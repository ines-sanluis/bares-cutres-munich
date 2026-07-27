import barsData from "./bars.json";

/**
 * `original` bars are the 100 from the Google map — the actual challenge, frozen
 * in bars.json. `extra` bars are ones added later from the app; they live in
 * Supabase and are deliberately kept out of the 100-bar progress count.
 */
export type BarOrigin = "original" | "extra";

export type Bar = {
  /** Set only on extra bars. Original bars derive their id from the name. */
  id?: string;
  name: string;
  lat: number;
  lng: number;
  origin: BarOrigin;
};

export const bars: Bar[] = barsData.map((bar) => ({
  ...bar,
  origin: "original" as const,
}));

export const MAP_CENTER: [number, number] = [48.1351, 11.582];

export const GOOGLE_MAPS_ID = "1v2JwzCR7tzoIXnyutpcvhmofkMxc884";

/** Extra bar ids are namespaced so they can never collide with the 100. */
export const EXTRA_ID_PREFIX = "x-";

export const BAR_NAME_MAX_LENGTH = 80;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Stable identifier used as the primary key of the `visits` table.
 * All 100 original bar names produce a unique slug, so the name alone is enough
 * for them; extra bars carry an explicit prefixed id from the database.
 */
export function barId(bar: Bar): string {
  return bar.id ?? slugify(bar.name);
}

export function extraBarId(name: string): string {
  return `${EXTRA_ID_PREFIX}${slugify(name)}`;
}

export function isExtraId(id: string): boolean {
  return id.startsWith(EXTRA_ID_PREFIX);
}

export function googleMapsUrl(bar: Bar): string {
  const query = encodeURIComponent(`${bar.name}, Munich`);
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=&center=${bar.lat},${bar.lng}`;
}

export function googleMapsDirectionsUrl(bar: Bar): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${bar.lat},${bar.lng}`;
}
