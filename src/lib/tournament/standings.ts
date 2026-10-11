import {
  POINTS,
  type Pod,
  type Player,
  type Round,
  type StandingRow,
  type TournamentState,
} from "./types";

function ensureRow(
  map: Map<string, StandingRow>,
  player: Player,
): StandingRow {
  let row = map.get(player.id);
  if (!row) {
    row = {
      playerId: player.id,
      name: player.name,
      commander: player.commander,
      deckUrl: player.deckUrl,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      byes: 0,
      opponentPoints: 0,
      gamesPlayed: 0,
    };
    map.set(player.id, row);
  } else {
    row.name = player.name;
    row.commander = player.commander;
    row.deckUrl = player.deckUrl;
  }
  return row;
}

function applyPod(map: Map<string, StandingRow>, pod: Pod, players: Player[]) {
  const byId = new Map(players.map((p) => [p.id, p]));
  const result = pod.result;
  if (!result) return;

  if (result.kind === "bye") {
    const player = byId.get(result.playerId);
    if (!player) return;
    const row = ensureRow(map, player);
    row.points += POINTS.bye;
    row.wins += 1;
    row.byes += 1;
    return;
  }

  const podPlayers = pod.playerIds
    .map((id) => byId.get(id))
    .filter((p): p is Player => Boolean(p));

  for (const player of podPlayers) {
    const row = ensureRow(map, player);
    row.gamesPlayed += 1;
    if (result.kind === "draw") {
      row.points += POINTS.draw;
      row.draws += 1;
    } else if (result.winnerId === player.id) {
      row.points += POINTS.win;
      row.wins += 1;
    } else {
      row.points += POINTS.loss;
      row.losses += 1;
    }
  }
}

/** Pontos de match por jogador após rounds completos (só pods com resultado). */
export function matchPointsByPlayer(state: TournamentState): Map<string, number> {
  const map = new Map<string, StandingRow>();
  for (const player of state.players) {
    ensureRow(map, player);
  }
  for (const round of state.rounds) {
    for (const pod of round.pods) {
      applyPod(map, pod, state.players);
    }
  }
  const points = new Map<string, number>();
  for (const [id, row] of map) {
    points.set(id, row.points);
  }
  return points;
}

function opponentsOf(playerId: string, rounds: Round[]): string[] {
  const ops: string[] = [];
  for (const round of rounds) {
    for (const pod of round.pods) {
      if (!pod.result || pod.result.kind === "bye") continue;
      if (!pod.playerIds.includes(playerId)) continue;
      for (const id of pod.playerIds) {
        if (id !== playerId) ops.push(id);
      }
    }
  }
  return ops;
}

export function computeStandings(state: TournamentState): StandingRow[] {
  const map = new Map<string, StandingRow>();
  for (const player of state.players) {
    ensureRow(map, player);
  }
  for (const round of state.rounds) {
    for (const pod of round.pods) {
      applyPod(map, pod, state.players);
    }
  }

  const points = new Map(
    [...map.values()].map((r) => [r.playerId, r.points] as const),
  );

  for (const row of map.values()) {
    const ops = opponentsOf(row.playerId, state.rounds);
    row.opponentPoints = ops.reduce((sum, id) => sum + (points.get(id) ?? 0), 0);
  }

  return [...map.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.opponentPoints !== a.opponentPoints) {
      return b.opponentPoints - a.opponentPoints;
    }
    if (a.byes !== b.byes) return a.byes - b.byes;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

export function previousOpponents(
  playerId: string,
  rounds: Round[],
): Set<string> {
  return new Set(opponentsOf(playerId, rounds));
}

export function hasIncompleteResults(round: Round): boolean {
  return round.pods.some((p) => !p.result);
}

export function lastRound(state: TournamentState): Round | undefined {
  return state.rounds[state.rounds.length - 1];
}
