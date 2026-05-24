import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getReports } from "../_lib/store.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }
  const id = String(req.query.id);
  const reports = await getReports();
  const report = reports.find((r) => r.id === id);
  if (!report) return res.status(404).send("Không tìm thấy tệp tin.");
  if (!report.fileData)
    return res.status(400).send("Tệp tin này không chứa dữ liệu.");
  try {
    const fileBuffer = Buffer.from(report.fileData, "base64");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(report.fileName)}`
    );
    res.setHeader("Content-Type", "application/octet-stream");
    return res.send(fileBuffer);
  } catch (err) {
    console.error("Error serving file:", err);
    return res.status(500).send("Gặp lỗi tải tệp tin.");
  }
}
