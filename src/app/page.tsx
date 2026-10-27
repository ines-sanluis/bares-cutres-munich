import BarExplorer from "@/components/BarExplorer";
import { isUnlocked } from "@/lib/auth";
import { getClosedBarIds, getExtraBars } from "@/lib/bars-server";
import { getVisits } from "@/lib/visits-server";

// Visits come from Supabase, which is not a dynamic API on its own, so without
// this the page would be prerendered once and never show new visits.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [visits, extraBars, closedBarIds, unlocked] = await Promise.all([
    getVisits(),
    getExtraBars(),
    getClosedBarIds(),
    isUnlocked(),
  ]);

  return (
    <main className="h-dvh overflow-hidden">
      <BarExplorer
        visits={visits}
        extraBars={extraBars}
        closedBarIds={closedBarIds}
        unlocked={unlocked}
      />
    </main>
  );
}
