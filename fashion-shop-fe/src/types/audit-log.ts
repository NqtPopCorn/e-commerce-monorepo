export interface AuditLogActor {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  avatarUrl?: string | null;
}

export interface AuditLog {
  id: number;
  userId?: number | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description?: string | null;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  status: "SUCCESS" | "FAILED" | string;
  errorMessage?: string | null;
  createdAt: string;
  user?: AuditLogActor | null;
}

export interface AuditLogSummary {
  total: number;
  todayCount: number;
  failedCount: number;
  activeUsersCount: number;
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  entityType?: string;
  action?: string;
  status?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedAuditLogsResponse {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
