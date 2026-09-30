import { PaginationMeta } from "./product";

export interface Account {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: string;
  status: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface GetAccountsParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface PaginatedAccountsResponse {
  data: Account[];
  meta: PaginationMeta;
}
