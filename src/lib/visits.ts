import { barId, type Bar } from "@/data/bars";

/**
 * A visit record for one bar. Kept free of server-only imports so Client
 * Components can use these types and helpers — the Supabase read lives in
 * `visits-server.ts`.
 */
export type Visit = {
  barId: string;
  visited: boolean;
  visitedOn: string | null;
  beerPrice: number | null;
  noteInes: string | null;
  noteFabienne: string | null;
  voteInes: number | null;
  voteFabienne: number | null;
  photoPath: string | null;
  photoUrl: string | null;
};

export type VisitMap = Record<string, Visit>;

export const VOTE_MIN = 1;
export const VOTE_MAX = 5;

/** Average of whichever votes have been filled in, or null if neither has. */
export function averageVote(visit: Visit | undefined): number | null {
  if (!visit) return null;

  const votes = [visit.voteInes, visit.voteFabienne].filter(
    (vote): vote is number => typeof vote === "number",
  );

  if (votes.length === 0) return null;

  return votes.reduce((sum, vote) => sum + vote, 0) / votes.length;
}

export function formatPrice(price: number | null): string {
  if (price === null) return "—";

  return price.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

export function formatVisitDate(date: string | null): string {
  if (!date) return "";

  // Parse as a plain calendar date; avoids a timezone shift moving it a day.
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return "";

  return new Date(year, month - 1, day).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * What to show for the visit date. An empty date is not missing data: it means
 * they went but nobody remembers when.
 */
export function visitDateLabel(date: string | null): string {
  return date ? formatVisitDate(date) : "fecha desconocida";
}

export type VisitStats = {
  visitedCount: number;
  total: number;
  averagePrice: number | null;
  cheapest: { name: string; price: number } | null;
  bestRated: { name: string; score: number } | null;
};

export function visitStats(barList: Bar[], visits: VisitMap): VisitStats {
  let priceSum = 0;
  let priceCount = 0;
  let visitedCount = 0;
  let cheapest: VisitStats["cheapest"] = null;
  let bestRated: VisitStats["bestRated"] = null;

  for (const bar of barList) {
    const visit = visits[barId(bar)];
    if (!visit?.visited) continue;

    visitedCount++;

    if (visit.beerPrice !== null) {
      priceSum += visit.beerPrice;
      priceCount++;

      if (!cheapest || visit.beerPrice < cheapest.price) {
        cheapest = { name: bar.name, price: visit.beerPrice };
      }
    }

    const score = averageVote(visit);
    if (score !== null && (!bestRated || score > bestRated.score)) {
      bestRated = { name: bar.name, score };
    }
  }

  return {
    visitedCount,
    total: barList.length,
    averagePrice: priceCount > 0 ? priceSum / priceCount : null,
    cheapest,
    bestRated,
  };
}
