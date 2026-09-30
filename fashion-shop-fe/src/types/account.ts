import { PaginationMeta } from "./product";

export type RoleType = "CUSTOMER" | "STAFF" | "ADMIN";
export type UserStatusType = "ACTIVE" | "BLOCKED";
export type GenderType = "MALE" | "FEMALE" | "OTHER";
export type CustomerTierType = "STANDARD" | "SILVER" | "GOLD" | "DIAMOND";

export interface Address {
  id: number;
  userId: number;
  recipientName: string;
  phone: string;
  street: string;
  ward?: string | null;
  district?: string | null;
  city: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountRecentOrder {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  _count?: {
    items: number;
  };
}

export interface Account {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  gender?: GenderType | null;
  dateOfBirth?: string | null;
  role: RoleType;
  status: UserStatusType;
  tier: CustomerTierType;
  notes?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  ordersCount?: number;
  totalSpent?: number;
  addresses?: Address[];
  orders?: AccountRecentOrder[];
}

export interface AccountSummary {
  total: number;
  active: number;
  blocked: number;
  admins: number;
  staffs: number;
  customers: number;
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

export interface CreateAccountDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: RoleType;
  notes?: string;
}

export interface UpdateAdminAccountDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: RoleType;
  status?: UserStatusType;
  tier?: CustomerTierType;
  notes?: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  gender?: GenderType;
  dateOfBirth?: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface CreateAddressDto {
  recipientName: string;
  phone: string;
  street: string;
  ward?: string;
  district?: string;
  city: string;
  isDefault?: boolean;
}

export interface UpdateAddressDto {
  recipientName?: string;
  phone?: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  isDefault?: boolean;
}
