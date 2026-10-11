import { isOrganizerRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import {
  countRounds,
  loadTournament,
  setEventStatus,
} from "@/lib/tournament/repository";
import { isEventStatus } from "@/lib/tournament/types";
import { computeStandings } from "@/lib/tournament/standings";


export async function PATCH(req: Request) {
  if (!(await isOrganizerRequest())) {
    return jsonError("Só a organizadora pode mudar o estado do evento.", 403);
  }
  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  if (!body || !isEventStatus(body.status)) {
    return jsonError("Status inválido.");
  }
  if (body.status === "inscricoes_abertas" && countRounds() > 0) {
    return jsonError(
      "Há rodadas registradas. Remova as rodadas antes de reabrir as inscrições, ou zere o torneio.",
    );
  }
  setEventStatus(body.status);
  const state = loadTournament();
  return jsonOk({ state, standings: computeStandings(state) });
}
