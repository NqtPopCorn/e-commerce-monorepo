export interface StorageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  fieldname?: string;
  encoding?: string;
}

export interface UploadOptions {
  /**
   * Subfolder in the storage provider (e.g. 'products', 'brands', 'avatars', 'general')
   */
  folder?: string;

  /**
   * Optional custom filename or prefix
   */
  filename?: string;

  /**
   * List of allowed MIME types. If omitted, uses default allowed image types.
   */
  allowedMimeTypes?: string[];

  /**
   * Maximum allowed file size in bytes
   */
  maxSizeBytes?: number;
}

export interface StorageResult {
  /**
   * Unique identifier or path in the storage provider (e.g., local relative path or Cloudinary public_id).
   * Used for deletion or referencing.
   */
  key: string;

  /**
   * Public URL or Data URI that can be loaded in web browsers
   */
  url: string;

  /**
   * Original name of the uploaded file
   */
  originalName: string;

  /**
   * MIME type of the uploaded file
   */
  mimetype: string;

  /**
   * Size in bytes
   */
  size: number;

  /**
   * Active driver name that processed this file: 'memory' | 'local' | 'cloudinary' | string
   */
  driver: string;

  /**
   * Timestamp when uploaded
   */
  createdAt: Date;
}

export interface IStorageDriver {
  /**
   * Unique name of the storage driver ('memory', 'local', 'cloudinary', 's3', etc.)
   */
  readonly name: string;

  /**
   * Upload a file buffer to the underlying storage
   */
  upload(file: StorageFile, options?: UploadOptions): Promise<StorageResult>;

  /**
   * Delete a file by its storage key
   */
  delete(key: string): Promise<boolean>;

  /**
   * Get the publicly accessible URL for a given storage key
   */
  getUrl(key: string): Promise<string> | string;

  /**
   * Check whether a file exists in the storage
   */
  exists(key: string): Promise<boolean>;
}
