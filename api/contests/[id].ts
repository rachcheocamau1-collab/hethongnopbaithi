import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getContests,
  saveContests,
  getReports,
  saveReports
} from "../_lib/store";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const id = String(req.query.id);

  if (req.method === "PUT") {
    const { name, year, status, startTime, endTime } = req.body ?? {};
    const contests = await getContests();
    const idx = contests.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Không tìm thấy kỳ thi yêu cầu." });
    }
    if (name !== undefined) contests[idx].name = name.trim();
    if (year !== undefined) contests[idx].year = year.toString();
    if (status !== undefined) contests[idx].status = status;
    if (startTime !== undefined) {
      contests[idx].startTime =
        startTime && startTime.trim()
          ? new Date(startTime).toISOString()
          : undefined;
    }
    if (endTime !== undefined) {
      contests[idx].endTime =
        endTime && endTime.trim()
          ? new Date(endTime).toISOString()
          : undefined;
    }
    await saveContests(contests);
    return res.json({ success: true, contest: contests[idx] });
  }

  if (req.method === "DELETE") {
    if (id === "default-contest") {
      return res
        .status(400)
        .json({ error: "Không thể xóa kỳ thi mặc định hệ thống." });
    }
    const contests = await getContests();
    const remaining = contests.filter((c) => c.id !== id);
    if (remaining.length === contests.length) {
      return res.status(404).json({ error: "Không tìm thấy kỳ thi yêu cầu." });
    }
    await saveContests(remaining);

    const reports = await getReports();
    let updated = false;
    reports.forEach((r) => {
      if (r.contestId === id) {
        r.contestId = "default-contest";
        updated = true;
      }
    });
    if (updated) await saveReports(reports);

    return res.json({ success: true, message: "Đã xóa kỳ thi thành công." });
  }

  res.setHeader("Allow", "PUT, DELETE");
  return res.status(405).end();
}
