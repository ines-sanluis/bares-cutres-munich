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
  unlocked,
}: {
  visits: VisitMap;
  unlocked: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [editingBar, setEditingBar] = useState<Bar | null>(null);

  const stats = useMemo(() => visitStats(bars, visits), [visits]);

  const filteredBars = useMemo(() => {
    const q = query.trim().toLowerCase();

    return bars.filter((bar) => {
      if (q && !bar.name.toLowerCase().includes(q)) return false;

      const isVisited = visits[barId(bar)]?.visited ?? false;
      if (filter === "visited") return isVisited;
      if (filter === "pending") return !isVisited;
      return true;
    });
  }, [query, filter, visits]);

  const openBar = (bar: Bar) => {
    setSelectedBar(bar);
    setEditingBar(bar);
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <aside className="flex w-full flex-col border-b border-stone-200 bg-paper lg:w-80 lg:border-b-0 lg:border-r">
        <div className="border-b border-stone-200 p-4">
          <h1 className="text-lg font-bold text-amber-700">
            Bares cutres de Múnich
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {filteredBars.length} de {bars.length} bares
          </p>
          <input
            type="search"
            placeholder="Buscar bar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-3 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none"
          />

          <div className="mt-3 flex gap-1 rounded-lg bg-stone-100 p-1">
            {(Object.keys(FILTER_LABELS) as Filter[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
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

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-b border-stone-200 p-4 text-xs">
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
        </dl>

        <ul className="max-h-48 flex-1 overflow-y-auto lg:max-h-none">
          {filteredBars.map((bar) => {
            const visit = visits[barId(bar)];
            const score = averageVote(visit);
            const isSelected =
              selectedBar?.name === bar.name && selectedBar?.lat === bar.lat;

            return (
              <li key={`${bar.name}-${bar.lat}`}>
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
                    <span className="block truncate">{bar.name}</span>
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

        <div className="border-t border-stone-200 p-3">
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

        <div className="border-t border-stone-200 p-3 text-xs text-stone-500">
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

      <div className="relative min-h-[50vh] flex-1 lg:min-h-0">
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
    </div>
  );
}
