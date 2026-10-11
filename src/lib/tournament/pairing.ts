import { previousOpponents, computeStandings } from "./standings";
import { newId, type Pod, type Round, type TournamentState } from "./types";

/**
 * Tamanhos de mesa: maximiza pods de 4; resto 3; se sobrar 1 → bye.
 * rem 0 → só 4s; rem 3 → um 3; rem 2 → dois 3s; rem 1 → bye + 4s.
 */
export function podPlan(n: number): { sizes: number[]; bye: boolean } {
  if (n <= 0) return { sizes: [], bye: false };
  if (n === 1) return { sizes: [], bye: true };
  if (n === 2) return { sizes: [], bye: false };
  if (n === 3) return { sizes: [3], bye: false };

  const rem = n % 4;
  if (rem === 0) return { sizes: Array(n / 4).fill(4), bye: false };
  if (rem === 3) {
    const fours = Math.floor(n / 4);
    return { sizes: [...Array(fours).fill(4), 3], bye: false };
  }
  if (rem === 2) {
    const fours = Math.floor(n / 4);
    // 4k+2 → (k-1)×4 + 2×3
    return {
      sizes: [...Array(fours - 1).fill(4), 3, 3],
      bye: false,
    };
  }
  // rem === 1 → bye + 4s
  return { sizes: Array(Math.floor(n / 4)).fill(4), bye: true };
}

function rematchCount(ids: string[], history: TournamentState["rounds"]): number {
  let count = 0;
  for (let i = 0; i < ids.length; i++) {
    const seen = previousOpponents(ids[i], history);
    for (let j = i + 1; j < ids.length; j++) {
      if (seen.has(ids[j])) count += 1;
    }
  }
  return count;
}

/**
 * Pairing suíço simples (v1):
 * - Ordena pela classificação atual
 * - Monta mesas em ordem de ranking
 * - Bye para quem tem menos byes entre os piores classificados
 * - Micro-swap local para reduzir rematches
 *
 * Limitações: não é pairing ótimo (sem backtracking completo); rematches
 * ainda podem ocorrer em campo pequeno após várias rodadas.
 */
export function generateSwissRound(state: TournamentState): {
  round: Round;
  warning?: string;
} {
  const active = state.players;
  if (active.length < 3) {
    throw new Error(
      "É preciso pelo menos 3 jogadores para gerar uma rodada (pods de 3–4).",
    );
  }
  if (active.length === 2) {
    throw new Error("Com 2 jogadores não dá para montar mesa de 3–4.");
  }

  const standings = computeStandings(state);
  const ordered = standings.map((s) => s.playerId);
  let pool = [...ordered];
  let byePlayer: string | undefined;

  const initial = podPlan(pool.length);
  if (initial.bye) {
    const byeCounts = new Map(standings.map((s) => [s.playerId, s.byes] as const));
    const candidates = [...pool].sort((a, b) => {
      const ba = byeCounts.get(a) ?? 0;
      const bb = byeCounts.get(b) ?? 0;
      if (ba !== bb) return ba - bb;
      // empate em byes: pior ranking (índice maior em ordered)
      return ordered.indexOf(b) - ordered.indexOf(a);
    });
    byePlayer = candidates[0];
    pool = pool.filter((id) => id !== byePlayer);
  }

  const { sizes } = podPlan(pool.length);
  if (sizes.length === 0) {
    throw new Error("Não foi possível montar mesas com este número de jogadores.");
  }

  const history = state.rounds;
  const working = [...pool];
  const pods: Pod[] = [];
  let cursor = 0;

  for (const size of sizes) {
    let bestScore = rematchCount(working.slice(cursor, cursor + size), history);
    if (bestScore > 0) {
      const windowEnd = Math.min(working.length, cursor + size + 4);
      for (let swapIdx = cursor + size; swapIdx < windowEnd; swapIdx++) {
        const trial = [
          ...working.slice(cursor, cursor + size - 1),
          working[swapIdx],
        ];
        const score = rematchCount(trial, history);
        if (score < bestScore) {
          bestScore = score;
          const tmp = working[cursor + size - 1];
          working[cursor + size - 1] = working[swapIdx];
          working[swapIdx] = tmp;
        }
      }
    }

    pods.push({
      id: newId(),
      playerIds: working.slice(cursor, cursor + size),
    });
    cursor += size;
  }

  if (byePlayer) {
    pods.push({
      id: newId(),
      playerIds: [byePlayer],
      result: { kind: "bye", playerId: byePlayer },
    });
  }

  const rematches = pods
    .filter((p) => p.playerIds.length > 1)
    .reduce((n, p) => n + rematchCount(p.playerIds, history), 0);

  return {
    round: {
      id: newId(),
      number: state.rounds.length + 1,
      pods,
    },
    warning:
      rematches > 0
        ? `Pairing v1: ${rematches} reencontro(s) nesta rodada (campo pequeno / sem backtracking completo).`
        : undefined,
  };
}
