import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const UNLOCK_COOKIE = "bares_unlock";

/** 90 days, so the passphrase is not retyped on every trip to a bar. */
export const UNLOCK_MAX_AGE = 60 * 60 * 24 * 90;

function tokenFor(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

/**
 * The cookie holds a hash of the passphrase rather than a flag: an httpOnly
 * cookie still cannot be trusted (anyone can send an arbitrary Cookie header),
 * so the value has to be something only someone who knows the passphrase can
 * produce.
 */
function expectedToken(): string | null {
  const password = process.env.APP_PASSWORD;
  return password ? tokenFor(password) : null;
}

export function isPasswordConfigured(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}

export function checkPassword(input: string): boolean {
  const expected = expectedToken();
  return expected !== null && safeEqual(tokenFor(input), expected);
}

export function unlockToken(): string | null {
  return expectedToken();
}

/**
 * Fails closed: with no APP_PASSWORD set, nothing is unlocked and every write
 * is refused, rather than silently leaving the app open to the world.
 */
export async function isUnlocked(): Promise<boolean> {
  const expected = expectedToken();
  if (!expected) return false;

  const value = (await cookies()).get(UNLOCK_COOKIE)?.value;
  return typeof value === "string" && safeEqual(value, expected);
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}
