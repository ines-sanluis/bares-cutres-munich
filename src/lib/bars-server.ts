import "server-only";

import type { Bar } from "@/data/bars";
import { getSupabase } from "@/lib/supabase";

type ExtraBarRow = {
  id: string;
  name: string;
  lat: number | string;
  lng: number | string;
};

/**
 * Bars added from the app, in the order they were added. Returns an empty list
 * when Supabase is not configured so the original 100 still render.
 */
export async function getExtraBars(): Promise<Bar[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("extra_bars")
    .select("id, name, lat, lng")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("No se pudieron cargar los bares añadidos:", error.message);
    return [];
  }

  const extras: Bar[] = [];

  for (const row of (data ?? []) as ExtraBarRow[]) {
    const lat = Number(row.lat);
    const lng = Number(row.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    extras.push({ id: row.id, name: row.name, lat, lng, origin: "extra" });
  }

  return extras;
}
