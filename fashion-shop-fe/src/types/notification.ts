export type NotificationType = "ORDER" | "INVENTORY" | "SYSTEM";
export type NotificationLevel = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  level: NotificationLevel;
  link?: string | null;
  isRead: boolean;
  readAt?: string | null;
  data?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}
