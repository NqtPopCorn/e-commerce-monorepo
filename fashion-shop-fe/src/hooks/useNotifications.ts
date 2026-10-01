"use client";

import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import {
  notificationsService,
  GetNotificationsParams,
} from "@/services/notifications.service";
import { NotificationItem } from "@/types/notification";

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Vừa xong";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ngày trước`;

  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function useNotifications(params?: GetNotificationsParams) {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  // 1. Query danh sách thông báo
  const {
    data: listData,
    isLoading: isLoadingList,
    refetch: refetchList,
  } = useQuery({
    queryKey: ["notifications", params],
    queryFn: () => notificationsService.getNotifications(params),
    enabled: Boolean(token && user),
    staleTime: 30 * 1000,
  });

  // 2. Query số lượng chưa đọc
  const {
    data: unreadData,
    isLoading: isLoadingUnread,
    refetch: refetchUnread,
  } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: notificationsService.getUnreadCount,
    enabled: Boolean(token && user),
    staleTime: 30 * 1000,
  });

  // 3. Mutation đánh dấu đã đọc 1 tin
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
    },
  });

  // 4. Mutation đánh dấu đọc tất cả
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
    },
  });

  // 5. Kết nối SSE Stream
  useEffect(() => {
    if (!token || !user) return;

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const streamUrl = `${apiUrl}/notifications/stream?token=${encodeURIComponent(token)}`;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener("notification", () => {
        // Tự động invalidate cache để cập nhật danh sách và badge số lượng chưa đọc theo thời gian thực
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({
          queryKey: ["notifications-unread-count"],
        });
      });

      eventSource.onerror = () => {
        // Trình duyệt sẽ tự động kết nối lại khi có lỗi mạng
      };
    } catch (err) {
      console.error("Không thể khởi tạo EventSource SSE:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [token, user, queryClient]);

  const handleMarkAsRead = useCallback(
    async (id: number) => {
      await markAsReadMutation.mutateAsync(id);
    },
    [markAsReadMutation],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsReadMutation.mutateAsync();
  }, [markAllAsReadMutation]);

  return {
    notifications: listData?.items || [],
    total: listData?.total || 0,
    unreadCount: unreadData?.count ?? listData?.unreadCount ?? 0,
    isLoading: isLoadingList || isLoadingUnread,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    refetchList,
    refetchUnread,
  };
}
