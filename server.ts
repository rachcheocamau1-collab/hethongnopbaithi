import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for file transfers (base64)
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

const DATA_DIR = path.join(process.cwd(), "data");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");
const CONTESTS_FILE = path.join(DATA_DIR, "contests.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface SystemSettings {
  adminPasscode: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  adminPasscode: "admin123"
};

if (!fs.existsSync(SETTINGS_FILE)) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf-8");
}

function readSettings(): SystemSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return JSON.parse(data) as SystemSettings;
    }
  } catch (err) {
    console.error("Lỗi đọc file settings.json:", err);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: SystemSettings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (err) {
    console.error("Lỗi ghi file settings.json:", err);
  }
}

interface Contest {
  id: string;
  name: string;
  year: string;
  status: "active" | "archived";
  createdAt: string;
  startTime?: string;
  endTime?: string;
}

interface Report {
  id: string;
  senderName: string;
  fileName: string;
  fileSize: string;
  fileData?: string; // base64 string
  submittedAt: string;
  contestId?: string;
}

const DEFAULT_CONTESTS: Contest[] = [
  {
    id: "default-contest",
    name: "Cuộc thi trực tuyến 2026",
    year: "2026",
    status: "active",
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_REPORTS: Report[] = [
  {
    id: "mock-1",
    senderName: "Nguyễn Văn An",
    fileName: "Bai_thi_Tin_hoc_tuan_3.docx",
    fileSize: "128 KB",
    fileData: "VGVzdCBjb250ZW50IGZvciBmaWxlIDE=", // base64 representation of "Test content for file 1"
    submittedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    contestId: "default-contest"
  },
  {
    id: "mock-2",
    senderName: "Trần Thị Bình",
    fileName: "Bai_du_thi_Sang_tao_tre.pdf",
    fileSize: "245 KB",
    fileData: "VGVzdCBjb250ZW50IGZvciBmaWxlIDI=", // base64 representation of "Test content for file 2"
    submittedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    contestId: "default-contest"
  }
];

if (!fs.existsSync(CONTESTS_FILE)) {
  fs.writeFileSync(CONTESTS_FILE, JSON.stringify(DEFAULT_CONTESTS, null, 2), "utf-8");
}

if (!fs.existsSync(REPORTS_FILE)) {
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(DEFAULT_REPORTS, null, 2), "utf-8");
}

// Read helper for contests
function readContests(): Contest[] {
  try {
    if (fs.existsSync(CONTESTS_FILE)) {
      const data = fs.readFileSync(CONTESTS_FILE, "utf-8");
      return JSON.parse(data) as Contest[];
    }
  } catch (err) {
    console.error("Lỗi đọc file contests.json:", err);
  }
  return DEFAULT_CONTESTS;
}

// Write helper for contests
function saveContests(contests: Contest[]) {
  try {
    fs.writeFileSync(CONTESTS_FILE, JSON.stringify(contests, null, 2), "utf-8");
  } catch (err) {
    console.error("Lỗi ghi file contests.json:", err);
  }
}

// Read helper
function readReports(): Report[] {
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      const data = fs.readFileSync(REPORTS_FILE, "utf-8");
      return JSON.parse(data) as Report[];
    }
  } catch (err) {
    console.error("Lỗi đọc file reports.json:", err);
  }
  return [];
}

// Write helper
function saveReports(reports: Report[]) {
  try {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), "utf-8");
  } catch (err) {
    console.error("Lỗi ghi file reports.json:", err);
  }
}

// 1. Get all reports
app.get("/api/reports", (req, res) => {
  const reports = readReports();
  res.json(reports);
});

function formatDateTimeVN(isoOrDateStr: string | undefined): string {
  if (!isoOrDateStr) return "";
  try {
    const d = new Date(isoOrDateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }) + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoOrDateStr;
  }
}

// 2. Submit new file report
app.post("/api/reports", (req, res) => {
  const { senderName, fileName, fileSize, fileData, contestId } = req.body;

  if (!senderName || !senderName.trim()) {
    return res.status(400).json({ error: "Vui lòng điền họ và tên của người nộp." });
  }

  if (!fileName || !fileSize) {
    return res.status(450).json({ error: "Vui lòng chọn hoặc kéo thả tài liệu báo cáo của bạn." });
  }

  const targetContestId = contestId || "default-contest";
  const contests = readContests();
  const contest = contests.find(c => c.id === targetContestId);
  const now = new Date();

  if (contest) {
    if (contest.status === "archived") {
      return res.status(400).json({ error: "Cuộc thi này đã chính thức đóng/khóa. Không thể nộp bài." });
    }

    if (contest.startTime && new Date(contest.startTime) > now) {
      return res.status(400).json({ 
        error: `Cuộc thi chưa bắt đầu thời gian nhận bài (Thời gian mở: ${formatDateTimeVN(contest.startTime)}).` 
      });
    }

    if (contest.endTime && new Date(contest.endTime) < now) {
      return res.status(400).json({ 
        error: `Cuộc thi đã kết thúc nhận bài dự thi lúc ${formatDateTimeVN(contest.endTime)}.` 
      });
    }
  }

  const reports = readReports();
  const newReport: Report = {
    id: "report_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    senderName: senderName.trim(),
    fileName,
    fileSize,
    fileData: fileData || undefined,
    submittedAt: now.toISOString(),
    contestId: targetContestId
  };

  reports.unshift(newReport);
  saveReports(reports);

  res.status(201).json({ success: true, report: newReport });
});

// 3. Delete report
app.delete("/api/reports/:id", (req, res) => {
  const { id } = req.params;
  let reports = readReports();
  const initialLength = reports.length;
  reports = reports.filter(r => r.id !== id);

  if (reports.length === initialLength) {
    return res.status(404).json({ error: "Không tìm thấy báo cáo yêu cầu." });
  }

  saveReports(reports);
  res.json({ success: true, message: "Đã xóa báo cáo thành công." });
});

// 4. Download file directly
app.get("/api/download/:id", (req, res) => {
  const { id } = req.params;
  const reports = readReports();
  const report = reports.find(r => r.id === id);

  if (!report) {
    return res.status(404).send("Không tìm thấy tệp tin.");
  }

  if (!report.fileData) {
    return res.status(400).send("Tệp tin này không chứa dữ liệu.");
  }

  try {
    const fileBuffer = Buffer.from(report.fileData, "base64");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(report.fileName)}`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(fileBuffer);
  } catch (err) {
    console.error("Error serving file:", err);
    res.status(500).send("Gặp lỗi tải tệp tin.");
  }
});

// 5. Contests API Endpoints
app.get("/api/contests", (req, res) => {
  const contests = readContests();
  res.json(contests);
});

app.post("/api/contests", (req, res) => {
  const { name, year, startTime, endTime } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Tên kỳ thi không được để trống." });
  }

  const contests = readContests();
  const newContest: Contest = {
    id: "contest_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    name: name.trim(),
    year: (year || new Date().getFullYear()).toString(),
    status: "active",
    createdAt: new Date().toISOString(),
    startTime: startTime && startTime.trim() ? new Date(startTime).toISOString() : undefined,
    endTime: endTime && endTime.trim() ? new Date(endTime).toISOString() : undefined
  };

  contests.push(newContest);
  saveContests(contests);
  res.status(201).json({ success: true, contest: newContest });
});

app.put("/api/contests/:id", (req, res) => {
  const { id } = req.params;
  const { name, year, status, startTime, endTime } = req.body;

  const contests = readContests();
  const idx = contests.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Không tìm thấy kỳ thi yêu cầu." });
  }

  if (name !== undefined) contests[idx].name = name.trim();
  if (year !== undefined) contests[idx].year = year.toString();
  if (status !== undefined) contests[idx].status = status;
  if (startTime !== undefined) {
    contests[idx].startTime = startTime && startTime.trim() ? new Date(startTime).toISOString() : undefined;
  }
  if (endTime !== undefined) {
    contests[idx].endTime = endTime && endTime.trim() ? new Date(endTime).toISOString() : undefined;
  }

  saveContests(contests);
  res.json({ success: true, contest: contests[idx] });
});

app.delete("/api/contests/:id", (req, res) => {
  const { id } = req.params;
  if (id === "default-contest") {
    return res.status(400).json({ error: "Không thể xóa kỳ thi mặc định hệ thống." });
  }

  let contests = readContests();
  const initialLength = contests.length;
  contests = contests.filter(c => c.id !== id);

  if (contests.length === initialLength) {
    return res.status(404).json({ error: "Không tìm thấy kỳ thi yêu cầu." });
  }

  saveContests(contests);

  // Update reports associated with this contest to default-contest so they don't break
  const reports = readReports();
  let updated = false;
  reports.forEach(r => {
    if (r.contestId === id) {
      r.contestId = "default-contest";
      updated = true;
    }
  });
  if (updated) {
    saveReports(reports);
  }

  res.json({ success: true, message: "Đã xóa kỳ thi thành công." });
});

// 6. Admin passcode verification and edit endpoints
app.post("/api/admin/verify", (req, res) => {
  const { passcode } = req.body;
  const settings = readSettings();
  if (settings.adminPasscode === passcode) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Mật mã quản trị viên không chính xác." });
  }
});

app.post("/api/admin/reset", (req, res) => {
  const settings = readSettings();
  settings.adminPasscode = "admin123";
  saveSettings(settings);
  res.json({ success: true, message: "Mật mã quản trị đã được khôi phục về mặc định thành công." });
});

app.put("/api/admin/passcode", (req, res) => {
  const { currentPasscode, newPasscode } = req.body;
  const settings = readSettings();

  if (settings.adminPasscode !== currentPasscode) {
    return res.status(401).json({ error: "Mật mã hiện tại không đúng." });
  }

  if (!newPasscode || !newPasscode.trim()) {
    return res.status(400).json({ error: "Mật mã mới không được để trống." });
  }

  settings.adminPasscode = newPasscode.trim();
  saveSettings(settings);
  res.json({ success: true, message: "Cập nhật mật mã quản trị thành công." });
});

// Setup Vite & static assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on port ${PORT}`);
  });
}

startServer();
