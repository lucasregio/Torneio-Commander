import { isOrganizerRequest, playerTokenFromRequest } from "@/lib/auth";
import { jsonOk } from "@/lib/api-helpers";
import { EVENT_SLUG } from "@/lib/tournament/constants";
import {
  findPlayerIdByToken,
  loadTournament,
} from "@/lib/tournament/repository";
import { computeStandings } from "@/lib/tournament/standings";


export async function GET(req: Request) {
  const state = loadTournament();
  const isOrganizer = await isOrganizerRequest();
  const token = playerTokenFromRequest(req);
  const selfPlayerId = token ? findPlayerIdByToken(token) : null;

  return jsonOk({
    slug: EVENT_SLUG,
    state,
    standings: computeStandings(state),
    isOrganizer,
    selfPlayerId,
  });
}
