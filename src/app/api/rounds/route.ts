import { isOrganizerRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { generateSwissRound } from "@/lib/tournament/pairing";
import {
  getEventStatus,
  insertRound,
  loadTournament,
} from "@/lib/tournament/repository";
import {
  hasIncompleteResults,
  lastRound,
  computeStandings,
} from "@/lib/tournament/standings";


export async function POST() {
  if (!(await isOrganizerRequest())) {
    return jsonError("Só a organizadora gera rodadas.", 403);
  }
  if (getEventStatus() !== "lock") {
    return jsonError("Gere mesas só com o evento em lock (torneio rolando).");
  }

  const state = loadTournament();
  const last = lastRound(state);
  if (last && hasIncompleteResults(last)) {
    return jsonError(
      "Finalize os resultados da rodada atual antes de gerar a próxima.",
    );
  }

  try {
    const { round, warning } = generateSwissRound(state);
    insertRound(round);
    const next = loadTournament();
    return jsonOk({
      state: next,
      standings: computeStandings(next),
      warning: warning ?? null,
    });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Falha ao gerar rodada.",
    );
  }
}
