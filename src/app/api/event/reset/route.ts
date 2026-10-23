import { isOrganizerRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { loadTournament, resetEvent } from "@/lib/tournament/repository";
import { computeStandings } from "@/lib/tournament/standings";


export async function POST() {
  if (!(await isOrganizerRequest())) {
    return jsonError("Só a organizadora pode zerar o torneio.", 403);
  }
  resetEvent();
  const state = loadTournament();
  return jsonOk({ state, standings: computeStandings(state) });
}
