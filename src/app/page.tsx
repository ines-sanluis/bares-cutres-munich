import BarExplorer from "@/components/BarExplorer";
import { isUnlocked } from "@/lib/auth";
import { getVisits } from "@/lib/visits-server";

// Visits come from Supabase, which is not a dynamic API on its own, so without
// this the page would be prerendered once and never show new visits.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [visits, unlocked] = await Promise.all([getVisits(), isUnlocked()]);

  return (
    <main className="h-dvh overflow-hidden">
      <BarExplorer visits={visits} unlocked={unlocked} />
    </main>
  );
}
