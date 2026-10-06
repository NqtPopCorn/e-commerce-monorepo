import { api } from "@/lib/api";

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    role: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    status?: string;
    tier?: string;
  };
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const res = await api.post("/auth/login", credentials);
    return res.data;
  },
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },
  forgotPassword: async (email: string) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },
  sendOtp: async (data: {
    target: string;
    type?: string;
    channel?: "EMAIL" | "SMS";
  }) => {
    const res = await api.post("/auth/otp/send", data);
    return res.data;
  },
  verifyOtp: async (data: { target: string; code: string; type?: string }) => {
    const res = await api.post("/auth/otp/verify", data);
    return res.data;
  },
  resetPassword: async (data: {
    target: string;
    code: string;
    newPassword: string;
  }) => {
    const res = await api.post("/auth/reset-password", data);
    return res.data;
  },
};
