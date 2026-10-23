import { isOrganizerRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import {
  deleteLastRound,
  getEventStatus,
  loadTournament,
} from "@/lib/tournament/repository";
import { computeStandings } from "@/lib/tournament/standings";


export async function DELETE() {
  if (!(await isOrganizerRequest())) {
    return jsonError("Só a organizadora remove rodadas.", 403);
  }
  if (getEventStatus() === "encerrado") {
    return jsonError("Evento encerrado — reabra o status para ajustar rodadas.");
  }
  if (!deleteLastRound()) {
    return jsonError("Nenhuma rodada para remover.");
  }
  const state = loadTournament();
  return jsonOk({ state, standings: computeStandings(state) });
}
