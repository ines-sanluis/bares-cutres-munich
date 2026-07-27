"use client";

import { useActionState } from "react";
import { unlock } from "@/app/auth-actions";
import { emptyAuthState } from "@/lib/form-state";

export default function UnlockForm({ hint }: { hint?: string }) {
  const [state, action, pending] = useActionState(unlock, emptyAuthState);

  return (
    <form action={action} className="flex flex-col gap-2">
      {hint && <p className="text-xs text-stone-500">{hint}</p>}
      <div className="flex gap-2">
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          autoComplete="current-password"
          // text-base on phones: anything smaller makes iOS zoom in on focus.
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-base text-stone-800 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none lg:text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-amber-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-50"
        >
          {pending ? "…" : "Entrar"}
        </button>
      </div>
      {state.error && <p className="text-xs text-rose-700">{state.error}</p>}
    </form>
  );
}
