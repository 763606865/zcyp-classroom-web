import type { User } from "@/entities/user";

export type { User } from "@/entities/user";

export interface AuthSession {
  tokenType: "Bearer";
  accessToken: string;
  user: User;
}

export type AuthStatus = "loading" | "authenticated" | "anonymous";
