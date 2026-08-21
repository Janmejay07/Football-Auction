"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthCredentials, SignupData, User } from "@/types/user";
import { authService } from "@/lib/services/authService";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (partial: Partial<User>) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.login(credentials);
          if (typeof window !== "undefined") {
            localStorage.setItem("fa_user", JSON.stringify(user));
          }
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (e) {
          set({
            error: e instanceof Error ? e.message : "Login failed",
            isLoading: false,
          });
          throw e;
        }
      },

      signup: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.signup(data);
          if (typeof window !== "undefined") {
            localStorage.setItem("fa_user", JSON.stringify(user));
          }
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (e) {
          set({
            error: e instanceof Error ? e.message : "Signup failed",
            isLoading: false,
          });
          throw e;
        }
      },

      logout: async () => {
        await authService.logout();
        if (typeof window !== "undefined") {
          localStorage.removeItem("fa_user");
        }
        set({ user: null, isAuthenticated: false });
      },

      clearError: () => set({ error: null }),

      updateUser: (partial) => {
        set((state) => {
          if (!state.user) return state;
          const updated = { ...state.user, ...partial };
          if (typeof window !== "undefined") {
            localStorage.setItem("fa_user", JSON.stringify(updated));
          }
          return { user: updated };
        });
      },

      hydrate: async () => {
        const user = await authService.getCurrentUser();
        if (user) set({ user, isAuthenticated: true });
      },
    }),
    {
      name: "fa-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
