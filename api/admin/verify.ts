import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSettings } from "../_lib/store.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  const { passcode } = req.body ?? {};
  const settings = await getSettings();
  if (settings.adminPasscode === passcode) {
    return res.json({ success: true });
  }
  return res
    .status(401)
    .json({ error: "Mật mã quản trị viên không chính xác." });
}
