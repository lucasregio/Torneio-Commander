import { clearOrgCookie } from "@/lib/auth";
import { jsonOk } from "@/lib/api-helpers";


export async function POST() {
  await clearOrgCookie();
  return jsonOk({ ok: true, isOrganizer: false });
}
