import { FileText, Calendar, ShieldCheck, User } from "lucide-react";

interface HeaderProps {
  currentRole: "member" | "manager";
  setCurrentRole: (role: "member" | "manager") => void;
  reportCount: number;
}

export default function Header({ currentRole, setCurrentRole, reportCount }: HeaderProps) {
  const currentFormattedTime = "Chủ nhật, ngày 24 tháng 05, 2026"; // Consistent with real environment year 2026 and Vietnamese localization

  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-emerald-100/80 py-5 px-6 md:px-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-40 transition-shadow duration-200 glow-shadow">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-100">
          <FileText size={22} className="stroke-[2.25]" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-[#0b3c29] tracking-tight flex items-center gap-2">
             Nộp Bài 
          </h1>
          <p className="text-xs text-slate-500 font-medium font-sans">Thu Thập, Tiếp Nhận & Quản Lý Bài Thi Trực Tuyến</p>
        </div>
      </div>

      {/* Date & Metadata */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50/70 border border-emerald-100/60 rounded-xl text-xs text-emerald-800 font-mono font-bold">
          <Calendar size={14} className="text-emerald-600" />
          <span>{currentFormattedTime}</span>
        </div>

        {/* Role Switcher tabs */}
        <div className="bg-slate-100 border border-slate-200/50 p-1 rounded-xl flex items-center font-sans text-xs sm:text-sm">
          <button
            id="role-member-toggle"
            onClick={() => setCurrentRole("member")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold tracking-wide transition-all duration-300 cursor-pointer ${
              currentRole === "member"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200/20"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <User size={15} />
            <span>NỘP BÀI DỰ THI</span>
          </button>
          
          <button
            id="role-manager-toggle"
            onClick={() => setCurrentRole("manager")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium transition-all duration-300 relative cursor-pointer ${
              currentRole === "manager"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck size={15} />
            <span>QUẢN LÝ</span>
            {reportCount > 0 && (
              <span className={`absolute -top-1.5 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-bold text-white ${
                currentRole === "manager" ? "bg-amber-500" : "bg-emerald-500 animate-bounce"
              }`}>
                {reportCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
