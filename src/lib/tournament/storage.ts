import { migratePlayer } from "./player-fields";
import { emptyTournament, STORAGE_KEY, type TournamentState } from "./types";

export function loadTournament(): TournamentState {
  if (typeof window === "undefined") return emptyTournament();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyTournament();
    const parsed = JSON.parse(raw) as TournamentState;
    if (parsed?.version !== 1 || !Array.isArray(parsed.players)) {
      return emptyTournament();
    }
    return {
      version: 1,
      players: parsed.players
        .filter(
          (p): p is { id: string; name: string } =>
            Boolean(p && typeof p.id === "string" && typeof p.name === "string"),
        )
        .map(migratePlayer),
      rounds: Array.isArray(parsed.rounds) ? parsed.rounds : [],
    };
  } catch {
    return emptyTournament();
  }
}

export function saveTournament(state: TournamentState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearTournament(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
