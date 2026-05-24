import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getReports,
  saveReports,
  getContests,
  formatDateTimeVN
} from "../_lib/store.js";
import type { Report } from "../_lib/types.js";

export const config = {
  api: { bodyParser: { sizeLimit: "4mb" } }
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === "GET") {
    const reports = await getReports();
    return res.json(reports);
  }

  if (req.method === "POST") {
    const { senderName, fileName, fileSize, fileData, contestId } =
      req.body ?? {};

    if (!senderName || !senderName.trim()) {
      return res
        .status(400)
        .json({ error: "Vui lòng điền họ và tên của người nộp." });
    }
    if (!fileName || !fileSize) {
      return res.status(450).json({
        error: "Vui lòng chọn hoặc kéo thả tài liệu báo cáo của bạn."
      });
    }

    const targetContestId = contestId || "default-contest";
    const contests = await getContests();
    const contest = contests.find((c) => c.id === targetContestId);
    const now = new Date();

    if (contest) {
      if (contest.status === "archived") {
        return res.status(400).json({
          error: "Cuộc thi này đã chính thức đóng/khóa. Không thể nộp bài."
        });
      }
      if (contest.startTime && new Date(contest.startTime) > now) {
        return res.status(400).json({
          error: `Cuộc thi chưa bắt đầu thời gian nhận bài (Thời gian mở: ${formatDateTimeVN(
            contest.startTime
          )}).`
        });
      }
      if (contest.endTime && new Date(contest.endTime) < now) {
        return res.status(400).json({
          error: `Cuộc thi đã kết thúc nhận bài dự thi lúc ${formatDateTimeVN(
            contest.endTime
          )}.`
        });
      }
    }

    const reports = await getReports();
    const newReport: Report = {
      id:
        "report_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2, 7),
      senderName: senderName.trim(),
      fileName,
      fileSize,
      fileData: fileData || undefined,
      submittedAt: now.toISOString(),
      contestId: targetContestId
    };
    reports.unshift(newReport);
    await saveReports(reports);
    return res.status(201).json({ success: true, report: newReport });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end();
}
