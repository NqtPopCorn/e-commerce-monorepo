import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { auditLogsService } from "@/services/audit-logs.service";
import { GetAuditLogsParams } from "@/types/audit-log";

export const useGetAuditLogs = (params?: GetAuditLogsParams) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-audit-logs", params],
    queryFn: () => auditLogsService.getAll(params),
    enabled: !!token,
  });
};

export const useGetAuditLogSummary = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-audit-logs-summary"],
    queryFn: auditLogsService.getSummary,
    enabled: !!token,
  });
};

export const useGetAuditLogDetail = (id?: number | null) => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["admin-audit-log-detail", id],
    queryFn: () => auditLogsService.getById(id!),
    enabled: !!token && !!id,
  });
};
