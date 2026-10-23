import { isOrganizerRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import {
  getEventStatus,
  loadTournament,
  setPodResult,
} from "@/lib/tournament/repository";
import type { PodResult } from "@/lib/tournament/types";
import { computeStandings } from "@/lib/tournament/standings";


type Ctx = { params: Promise<{ podId: string }> };

function parseResult(body: unknown): PodResult | null | undefined {
  if (body === null) return null;
  if (!body || typeof body !== "object") return undefined;
  const r = body as { kind?: string; winnerId?: string; playerId?: string };
  if (r.kind === "draw") return { kind: "draw" };
  if (r.kind === "win" && typeof r.winnerId === "string") {
    return { kind: "win", winnerId: r.winnerId };
  }
  if (r.kind === "bye" && typeof r.playerId === "string") {
    return { kind: "bye", playerId: r.playerId };
  }
  return undefined;
}

export async function PUT(req: Request, ctx: Ctx) {
  if (!(await isOrganizerRequest())) {
    return jsonError("Só a organizadora reporta resultados.", 403);
  }
  if (getEventStatus() !== "lock") {
    return jsonError("Resultados só com o evento em lock.");
  }

  const { podId } = await ctx.params;
  const body = await req.json().catch(() => undefined);
  const wrapped = body as { result?: unknown } | unknown;
  const raw =
    wrapped && typeof wrapped === "object" && "result" in wrapped
      ? (wrapped as { result: unknown }).result
      : wrapped;
  const result = parseResult(raw);
  if (result === undefined) return jsonError("Resultado inválido.");

  if (!setPodResult(podId, result)) {
    return jsonError("Mesa não encontrada.", 404);
  }
  const state = loadTournament();
  return jsonOk({ state, standings: computeStandings(state) });
}
