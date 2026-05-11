// src/store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "EMPLOYER" | "CANDIDATE";

// FIX 3 — Added firstName, lastName, avatarUrl.
// These were missing, causing undefined renders throughout dashboards and navbars.
export interface AuthUser {
  id:        string;
  email:     string;
  role:      UserRole;
  firstName: string;
  lastName:  string;
  avatarUrl?: string;
}

interface AuthStore {
  user:       AuthUser | null;
  token:      string | null;
  setUser:    (user: AuthUser | null) => void;
  setToken:   (token: string) => void;
  // Convenience: set both at once after login/verify
  setSession: (user: AuthUser, token: string) => void;
  logout:     () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user:       null,
      token:      null,
      setUser:    (user)         => set({ user }),
      setToken:   (token)        => set({ token }),
      setSession: (user, token)  => set({ user, token }),
      logout:     ()             => set({ user: null, token: null }),
    }),
    { name: "hc-auth" }
  )
);