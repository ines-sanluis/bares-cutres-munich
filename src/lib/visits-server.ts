import "server-only";

import { getSupabase, PHOTO_BUCKET } from "@/lib/supabase";
import type { Visit, VisitMap } from "@/lib/visits";

type VisitRow = {
  bar_id: string;
  visited: boolean;
  visited_on: string | null;
  beer_price: number | string | null;
  note_ines: string | null;
  note_fabienne: string | null;
  vote_ines: number | null;
  vote_fabienne: number | null;
  photo_path: string | null;
};

/**
 * Reads every visit, keyed by bar id for O(1) lookup while rendering the list
 * and the map. Photo public URLs are resolved here so Client Components never
 * need a Supabase client of their own.
 */
export async function getVisits(): Promise<VisitMap> {
  const supabase = getSupabase();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("visits")
    .select(
      "bar_id, visited, visited_on, beer_price, note_ines, note_fabienne, vote_ines, vote_fabienne, photo_path",
    );

  if (error) {
    console.error("No se pudieron cargar las visitas:", error.message);
    return {};
  }

  const visits: VisitMap = {};

  for (const row of (data ?? []) as VisitRow[]) {
    visits[row.bar_id] = toVisit(row, supabase);
  }

  return visits;
}

function toVisit(
  row: VisitRow,
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
): Visit {
  // numeric columns come back as strings from PostgREST
  const price =
    row.beer_price === null || row.beer_price === ""
      ? null
      : Number(row.beer_price);

  return {
    barId: row.bar_id,
    visited: row.visited,
    visitedOn: row.visited_on,
    beerPrice: price !== null && Number.isFinite(price) ? price : null,
    noteInes: row.note_ines,
    noteFabienne: row.note_fabienne,
    voteInes: row.vote_ines,
    voteFabienne: row.vote_fabienne,
    photoPath: row.photo_path,
    photoUrl: row.photo_path
      ? supabase.storage.from(PHOTO_BUCKET).getPublicUrl(row.photo_path).data
          .publicUrl
      : null,
  };
}
