import { Injectable, Logger } from '@nestjs/common';
import {
  IStorageDriver,
  StorageFile,
  StorageResult,
  UploadOptions,
} from '../interfaces/storage-driver.interface';

interface MemoryRecord {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalName: string;
  createdAt: Date;
  dataUrl: string;
}

@Injectable()
export class MemoryStorageAdapter implements IStorageDriver {
  readonly name = 'memory';
  private readonly logger = new Logger(MemoryStorageAdapter.name);
  private readonly store = new Map<string, MemoryRecord>();

  async upload(file: StorageFile, options?: UploadOptions): Promise<StorageResult> {
    const folder = (options?.folder || 'general').replace(/^[\\/]+|[\\/]+$/g, '');
    const ext = file.originalname.includes('.')
      ? file.originalname.split('.').pop()
      : 'bin';
    const randomId = Math.random().toString(36).substring(2, 9);
    const key = `memory/${folder}/${Date.now()}-${randomId}.${ext}`;

    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;

    const record: MemoryRecord = {
      buffer: file.buffer,
      mimetype: file.mimetype,
      size: file.size,
      originalName: file.originalname,
      createdAt: new Date(),
      dataUrl,
    };

    this.store.set(key, record);
    this.logger.debug(`[MemoryStorage] Stored file key: ${key}, size: ${file.size} bytes`);

    return {
      key,
      url: dataUrl,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      driver: this.name,
      createdAt: record.createdAt,
    };
  }

  async delete(key: string): Promise<boolean> {
    const exists = this.store.has(key);
    if (exists) {
      this.store.delete(key);
      this.logger.debug(`[MemoryStorage] Deleted file key: ${key}`);
      return true;
    }
    return false;
  }

  async getUrl(key: string): Promise<string> {
    const record = this.store.get(key);
    if (!record) {
      throw new Error(`File with key "${key}" not found in memory storage`);
    }
    return record.dataUrl;
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  /**
   * Helper for tests to inspect stored files
   */
  getFileRecord(key: string): MemoryRecord | undefined {
    return this.store.get(key);
  }

  /**
   * Clear all records in memory
   */
  clear(): void {
    this.store.clear();
  }
}
