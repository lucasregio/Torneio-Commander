import {
  isOrganizerRequest,
  newPlayerToken,
  playerTokenFromRequest,
} from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { normalizePlayerFields } from "@/lib/tournament/player-fields";
import {
  findPlayerIdByToken,
  getEventStatus,
  insertPlayer,
  loadTournament,
} from "@/lib/tournament/repository";
import { newId } from "@/lib/tournament/types";
import { computeStandings } from "@/lib/tournament/standings";


export async function POST(req: Request) {
  const isOrganizer = await isOrganizerRequest();
  const status = getEventStatus();
  const token = playerTokenFromRequest(req);
  const existingSelf = token ? findPlayerIdByToken(token) : null;

  if (!isOrganizer) {
    if (status !== "inscricoes_abertas") {
      return jsonError("Inscrições fechadas.", 403);
    }
    if (existingSelf) {
      return jsonError(
        "Este aparelho já tem uma ficha. Edite a sua ou peça à organizadora.",
        403,
      );
    }
  }

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    commander?: string;
    deckUrl?: string;
  } | null;
  const normalized = normalizePlayerFields({
    name: body?.name ?? "",
    commander: body?.commander,
    deckUrl: body?.deckUrl,
  });
  if (!normalized.ok) return jsonError(normalized.error);

  const state = loadTournament();
  if (
    state.players.some(
      (p) =>
        p.name.toLocaleLowerCase("pt-BR") ===
        normalized.fields.name.toLocaleLowerCase("pt-BR"),
    )
  ) {
    return jsonError("Já existe um jogador com esse nome.");
  }

  const id = newId();
  const editToken = newPlayerToken();
  try {
    insertPlayer({
      id,
      name: normalized.fields.name,
      commander: normalized.fields.commander,
      deckUrl: normalized.fields.deckUrl,
      editToken,
    });
  } catch {
    return jsonError("Não foi possível criar o jogador (nome duplicado?).");
  }

  const next = loadTournament();
  return jsonOk({
    state: next,
    standings: computeStandings(next),
    playerId: id,
    playerToken: isOrganizer ? undefined : editToken,
  });
}
