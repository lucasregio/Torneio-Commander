import { ORG_SESSION_KEY, SELF_PLAYER_KEY } from "./types";

/** PIN padrão do MVP; sobrescreva com NEXT_PUBLIC_ORG_PIN. */
export function expectedOrgPin(): string {
  return process.env.NEXT_PUBLIC_ORG_PIN?.trim() || "500";
}

export function loadOrgSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(ORG_SESSION_KEY) === "1";
}

export function saveOrgSession(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) window.sessionStorage.setItem(ORG_SESSION_KEY, "1");
  else window.sessionStorage.removeItem(ORG_SESSION_KEY);
}

export function verifyOrgPin(pin: string): boolean {
  return pin.trim() === expectedOrgPin();
}

export function loadSelfPlayerId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SELF_PLAYER_KEY);
}

export function saveSelfPlayerId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(SELF_PLAYER_KEY, id);
  else window.localStorage.removeItem(SELF_PLAYER_KEY);
}
