import { api } from "@/lib/api";

export interface UploadResult {
  key: string;
  url: string;
  originalName: string;
  mimetype: string;
  size: number;
  driver: string;
  createdAt: string;
}

export interface DriverInfo {
  activeDriver: string;
  availableDrivers: string[];
  defaultMaxFileSize: number;
  allowedMimeTypes: string[];
}

export const uploadService = {
  /**
   * Upload 1 file ảnh
   * @param file File từ input hoặc drag & drop
   * @param folder Thư mục đích (vd: 'products', 'brands', 'avatars')
   */
  uploadSingle: async (file: File, folder = "general"): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await api.post<{ success: boolean; data: UploadResult }>(
      "/upload/single",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return res.data.data;
  },

  /**
   * Upload nhiều file ảnh đồng thời
   * @param files Mảng File
   * @param folder Thư mục đích
   */
  uploadMultiple: async (
    files: File[],
    folder = "general",
  ): Promise<UploadResult[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("folder", folder);

    const res = await api.post<{ success: boolean; data: UploadResult[] }>(
      "/upload/multiple",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return res.data.data;
  },

  /**
   * Xóa file theo key (chủ động gọi khi cần dọn dẹp)
   */
  deleteFile: async (key: string): Promise<boolean> => {
    const res = await api.delete<{ success: boolean; message: string }>("/upload", {
      data: { key },
    });
    return res.data.success;
  },

  /**
   * Lấy thông tin storage driver hiện tại
   */
  getDriverInfo: async (): Promise<DriverInfo> => {
    const res = await api.get<{ success: boolean; data: DriverInfo }>(
      "/upload/driver-info",
    );
    return res.data.data;
  },
};
