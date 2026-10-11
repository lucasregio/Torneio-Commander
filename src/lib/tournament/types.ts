export type Player = {
  id: string;
  name: string;
};

export type PodResult =
  | { kind: "win"; winnerId: string }
  | { kind: "draw" }
  | { kind: "bye"; playerId: string };

export type Pod = {
  id: string;
  /** 3–4 players for a mesa; 1 player for bye */
  playerIds: string[];
  result?: PodResult;
};

export type Round = {
  id: string;
  number: number;
  pods: Pod[];
};

export type TournamentState = {
  version: 1;
  players: Player[];
  rounds: Round[];
};

export type StandingRow = {
  playerId: string;
  name: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  byes: number;
  /** Soma dos pontos de match dos oponentes enfrentados (bye não conta). */
  opponentPoints: number;
  gamesPlayed: number;
};

export const STORAGE_KEY = "torneio-commander-500";

export const POINTS = {
  win: 3,
  draw: 1,
  loss: 0,
  bye: 3,
} as const;

export function emptyTournament(): TournamentState {
  return { version: 1, players: [], rounds: [] };
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
