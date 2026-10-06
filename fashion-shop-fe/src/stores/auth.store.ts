import { create } from "zustand";
import { persist } from "zustand/middleware";
type User = {
  id: number;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  status?: string;
  tier?: string;
  avatarUrl?: string | null;
};
type AuthState = {
  token: string | null;
  user: User | null;
  hasHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  logout: () => void;
};
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hasHydrated: false,
      setAuth: (token, user) => {
        localStorage.setItem("accessToken", token);
        set({ token, user, hasHydrated: true });
      },
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: () => {
        localStorage.removeItem("accessToken");
        set({ token: null, user: null, hasHydrated: true });
      },
    }),
    {
      name: "fashion-shop-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hasHydrated: true });
      },
    },
  ),
);
