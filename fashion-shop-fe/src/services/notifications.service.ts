import { api } from "@/lib/api";
import {
  NotificationItem,
  NotificationListResponse,
} from "@/types/notification";

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
}

export const notificationsService = {
  getNotifications: async (
    params?: GetNotificationsParams,
  ): Promise<NotificationListResponse> => {
    const res = await api.get<NotificationListResponse>("/notifications", {
      params,
    });
    return res.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const res = await api.get<{ count: number }>("/notifications/unread-count");
    return res.data;
  },

  markAsRead: async (id: number): Promise<NotificationItem> => {
    const res = await api.patch<NotificationItem>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const res = await api.patch<{ success: boolean }>(
      "/notifications/read-all",
    );
    return res.data;
  },

  deleteNotification: async (id: number): Promise<{ success: boolean }> => {
    const res = await api.delete<{ success: boolean }>(`/notifications/${id}`);
    return res.data;
  },
};
