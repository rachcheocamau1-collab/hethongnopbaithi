import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSettings, saveSettings } from "../_lib/store.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return res.status(405).end();
  }
  const { currentPasscode, newPasscode } = req.body ?? {};
  const settings = await getSettings();
  if (settings.adminPasscode !== currentPasscode) {
    return res.status(401).json({ error: "Mật mã hiện tại không đúng." });
  }
  if (!newPasscode || !newPasscode.trim()) {
    return res.status(400).json({ error: "Mật mã mới không được để trống." });
  }
  settings.adminPasscode = newPasscode.trim();
  await saveSettings(settings);
  return res.json({
    success: true,
    message: "Cập nhật mật mã quản trị thành công."
  });
}
