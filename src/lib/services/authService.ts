import type { AuthCredentials, SignupData, User, UserProfile } from "@/types/user";
import { api } from "@/lib/api";

export const authService = {
  async login(credentials: AuthCredentials): Promise<User> {
    if (!credentials.email || !credentials.password) {
      throw new Error("Email and password are required");
    }
    const data = await api<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    return data.user;
  },

  async signup(data: SignupData): Promise<User> {
    if (data.password !== data.confirmPassword) {
      throw new Error("Passwords do not match");
    }
    const res = await api<{ user: User }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.user;
  },

  async getCurrentUser(): Promise<User | null> {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("fa_user");
    return raw ? (JSON.parse(raw) as User) : null;
  },

  async getProfile(userId: string): Promise<UserProfile> {
    const data = await api<{ profile: UserProfile }>(
      `/api/profile?userId=${encodeURIComponent(userId)}`
    );
    return data.profile;
  },

  async logout(): Promise<void> {
    if (typeof window === "undefined") return;
    localStorage.removeItem("fa_user");
  },
};
