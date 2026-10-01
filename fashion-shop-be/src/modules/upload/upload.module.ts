import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";
import { STORAGE_DRIVER } from "./constants/upload.constants";
import { MemoryStorageAdapter } from "./adapters/memory-storage.adapter";
import { LocalStorageAdapter } from "./adapters/local-storage.adapter";
import { CloudinaryStorageAdapter } from "./adapters/cloudinary-storage.adapter";
import { StorageMigrationHelper } from "./helpers/storage-migration.helper";

@Module({
  controllers: [UploadController],
  providers: [
    MemoryStorageAdapter,
    LocalStorageAdapter,
    CloudinaryStorageAdapter,
    StorageMigrationHelper,
    UploadService,
    {
      provide: STORAGE_DRIVER,
      useFactory: (
        config: ConfigService,
        memoryAdapter: MemoryStorageAdapter,
        localAdapter: LocalStorageAdapter,
        cloudinaryAdapter: CloudinaryStorageAdapter,
      ) => {
        const driverName = config
          .get<string>("STORAGE_DRIVER", "local")
          .trim()
          .toLowerCase();

        switch (driverName) {
          case "memory":
            return memoryAdapter;
          case "cloudinary":
            return cloudinaryAdapter;
          case "local":
          default:
            return localAdapter;
        }
      },
      inject: [
        ConfigService,
        MemoryStorageAdapter,
        LocalStorageAdapter,
        CloudinaryStorageAdapter,
      ],
    },
  ],
  exports: [UploadService, STORAGE_DRIVER, StorageMigrationHelper],
})
export class UploadModule {}
