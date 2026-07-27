/**
 * Shared `useActionState` shapes and their initial values.
 *
 * These live outside the `"use server"` modules on purpose: such a file may
 * only export async functions, so exporting a plain object from there is a
 * build error.
 */

export type VisitFormState = {
  ok: boolean;
  error: string | null;
};

export const emptyVisitFormState: VisitFormState = { ok: false, error: null };

/** Same shape as a visit write, but for adding or removing an extra bar. */
export type BarFormState = {
  ok: boolean;
  error: string | null;
};

export const emptyBarFormState: BarFormState = { ok: false, error: null };

export type AuthState = {
  error: string | null;
};

export const emptyAuthState: AuthState = { error: null };
