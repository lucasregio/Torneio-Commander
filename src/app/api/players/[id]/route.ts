import { isOrganizerRequest, playerTokenFromRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { normalizePlayerFields } from "@/lib/tournament/player-fields";
import {
  countRounds,
  deletePlayerRow,
  findPlayerIdByToken,
  findPlayerToken,
  getEventStatus,
  loadTournament,
  updatePlayerRow,
} from "@/lib/tournament/repository";
import { computeStandings } from "@/lib/tournament/standings";


type Ctx = { params: Promise<{ id: string }> };

function canEdit(
  isOrganizer: boolean,
  status: string,
  playerId: string,
  tokenPlayerId: string | null,
) {
  if (isOrganizer) return true;
  if (status !== "inscricoes_abertas") return false;
  return tokenPlayerId === playerId;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const isOrganizer = await isOrganizerRequest();
  const status = getEventStatus();
  const token = playerTokenFromRequest(req);
  const tokenPlayerId = token ? findPlayerIdByToken(token) : null;

  if (!findPlayerToken(id)) return jsonError("Jogador não encontrado.", 404);
  if (!canEdit(isOrganizer, status, id, tokenPlayerId)) {
    return jsonError(
      status === "inscricoes_abertas"
        ? "Só dá para editar a própria ficha."
        : "Inscrições trancadas — só a organizadora altera fichas.",
      403,
    );
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
        p.id !== id &&
        p.name.toLocaleLowerCase("pt-BR") ===
          normalized.fields.name.toLocaleLowerCase("pt-BR"),
    )
  ) {
    return jsonError("Já existe um jogador com esse nome.");
  }

  updatePlayerRow(id, normalized.fields);
  const next = loadTournament();
  return jsonOk({ state: next, standings: computeStandings(next) });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const isOrganizer = await isOrganizerRequest();
  const status = getEventStatus();
  const token = playerTokenFromRequest(req);
  const tokenPlayerId = token ? findPlayerIdByToken(token) : null;

  if (!findPlayerToken(id)) return jsonError("Jogador não encontrado.", 404);
  if (countRounds() > 0) {
    return jsonError("Não dá para remover jogadores depois que as rodadas começaram.");
  }
  if (status !== "inscricoes_abertas" && !isOrganizer) {
    return jsonError("Inscrições fechadas.", 403);
  }
  if (!isOrganizer && tokenPlayerId !== id) {
    return jsonError("Só dá para remover a própria ficha.", 403);
  }

  deletePlayerRow(id);
  const next = loadTournament();
  return jsonOk({ state: next, standings: computeStandings(next) });
}
