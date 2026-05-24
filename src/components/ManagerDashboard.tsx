import React, { useState } from "react";
import { Report, Contest } from "../types";
import { 
  Search, 
  Calendar, 
  FileText, 
  Trash2, 
  Download, 
  Paperclip, 
  RefreshCw, 
  FileSpreadsheet, 
  Settings, 
  Layers, 
  Plus, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  Edit3,
  Key,
  ShieldCheck,
  LogOut
} from "lucide-react";

interface ManagerDashboardProps {
  reports: Report[];
  contests: Contest[];
  onDeleteReport: (id: string) => Promise<void>;
  isRefreshing: boolean;
  onRefresh: () => void;
  onAddContest: (name: string, year: string, startTime?: string, endTime?: string) => Promise<boolean>;
  onEditContest: (id: string, name: string, year: string, status: "active" | "archived", startTime?: string, endTime?: string) => Promise<boolean>;
  onDeleteContest: (id: string) => Promise<boolean>;
  onLogout: () => void;
  onUpdatePasscode: (currentPasscode: string, newPasscode: string) => Promise<{ success: boolean; error?: string }>;
}

export default function ManagerDashboard({
  reports,
  contests,
  onDeleteReport,
  isRefreshing,
  onRefresh,
  onAddContest,
  onEditContest,
  onDeleteContest,
  onLogout,
  onUpdatePasscode
}: ManagerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"submissions" | "contests" | "security">("submissions");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterContestId, setSelectedFilterContestId] = useState<string>("all");

  // Add Contest States
  const [newContestName, setNewContestName] = useState("");
  const [newContestYear, setNewContestYear] = useState(new Date().getFullYear().toString());
  const [newContestStartTime, setNewContestStartTime] = useState("");
  const [newContestEndTime, setNewContestEndTime] = useState("");
  const [isSubmitAdding, setIsSubmitAdding] = useState(false);

  // Edit Contest States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "archived">("active");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  // Security Reset Passcode States
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [securityStatus, setSecurityStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isUpdatingPasscode, setIsUpdatingPasscode] = useState(false);

  const handleUpdateSecurityPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityStatus(null);

    if (newPasscode !== confirmPasscode) {
      setSecurityStatus({ success: false, message: "Mật mã mới và xác nhận mật mã mới chưa khớp nhau." });
      return;
    }

    if (newPasscode.length < 4) {
      setSecurityStatus({ success: false, message: "Mật mã mới phải có tối thiểu 4 ký tự." });
      return;
    }

    setIsUpdatingPasscode(true);
    const result = await onUpdatePasscode(currentPasscode, newPasscode);
    setIsUpdatingPasscode(false);

    if (result.success) {
      setSecurityStatus({ success: true, message: "Đã cập nhật mật mã quản trị thành công!" });
      setCurrentPasscode("");
      setNewPasscode("");
      setConfirmPasscode("");
    } else {
      setSecurityStatus({ success: false, message: result.error || "Mật mã hiện tại không đúng." });
    }
  };

  // Filter reports
  const filteredReports = reports.filter(r => {
    // 1. Contest Match
    const matchesContest = selectedFilterContestId === "all" || 
      r.contestId === selectedFilterContestId || 
      (!r.contestId && selectedFilterContestId === "default-contest");

    // 2. Search Match
    const matchesSearch = r.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fileName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesContest && matchesSearch;
  });

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }) + " - " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoStr;
    }
  };

  const toLocalDateTimeLocalString = (isoOrDateStr: string | undefined): string => {
    if (!isoOrDateStr) return "";
    try {
      const d = new Date(isoOrDateStr);
      if (isNaN(d.getTime())) return "";
      const offset = d.getTimezoneOffset();
      const localTime = new Date(d.getTime() - (offset * 60 * 1000));
      return localTime.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  const handleDownloadFile = (report: Report) => {
    if (!report.fileData) {
      alert("Tập tin này không chứa dữ liệu thô để tải.");
      return;
    }

    try {
      const binaryString = window.atob(report.fileData);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = report.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tải tập tin xuống.");
    }
  };

  const handleExportExcel = () => {
    try {
      const escapeCsv = (str: string) => {
        if (!str) return "";
        const processed = str.replace(/"/g, '""');
        return `"${processed}"`;
      };

      const separator = ",";
      let csv = "\uFEFF"; // UTF-8 BOM helps Excel render Vietnamese characters correctly
      
      // Determine the contest title dynamically
      let contestTitle = "CUỘC THI TRỰC TUYẾN";
      if (selectedFilterContestId !== "all") {
        const matching = contests.find(c => c.id === selectedFilterContestId);
        if (matching) {
          contestTitle = matching.name.toUpperCase();
        }
      }

      // Main headers mirroring the screenshot template
      csv += `ỦY BND XÃ NGUYỄN VIỆT KHÁI\r\n`;
      csv += `TRƯỜNG TIỂU HỌC RẠCH CHÈO\r\n`;
      csv += `\r\n`;
      csv += `,,${contestTitle}\r\n`;
      csv += `\r\n`;
      
      // Row table columns matching exactly: STT | HỌ VÀ TÊN | LINK BÀI DỰ THI | GHI CHÚ
      csv += `STT${separator}HỌ VÀ TÊN${separator}LINK BÀI DỰ THI${separator}GHI CHÚ\r\n`;

      // Fill in rows
      filteredReports.forEach((r, idx) => {
        const downloadUrl = `${window.location.origin}/api/download/${r.id}`;
        const name = r.senderName;
        const note = `Nộp lúc ${formatDate(r.submittedAt)}`;
        
        csv += `${idx + 1}${separator}${escapeCsv(name)}${separator}${escapeCsv(downloadUrl)}${separator}${escapeCsv(note)}\r\n`;
      });

      // Export as Blob
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const filePrefix = selectedFilterContestId === "all" ? "Tat_ca" : selectedFilterContestId;
      link.href = url;
      link.setAttribute("download", `Danh_sach_bai_du_thi_${filePrefix}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Lỗi khi xuất file CSV:", err);
      alert("Không thể xuất file Excel vào lúc này.");
    }
  };

  const handleCreateContestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContestName.trim()) return;

    setIsSubmitAdding(true);
    const success = await onAddContest(newContestName, newContestYear, newContestStartTime, newContestEndTime);
    setIsSubmitAdding(false);

    if (success) {
      setNewContestName("");
      setNewContestYear(new Date().getFullYear().toString());
      setNewContestStartTime("");
      setNewContestEndTime("");
    }
  };

  const startEditContest = (c: Contest) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditYear(c.year);
    setEditStatus(c.status);
    setEditStartTime(c.startTime ? toLocalDateTimeLocalString(c.startTime) : "");
    setEditEndTime(c.endTime ? toLocalDateTimeLocalString(c.endTime) : "");
  };

  const cancelEditContest = () => {
    setEditingId(null);
  };

  const handleUpdateContestSubmit = async (id: string) => {
    if (!editName.trim()) return;
    const success = await onEditContest(id, editName, editYear, editStatus, editStartTime, editEndTime);
    if (success) {
      setEditingId(null);
    }
  };

  const getContestName = (id?: string) => {
    if (!id) return "Kỳ thi mặc định";
    const found = contests.find(c => c.id === id);
    return found ? found.name : "Kỳ thi mặc định";
  };

  return (
    <div className="w-full space-y-6 font-sans">
      
      {/* Search Header layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-semibold text-lg md:text-xl text-slate-800 flex items-center gap-2">
            <span>📂</span> Hệ Thống Quản Trị Viên (Admin)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem danh sách bài thi gửi lên và quản trị các kỳ thi theo năm.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          {activeTab === "submissions" && (
            <button
              id="btn-export-excel"
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer border border-emerald-600"
              title="Xuất danh sách bài thi sang file Excel CSV"
            >
              <FileSpreadsheet size={15} />
              <span>Xuất file Excel</span>
            </button>
          )}

          <button
            id="btn-refresh-dashboard"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span>Đồng bộ</span>
          </button>

          <button
            id="btn-logout-dashboard"
            onClick={onLogout}
            className="bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-rose-100/50"
            title="Thoát quyền quản trị và quay lại giao diện nộp bài"
          >
            <LogOut size={14} />
            <span>Thoát Admin</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex border-b border-slate-250/60 gap-4 font-sans text-sm">
        <button
          id="tab-submissions"
          onClick={() => setActiveTab("submissions")}
          className={`pb-3 px-1 font-bold flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
            activeTab === "submissions"
              ? "border-emerald-600 text-emerald-700 border-emerald-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Layers size={16} />
          <span>Danh Sách Bài Dự Thi ({filteredReports.length})</span>
        </button>

        <button
          id="tab-contests"
          onClick={() => setActiveTab("contests")}
          className={`pb-3 px-1 font-bold flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
            activeTab === "contests"
              ? "border-emerald-600 text-emerald-700 border-emerald-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Settings size={16} />
          <span>Quản Lý Các Kỳ Thi ({contests.length})</span>
        </button>

        <button
          id="tab-security"
          onClick={() => setActiveTab("security")}
          className={`pb-3 px-1 font-bold flex items-center gap-2 transition-all border-b-2 cursor-pointer ${
            activeTab === "security"
              ? "border-emerald-600 text-emerald-700 border-emerald-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Key size={16} />
          <span>Mật mã Quản lý</span>
        </button>
      </div>

      {activeTab === "submissions" && (
        <>
          {/* Filters & search bars */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 glow-shadow flex flex-col md:flex-row gap-4">
            
            {/* Contest Filter dropdown */}
            <div className="w-full md:w-1/3">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 label-sans">
                Bộ lọc theo kỳ thi
              </label>
              <select
                id="filter-contest-select"
                value={selectedFilterContestId}
                onChange={(e) => setSelectedFilterContestId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 outline-none rounded-xl px-3 py-2.5 text-slate-700 text-sm focus:border-emerald-500 font-medium cursor-pointer"
              >
                <option value="all">📁 Tất cả các kỳ thi</option>
                {contests.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.status === "archived" ? "🔒 " : "🟢 "} {c.name} {c.year ? `(${c.year})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Free Search input */}
            <div className="w-full md:w-2/3">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 label-sans">
                Tìm kiếm bài dự thi
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="search-reports-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên thí sinh hoặc tên tập tin đã nộp..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white outline-none rounded-xl pl-10 pr-4 py-2.5 text-slate-700 text-sm transition-all focus:ring-1 focus:ring-emerald-550 font-medium"
                />
              </div>
            </div>

          </div>

          {/* Main Table for submissions lists */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden glow-shadow">
            <div className="overflow-x-auto">
              {filteredReports.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-3">
                    <FileText size={24} />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Chưa có tệp tin bài dự thi nào được tìm thấy</p>
                  <p className="text-xs text-slate-400 mt-1">Các thí sinh cần tải tệp lên hoặc chọn bộ lọc thi khác.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100/80 bg-slate-50/50 text-slate-450 text-xs font-bold font-sans uppercase tracking-wider">
                      <th className="py-4 px-6 font-semibold text-slate-600">STT</th>
                      <th className="py-4 px-6 font-semibold text-slate-600">Học sinh / Thí sinh</th>
                      <th className="py-4 px-6 font-semibold text-slate-600">Bài thi / Tài liệu</th>
                      <th className="py-4 px-6 font-semibold text-slate-600">Thuộc Kỳ thi / Nhãn</th>
                      <th className="py-4 px-6 font-semibold text-slate-600">Thời gian nộp</th>
                      <th className="py-4 px-6 font-semibold text-slate-600 text-center">Tải về / Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60 font-medium">
                    {filteredReports.map((r, index) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/40 transition-colors text-sm"
                      >
                        {/* Index */}
                        <td className="py-4 px-6 font-mono text-xs text-slate-400">
                          #{index + 1}
                        </td>

                        {/* Student Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xs font-display shrink-0">
                              {r.senderName.split(" ").pop()?.charAt(0) || "U"}
                            </div>
                            <div className="font-semibold text-slate-800">
                              {r.senderName}
                            </div>
                          </div>
                        </td>

                        {/* File Details */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 max-w-xs truncate text-slate-700 font-medium">
                            <Paperclip size={14} className="text-emerald-500 shrink-0" />
                            <span className="truncate" title={r.fileName}>{r.fileName}</span>
                            <span className="text-xs text-slate-400 font-mono">({r.fileSize})</span>
                          </div>
                        </td>

                        {/* Selected Contest */}
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600 rounded-lg">
                            {getContestName(r.contestId)}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td className="py-4 px-6 text-xs font-mono text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{formatDate(r.submittedAt)}</span>
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              id={`btn-download-file-${r.id}`}
                              onClick={() => handleDownloadFile(r)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-emerald-100"
                              title="Tải tệp tin về thiết bị"
                            >
                              <Download size={14} />
                              <span>Tải về</span>
                            </button>

                            <button
                              id={`btn-delete-report-${r.id}`}
                              onClick={() => {
                                if (window.confirm(`Bạn có chắc muốn xóa tệp tin bài thi của thí sinh "${r.senderName}"?`)) {
                                  onDeleteReport(r.id);
                                }
                              }}
                              className="bg-slate-50 hover:bg-rose-50 text-slate-550 hover:text-rose-600 p-2 rounded-xl transition-all cursor-pointer"
                              title="Xóa tệp"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "contests" && (
        /* ========================================= */
        /* CONTESTS CONFIGURATION ZONE               */
        /* ========================================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Create new Contest form on Left */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-6 glow-shadow">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Plus size={16} className="text-emerald-600" />
              <span>Thiết Lập Kỳ Thi Mới</span>
            </h3>

            <form onSubmit={handleCreateContestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Tên kỳ thi / Cuộc thi
                </label>
                <input
                  type="text"
                  required
                  value={newContestName}
                  onChange={(e) => setNewContestName(e.target.value)}
                  placeholder="Ví dụ: Tin Học Trẻ cấp Trường"
                  className="w-full bg-slate-50 border border-slate-200 outline-none rounded-xl px-3 py-2 text-slate-700 text-sm focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Năm tổ chức
                </label>
                <input
                  type="number"
                  required
                  value={newContestYear}
                  onChange={(e) => setNewContestYear(e.target.value)}
                  placeholder="2026"
                  className="w-full bg-slate-50 border border-slate-200 outline-none rounded-xl px-3 py-2 text-slate-700 text-sm focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Bắt đầu nhận bài (Tùy chọn)
                  </label>
                  <input
                    type="datetime-local"
                    value={newContestStartTime}
                    onChange={(e) => setNewContestStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none rounded-xl px-3 py-2 text-slate-700 text-sm focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Kết thúc cuộc thi (Tùy chọn)
                  </label>
                  <input
                    type="datetime-local"
                    value={newContestEndTime}
                    onChange={(e) => setNewContestEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none rounded-xl px-3 py-2 text-slate-700 text-sm focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitAdding}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-100/50"
              >
                <span>Tạo Kỳ Thi</span>
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400 leading-relaxed font-sans">
              <strong>💡 Gợi ý:</strong> Bạn có thể tạo nhiều kỳ thi khác nhau ứng với mỗi năm hoặc chủ đề như: 
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Cuộc thi viết chữ đẹp</li>
                <li>Thi kể chuyện theo sách</li>
                <li>Học sinh giỏi lớp 5</li>
              </ul>
            </div>
          </div>

          {/* List of Contests on Right */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl overflow-hidden glow-shadow">
            <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Danh sách các Kỳ thi hiện hữu</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/80 px-2.5 py-1 rounded-full uppercase">Kỳ thi hệ thống</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {contests.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">Chưa cài đặt kỳ thi nào.</div>
              ) : (
                contests.map((c) => {
                  const isEditing = editingId === c.id;
                  
                  return (
                    <div key={c.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors">
                      {isEditing ? (
                        /* EDITING MODE FORM */
                        <div className="w-full space-y-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-200/65">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="col-span-2 bg-white border border-slate-200 outline-none rounded-xl px-3 py-1.5 text-slate-700 text-xs font-medium"
                              placeholder="Tên kỳ thi"
                            />
                            <input
                              type="text"
                              value={editYear}
                              onChange={(e) => setEditYear(e.target.value)}
                              className="bg-white border border-slate-200 outline-none rounded-xl px-3 py-1.5 text-slate-700 text-xs font-mono"
                              placeholder="Năm"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Thời gian Bắt đầu</label>
                              <input
                                type="datetime-local"
                                value={editStartTime}
                                onChange={(e) => setEditStartTime(e.target.value)}
                                className="w-full bg-white border border-slate-200 outline-none rounded-xl px-2.5 py-1 text-slate-700 text-[11px] font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Thời gian Kết thúc</label>
                              <input
                                type="datetime-local"
                                value={editEndTime}
                                onChange={(e) => setEditEndTime(e.target.value)}
                                className="w-full bg-white border border-slate-200 outline-none rounded-xl px-2.5 py-1 text-slate-700 text-[11px] font-mono"
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-semibold uppercase">Trạng thái:</span>
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value as "active" | "archived")}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium"
                              >
                                <option value="active">🟢 Đang diễn ra</option>
                                <option value="archived">🔒 Đã khóa</option>
                              </select>
                            </div>

                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleUpdateContestSubmit(c.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Check size={14} />
                                <span>Lưu</span>
                              </button>
                              <button
                                onClick={cancelEditContest}
                                className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-250 p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <X size={14} />
                                <span>Hủy</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* NORMAL RENDER MODE */
                        <>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-slate-800">{c.name}</span>
                              <span className="text-xs text-slate-400 font-mono font-medium">({c.year})</span>
                              {c.status === "archived" ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] bg-amber-50 text-amber-700 font-bold border border-amber-100 select-none">
                                  <Lock size={10} /> Đã khóa
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 select-none anim-pulse">
                                  <Unlock size={10} /> Đang chạy
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">Tạo lúc: {formatDate(c.createdAt)}</p>
                            {(c.startTime || c.endTime) && (
                              <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl mt-1 space-y-0.5 max-w-md border border-slate-100/60 font-sans">
                                {c.startTime && (
                                  <p className="flex items-center gap-1.5">
                                    <span className="text-emerald-500 font-bold text-xs">▶</span>
                                    <span>Mở cửa nhận bài:</span>
                                    <span className="font-medium text-slate-700 font-mono">{formatDate(c.startTime)}</span>
                                  </p>
                                )}
                                {c.endTime && (
                                  <p className="flex items-center gap-1.5">
                                    <span className="text-rose-500 font-bold text-xs">⏹</span>
                                    <span>Thời hạn kết thúc:</span>
                                    <span className="font-medium text-slate-700 font-mono">{formatDate(c.endTime)}</span>
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Contest Controls */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => startEditContest(c)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all cursor-pointer"
                              title="Sửa thông tin kỳ thi"
                            >
                              <Edit3 size={14} />
                            </button>

                            {c.id !== "default-contest" && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Xóa kỳ thi này sẽ thu hồi nhãn dự thi của tất cả thí sinh liên quan về "Kỳ thi mặc định".\n\nBạn có chắc muốn tiếp tục xóa kỳ thi "${c.name}"?`)) {
                                    onDeleteContest(c.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                                title="Xóa kỳ thi"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {activeTab === "security" && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-slate-800">
                Chỉnh Sửa Khóa Bảo Mật / Mật Mã Quản Trị
              </h3>
              <p className="text-xs text-slate-400">
                Thay đổi mật mã xác thực quyền quản lý để ngăn người ngoài truy cập hoặc tự ý chỉnh sửa các khóa thi.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateSecurityPasscode} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-semibold">
                Mật mã hiện tại *
              </label>
              <input
                type="password"
                required
                placeholder="Nhập khóa bảo mật hiện tại (mặc định: admin123)"
                value={currentPasscode}
                onChange={(e) => setCurrentPasscode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 outline-none rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-semibold font-sans">
                  Mật mã mới *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập khóa mới..."
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 outline-none rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-semibold font-sans">
                  Xác nhận mật mã mới *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Xác nhận khóa mới..."
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 outline-none rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            {securityStatus && (
              <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                securityStatus.success 
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                  : "bg-rose-50 text-rose-800 border border-rose-100"
              }`}>
                <span>{securityStatus.success ? "🟢" : "⚠️"}</span>
                <span className="font-medium">{securityStatus.message}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isUpdatingPasscode}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-100/50"
              >
                <span>{isUpdatingPasscode ? "Đang cập nhật..." : "Cập nhật mật mã khóa"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
