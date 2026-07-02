"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { bars, type Bar, GOOGLE_MAPS_ID } from "@/data/bars";

const BarMap = dynamic(() => import("./BarMap"), { ssr: false });

export default function BarExplorer() {
  const [query, setQuery] = useState("");
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);

  const filteredBars = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bars;
    return bars.filter((bar) => bar.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <aside className="flex w-full flex-col border-b border-stone-800 bg-stone-950 lg:w-80 lg:border-b-0 lg:border-r">
        <div className="border-b border-stone-800 p-4">
          <h1 className="text-lg font-bold text-amber-400">
            Bares cutres de Múnich
          </h1>
          <p className="mt-1 text-sm text-stone-400">
            {filteredBars.length} de {bars.length} bares
          </p>
          <input
            type="search"
            placeholder="Buscar bar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-3 w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
        <ul className="max-h-48 flex-1 overflow-y-auto lg:max-h-none">
          {filteredBars.map((bar) => (
            <li key={`${bar.name}-${bar.lat}`}>
              <button
                type="button"
                onClick={() => setSelectedBar(bar)}
                className={`w-full border-b border-stone-900 px-4 py-3 text-left text-sm transition-colors hover:bg-stone-900 ${
                  selectedBar?.name === bar.name &&
                  selectedBar?.lat === bar.lat
                    ? "bg-stone-900 text-amber-400"
                    : "text-stone-200"
                }`}
              >
                {bar.name}
              </button>
            </li>
          ))}
          {filteredBars.length === 0 && (
            <li className="px-4 py-6 text-sm text-stone-500">
              Ningún bar coincide con tu búsqueda.
            </li>
          )}
        </ul>
        <div className="border-t border-stone-800 p-3 text-xs text-stone-500">
          Datos del{" "}
          <a
            href={`https://www.google.com/maps/d/viewer?mid=${GOOGLE_MAPS_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:underline"
          >
            mapa original
          </a>
        </div>
      </aside>
      <div className="relative min-h-[50vh] flex-1 lg:min-h-0">
        <BarMap
          bars={filteredBars}
          selectedBar={selectedBar}
          onSelectBar={setSelectedBar}
        />
      </div>
    </div>
  );
}
