"use server";

import { cookies } from "next/headers";
import {
  UNLOCK_COOKIE,
  UNLOCK_MAX_AGE,
  checkPassword,
  isPasswordConfigured,
  unlockToken,
} from "@/lib/auth";
import type { AuthState } from "@/lib/form-state";

export async function unlock(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isPasswordConfigured()) {
    return {
      error: "Falta APP_PASSWORD en la configuración del servidor.",
    };
  }

  const password = String(formData.get("password") ?? "");

  if (!password) {
    return { error: "Escribe la contraseña." };
  }

  if (!checkPassword(password)) {
    return { error: "Contraseña incorrecta." };
  }

  const token = unlockToken();
  if (!token) {
    return { error: "Falta APP_PASSWORD en la configuración del servidor." };
  }

  // Setting a cookie in a Server Action re-renders the page, so the UI picks up
  // the unlocked state without an explicit refresh.
  (await cookies()).set(UNLOCK_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UNLOCK_MAX_AGE,
  });

  return { error: null };
}

export async function lock(): Promise<void> {
  (await cookies()).delete(UNLOCK_COOKIE);
}
