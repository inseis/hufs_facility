import React, { useEffect, useMemo, useState } from "react";
import {
  Camera,
  MapPin,
  Calendar,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Search,
  UserCircle2,
  LogOut,
} from "lucide-react";

/**
 * HUFS Facility Report System – refined UI
 * - Color system based on Pantone 7463C (deep navy). Approximations:
 *   primary: #00325A (base), primaryDark: #002846, primaryLight: #E7F0F8
 * - Improved contrast, focus states, spacing, and admin tools
 * - Added list filters/search, empty states, and safer date handling
 */

const HUFS = {
  primary: "#00325A",
  primaryDark: "#002846",
  primaryLight: "#E7F0F8",
  accent: "#4F9EE3",
  success: "#178A55",
  warn: "#B7791F",
  danger: "#C53030",
};

const buildings = [
  "백년관",
  "공학관",
  "도서관",
  "교양관",
  "인문경상관",
  "어문관",
  "기숙사",
  "주차장",
  "자연과학관",
  "후생관",
  "학생회관",
];

const floors = [
  "지하2층",
  "지하1층",
  "1층",
  "2층",
  "3층",
  "4층",
  "5층",
  "6층",
  "7층",
  "8층",
];

const StatusBadge = ({ status }) => {
  const cfg = {
    submitted: { label: "접수됨", cls: "bg-blue-100 text-blue-800", Icon: Clock },
    processing: { label: "처리중", cls: "bg-amber-100 text-amber-800", Icon: AlertCircle },
    completed: { label: "완료", cls: "bg-emerald-100 text-emerald-800", Icon: CheckCircle },
  }[status];
  const Icon = cfg?.Icon || Clock;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${cfg?.cls}`}>
      <Icon size={14} /> {cfg?.label}
    </span>
  );
};

const UrgencyBadge = ({ urgency }) => {
  const cfg = {
    urgent: { label: "긴급", cls: "bg-red-600 text-white" },
    high: { label: "높음", cls: "bg-orange-500 text-white" },
    normal: { label: "보통", cls: "bg-slate-500 text-white" },
    low: { label: "낮음", cls: "bg-slate-300 text-slate-800" },
  }[urgency];
  return <span className={`px-2 py-1 rounded text-xs font-bold ${cfg?.cls}`}>{cfg?.label}</span>;
};

const formatKDate = (input) => {
  try {
    const d = typeof input === "string" ? new Date(input) : input;
    if (Number.isNaN(d?.getTime?.())) return "";
    return d.toLocaleDateString("ko-KR");
  } catch {
    return "";
  }
};

const calcDeadlineISO = (urgency) => {
  const now = new Date();
  const addDays = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };
  let days = 7;
  if (urgency === "high") days = 1;
  else if (urgency === "urgent") days = 0.5;
  else if (urgency === "low") days = 14;
  return addDays(days).toISOString();
};

export default function FacilityReportSystem() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("report");
  const [reports, setReports] = useState([]);
  const [studentId, setStudentId] = useState("");

  // report form state
  const [reportForm, setReportForm] = useState({
    building: "",
    floor: "",
    room: "",
    description: "",
    image: null,
    urgency: "normal",
  });

  // list filters (status tab & admin tab)
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBuilding, setFilterBuilding] = useState("all");

  // load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("hufs_reports");
    if (stored) {
      try {
        setReports(JSON.parse(stored));
      } catch {
        // ignore broken storage
      }
    }
  }, []);

  // persist to localStorage
  useEffect(() => {
    localStorage.setItem("hufs_reports", JSON.stringify(reports));
  }, [reports]);

  const handleLogin = (e) => {
    e?.preventDefault();
    if (!studentId || studentId.length < 4) return;
    setCurrentUser(studentId);
    const admin = studentId === "admin" || studentId.startsWith("admin");
    setIsAdmin(admin);
    setActiveTab(admin ? "admin" : "report");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setReportForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const isDuplicate = (nr) => {
    const NOW = new Date();
    return reports.find((r) => {
      const within1h = Math.abs(NOW - new Date(r.timestamp)) < 60 * 60 * 1000;
      const sameSpot = r.building === nr.building && r.floor === nr.floor && r.room === nr.room;
      const sameDay = new Date(r.timestamp).toDateString() === NOW.toDateString();
      return within1h && sameSpot && sameDay;
    });
  };

  const submitReport = (e) => {
    e?.preventDefault();
    const { building, floor, room, description, image, urgency } = reportForm;
    if (!building || !floor || !room || !description.trim()) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }
    const newReport = {
      id: Date.now(),
      studentId: currentUser,
      building,
      floor,
      room,
      description: description.trim(),
      image,
      urgency,
      status: "submitted",
      timestamp: new Date().toISOString(),
      deadlineISO: calcDeadlineISO(urgency),
    };
    const dup = isDuplicate(newReport);
    if (dup) {
      alert(`최근 1시간 이내 동일 위치 신고가 있습니다.\n신고번호: ${dup.id}`);
      return;
    }
    setReports((prev) => [newReport, ...prev]);
    setReportForm({ building: "", floor: "", room: "", description: "", image: null, urgency: "normal" });
    alert(`신고가 접수되었습니다!\n신고번호: ${newReport.id}`);
  };

  const updateStatus = (id, newStatus) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              completedISO: newStatus === "completed" ? new Date().toISOString() : r.completedISO,
            }
          : r
      )
    );
  };

  const updateDeadline = (id, iso) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, deadlineISO: iso } : r)));
  };

  const stats = useMemo(() => {
    const statusCount = { submitted: 0, processing: 0, completed: 0 };
    const locationCount = {};
    for (const r of reports) {
      statusCount[r.status]++;
      const loc = `${r.building} ${r.floor}`;
      locationCount[loc] = (locationCount[loc] || 0) + 1;
    }
    const topLocations = Object.entries(locationCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    return { statusCount, topLocations };
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => (isAdmin ? true : r.studentId === currentUser))
      .filter((r) => (filterStatus === "all" ? true : r.status === filterStatus))
      .filter((r) => (filterBuilding === "all" ? true : r.building === filterBuilding))
      .filter((r) => {
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return (
          r.building.toLowerCase().includes(q) ||
          r.floor.toLowerCase().includes(q) ||
          r.room.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          String(r.id).includes(q)
        );
      });
  }, [reports, isAdmin, currentUser, filterStatus, filterBuilding, query]);

  // ===== UI =====
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${HUFS.primaryLight}, #ffffff)` }}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-slate-100 p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg" style={{ backgroundColor: HUFS.primary }}>
              <AlertCircle size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">한국외국어대학교</h1>
            <p className="text-slate-600">시설물 신고 시스템</p>
          </div>
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">학번 입력</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="예: 202012345 (관리자: admin)"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-4"
                style={{ boxShadow: `0 0 0 0 rgba(0,0,0,0)`, outline: "none", caretColor: HUFS.primary }}
              />
              <p className="text-xs text-slate-500 mt-2">관리자는 <b>admin</b>으로 로그인하세요.</p>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold text-white shadow-md hover:shadow-lg transition"
              style={{ backgroundColor: HUFS.primary }}
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="text-white shadow-lg" style={{ background: `linear-gradient(180deg, ${HUFS.primary}, ${HUFS.primaryDark})` }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/10 ring-1 ring-white/20">
                <UserCircle2 size={22} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">시설물 신고 시스템</h1>
                <p className="text-white/70 text-xs">한국외국어대학교</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80">{isAdmin ? "관리자" : "학생"}: {currentUser}</p>
              <button
                onClick={() => setCurrentUser(null)}
                className="text-xs inline-flex items-center gap-1 mt-1 px-2 py-1 rounded hover:bg-white/10"
              >
                <LogOut size={14} /> 로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2">
            {!isAdmin && (
              <button
                onClick={() => setActiveTab("report")}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === "report" ? "border-sky-700 text-sky-700" : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Camera size={18} className="inline mr-2" /> 신고하기
              </button>
            )}
            <button
              onClick={() => setActiveTab("status")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "status" ? "border-sky-700 text-sky-700" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Clock size={18} className="inline mr-2" /> 처리 상태
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === "admin" ? "border-sky-700 text-sky-700" : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <AlertCircle size={18} className="inline mr-2" /> 관리
                </button>
                <button
                  onClick={() => setActiveTab("statistics")}
                  className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === "statistics" ? "border-sky-700 text-sky-700" : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <BarChart3 size={18} className="inline mr-2" /> 통계
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Report Tab */}
        {activeTab === "report" && (
          <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto max-h-[calc(100vh-250px)] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 sticky top-0 bg-white pb-4 border-b">시설물 고장 신고</h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <MapPin size={16} className="inline mr-1" /> 건물
                  </label>
                  <select
                    value={reportForm.building}
                    onChange={(e) => setReportForm({ ...reportForm, building: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-4"
                    style={{ caretColor: HUFS.primary }}
                  >
                    <option value="">선택</option>
                    {buildings.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">층</label>
                  <select
                    value={reportForm.floor}
                    onChange={(e) => setReportForm({ ...reportForm, floor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-4"
                  >
                    <option value="">선택</option>
                    {floors.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">호수</label>
                  <input
                    type="text"
                    value={reportForm.room}
                    onChange={(e) => setReportForm({ ...reportForm, room: e.target.value })}
                    placeholder="예: 301호"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">긴급도</label>
                <select
                  value={reportForm.urgency}
                  onChange={(e) => setReportForm({ ...reportForm, urgency: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-4"
                >
                  <option value="low">낮음 (14일 이내)</option>
                  <option value="normal">보통 (7일 이내)</option>
                  <option value="high">높음 (1일 이내)</option>
                  <option value="urgent">긴급 (즉시)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">상세 설명</label>
                <textarea
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  placeholder="고장 내용을 자세히 설명해주세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Camera size={16} className="inline mr-1" /> 사진 첨부 (선택)
                </label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                {reportForm.image && <img src={reportForm.image} alt="Preview" className="mt-4 w-full h-40 object-cover rounded-lg" />}
              </div>

              <div className="sticky bottom-0 bg-white pt-4 border-t">
                <button
                  onClick={submitReport}
                  className="w-full text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:brightness-95 transition"
                  style={{ backgroundColor: HUFS.primary }}
                >
                  ✅ 신고 제출하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Tab */}
        {activeTab === "status" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold text-slate-900">신고 내역 및 처리 상태</h2>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-4"
                    placeholder="검색(건물/층/호/설명/번호)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <select className="px-3 py-2 rounded-lg border border-slate-300" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">전체 상태</option>
                  <option value="submitted">접수됨</option>
                  <option value="processing">처리중</option>
                  <option value="completed">완료</option>
                </select>
                <select className="px-3 py-2 rounded-lg border border-slate-300" value={filterBuilding} onChange={(e) => setFilterBuilding(e.target.value)}>
                  <option value="all">전체 건물</option>
                  {buildings.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">조건에 해당하는 신고 내역이 없습니다.</p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {report.building} {report.floor} {report.room}
                        </h3>
                        <UrgencyBadge urgency={report.urgency} />
                        <StatusBadge status={report.status} />
                      </div>
                      <p className="text-sm text-slate-500">신고번호: {report.id} | 신고일: {formatKDate(report.timestamp)}</p>
                    </div>
                  </div>

                  <p className="text-slate-700 mb-4 whitespace-pre-wrap">{report.description}</p>

                  {report.image && <img src={report.image} alt="신고" className="w-full h-48 object-cover rounded-lg mb-4" />}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-slate-600">
                      <Calendar size={14} className="inline mr-1" /> 처리 예정일: {formatKDate(report.deadlineISO)}
                    </div>
                    {report.status === "completed" && (
                      <div className="text-sm font-medium text-emerald-700">완료일: {formatKDate(report.completedISO)}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === "admin" && isAdmin && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-2xl font-bold text-slate-900">신고 관리</h2>
              <div className="text-sm text-slate-600">
                총 {reports.length}건 | 처리중 {stats.statusCount.processing}건 | 완료 {stats.statusCount.completed}건
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-4"
                  placeholder="검색(건물/층/호/설명/번호/신고자)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <select className="px-3 py-2 rounded-lg border border-slate-300" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">전체 상태</option>
                <option value="submitted">접수됨</option>
                <option value="processing">처리중</option>
                <option value="completed">완료</option>
              </select>
              <select className="px-3 py-2 rounded-lg border border-slate-300" value={filterBuilding} onChange={(e) => setFilterBuilding(e.target.value)}>
                <option value="all">전체 건물</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {filteredReports.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">표시할 신고가 없습니다.</p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {report.building} {report.floor} {report.room}
                        </h3>
                        <UrgencyBadge urgency={report.urgency} />
                        <StatusBadge status={report.status} />
                      </div>
                      <p className="text-sm text-slate-500">
                        신고번호: {report.id} | 신고자: {report.studentId} | 신고일: {formatKDate(report.timestamp)}
                      </p>
                    </div>
                  </div>

                  <p className="text-slate-700 mb-4 whitespace-pre-wrap">{report.description}</p>

                  {report.image && <img src={report.image} alt="신고" className="w-full h-48 object-cover rounded-lg mb-4" />}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">처리 상태 변경</label>
                      <select
                        value={report.status}
                        onChange={(e) => updateStatus(report.id, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-4"
                      >
                        <option value="submitted">접수됨</option>
                        <option value="processing">처리중</option>
                        <option value="completed">완료</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">처리 기한</label>
                      <input
                        type="date"
                        value={report.deadlineISO ? new Date(report.deadlineISO).toISOString().split("T")[0] : ""}
                        onChange={(e) => updateDeadline(report.id, new Date(e.target.value).toISOString())}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-4"
                      />
                      <p className="text-xs text-slate-500 mt-1">표시: {formatKDate(report.deadlineISO)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === "statistics" && isAdmin && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">통계 및 분석</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl p-6 border bg-white" style={{ borderColor: HUFS.primaryLight }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ color: HUFS.primary }}>접수됨</p>
                    <p className="text-3xl font-extrabold mt-2" style={{ color: HUFS.primary }}>{stats.statusCount.submitted}</p>
                  </div>
                  <Clock size={40} style={{ color: HUFS.accent }} />
                </div>
              </div>

              <div className="rounded-xl p-6 border bg-white" style={{ borderColor: HUFS.primaryLight }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700">처리중</p>
                    <p className="text-3xl font-extrabold mt-2 text-amber-800">{stats.statusCount.processing}</p>
                  </div>
                  <AlertCircle size={40} className="text-amber-400" />
                </div>
              </div>

              <div className="rounded-xl p-6 border bg-white" style={{ borderColor: HUFS.primaryLight }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-700">완료</p>
                    <p className="text-3xl font-extrabold mt-2 text-emerald-800">{stats.statusCount.completed}</p>
                  </div>
                  <CheckCircle size={40} className="text-emerald-400" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                <BarChart3 size={24} className="inline mr-2" /> 위치별 신고 건수 TOP 10
              </h3>
              {stats.topLocations.length === 0 ? (
                <p className="text-slate-500 text-center py-8">데이터가 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {stats.topLocations.map(([location, count], index) => (
                    <div key={location} className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                            ? "bg-slate-400"
                            : index === 2
                            ? "bg-orange-600"
                            : "bg-slate-700"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-slate-900">{location}</span>
                          <span className="text-sm font-bold" style={{ color: HUFS.primary }}>
                            {count}건
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${(count / stats.topLocations[0][1]) * 100}%`, backgroundColor: HUFS.primary }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}