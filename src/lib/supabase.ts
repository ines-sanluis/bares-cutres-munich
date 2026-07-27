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

  client ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
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
