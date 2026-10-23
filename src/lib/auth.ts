import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ORG_COOKIE, orgPin } from "@/lib/tournament/constants";

export function newPlayerToken(): string {
  return randomBytes(24).toString("hex");
}

function orgCookieValue(): string {
  return createHash("sha256")
    .update(`torneio-org:${orgPin()}`)
    .digest("hex");
}

export function verifyOrgPin(pin: string): boolean {
  const expected = orgPin();
  const a = Buffer.from(pin.trim());
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function setOrgCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(ORG_COOKIE, orgCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearOrgCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(ORG_COOKIE);
}

export async function isOrganizerRequest(): Promise<boolean> {
  const jar = await cookies();
  const value = jar.get(ORG_COOKIE)?.value;
  if (!value) return false;
  const expected = orgCookieValue();
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function playerTokenFromRequest(req: Request): string | null {
  return req.headers.get("x-player-token")?.trim() || null;
}
