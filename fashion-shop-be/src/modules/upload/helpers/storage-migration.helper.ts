import { Injectable, Logger } from "@nestjs/common";
import { UploadService } from "../upload.service";
import { StorageResult } from "../interfaces/storage-driver.interface";
import * as fs from "fs";
import * as path from "path";

export interface MigrationSummary {
  total: number;
  succeeded: number;
  failed: number;
  results: {
    sourceKey: string;
    newResult?: StorageResult;
    error?: string;
  }[];
}

@Injectable()
export class StorageMigrationHelper {
  private readonly logger = new Logger(StorageMigrationHelper.name);

  constructor(private readonly uploadService: UploadService) {}

  /**
   * Di chuyển 1 file cục bộ lên driver mục tiêu (ví dụ 'cloudinary')
   */
  async migrateLocalFileToDriver(
    localFilePath: string,
    targetDriverName: string,
    targetFolder = "migrated",
  ): Promise<StorageResult> {
    const targetDriver = this.uploadService.getDriverByName(targetDriverName);

    if (!fs.existsSync(localFilePath)) {
      throw new Error(`Local file not found at: ${localFilePath}`);
    }

    const buffer = await fs.promises.readFile(localFilePath);
    const filename = path.basename(localFilePath);
    const ext = path.extname(filename).toLowerCase();

    // Map common extensions to MIME types
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
    };
    const mimetype = mimeMap[ext] || "application/octet-stream";

    this.logger.log(
      `Migrating local file "${filename}" to [${targetDriver.name}] under folder "${targetFolder}"`,
    );

    return targetDriver.upload(
      {
        buffer,
        originalname: filename,
        mimetype,
        size: buffer.length,
      },
      { folder: targetFolder },
    );
  }

  /**
   * Di chuyển hàng loạt file từ thư mục local sang driver mới
   */
  async migrateDirectory(
    sourceDir: string,
    targetDriverName: string,
    targetFolder = "migrated",
  ): Promise<MigrationSummary> {
    const summary: MigrationSummary = {
      total: 0,
      succeeded: 0,
      failed: 0,
      results: [],
    };

    if (!fs.existsSync(sourceDir)) {
      return summary;
    }

    const files = await fs.promises.readdir(sourceDir);
    for (const filename of files) {
      const fullPath = path.join(sourceDir, filename);
      const stat = await fs.promises.stat(fullPath);
      if (stat.isFile()) {
        summary.total++;
        try {
          const res = await this.migrateLocalFileToDriver(
            fullPath,
            targetDriverName,
            targetFolder,
          );
          summary.succeeded++;
          summary.results.push({ sourceKey: filename, newResult: res });
        } catch (err: any) {
          summary.failed++;
          summary.results.push({ sourceKey: filename, error: err.message });
        }
      }
    }

    this.logger.log(
      `Migration finished: ${summary.succeeded}/${summary.total} files migrated successfully to [${targetDriverName}].`,
    );
    return summary;
  }
}
