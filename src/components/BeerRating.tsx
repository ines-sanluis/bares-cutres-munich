"use client";

import { useState } from "react";
import { VOTE_MAX } from "@/lib/visits";

type BeerRatingProps = {
  name: string;
  label: string;
  defaultValue: number | null;
};

/**
 * 1–5 🍺 vote. The value rides along in a hidden input so the control works
 * inside a plain <form> submitted to a Server Action.
 */
export default function BeerRating({
  name,
  label,
  defaultValue,
}: BeerRatingProps) {
  const [value, setValue] = useState<number | null>(defaultValue);

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-stone-700">{label}</span>
      <input type="hidden" name={name} value={value ?? ""} />
      <div className="flex items-center gap-1">
        {Array.from({ length: VOTE_MAX }, (_, index) => index + 1).map(
          (vote) => (
            <button
              key={vote}
              type="button"
              // Tapping the current value clears it, so a vote can be undone.
              onClick={() => setValue(value === vote ? null : vote)}
              aria-label={`${label}: ${vote} de ${VOTE_MAX}`}
              aria-pressed={value === vote}
              className="rounded text-lg leading-none transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            >
              <span className={value !== null && vote <= value ? "" : "opacity-25 grayscale"}>
                🍺
              </span>
            </button>
          ),
        )}
        <span className="ml-1 w-4 text-right text-xs text-stone-500">
          {value ?? "–"}
        </span>
      </div>
    </div>
  );
}
