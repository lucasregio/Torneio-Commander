import {
  PLAYER_ID_KEY,
  PLAYER_TOKEN_KEY,
} from "@/lib/tournament/constants";
import type {
  EventStatus,
  PlayerInput,
  PodResult,
  StandingRow,
  TournamentState,
} from "@/lib/tournament/types";

export type EventPayload = {
  slug: string;
  state: TournamentState;
  standings: StandingRow[];
  isOrganizer: boolean;
  selfPlayerId: string | null;
  warning?: string | null;
  playerToken?: string;
  playerId?: string;
  error?: string;
};

function playerToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PLAYER_TOKEN_KEY);
}

export function savePlayerSession(id: string, token: string) {
  window.localStorage.setItem(PLAYER_ID_KEY, id);
  window.localStorage.setItem(PLAYER_TOKEN_KEY, token);
}

export function clearPlayerSession() {
  window.localStorage.removeItem(PLAYER_ID_KEY);
  window.localStorage.removeItem(PLAYER_TOKEN_KEY);
}

export function loadCachedSelfId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PLAYER_ID_KEY);
}

async function api<T extends object>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = playerToken();
  if (token) headers.set("X-Player-Token", token);

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Erro ${res.status}`);
  }
  return data;
}

export function fetchEvent() {
  return api<EventPayload>("/api/event");
}

export function orgLogin(pin: string) {
  return api<{ ok: boolean; isOrganizer: boolean }>("/api/org/login", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export function orgLogout() {
  return api<{ ok: boolean }>("/api/org/logout", { method: "POST" });
}

export function patchStatus(status: EventStatus) {
  return api<Pick<EventPayload, "state" | "standings">>("/api/event/status", {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function resetEvent() {
  return api<Pick<EventPayload, "state" | "standings">>("/api/event/reset", {
    method: "POST",
  });
}

export function createPlayer(input: PlayerInput) {
  return api<EventPayload>("/api/players", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function patchPlayer(id: string, input: PlayerInput) {
  return api<Pick<EventPayload, "state" | "standings">>(`/api/players/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function removePlayer(id: string) {
  return api<Pick<EventPayload, "state" | "standings">>(`/api/players/${id}`, {
    method: "DELETE",
  });
}

export function createRound() {
  return api<Pick<EventPayload, "state" | "standings" | "warning">>(
    "/api/rounds",
    { method: "POST" },
  );
}

export function deleteLastRound() {
  return api<Pick<EventPayload, "state" | "standings">>("/api/rounds/last", {
    method: "DELETE",
  });
}

export function putPodResult(podId: string, result: PodResult | null) {
  return api<Pick<EventPayload, "state" | "standings">>(
    `/api/pods/${podId}/result`,
    {
      method: "PUT",
      body: JSON.stringify({ result }),
    },
  );
}
