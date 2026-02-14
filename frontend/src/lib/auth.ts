import { apiGet, apiPost } from "./api";
import type { AuthResponse, User } from "../types/auth";

export async function loginWithGoogle(idToken: string, username: string) {
  return apiPost<AuthResponse>("/auth/google", {
    idToken,
    username
  });
}

export async function fetchMe(token: string) {
  return apiGet<User>("/users/me", token);
}
