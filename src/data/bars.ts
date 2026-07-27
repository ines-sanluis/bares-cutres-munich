import barsData from "./bars.json";

export type Bar = {
  name: string;
  lat: number;
  lng: number;
};

export const bars: Bar[] = barsData;

export const MAP_CENTER: [number, number] = [48.1351, 11.582];

export const GOOGLE_MAPS_ID = "1v2JwzCR7tzoIXnyutpcvhmofkMxc884";

/**
 * Stable identifier used as the primary key of the `visits` table.
 * All 100 bar names produce a unique slug, so the name alone is enough.
 */
export function barId(bar: Bar): string {
  return bar.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function googleMapsUrl(bar: Bar): string {
  const query = encodeURIComponent(`${bar.name}, Munich`);
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=&center=${bar.lat},${bar.lng}`;
}

export function googleMapsDirectionsUrl(bar: Bar): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${bar.lat},${bar.lng}`;
}
