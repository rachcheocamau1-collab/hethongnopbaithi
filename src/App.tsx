import React, { useState, useEffect } from "react";
import { Report, Contest } from "./types";
import Header from "./components/Header";
import ReportSubmissionForm from "./components/ReportSubmissionForm";
import ManagerDashboard from "./components/ManagerDashboard";
import { FolderOpen } from "lucide-react";

export default function App() {
  const [currentRole, setCurrentRole] = useState<"member" | "manager">("member"); // Mặc định là "member" (Nộp bài dự thi) để luôn xuất hiện đầu tiên khi truy cập
  const [reports, setReports] = useState<Report[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // States for Admin Lock / Access Protection (Bypassed by default for seamless GitHub & Vercel deployment)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSetRole = (role: "member" | "manager") => {
    setCurrentRole(role);
  };

  const handleLogoutAdmin = () => {
    setCurrentRole("member");
  };

  const handleUpdateAdminPasscode = async (currentPasscode: string, newPasscode: string) => {
    try {
      const response = await fetch("/api/admin/passcode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPasscode, newPasscode })
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: "Lỗi kết nối máy chủ." };
    }
  };

  const fetchReports = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/reports");
      if (response.ok) {
        const data = await response.json();
        setReports(data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải báo cáo:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchContests = async () => {
    try {
      const response = await fetch("/api/contests");
      if (response.ok) {
        const data = await response.json();
        setContests(data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách kỳ thi:", err);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchReports(), fetchContests()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchReports();
    fetchContests();
  }, []);

  const handleDeleteReport = async (id: string) => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setReports(prev => prev.filter(r => r.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || "Gặp lỗi khi xóa báo cáo.");
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối máy chủ để thực hiện lệnh xóa.");
    }
  };

  const handleAddContest = async (name: string, year: string, startTime?: string, endTime?: string) => {
    try {
      const response = await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, year, startTime, endTime })
      });
      const data = await response.json();
      if (response.ok) {
        setContests(prev => [...prev, data.contest]);
        return true;
      } else {
        alert(data.error || "Lỗi khi thêm kỳ thi mới.");
        return false;
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi mạng khi thêm kỳ thi.");
      return false;
    }
  };

  const handleEditContest = async (id: string, name: string, year: string, status: "active" | "archived", startTime?: string, endTime?: string) => {
    try {
      const response = await fetch(`/api/contests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, year, status, startTime, endTime })
      });
      const data = await response.json();
      if (response.ok) {
        setContests(prev => prev.map(c => c.id === id ? data.contest : c));
        // Refresh all since status edits could impact what members see and filtering
        fetchReports();
        return true;
      } else {
        alert(data.error || "Lỗi khi cập nhật kỳ thi.");
        return false;
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi mạng khi cập nhật thông tin kỳ thi.");
      return false;
    }
  };

  const handleDeleteContest = async (id: string) => {
    try {
      const response = await fetch(`/api/contests/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (response.ok) {
        setContests(prev => prev.filter(c => c.id !== id));
        // Also refresh reports as some reports might have been switched back to the default contest
        fetchReports();
        return true;
      } else {
        alert(data.error || "Lỗi khi xóa kỳ thi.");
        return false;
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi mạng khi xóa kỳ thi.");
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#ecf3ef] flex flex-col font-sans text-slate-800">
      
      {/* Header layout */}
      <Header 
        currentRole={currentRole} 
        setCurrentRole={handleSetRole} 
        reportCount={reports.length} 
      />

      {/* Core main zone */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
        
        {currentRole === "member" ? (
          /* ========================================================= */
          /* MEMBER FLOW                                               */
          /* ========================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Left Column info */}
            <div className="lg:col-span-4 w-full space-y-6">
              <div className="bg-[#0a2f1d] text-emerald-100 rounded-3xl border border-emerald-900/60 p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-emerald-400/20 rounded-full blur-[45px]" />
                <h3 className="font-display font-bold text-base text-white mb-4 flex items-center gap-2">
                  <span>📝</span> Hướng Dẫn Kính Gửi
                </h3>
                <ul className="space-y-4 text-xs text-emerald-100/85 leading-relaxed font-sans">
                  <li className="flex gap-2">
                    <span className="text-emerald-300 font-black">1.</span>
                    <span>Hãy nhập chính xác <strong>Họ tên</strong> của bạn để phục vụ việc đối soát kết quả.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-300 font-black">2.</span>
                    <span>Kéo thả tệp tin bài dự thi trực tiếp hoặc nhấn chọn tệp. Chấp nhận các loại file khác nhau (Word, PDF, Excel, Hình ảnh, Zip, v.v.).</span>
                  </li>
                  <li className="text-xs text-emerald-200 flex gap-2">
                    <span className="font-black">3.</span>
                    <span>Nhấn nút <strong className="text-white font-extrabold uppercase bg-emerald-800/80 px-1.5 py-0.5 rounded-md border border-emerald-600/30">Nộp bài ngay</strong> để hoàn tất quá trình lưu trữ bảo mật cao.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/95 rounded-3xl border border-emerald-100/50 p-6 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-slow" />
                  <h4 className="font-bold text-slate-800 text-sm">Gửi bài dự thi an toàn</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Ngay khi bạn tải lên, hệ thống thực hiện mã hóa bảo vệ tính toàn vẹn tài liệu trên máy chủ. Ban tổ chức sẽ dễ dàng thẩm định một cách công minh và chuyên nghiệp.
                </p>
              </div>
            </div>

            {/* Right Form column */}
            <div className="lg:col-span-8 w-full">
              <ReportSubmissionForm onSuccess={handleRefreshAll} contests={contests} />
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* MANAGER VIEW - ARCHIVES LIST                              */
          /* ========================================================= */
          <div className="w-full space-y-6 animate-fade-in max-w-5xl mx-auto">
            <ManagerDashboard
              reports={reports}
              contests={contests}
              onDeleteReport={handleDeleteReport}
              isRefreshing={isRefreshing}
              onRefresh={handleRefreshAll}
              onAddContest={handleAddContest}
              onEditContest={handleEditContest}
              onDeleteContest={handleDeleteContest}
              onLogout={handleLogoutAdmin}
              onUpdatePasscode={handleUpdateAdminPasscode}
            />
          </div>
        )}

      </main>

      {/* Footer view */}
      <footer className="w-full bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-medium mt-12">
        <p>© 2026 Hệ Thống Thu Thập & Tiếp Nhận Bài Dự Thi. Thiết kế tinh giản, hiệu suất cao.</p>
      </footer>

    </div>
  );
}
