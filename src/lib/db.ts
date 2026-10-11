import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { EVENT_SLUG } from "@/lib/tournament/constants";

const globalForDb = globalThis as unknown as { __torneioDb?: Database.Database };

function dbPath() {
  return path.join(process.cwd(), "data", "torneio.sqlite");
}

export function getDb(): Database.Database {
  if (globalForDb.__torneioDb) return globalForDb.__torneioDb;

  const file = dbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  globalForDb.__torneioDb = db;
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS event (
      slug TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      event_slug TEXT NOT NULL,
      name TEXT NOT NULL,
      commander TEXT,
      deck_url TEXT,
      edit_token TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(event_slug, name)
    );

    CREATE TABLE IF NOT EXISTS rounds (
      id TEXT PRIMARY KEY,
      event_slug TEXT NOT NULL,
      number INTEGER NOT NULL,
      UNIQUE(event_slug, number)
    );

    CREATE TABLE IF NOT EXISTS pods (
      id TEXT PRIMARY KEY,
      round_id TEXT NOT NULL,
      sort_index INTEGER NOT NULL DEFAULT 0,
      result_kind TEXT,
      winner_id TEXT,
      bye_player_id TEXT,
      FOREIGN KEY(round_id) REFERENCES rounds(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pod_players (
      pod_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      seat INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (pod_id, player_id),
      FOREIGN KEY(pod_id) REFERENCES pods(id) ON DELETE CASCADE,
      FOREIGN KEY(player_id) REFERENCES players(id) ON DELETE CASCADE
    );
  `);

  const row = db
    .prepare("SELECT slug FROM event WHERE slug = ?")
    .get(EVENT_SLUG) as { slug: string } | undefined;
  if (!row) {
    db.prepare(
      "INSERT INTO event (slug, status, updated_at) VALUES (?, ?, ?)",
    ).run(EVENT_SLUG, "inscricoes_abertas", new Date().toISOString());
  }
}
