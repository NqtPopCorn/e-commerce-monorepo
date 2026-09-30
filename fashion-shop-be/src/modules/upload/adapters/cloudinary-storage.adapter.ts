import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';
import {
  IStorageDriver,
  StorageFile,
  StorageResult,
  UploadOptions,
} from '../interfaces/storage-driver.interface';

@Injectable()
export class CloudinaryStorageAdapter implements IStorageDriver {
  readonly name = 'cloudinary';
  private readonly logger = new Logger(CloudinaryStorageAdapter.name);
  private readonly isConfigured: boolean;
  private readonly rootFolder: string;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');
    this.rootFolder = this.configService.get<string>('CLOUDINARY_FOLDER', 'fashionshop');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isConfigured = true;
      this.logger.log(`[CloudinaryStorage] Configured successfully for cloud_name: "${cloudName}"`);
    } else {
      this.isConfigured = false;
      this.logger.warn(
        '[CloudinaryStorage] Cloudinary credentials missing (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Uploads will fail until configured.',
      );
    }
  }

  async upload(file: StorageFile, options?: UploadOptions): Promise<StorageResult> {
    if (!this.isConfigured) {
      throw new Error(
        'Cloudinary is not configured. Please define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }

    const subFolder = (options?.folder || 'general').replace(/^[\\/]+|[\\/]+$/g, '');
    const targetFolder = `${this.rootFolder}/${subFolder}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: targetFolder,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            this.logger.error('[CloudinaryStorage] Upload failed', error);
            return reject(error || new Error('Upload to Cloudinary returned empty response'));
          }

          this.logger.debug(
            `[CloudinaryStorage] Uploaded successfully: public_id=${result.public_id}, url=${result.secure_url}`,
          );

          resolve({
            key: result.public_id,
            url: result.secure_url,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: result.bytes || file.size,
            driver: this.name,
            createdAt: new Date(result.created_at || Date.now()),
          });
        },
      );

      // Stream the buffer into Cloudinary uploadStream
      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn('[CloudinaryStorage] Cannot delete file: Cloudinary is not configured');
      return false;
    }

    try {
      const result = await cloudinary.uploader.destroy(key);
      const isSuccess = result.result === 'ok';
      if (isSuccess) {
        this.logger.debug(`[CloudinaryStorage] Deleted key: ${key}`);
      } else {
        this.logger.warn(`[CloudinaryStorage] Delete returned result: "${result.result}" for key: ${key}`);
      }
      return isSuccess;
    } catch (err) {
      this.logger.error(`[CloudinaryStorage] Error deleting key: ${key}`, err);
      return false;
    }
  }

  getUrl(key: string): string {
    return cloudinary.url(key, { secure: true });
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConfigured) return false;
    try {
      await cloudinary.api.resource(key);
      return true;
    } catch (err: any) {
      if (err?.error?.http_code === 404 || err?.http_code === 404) {
        return false;
      }
      this.logger.error(`[CloudinaryStorage] Error checking existence for key: ${key}`, err);
      return false;
    }
  }
}
