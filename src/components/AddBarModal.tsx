"use client";

import dynamic from "next/dynamic";
import { useActionState, useEffect, useState } from "react";
import { addBar } from "@/app/actions";
import { BAR_NAME_MAX_LENGTH } from "@/data/bars";
import { emptyBarFormState } from "@/lib/form-state";
import type { LatLng } from "./LocationPicker";

const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 w-full items-center justify-center rounded-lg bg-stone-100 text-sm text-stone-500">
      Cargando mapa…
    </div>
  ),
});

export default function AddBarModal({ onClose }: { onClose: () => void }) {
  const [state, action, saving] = useActionState(addBar, emptyBarFormState);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocateError("Este navegador no sabe dónde estás.");
      return;
    }

    setLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        // Denied, unavailable, or a non-HTTPS page: the map stays usable.
        setLocateError("No se pudo obtener tu ubicación. Marca el sitio a mano.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-stone-900/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-stone-200 bg-surface shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Añadir un bar"
      >
        <div className="flex items-start justify-between gap-3 border-b border-stone-200 p-4">
          <h2 className="text-base font-bold text-amber-700">Añadir un bar</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mt-1 rounded px-2 py-1 text-lg leading-none text-stone-400 hover:bg-stone-100 hover:text-stone-800"
          >
            ✕
          </button>
        </div>

        <form action={action} className="flex flex-col gap-4 p-4">
          <label className="flex flex-col gap-1 text-xs text-stone-500">
            Nombre del bar
            <input
              type="text"
              name="name"
              required
              maxLength={BAR_NAME_MAX_LENGTH}
              placeholder="Ej. Bar Centrale"
              autoComplete="off"
              className="rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none"
            />
          </label>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-stone-500">
                Toca el mapa para poner el pin
              </span>
              <button
                type="button"
                onClick={locateMe}
                disabled={locating}
                className="shrink-0 rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-50"
              >
                {locating ? "Buscando…" : "📍 Estoy aquí"}
              </button>
            </div>

            <LocationPicker value={location} onPick={setLocation} />

            <p className="text-xs text-stone-500">
              {location
                ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                : "Sin ubicación todavía."}
            </p>
            {locateError && (
              <p className="text-xs text-rose-700">{locateError}</p>
            )}
          </div>

          <input type="hidden" name="lat" value={location?.lat ?? ""} />
          <input type="hidden" name="lng" value={location?.lng ?? ""} />

          {state.error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !location}
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Añadiendo…" : "Añadir bar"}
          </button>
        </form>
      </div>
    </div>
  );
}
