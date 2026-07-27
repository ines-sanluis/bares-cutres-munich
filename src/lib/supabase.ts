import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PHOTO_BUCKET = "bar-photos";

let client: SupabaseClient | null = null;

/**
 * Supabase client using the service_role key. Server-side only — the key
 * bypasses row level security and must never reach the browser.
 *
 * Returns null when the environment variables are missing so the app still
 * renders (read-only, no visits) instead of crashing.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  warnIfNotAServiceKey(key);

  client ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}

let keyWarned = false;

/**
 * The anon/publishable key is subject to row level security, and this schema
 * enables RLS with no policies — so using it turns every read into an empty
 * result and every write into "new row violates row-level security policy".
 * That error says nothing about the real cause, hence this check.
 *
 * Supabase calls the right key `service_role` (a JWT) on older projects and
 * `secret` (`sb_secret_…`) on newer ones.
 */
function warnIfNotAServiceKey(key: string): void {
  if (keyWarned) return;

  let isServiceKey = true;

  if (key.startsWith("sb_publishable_")) {
    isServiceKey = false;
  } else if (key.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(
        Buffer.from(key.split(".")[1] ?? "", "base64url").toString(),
      );
      isServiceKey = payload?.role === "service_role";
    } catch {
      // Unreadable JWT: leave it to Supabase to reject.
    }
  }

  if (!isServiceKey) {
    keyWarned = true;
    console.error(
      "SUPABASE_SERVICE_ROLE_KEY no es una clave de servicio: usa la 'service_role' " +
        "(o 'sb_secret_…') del panel de Supabase → Project Settings → API keys. " +
        "Con la clave publishable/anon, RLS bloquea todas las lecturas y escrituras.",
    );
  }
}

/** Same as getSupabase, but throws — for mutations, which cannot silently no-op. */
export function requireSupabase(): SupabaseClient {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error(
      "Supabase no está configurado: define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local",
    );
  }

  return supabase;
}
