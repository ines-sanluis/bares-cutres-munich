import BarExplorer from "@/components/BarExplorer";
import { isUnlocked } from "@/lib/auth";
import { getExtraBars } from "@/lib/bars-server";
import { getVisits } from "@/lib/visits-server";

// Visits come from Supabase, which is not a dynamic API on its own, so without
// this the page would be prerendered once and never show new visits.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [visits, extraBars, unlocked] = await Promise.all([
    getVisits(),
    getExtraBars(),
    isUnlocked(),
  ]);

  return (
    <main className="h-dvh overflow-hidden">
      <BarExplorer
        visits={visits}
        extraBars={extraBars}
        unlocked={unlocked}
      />
    </main>
  );
}
