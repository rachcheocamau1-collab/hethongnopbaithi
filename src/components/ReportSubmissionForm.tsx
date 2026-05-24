import React, { useState, useRef, useEffect } from "react";
import { Upload, X, CheckCircle, FileText, Send, User, AlertCircle, HelpCircle } from "lucide-react";
import { Contest } from "../types";

interface ReportSubmissionFormProps {
  onSuccess: () => void;
  contests: Contest[];
}

export default function ReportSubmissionForm({ onSuccess, contests }: ReportSubmissionFormProps) {
  const [senderName, setSenderName] = useState("");
  const [selectedContestId, setSelectedContestId] = useState("");
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
    base64Data?: string;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Congratulatory Celebration Modal on Success
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [submittedFileName, setSubmittedFileName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (contests && contests.length > 0) {
      // Prioritize active contests
      const active = contests.find(c => c.status === "active");
      if (active) {
        setSelectedContestId(active.id);
      } else {
        setSelectedContestId(contests[0].id);
      }
    }
  }, [contests]);

  const selectedContest = contests.find(c => c.id === selectedContestId) || contests.find(c => c.status === "active") || contests[0];
  const isArchived = selectedContest?.status === "archived";
  const hasNotStarted = selectedContest?.startTime && new Date(selectedContest.startTime) > currentTime;
  const hasEnded = selectedContest?.endTime && new Date(selectedContest.endTime) < currentTime;
  const isSubmissionDisabled = isArchived || hasNotStarted || hasEnded;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDateTimeVN = (isoOrDateStr: string | undefined): string => {
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
  };

  // Convert uploaded file to base64 so we can upload and download it
  const handleFileProcess = (file: File) => {
    if (isSubmissionDisabled) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64Data = result.split(",")[1]; // extract base64 part
      
      setAttachedFile({
        name: file.name,
        size: formatBytes(file.size),
        base64Data: base64Data
      });

      setStatus({
        type: "success",
        msg: `Đã chọn thành công tài liệu: "${file.name}" (${formatBytes(file.size)})`
      });
      setTimeout(() => setStatus(null), 5000);
    };
    reader.onerror = () => {
      setStatus({
        type: "error",
        msg: "Có lỗi xảy ra khi đọc file tài liệu."
      });
    };
    reader.readAsDataURL(file); // read file as data url
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSubmissionDisabled) return;
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isSubmissionDisabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isSubmissionDisabled) return;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmissionDisabled) {
      setStatus({ type: "error", msg: "Kỳ thi hiện đang đóng. Không thể nộp bài dự thi." });
      return;
    }

    if (!senderName.trim()) {
      setStatus({ type: "error", msg: "Vui lòng điền Họ và tên của bạn." });
      return;
    }

    if (!attachedFile) {
      setStatus({ type: "error", msg: "Vui lòng chọn hoặc kéo thả tệp tin bài dự thi để nộp." });
      return;
    }

    setIsLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          senderName: senderName.trim(),
          fileName: attachedFile.name,
          fileSize: attachedFile.size,
          fileData: attachedFile.base64Data,
          contestId: selectedContestId || "default-contest"
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: "success",
          msg: "Đã nộp bài dự thi và tài liệu đính kèm thành công lên hệ thống!"
        });
        setSubmittedName(senderName.trim());
        setSubmittedFileName(attachedFile.name);
        setShowSuccessModal(true);
        setSenderName("");
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onSuccess();
      } else {
        setStatus({
          type: "error",
          msg: data.error || "Gặp lỗi trong quá trình nộp báo cáo."
        });
      }
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        msg: "Lỗi kết nối máy chủ. Vui lòng kiểm tra lại mạng."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-emerald-150 p-6 md:p-8 shadow-lg glow-shadow font-sans">
      <div className="mb-6">
        <h2 className="font-display font-bold text-lg md:text-xl text-[#0a3a24] flex items-center gap-2">
          <span>📤</span> Gửi Bài Dự Thi
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Nhập họ tên và tải tệp tin bài dự thi lên hệ thống.
        </p>
      </div>

      {status && (
        <div id="status-alert" className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm transition-all duration-300 ${
          status.type === "success" 
            ? "bg-emerald-50 text-emerald-850 border border-emerald-200" 
            : "bg-rose-50 text-rose-800 border border-rose-100"
        }`}>
          {status.type === "success" ? (
            <CheckCircle className="shrink-0 text-emerald-600 mt-0.5" size={18} />
          ) : (
            <AlertCircle className="shrink-0 text-rose-500 mt-0.5" size={18} />
          )}
          <span className="font-semibold leading-relaxed">{status.msg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {isSubmissionDisabled && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs text-rose-850 font-sans shadow-sm leading-relaxed">
            <span className="text-base select-none">❌</span>
            <div>
              <p className="font-bold text-rose-900 uppercase">Hệ thống nộp bài đang tắt</p>
              {isArchived && <p className="mt-0.5">Kỳ thi này đã được quản trị viên đóng/khóa nhận bài.</p>}
              {hasNotStarted && <p className="mt-0.5">Kỳ thi chưa mở cổng nhận bài. Thời gian bắt đầu: <span className="font-bold text-rose-900">{formatDateTimeVN(selectedContest?.startTime)}</span>. Vui lòng quay lại sau.</p>}
              {hasEnded && <p className="mt-0.5">Kỳ thi đã kết thúc thời gian nhận bài vào lúc <span className="font-bold text-rose-900">{formatDateTimeVN(selectedContest?.endTime)}</span>. Cổng nộp bài được tự động đóng.</p>}
            </div>
          </div>
        )}

        {/* Name input */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
            <User size={13} className="text-emerald-600" />
            <span>Họ và Tên người nộp *</span>
          </label>
          <input
            id="input-sender-name"
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            disabled={isSubmissionDisabled}
            placeholder={isSubmissionDisabled ? "Cổng nộp bài đã đóng" : "Ví dụ: Nguyễn Văn An"}
            className="w-full bg-slate-50 border border-slate-250 focus:border-emerald-500 focus:bg-[#fafdfb] focus:ring-1 focus:ring-emerald-500 outline-none rounded-xl px-4 py-3 text-slate-700 text-sm transition-all font-medium disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
            required
          />
        </div>

        {/* Contest Dropdown */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
            <HelpCircle size={13} className="text-emerald-600" />
            <span>Chọn Kỳ thi / Cuộc thi nộp bài *</span>
          </label>
          <select
            id="select-contest"
            value={selectedContestId}
            onChange={(e) => setSelectedContestId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-250 focus:border-emerald-500 focus:bg-[#fafdfb] focus:ring-1 focus:ring-emerald-500 outline-none rounded-xl px-4 py-3 text-slate-700 text-sm transition-all font-medium cursor-pointer"
            required
          >
            {contests.length === 0 ? (
              <option value="default-contest">Cuộc thi trực tuyến 2026</option>
            ) : (
              contests.map((c) => {
                // Check status of each contest
                const itemHasNotStarted = c.startTime && new Date(c.startTime) > currentTime;
                const itemHasEnded = c.endTime && new Date(c.endTime) < currentTime;
                const itemStatusLabel = c.status === "archived" 
                  ? "🔒 [ Đã khóa ]" 
                  : itemHasNotStarted 
                    ? "⏳ [ Chưa mở ]" 
                    : itemHasEnded 
                      ? "❌ [ Quá hạn ]" 
                      : "🟢 [ Đang mở ]";
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.year ? `(${c.year})` : ""} {itemStatusLabel}
                  </option>
                );
              })
            )}
          </select>

          {/* Timeframe information display */}
          {selectedContest && (selectedContest.startTime || selectedContest.endTime) && (
            <div className="mt-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-3 shadow-sm">
              {selectedContest.startTime && (
                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 select-none ${hasNotStarted ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                    <span className="text-sm">🏁</span>
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thời gian mở cổng nhận bài:</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 font-mono">
                      {formatDateTimeVN(selectedContest.startTime)}
                    </p>
                  </div>
                  {hasNotStarted && (
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-150 px-2.5 py-0.5 rounded-lg font-bold uppercase tracking-wider self-center shrink-0">
                      Sắp mở
                    </span>
                  )}
                </div>
              )}

              {selectedContest.endTime && (
                <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl border-2 shadow-md transition-all ${
                  hasEnded 
                    ? "bg-rose-50 border-rose-200 text-rose-900" 
                    : "bg-emerald-50 border-emerald-300/80 text-emerald-950"
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm select-none ${
                    hasEnded 
                      ? "bg-rose-100 text-rose-600 border border-rose-200" 
                      : "bg-emerald-500 text-white border-4 border-emerald-100 animate-pulse"
                  }`}>
                    <span className="text-xl">⏳</span>
                  </div>
                  <div className="flex-1 space-y-1.5 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-xs font-black uppercase tracking-wider ${hasEnded ? "text-rose-550" : "text-emerald-700"}`}>
                        Hạn chót đóng cuộc thi:
                      </p>
                      {!hasEnded && !hasNotStarted && (
                        <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm uppercase tracking-wider">
                          Đang nhận bài
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-base sm:text-lg md:text-xl font-black font-mono tracking-wide ${
                      hasEnded ? "text-rose-800 line-through opacity-75" : "text-emerald-900 drop-shadow-xs"
                    }`}>
                      {formatDateTimeVN(selectedContest.endTime)}
                    </p>

                    {/* Live countdown badge */}
                    {!hasEnded && !hasNotStarted && (
                      <div className="mt-1 flex items-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-250/70 shadow-xs font-sans">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                          <span>
                            {(() => {
                              const end = new Date(selectedContest.endTime!);
                              const diff = end.getTime() - currentTime.getTime();
                              if (diff <= 0) return "Vừa hết thời gian";
                              
                              const secs = Math.floor(diff / 1000);
                              const mins = Math.floor(secs / 60);
                              const hours = Math.floor(mins / 60);
                              const days = Math.floor(hours / 24);

                              if (days > 0) {
                                return `Thời gian còn lại: ${days} ngày ${hours % 24} giờ ${mins % 60} phút`;
                              }
                              
                              const hh = String(hours % 24).padStart(2, "0");
                              const mm = String(mins % 60).padStart(2, "0");
                              const ss = String(secs % 60).padStart(2, "0");
                              return `Khóa cổng sau: ${hh}:${mm}:${ss}`;
                            })()}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {hasEnded && (
                    <div className="self-center sm:self-center shrink-0 pr-1 mt-2 sm:mt-0">
                      <span className="text-xs bg-rose-150 text-rose-800 border border-rose-250 px-3.5 py-1.5 rounded-full font-black uppercase tracking-wider shadow-sm">
                        Đã đóng
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload attachment area */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">
            Tài liệu đính kèm *
          </label>
          <div
            id="drag-drop-container"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (isSubmissionDisabled) return;
              fileInputRef.current?.click();
            }}
            className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
              isSubmissionDisabled
                ? "border-slate-200 bg-slate-100/50 cursor-not-allowed opacity-80"
                : isDragging 
                  ? "border-emerald-500 bg-emerald-50/20 cursor-pointer" 
                  : attachedFile 
                    ? "border-emerald-300 bg-emerald-50/10 hover:bg-emerald-50/20 cursor-pointer"
                    : "border-emerald-100 bg-[#fbfdfc] hover:bg-emerald-50/20 hover:border-emerald-300 cursor-pointer"
            }`}
          >
            <input
              id="file-input"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isSubmissionDisabled}
              className="hidden"
            />
            
            {isSubmissionDisabled ? (
              <div className="flex flex-col items-center gap-2 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-1 border border-rose-100">
                  <X size={22} />
                </div>
                <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                  Cổng nộp bài đang đóng
                </p>
                <div className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                  Cuộc thi này hiện không chấp nhận bài nộp do nằm ngoài khung thời gian quy định hoặc đã bị khóa.
                </div>
              </div>
            ) : attachedFile ? (
              <div className="flex flex-col items-center gap-2 w-full max-w-sm text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
                  <FileText size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-700 line-clamp-1">{attachedFile.name}</p>
                <p className="text-xs text-slate-400 font-mono">{attachedFile.size}</p>
                <button
                  id="btn-remove-attachment"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAttachment();
                  }}
                  className="mt-3 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all pointer-events-auto"
                >
                  <X size={12} /> Hủy đính kèm
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1">
                  <Upload size={22} />
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  Kéo thả file tài liệu vào đây hoặc <span className="text-emerald-700 hover:underline font-extrabold">Tải tệp từ thiết bị</span>
                </p>
                <div className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                  Chấp nhận mọi định dạng bài dự thi (Word, PDF, Excel, Txt, Hình ảnh, Zip, v.v.)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          id="btn-submit-report"
          type="submit"
          disabled={isLoading || isSubmissionDisabled}
          className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all glow-button bg-gradient-to-r ${
            isSubmissionDisabled
              ? "from-slate-400 to-slate-500 hover:from-slate-400 hover:to-slate-500 cursor-not-allowed shadow-none"
              : isLoading
                ? "from-emerald-600 to-teal-600 opacity-70 cursor-not-allowed"
                : "from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer shadow-md shadow-emerald-100/20"
          }`}
        >
          {isSubmissionDisabled ? (
            <>
              <X size={16} />
              <span>Cổng Nộp Bài Đang Đóng</span>
            </>
          ) : isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Đang gửi bài dự thi...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>Nộp Bài Dự Thi Ngay</span>
            </>
          )}
        </button>
      </form>

      {/* Chúc mừng nộp bài thành công modal */}
      {showSuccessModal && (
        <div id="congrats-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white rounded-3xl border-2 border-emerald-500 p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center space-y-6">
            
            {/* Celebration elements */}
            <div className="absolute top-4 left-0 right-0 flex justify-around pointer-events-none select-none">
              <span className="text-xl animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '1.2s' }}>🎉</span>
              <span className="text-lg animate-ping opacity-75" style={{ animationDelay: '0.3s', animationDuration: '2s' }}>✨</span>
              <span className="text-2xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '1.5s' }}>⭐</span>
              <span className="text-lg animate-ping opacity-75" style={{ animationDelay: '0.7s', animationDuration: '2.5s' }}>✨</span>
              <span className="text-xl animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '1s' }}>🎉</span>
            </div>

            {/* Glowing success ring */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-60" style={{ animationDuration: '2.5s' }} />
              <div className="absolute inset-2 bg-emerald-50 rounded-full border border-emerald-100" />
              <div className="relative bg-gradient-to-tr from-emerald-500 to-teal-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                <CheckCircle size={36} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-850 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-150 animate-pulse">
                Hệ thống tiếp nhận thành công
              </span>
              <h3 className="font-display font-extrabold text-2xl text-emerald-950 tracking-tight">
                Chúc Mừng Bạn! 🎉
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed px-2">
                Bài dự thi của bạn đã được lưu trữ an toàn và bảo mật trên máy chủ hệ thống. Ban tổ chức đã ghi nhận thông tin nộp bài.
              </p>
            </div>

            {/* Information card key values */}
            <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-100 text-left space-y-3 shadow-inner">
              <div>
                <span className="text-[10px] text-emerald-700/80 font-bold uppercase tracking-wider block mb-1">👤 Người nộp bài:</span>
                <span className="text-sm font-extrabold text-emerald-950 font-sans block">{submittedName}</span>
              </div>
              <div className="h-px bg-emerald-100/60" />
              <div>
                <span className="text-[10px] text-emerald-700/80 font-bold uppercase tracking-wider block mb-1">📄 Tên tập tin bài thi:</span>
                <span className="text-xs font-bold text-slate-700 font-sans break-all block" title={submittedFileName}>{submittedFileName}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="btn-close-congrats-modal"
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-100/30 hover:shadow-emerald-200/40 active:scale-98 transition-all cursor-pointer"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
