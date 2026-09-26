import { api } from "@/lib/api";

export const authService = {
  login: async (credentials: any) => {
    const res = await api.post("/auth/login", credentials);
    return res.data;
  },
  register: async (data: any) => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },
  forgotPassword: async (email: string) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },
};
