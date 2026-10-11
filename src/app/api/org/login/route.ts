import { setOrgCookie, verifyOrgPin } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";


export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { pin?: string } | null;
  if (!body?.pin || !verifyOrgPin(body.pin)) {
    return jsonError("PIN de organizador incorreto.", 401);
  }
  await setOrgCookie();
  return jsonOk({ ok: true, isOrganizer: true });
}
