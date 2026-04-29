// src/store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "EMPLOYER" | "CANDIDATE";

export interface AuthUser {
  id:    string;
  email: string;
  role:  UserRole;
}

interface AuthStore {
  user:    AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout:  () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user:    null,
      setUser: (user) => set({ user }),
      logout:  ()     => set({ user: null }),
    }),
    { name: "hc-auth" }
  )
);
