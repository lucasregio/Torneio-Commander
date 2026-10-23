export const EVENT_SLUG = "commander-500";

export const ORG_COOKIE = "torneio_org";
export const PLAYER_TOKEN_KEY = "torneio-commander-500-player-token";
export const PLAYER_ID_KEY = "torneio-commander-500-self";

export function orgPin(): string {
  return (
    process.env.ORG_PIN?.trim() ||
    process.env.NEXT_PUBLIC_ORG_PIN?.trim() ||
    "500"
  );
}
