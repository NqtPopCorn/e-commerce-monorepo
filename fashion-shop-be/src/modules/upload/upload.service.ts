import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import {
  IStorageDriver,
  StorageFile,
  StorageResult,
  UploadOptions,
} from "./interfaces/storage-driver.interface";
import {
  DEFAULT_ALLOWED_IMAGE_TYPES,
  DEFAULT_UPLOAD_FOLDER,
  MAX_FILE_SIZE,
  STORAGE_DRIVER,
} from "./constants/upload.constants";
import { MemoryStorageAdapter } from "./adapters/memory-storage.adapter";
import { LocalStorageAdapter } from "./adapters/local-storage.adapter";
import { CloudinaryStorageAdapter } from "./adapters/cloudinary-storage.adapter";

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @Inject(STORAGE_DRIVER) private readonly activeDriver: IStorageDriver,
    private readonly memoryAdapter: MemoryStorageAdapter,
    private readonly localAdapter: LocalStorageAdapter,
    private readonly cloudinaryAdapter: CloudinaryStorageAdapter,
  ) {}

  /**
   * Upload một file đơn lẻ sử dụng driver đang kích hoạt
   */
  async uploadSingle(
    file: StorageFile,
    options?: UploadOptions,
  ): Promise<StorageResult> {
    if (!file || !file.buffer) {
      throw new BadRequestException("Không tìm thấy file để tải lên");
    }

    this.validateFile(file, options);

    const mergedOptions: UploadOptions = {
      folder: options?.folder || DEFAULT_UPLOAD_FOLDER,
      ...options,
    };

    this.logger.log(
      `Uploading file "${file.originalname}" (${file.size} bytes) using [${this.activeDriver.name}] driver into folder "${mergedOptions.folder}"`,
    );

    return this.activeDriver.upload(file, mergedOptions);
  }

  /**
   * Upload nhiều file đồng thời
   */
  async uploadMultiple(
    files: StorageFile[],
    options?: UploadOptions,
  ): Promise<StorageResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException("Không tìm thấy danh sách file để tải lên");
    }

    return Promise.all(files.map((file) => this.uploadSingle(file, options)));
  }

  /**
   * Xóa file theo storage key.
   * Ghi chú: Theo yêu cầu hệ thống, không tự động kích hoạt xóa vật lý khi xóa DB record
   * mà để controller hoặc quản trị viên chủ động quyết định sau.
   */
  async deleteFile(key: string, driverName?: string): Promise<boolean> {
    if (!key) {
      throw new BadRequestException("Storage key không được để trống");
    }

    const driver = driverName
      ? this.getDriverByName(driverName)
      : this.activeDriver;
    this.logger.log(
      `Deleting file with key "${key}" using [${driver.name}] driver`,
    );
    return driver.delete(key);
  }

  /**
   * Lấy thông tin về driver đang hoạt động và danh sách driver khả dụng
   */
  getDriverInfo() {
    return {
      activeDriver: this.activeDriver.name,
      availableDrivers: [
        this.memoryAdapter.name,
        this.localAdapter.name,
        this.cloudinaryAdapter.name,
      ],
      defaultMaxFileSize: MAX_FILE_SIZE,
      allowedMimeTypes: DEFAULT_ALLOWED_IMAGE_TYPES,
    };
  }

  /**
   * Lấy driver theo tên phục vụ migration hoặc preview
   */
  getDriverByName(name: string): IStorageDriver {
    switch (name.toLowerCase()) {
      case "memory":
        return this.memoryAdapter;
      case "local":
        return this.localAdapter;
      case "cloudinary":
        return this.cloudinaryAdapter;
      default:
        throw new BadRequestException(`Driver "${name}" không được hỗ trợ`);
    }
  }

  /**
   * Kiểm tra tính hợp lệ của file (định dạng, kích thước)
   */
  private validateFile(file: StorageFile, options?: UploadOptions): void {
    const allowedTypes =
      options?.allowedMimeTypes || DEFAULT_ALLOWED_IMAGE_TYPES;
    const maxSize = options?.maxSizeBytes || MAX_FILE_SIZE;

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Định dạng file "${file.mimetype}" không được hỗ trợ. Các định dạng cho phép: ${allowedTypes.join(", ")}`,
      );
    }

    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(
        `Kích thước file (${(file.size / (1024 * 1024)).toFixed(2)} MB) vượt quá dung lượng tối đa cho phép (${maxSizeMB} MB)`,
      );
    }
  }
}
