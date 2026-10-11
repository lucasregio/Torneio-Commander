import { getDb } from "@/lib/db";
import { EVENT_SLUG } from "@/lib/tournament/constants";
import type {
  EventStatus,
  Player,
  Pod,
  PodResult,
  Round,
  TournamentState,
} from "@/lib/tournament/types";
import { isEventStatus } from "@/lib/tournament/types";

type PlayerRow = {
  id: string;
  name: string;
  commander: string | null;
  deck_url: string | null;
  edit_token: string;
};

type RoundRow = { id: string; number: number };
type PodRow = {
  id: string;
  round_id: string;
  sort_index: number;
  result_kind: string | null;
  winner_id: string | null;
  bye_player_id: string | null;
};

export function touchEvent() {
  getDb()
    .prepare("UPDATE event SET updated_at = ? WHERE slug = ?")
    .run(new Date().toISOString(), EVENT_SLUG);
}

export function getEventStatus(): EventStatus {
  const row = getDb()
    .prepare("SELECT status FROM event WHERE slug = ?")
    .get(EVENT_SLUG) as { status: string } | undefined;
  return isEventStatus(row?.status) ? row.status : "inscricoes_abertas";
}

export function setEventStatus(status: EventStatus) {
  getDb()
    .prepare("UPDATE event SET status = ?, updated_at = ? WHERE slug = ?")
    .run(status, new Date().toISOString(), EVENT_SLUG);
}

export function loadTournament(): TournamentState {
  const db = getDb();
  const status = getEventStatus();
  const players = (
    db
      .prepare(
        "SELECT id, name, commander, deck_url FROM players WHERE event_slug = ? ORDER BY created_at ASC",
      )
      .all(EVENT_SLUG) as Omit<PlayerRow, "edit_token">[]
  ).map(
    (p): Player => ({
      id: p.id,
      name: p.name,
      ...(p.commander ? { commander: p.commander } : {}),
      ...(p.deck_url ? { deckUrl: p.deck_url } : {}),
    }),
  );

  const roundRows = db
    .prepare(
      "SELECT id, number FROM rounds WHERE event_slug = ? ORDER BY number ASC",
    )
    .all(EVENT_SLUG) as RoundRow[];

  const rounds: Round[] = roundRows.map((r) => {
    const pods = (
      db
        .prepare(
          "SELECT id, round_id, sort_index, result_kind, winner_id, bye_player_id FROM pods WHERE round_id = ? ORDER BY sort_index ASC",
        )
        .all(r.id) as PodRow[]
    ).map((pod): Pod => {
      const playerIds = (
        db
          .prepare(
            "SELECT player_id FROM pod_players WHERE pod_id = ? ORDER BY seat ASC",
          )
          .all(pod.id) as { player_id: string }[]
      ).map((x) => x.player_id);

      const base: Pod = { id: pod.id, playerIds };
      if (pod.result_kind === "win" && pod.winner_id) {
        base.result = { kind: "win", winnerId: pod.winner_id };
      } else if (pod.result_kind === "draw") {
        base.result = { kind: "draw" };
      } else if (pod.result_kind === "bye" && pod.bye_player_id) {
        base.result = { kind: "bye", playerId: pod.bye_player_id };
      }
      return base;
    });
    return { id: r.id, number: r.number, pods };
  });

  return { version: 1, eventStatus: status, players, rounds };
}

export function findPlayerToken(playerId: string): string | null {
  const row = getDb()
    .prepare(
      "SELECT edit_token FROM players WHERE id = ? AND event_slug = ?",
    )
    .get(playerId, EVENT_SLUG) as { edit_token: string } | undefined;
  return row?.edit_token ?? null;
}

export function findPlayerIdByToken(token: string): string | null {
  const row = getDb()
    .prepare(
      "SELECT id FROM players WHERE edit_token = ? AND event_slug = ?",
    )
    .get(token, EVENT_SLUG) as { id: string } | undefined;
  return row?.id ?? null;
}

export function insertPlayer(input: {
  id: string;
  name: string;
  commander?: string;
  deckUrl?: string;
  editToken: string;
}) {
  getDb()
    .prepare(
      `INSERT INTO players (id, event_slug, name, commander, deck_url, edit_token, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.id,
      EVENT_SLUG,
      input.name,
      input.commander ?? null,
      input.deckUrl ?? null,
      input.editToken,
      new Date().toISOString(),
    );
  touchEvent();
}

export function updatePlayerRow(
  id: string,
  fields: { name: string; commander?: string; deckUrl?: string },
) {
  getDb()
    .prepare(
      `UPDATE players SET name = ?, commander = ?, deck_url = ?
       WHERE id = ? AND event_slug = ?`,
    )
    .run(
      fields.name,
      fields.commander ?? null,
      fields.deckUrl ?? null,
      id,
      EVENT_SLUG,
    );
  touchEvent();
}

export function deletePlayerRow(id: string) {
  getDb()
    .prepare("DELETE FROM players WHERE id = ? AND event_slug = ?")
    .run(id, EVENT_SLUG);
  touchEvent();
}

export function countRounds(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM rounds WHERE event_slug = ?")
    .get(EVENT_SLUG) as { n: number };
  return row.n;
}

export function insertRound(round: Round) {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(
      "INSERT INTO rounds (id, event_slug, number) VALUES (?, ?, ?)",
    ).run(round.id, EVENT_SLUG, round.number);

    round.pods.forEach((pod, index) => {
      db.prepare(
        `INSERT INTO pods (id, round_id, sort_index, result_kind, winner_id, bye_player_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        pod.id,
        round.id,
        index,
        pod.result?.kind ?? null,
        pod.result?.kind === "win" ? pod.result.winnerId : null,
        pod.result?.kind === "bye" ? pod.result.playerId : null,
      );
      pod.playerIds.forEach((playerId, seat) => {
        db.prepare(
          "INSERT INTO pod_players (pod_id, player_id, seat) VALUES (?, ?, ?)",
        ).run(pod.id, playerId, seat);
      });
    });
  });
  tx();
  touchEvent();
}

export function deleteLastRound() {
  const db = getDb();
  const last = db
    .prepare(
      "SELECT id FROM rounds WHERE event_slug = ? ORDER BY number DESC LIMIT 1",
    )
    .get(EVENT_SLUG) as { id: string } | undefined;
  if (!last) return false;
  const tx = db.transaction(() => {
    const pods = db
      .prepare("SELECT id FROM pods WHERE round_id = ?")
      .all(last.id) as { id: string }[];
    for (const pod of pods) {
      db.prepare("DELETE FROM pod_players WHERE pod_id = ?").run(pod.id);
    }
    db.prepare("DELETE FROM pods WHERE round_id = ?").run(last.id);
    db.prepare("DELETE FROM rounds WHERE id = ?").run(last.id);
  });
  tx();
  touchEvent();
  return true;
}

export function setPodResult(podId: string, result: PodResult | null) {
  const db = getDb();
  const pod = db
    .prepare(
      `SELECT pods.id FROM pods
       JOIN rounds ON rounds.id = pods.round_id
       WHERE pods.id = ? AND rounds.event_slug = ?`,
    )
    .get(podId, EVENT_SLUG) as { id: string } | undefined;
  if (!pod) return false;

  db.prepare(
    `UPDATE pods SET result_kind = ?, winner_id = ?, bye_player_id = ? WHERE id = ?`,
  ).run(
    result?.kind ?? null,
    result?.kind === "win" ? result.winnerId : null,
    result?.kind === "bye" ? result.playerId : null,
    podId,
  );
  touchEvent();
  return true;
}

export function resetEvent() {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(
      `DELETE FROM pod_players WHERE pod_id IN (
         SELECT pods.id FROM pods
         JOIN rounds ON rounds.id = pods.round_id
         WHERE rounds.event_slug = ?
       )`,
    ).run(EVENT_SLUG);
    db.prepare(
      `DELETE FROM pods WHERE round_id IN (
         SELECT id FROM rounds WHERE event_slug = ?
       )`,
    ).run(EVENT_SLUG);
    db.prepare("DELETE FROM rounds WHERE event_slug = ?").run(EVENT_SLUG);
    db.prepare("DELETE FROM players WHERE event_slug = ?").run(EVENT_SLUG);
    db.prepare(
      "UPDATE event SET status = ?, updated_at = ? WHERE slug = ?",
    ).run("inscricoes_abertas", new Date().toISOString(), EVENT_SLUG);
  });
  tx();
}
