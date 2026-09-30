import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemoryStorageAdapter } from './adapters/memory-storage.adapter';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';
import { CloudinaryStorageAdapter } from './adapters/cloudinary-storage.adapter';
import { UploadService } from './upload.service';
import { StorageFile } from './interfaces/storage-driver.interface';
import * as fs from 'fs';
import * as path from 'path';

describe('Upload Module (Interface & Adapter Pattern)', () => {
  const sampleBuffer = Buffer.from('fake image content');
  const sampleFile: StorageFile = {
    buffer: sampleBuffer,
    originalname: 'test-product.png',
    mimetype: 'image/png',
    size: sampleBuffer.length,
    fieldname: 'file',
  };

  describe('MemoryStorageAdapter', () => {
    let memoryAdapter: MemoryStorageAdapter;

    beforeEach(() => {
      memoryAdapter = new MemoryStorageAdapter();
    });

    it('should upload a file and return a data URI and key', async () => {
      const result = await memoryAdapter.upload(sampleFile, { folder: 'products' });

      expect(result).toBeDefined();
      expect(result.driver).toBe('memory');
      expect(result.key).toContain('memory/products/');
      expect(result.url).toContain('data:image/png;base64,');
      expect(result.size).toBe(sampleBuffer.length);
      expect(result.originalName).toBe('test-product.png');

      const exists = await memoryAdapter.exists(result.key);
      expect(exists).toBe(true);
    });

    it('should retrieve url and delete file from memory', async () => {
      const result = await memoryAdapter.upload(sampleFile, { folder: 'avatars' });
      const url = await memoryAdapter.getUrl(result.key);
      expect(url).toBe(result.url);

      const deleted = await memoryAdapter.delete(result.key);
      expect(deleted).toBe(true);

      const existsAfter = await memoryAdapter.exists(result.key);
      expect(existsAfter).toBe(false);
    });
  });

  describe('LocalStorageAdapter', () => {
    let localAdapter: LocalStorageAdapter;
    const testUploadDir = path.resolve(process.cwd(), 'temp-test-uploads');

    beforeAll(() => {
      const mockConfig = {
        get: (key: string, defaultValue?: any) => {
          if (key === 'UPLOAD_DIR') return testUploadDir;
          if (key === 'APP_URL') return 'http://localhost:3000';
          return defaultValue;
        },
      } as ConfigService;

      localAdapter = new LocalStorageAdapter(mockConfig);
    });

    afterAll(async () => {
      if (fs.existsSync(testUploadDir)) {
        await fs.promises.rm(testUploadDir, { recursive: true, force: true });
      }
    });

    it('should upload a file to local disk and return public url and key', async () => {
      const result = await localAdapter.upload(sampleFile, { folder: 'products' });

      expect(result).toBeDefined();
      expect(result.driver).toBe('local');
      expect(result.key).toContain('products/');
      expect(result.url).toBe(`http://localhost:3000/uploads/${result.key}`);

      const exists = await localAdapter.exists(result.key);
      expect(exists).toBe(true);

      // Verify file physically exists on disk
      const physicalPath = path.join(testUploadDir, result.key);
      expect(fs.existsSync(physicalPath)).toBe(true);
      const content = await fs.promises.readFile(physicalPath);
      expect(content.toString()).toBe('fake image content');

      // Delete file
      const deleted = await localAdapter.delete(result.key);
      expect(deleted).toBe(true);
      expect(fs.existsSync(physicalPath)).toBe(false);
    });

    it('should defend against path traversal attempts', async () => {
      const maliciousKey = '../../etc/passwd';
      const deleted = await localAdapter.delete(maliciousKey);
      expect(deleted).toBe(false);

      const exists = await localAdapter.exists(maliciousKey);
      expect(exists).toBe(false);
    });
  });

  describe('UploadService Integration', () => {
    let uploadService: UploadService;
    let memoryAdapter: MemoryStorageAdapter;
    let localAdapter: LocalStorageAdapter;
    let cloudinaryAdapter: CloudinaryStorageAdapter;

    beforeEach(() => {
      const mockConfig = {
        get: (key: string, defaultValue?: any) => defaultValue,
      } as ConfigService;

      memoryAdapter = new MemoryStorageAdapter();
      localAdapter = new LocalStorageAdapter(mockConfig);
      cloudinaryAdapter = new CloudinaryStorageAdapter(mockConfig);

      // Active driver is memoryAdapter
      uploadService = new UploadService(
        memoryAdapter,
        memoryAdapter,
        localAdapter,
        cloudinaryAdapter,
      );
    });

    it('should successfully upload using the active driver', async () => {
      const result = await uploadService.uploadSingle(sampleFile, { folder: 'brands' });
      expect(result.driver).toBe('memory');
      expect(result.key).toContain('memory/brands/');
    });

    it('should reject invalid MIME types', async () => {
      const invalidFile: StorageFile = {
        ...sampleFile,
        mimetype: 'application/x-msdownload',
        originalname: 'virus.exe',
      };

      await expect(
        uploadService.uploadSingle(invalidFile, { folder: 'general' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject files exceeding max file size', async () => {
      const oversizedFile: StorageFile = {
        ...sampleFile,
        size: 10 * 1024 * 1024, // 10MB
      };

      await expect(
        uploadService.uploadSingle(oversizedFile, { folder: 'general' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should report driver info correctly', () => {
      const info = uploadService.getDriverInfo();
      expect(info.activeDriver).toBe('memory');
      expect(info.availableDrivers).toEqual(['memory', 'local', 'cloudinary']);
    });
  });
});
