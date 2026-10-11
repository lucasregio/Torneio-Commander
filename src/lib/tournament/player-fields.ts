import type { Player, PlayerInput } from "./types";

/** Normaliza URL opcional; exige http(s). Retorna null se inválida. */
export function normalizeDeckUrl(
  raw: string | undefined,
): { ok: true; value?: string } | { ok: false; error: string } {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return { ok: true, value: undefined };
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, error: "O link do deck precisa ser http ou https." };
    }
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, error: "Link do deck inválido." };
  }
}

export function normalizePlayerFields(
  input: PlayerInput,
): { ok: true; fields: Omit<Player, "id"> } | { ok: false; error: string } {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Digite um nome." };

  const commander = input.commander?.trim() || undefined;
  const urlResult = normalizeDeckUrl(input.deckUrl);
  if (!urlResult.ok) return urlResult;

  return {
    ok: true,
    fields: {
      name,
      commander,
      deckUrl: urlResult.value,
    },
  };
}

export function migratePlayer(raw: Partial<Player> & { id: string; name: string }): Player {
  const commander =
    typeof raw.commander === "string" && raw.commander.trim()
      ? raw.commander.trim()
      : undefined;
  const deck =
    typeof raw.deckUrl === "string" && raw.deckUrl.trim()
      ? raw.deckUrl.trim()
      : undefined;
  return {
    id: raw.id,
    name: raw.name,
    ...(commander ? { commander } : {}),
    ...(deck ? { deckUrl: deck } : {}),
  };
}
