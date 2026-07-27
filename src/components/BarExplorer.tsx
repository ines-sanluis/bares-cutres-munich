"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { lock } from "@/app/auth-actions";
import { bars, barId, type Bar, GOOGLE_MAPS_ID } from "@/data/bars";
import {
  averageVote,
  formatPrice,
  visitDateLabel,
  visitStats,
  type VisitMap,
} from "@/lib/visits";
import AddBarModal from "./AddBarModal";
import UnlockForm from "./UnlockForm";
import VisitModal from "./VisitModal";

const BarMap = dynamic(() => import("./BarMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-500">
      Cargando mapa…
    </div>
  ),
});

type Filter = "all" | "visited" | "pending";

const FILTER_LABELS: Record<Filter, string> = {
  all: "Todos",
  visited: "Visitados",
  pending: "Pendientes",
};

export default function BarExplorer({
  visits,
  extraBars,
  unlocked,
}: {
  visits: VisitMap;
  extraBars: Bar[];
  unlocked: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [editingBar, setEditingBar] = useState<Bar | null>(null);
  const [addingBar, setAddingBar] = useState(false);
  // Phones only: the bottom sheet starts collapsed so the map and the search
  // get the screen. Everything below the search folds away behind the toggle.
  const [sheetOpen, setSheetOpen] = useState(false);

  const allBars = useMemo(() => [...bars, ...extraBars], [extraBars]);

  // Deliberately the original 100 only: the challenge progress must not move
  // because a new bar was added.
  const stats = useMemo(() => visitStats(bars, visits), [visits]);
  const extraStats = useMemo(
    () => visitStats(extraBars, visits),
    [extraBars, visits],
  );

  const filteredBars = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allBars.filter((bar) => {
      if (q && !bar.name.toLowerCase().includes(q)) return false;

      const isVisited = visits[barId(bar)]?.visited ?? false;
      if (filter === "visited") return isVisited;
      if (filter === "pending") return !isVisited;
      return true;
    });
  }, [allBars, query, filter, visits]);

  const openBar = (bar: Bar) => {
    setSelectedBar(bar);
    setEditingBar(bar);
    // On a phone the map is behind the sheet: fold it back so the flown-to
    // marker is visible once the modal closes.
    setSheetOpen(false);
  };

  // Folded away on phones while the sheet is collapsed, always shown on desktop.
  const foldable = sheetOpen ? "" : "max-lg:hidden";

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-stone-200 bg-paper max-lg:order-last max-lg:max-h-[80dvh] max-lg:border-t lg:w-80 lg:border-r">
        <div className="shrink-0 border-b border-stone-200 p-3 lg:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-amber-700 lg:text-lg">
                Bares cutres de Múnich
              </h1>
              <p className="mt-0.5 text-xs text-stone-500 lg:mt-1 lg:text-sm">
                {filteredBars.length} de {allBars.length} bares
                <span className="lg:hidden">
                  {" "}
                  · {stats.visitedCount} visitados
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen((open) => !open)}
              aria-expanded={sheetOpen}
              className="-mr-1 -mt-1 shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 lg:hidden"
            >
              {sheetOpen ? "Ocultar ▾" : "Lista ▴"}
            </button>
          </div>

          <input
            type="search"
            placeholder="Buscar bar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            // text-base on phones: anything smaller makes iOS zoom in on focus.
            className="mt-3 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-base text-stone-800 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none lg:text-sm"
          />

          <div className="mt-2 flex gap-1 rounded-lg bg-stone-100 p-1 lg:mt-3">
            {(Object.keys(FILTER_LABELS) as Filter[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`flex-1 rounded-md px-2 py-2 text-xs font-medium transition-colors lg:py-1.5 ${
                  filter === option
                    ? "bg-amber-700 text-white"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {FILTER_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        <dl
          className={`grid shrink-0 grid-cols-2 gap-x-3 gap-y-2 border-b border-stone-200 p-3 text-xs lg:p-4 ${foldable}`}
        >
          <div>
            <dt className="text-stone-500">Visitados</dt>
            <dd className="font-semibold text-green-700">
              {stats.visitedCount} de {stats.total}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Cerveza media</dt>
            <dd className="font-semibold text-stone-800">
              {formatPrice(stats.averagePrice)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-stone-500">Más barata</dt>
            <dd className="truncate font-semibold text-stone-800">
              {stats.cheapest
                ? `${formatPrice(stats.cheapest.price)} · ${stats.cheapest.name}`
                : "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-stone-500">Mejor valorado</dt>
            <dd className="truncate font-semibold text-stone-800">
              {stats.bestRated
                ? `${stats.bestRated.name} (${stats.bestRated.score.toFixed(1)})`
                : "—"}
            </dd>
          </div>
          {extraStats.total > 0 && (
            <div className="col-span-2">
              <dt className="text-stone-500">Añadidos por vosotras</dt>
              <dd className="font-semibold text-violet-700">
                +{extraStats.total} · {extraStats.visitedCount} visitado
                {extraStats.visitedCount === 1 ? "" : "s"}
              </dd>
            </div>
          )}
        </dl>

        {/* Stays reachable on phones with the sheet collapsed: finding a bar
            that is not on the map is exactly when you want to add one. */}
        {unlocked && (
          <div className="shrink-0 border-b border-stone-200 px-3 py-2 lg:px-4 lg:py-3">
            <button
              type="button"
              onClick={() => setAddingBar(true)}
              className="w-full rounded-lg border border-dashed border-violet-300 px-3 py-2 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50"
            >
              + Añadir un bar nuevo
            </button>
          </div>
        )}

        <ul
          className={`min-h-24 flex-1 overflow-y-auto lg:min-h-0 ${foldable}`}
        >
          {filteredBars.map((bar) => {
            const id = barId(bar);
            const visit = visits[id];
            const score = averageVote(visit);
            const isSelected = selectedBar !== null && barId(selectedBar) === id;

            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => openBar(bar)}
                  className={`flex w-full items-start gap-2 border-b border-stone-100 px-4 py-3 text-left text-sm transition-colors hover:bg-stone-50 ${
                    isSelected ? "bg-amber-50 text-amber-800" : "text-stone-800"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      visit?.visited ? "bg-green-700" : "bg-stone-300"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="min-w-0 truncate">{bar.name}</span>
                      {bar.origin === "extra" && (
                        <span
                          title="No está en los 100 originales"
                          className="shrink-0 rounded bg-violet-100 px-1 py-0.5 text-[10px] font-semibold text-violet-700"
                        >
                          NUEVO
                        </span>
                      )}
                    </span>
                    {visit?.visited && (
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
                        {score !== null && (
                          <span className="text-amber-700">
                            🍺 {score.toFixed(1)}
                          </span>
                        )}
                        {visit.beerPrice !== null && (
                          <span>{formatPrice(visit.beerPrice)}</span>
                        )}
                        <span
                          className={visit.visitedOn ? "" : "italic opacity-70"}
                        >
                          {visitDateLabel(visit.visitedOn)}
                        </span>
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
          {filteredBars.length === 0 && (
            <li className="px-4 py-6 text-sm text-stone-500">
              Ningún bar coincide con tu búsqueda.
            </li>
          )}
        </ul>

        <div className={`shrink-0 border-t border-stone-200 p-3 ${foldable}`}>
          {unlocked ? (
            <form action={lock} className="flex items-center justify-between">
              <span className="text-xs text-green-700">🔓 Desbloqueado</span>
              <button
                type="submit"
                className="rounded px-2 py-1 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-800"
              >
                Bloquear
              </button>
            </form>
          ) : (
            <UnlockForm hint="🔒 Solo lectura. Entra para editar visitas." />
          )}
        </div>

        <div
          className={`shrink-0 border-t border-stone-200 p-3 text-xs text-stone-500 ${foldable}`}
        >
          Datos del{" "}
          <a
            href={`https://www.google.com/maps/d/viewer?mid=${GOOGLE_MAPS_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-700 hover:underline"
          >
            mapa original
          </a>
        </div>
      </aside>

      <div className="relative min-h-0 flex-1">
        <BarMap
          bars={filteredBars}
          visits={visits}
          selectedBar={selectedBar}
          unlocked={unlocked}
          onSelectBar={setSelectedBar}
          onEditBar={openBar}
        />
      </div>

      {editingBar && (
        <VisitModal
          bar={editingBar}
          visit={visits[barId(editingBar)]}
          unlocked={unlocked}
          onClose={() => setEditingBar(null)}
        />
      )}

      {addingBar && <AddBarModal onClose={() => setAddingBar(false)} />}
    </div>
  );
}
