import { api } from "@/lib/api";
import {
  AuditLog,
  AuditLogSummary,
  GetAuditLogsParams,
  PaginatedAuditLogsResponse,
} from "@/types/audit-log";

export const auditLogsService = {
  getAll: async (
    params?: GetAuditLogsParams,
  ): Promise<PaginatedAuditLogsResponse> => {
    const res = await api.get("/admin/audit-logs", { params });
    return res.data;
  },

  getSummary: async (): Promise<AuditLogSummary> => {
    const res = await api.get("/admin/audit-logs/summary");
    return res.data;
  },

  getById: async (id: number): Promise<AuditLog> => {
    const res = await api.get(`/admin/audit-logs/${id}`);
    return res.data;
  },
};
