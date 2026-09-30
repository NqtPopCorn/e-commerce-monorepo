import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import {
  IStorageDriver,
  StorageFile,
  StorageResult,
  UploadOptions,
} from '../interfaces/storage-driver.interface';

@Injectable()
export class LocalStorageAdapter implements IStorageDriver {
  readonly name = 'local';
  private readonly logger = new Logger(LocalStorageAdapter.name);
  private readonly uploadRootDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const configuredDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    this.uploadRootDir = path.isAbsolute(configuredDir)
      ? configuredDir
      : path.resolve(process.cwd(), configuredDir);

    const configuredAppUrl = this.configService.get<string>('APP_URL');
    if (configuredAppUrl) {
      this.baseUrl = configuredAppUrl.replace(/\/+$/, '');
    } else {
      const port = this.configService.get<string>('PORT', '3000');
      this.baseUrl = `http://localhost:${port}`;
    }

    // Ensure upload root directory exists
    try {
      if (!fs.existsSync(this.uploadRootDir)) {
        fs.mkdirSync(this.uploadRootDir, { recursive: true });
      }
    } catch (err) {
      this.logger.error(`Failed to create root upload directory: ${this.uploadRootDir}`, err);
    }
  }

  async upload(file: StorageFile, options?: UploadOptions): Promise<StorageResult> {
    const rawFolder = options?.folder || 'general';
    // Sanitize folder to avoid path traversal
    const safeFolder = rawFolder
      .replace(/\\/g, '/')
      .replace(/\.\./g, '')
      .replace(/^[\\/]+|[\\/]+$/g, '');

    const targetDir = path.join(this.uploadRootDir, safeFolder);
    await fs.promises.mkdir(targetDir, { recursive: true });

    // Generate safe, unique filename
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const rawBaseName = path.basename(file.originalname, ext);
    const safeBaseName = rawBaseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'file';

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomSuffix}-${safeBaseName}${ext}`;
    const destinationPath = path.join(targetDir, filename);

    // Write file buffer to destination
    await fs.promises.writeFile(destinationPath, file.buffer);

    // Key is relative to uploadRootDir with forward slashes
    const relativeKey = `${safeFolder}/${filename}`.replace(/\\/g, '/');
    const fileUrl = `${this.baseUrl}/uploads/${relativeKey}`;

    this.logger.debug(`[LocalStorage] File written to: ${destinationPath}, URL: ${fileUrl}`);

    return {
      key: relativeKey,
      url: fileUrl,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      driver: this.name,
      createdAt: new Date(),
    };
  }

  async delete(key: string): Promise<boolean> {
    const safePath = this.resolveSafePath(key);
    if (!safePath) {
      this.logger.warn(`[LocalStorage] Invalid path or path traversal attempt for key: "${key}"`);
      return false;
    }

    try {
      await fs.promises.access(safePath, fs.constants.F_OK);
      await fs.promises.unlink(safePath);
      this.logger.debug(`[LocalStorage] Successfully deleted file at: ${safePath}`);
      return true;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        this.logger.warn(`[LocalStorage] File not found for deletion: ${safePath}`);
        return false;
      }
      this.logger.error(`[LocalStorage] Error deleting file: ${safePath}`, err);
      throw err;
    }
  }

  getUrl(key: string): string {
    const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
    return `${this.baseUrl}/uploads/${normalizedKey}`;
  }

  async exists(key: string): Promise<boolean> {
    const safePath = this.resolveSafePath(key);
    if (!safePath) return false;
    try {
      await fs.promises.access(safePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Chống tấn công path traversal: Đảm bảo đường dẫn resolve luôn nằm trong uploadRootDir
   */
  private resolveSafePath(relativeKey: string): string | null {
    if (!relativeKey || typeof relativeKey !== 'string') return null;

    // Remove any protocol or host if full URL was accidentally passed
    let cleanKey = relativeKey;
    if (cleanKey.includes('/uploads/')) {
      cleanKey = cleanKey.split('/uploads/')[1];
    }

    const resolved = path.resolve(this.uploadRootDir, cleanKey);
    if (!resolved.startsWith(this.uploadRootDir)) {
      return null;
    }
    return resolved;
  }
}
