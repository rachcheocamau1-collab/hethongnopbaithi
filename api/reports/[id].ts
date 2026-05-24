import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getReports, saveReports } from "../_lib/store";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).end();
  }
  const id = String(req.query.id);
  const reports = await getReports();
  const remaining = reports.filter((r) => r.id !== id);
  if (remaining.length === reports.length) {
    return res.status(404).json({ error: "Không tìm thấy báo cáo yêu cầu." });
  }
  await saveReports(remaining);
  return res.json({ success: true, message: "Đã xóa báo cáo thành công." });
}
