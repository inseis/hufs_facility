import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Calendar, AlertCircle, BarChart3, CheckCircle, Clock, Filter, X } from 'lucide-react';
import CampusMap from './CampusMap'; // 새로 만든 지도 컴포넌트 import
import StatisticsMap from './StatisticsMap'; // 통계용 지도 컴포넌트 import

const buildings = ['백년관', '공학관', '도서관', '교양관', '인문경상관', '어문관', '기숙사', '주차장', '자연과학관', '후생관', '학생회관'];
const floors = ['지하1층', '지하2층', '1층', '2층', '3층', '4층', '5층', '6층', '7층', '8층'];

const buildingPositions = {
  '백년관': { x: 30, y: 40 },
  '공학관': { x: 50, y: 30 },
  '도서관': { x: 70, y: 45 },
  '교양관': { x: 45, y: 60 },
  '인문경상관': { x: 25, y: 65 },
  '어문관': { x: 60, y: 70 },
  '기숙사': { x: 80, y: 25 },
  '주차장': { x: 15, y: 50 },
  '자연과학관': { x: 35, y: 30 },
  '후생관': { x: 55, y: 55 },
  '학생회관': { x: 65, y: 40 }
};

const FacilityReportSystem = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('report');
  const [reports, setReports] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    building: 'all'
  });

  const buildings = ['백년관', '공학관', '도서관', '교양관', '인문경상관', '어문관', '기숙사', '주차장', '자연과학관', '후생관', '학생회관'];
  const floors = ['지하1층', '지하2층', '1층', '2층', '3층', '4층', '5층', '6층', '7층', '8층'];
  
  const buildingPositions = {
    '백년관': { x: 30, y: 40 },
    '공학관': { x: 50, y: 30 },
    '도서관': { x: 70, y: 45 },
    '교양관': { x: 45, y: 60 },
    '인문경상관': { x: 25, y: 65 },
    '어문관': { x: 60, y: 70 },
    '기숙사': { x: 80, y: 25 },
    '주차장': { x: 15, y: 50 },
    '자연과학관': { x: 35, y: 30 },
    '후생관': { x: 55, y: 55 },
    '학생회관': { x: 65, y: 40 }
  };

  const [reportForm, setReportForm] = useState({
    building: '',
    floor: '',
    room: '',
    description: '',
    image: null,
    urgency: 'normal'
  });

  const normalizeToYyyyMmDd = (value) => {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const parsedFromDate = new Date(value);
    if (!Number.isNaN(parsedFromDate.getTime())) {
      return parsedFromDate.toISOString().split('T')[0];
    }

    const cleaned = value
      .replace(/\./g, '-')
      .replace(/년|월/g, '-')
      .replace(/일/g, '')
      .replace(/\s+/g, '')
      .replace(/--+/g, '-')
      .replace(/-$/g, '');

    const parts = cleaned.split('-').filter(Boolean);
    if (parts.length >= 3) {
      const [year, month, day] = parts;
      if (year.length === 4) {
        const normalizedMonth = month.padStart(2, '0');
        const normalizedDay = day.padStart(2, '0');
        return `${year}-${normalizedMonth}-${normalizedDay}`;
      }
    }

    return null;
  };

  const formatDateForDisplay = (value) => {
    const normalized = normalizeToYyyyMmDd(value);
    if (!normalized) {
      return value || '-';
    }

    const date = new Date(`${normalized}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('ko-KR');
    }

    const [year, month, day] = normalized.split('-').map((part) => parseInt(part, 10));
    if (year && month && day) {
      return `${year}. ${month}. ${day}.`;
    }

    return normalized;
  };

  const formatDateForInput = (value) => {
    const normalized = normalizeToYyyyMmDd(value);
    return normalized || '';
  };

  const calculateDeadlineInfo = (urgency) => {
    const now = new Date();
    let days = 7;
    if (urgency === 'high') days = 1;
    else if (urgency === 'urgent') days = 0.5;
    else if (urgency === 'low') days = 14;

    const deadlineDateObj = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const deadlineDate = deadlineDateObj.toISOString().split('T')[0];
    return {
      deadlineDate,
      deadline: formatDateForDisplay(deadlineDate)
    };
  };

  const normalizeReportDeadline = (report) => {
    const normalizedDate = normalizeToYyyyMmDd(report.deadlineDate || report.deadline);
    if (normalizedDate) {
      return {
        ...report,
        deadlineDate: normalizedDate,
        deadline: formatDateForDisplay(normalizedDate)
      };
    }

    const fallback = calculateDeadlineInfo(report.urgency || 'normal');
    return {
      ...report,
      ...fallback
    };
  };

  useEffect(() => {
    const stored = localStorage.getItem('hufs_reports');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setReports(parsed.map(normalizeReportDeadline));
        }
      } catch (error) {
        console.error('Failed to parse stored reports', error);
      }
    }
  }, []);

  useEffect(() => {
    if (reports.length > 0) {
      localStorage.setItem('hufs_reports', JSON.stringify(reports));
    } else {
      localStorage.removeItem('hufs_reports');
    }
  }, [reports]);

  useEffect(() => {
    if (!selectedReport) return;

    const updated = reports.find(r => r.id === selectedReport.id);
    if (updated && updated !== selectedReport) {
      setSelectedReport(updated);
    }
    if (!updated) {
      setShowDetailModal(false);
      setSelectedReport(null);
    }
  }, [reports, selectedReport]);

  const handleLogin = () => {
    if (studentId.length >= 4) {
      setCurrentUser(studentId);
      const adminCheck = studentId === 'admin' || studentId.startsWith('admin');
      setIsAdmin(adminCheck);
      setActiveTab(adminCheck ? 'map' : 'report');
    } else {
      alert('학번을 입력해주세요.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportForm({ ...reportForm, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReport = () => {
    if (!reportForm.building || !reportForm.floor || !reportForm.room || !reportForm.description) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }
    
    const deadlineInfo = calculateDeadlineInfo(reportForm.urgency);

    const newReport = {
      id: Date.now(),
      studentId: currentUser,
      building: reportForm.building,
      floor: reportForm.floor,
      room: reportForm.room,
      description: reportForm.description,
      image: reportForm.image,
      urgency: reportForm.urgency,
      status: 'submitted',
      date: new Date().toLocaleDateString('ko-KR'),
      timestamp: new Date().toISOString(),
      ...deadlineInfo
    };

    setReports(prevReports => [newReport, ...prevReports]);
    setReportForm({
      building: '',
      floor: '',
      room: '',
      description: '',
      image: null,
      urgency: 'normal'
    });
    alert('신고가 접수되었습니다!');
  };

  const updateStatus = (id, newStatus) => {
    setReports(prevReports => {
      const updated = prevReports.map(r =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              completedDate: newStatus === 'completed' ? new Date().toLocaleDateString('ko-KR') : r.completedDate
            }
          : r
      );

      const updatedReport = updated.find(r => r.id === id);
      if (selectedReport && selectedReport.id === id && updatedReport) {
        setSelectedReport(updatedReport);
      }

      return updated;
    });
  };

  const updateDeadline = (id, newDeadline) => {
    setReports(prevReports => {
      const updated = prevReports.map(r => {
        if (r.id !== id) return r;

        if (!newDeadline) {
          return {
            ...r,
            deadlineDate: '',
            deadline: '-'
          };
        }

        const normalized = normalizeToYyyyMmDd(newDeadline);
        if (!normalized) {
          return r;
        }

        return {
          ...r,
          deadlineDate: normalized,
          deadline: formatDateForDisplay(normalized)
        };
      });

      const updatedReport = updated.find(r => r.id === id);
      if (selectedReport && selectedReport.id === id && updatedReport) {
        setSelectedReport(updatedReport);
      }

      return updated;
    });
  };

  const getFilteredReports = () => {
    return reports.filter(report => {
      if (filters.dateRange !== 'all') {
        const reportDate = new Date(report.timestamp);
        const now = new Date();
        const daysDiff = Math.floor((now - reportDate) / (1000 * 60 * 60 * 24));
        
        if (filters.dateRange === 'today' && daysDiff > 0) return false;
        if (filters.dateRange === 'week' && daysDiff > 7) return false;
        if (filters.dateRange === 'month' && daysDiff > 30) return false;
      }
      if (filters.building !== 'all' && report.building !== filters.building) return false;
      return true;
    });
  };

  const getStatistics = () => {
    const filteredReports = getFilteredReports();
    const locationCount = {};
    const statusCount = { submitted: 0, processing: 0, completed: 0 };
    
    filteredReports.forEach(r => {
      const location = r.building + ' ' + r.floor;
      locationCount[location] = (locationCount[location] || 0) + 1;
      statusCount[r.status] = statusCount[r.status] + 1;
    });

    const topLocations = Object.entries(locationCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { topLocations, statusCount };
  };

  const stats = getStatistics();

  const StatusBadge = ({ status }) => {
    const configs = {
      submitted: { label: '접수', color: 'bg-blue-100 text-blue-800' },
      processing: { label: '처리중', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: '완료', color: 'bg-green-100 text-green-800' }
    };
    const config = configs[status];
    return (
      <span className={'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ' + config.color}>
        {config.label}
      </span>
    );
  };

  const UrgencyBadge = ({ urgency }) => {
    const configs = {
      urgent: { label: '긴급', color: 'bg-red-600 text-white' },
      high: { label: '높음', color: 'bg-orange-500 text-white' },
      normal: { label: '보통', color: 'bg-gray-400 text-white' },
      low: { label: '낮음', color: 'bg-gray-300 text-gray-700' }
    };
    const config = configs[urgency];
    return (
      <span className={'px-2 py-0.5 rounded text-xs font-bold ' + config.color}>
        {config.label}
      </span>
    );
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src="/logo-circle.png" 
                alt="뚝딱 로고" 
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-gray-600 font-medium">시설물 신고 시스템</p>
            <p className="text-sm text-gray-500 mt-2">한국외국어대학교</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">학번 입력</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="학번 (예: 202012345)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
              />
              <p className="text-xs text-gray-500 mt-2">관리자는 admin으로 로그인</p>
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-circle.png" 
                alt="뚝딱" 
                className="w-16 h-16"
              />
              <div>
                <h1 className="text-xl font-bold">뚝딱</h1>
                <p className="text-blue-200 text-xs">{isAdmin ? '관리자' : currentUser}</p>
              </div>
            </div>
            <button onClick={() => setCurrentUser(null)} className="text-sm underline hover:text-blue-200">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2">
            {!isAdmin && (
              <button
                onClick={() => setActiveTab('report')}
                className={'px-4 py-3 font-medium border-b-2 text-sm ' + (activeTab === 'report' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500')}
              >
                <Camera size={16} className="inline mr-1" />신고하기
              </button>
            )}
            <button
              onClick={() => setActiveTab('status')}
              className={'px-4 py-3 font-medium border-b-2 text-sm ' + (activeTab === 'status' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500')}
            >
              <Clock size={16} className="inline mr-1" />내역 관리
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('map')}
                  className={'px-4 py-3 font-medium border-b-2 text-sm ' + (activeTab === 'map' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500')}
                >
                  <MapPin size={16} className="inline mr-1" />지도
                </button>
                <button
                  onClick={() => setActiveTab('statistics')}
                  className={'px-4 py-3 font-medium border-b-2 text-sm ' + (activeTab === 'statistics' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500')}
                >
                  <BarChart3 size={16} className="inline mr-1" />통계
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'report' && (
          <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">새 고장 신고</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">건물</label>
                  <select
                    value={reportForm.building}
                    onChange={(e) => setReportForm({ ...reportForm, building: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">선택</option>
                    {buildings.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">층</label>
                  <select
                    value={reportForm.floor}
                    onChange={(e) => setReportForm({ ...reportForm, floor: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">선택</option>
                    {floors.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">호수</label>
                  <input
                    type="text"
                    value={reportForm.room}
                    onChange={(e) => setReportForm({ ...reportForm, room: e.target.value })}
                    placeholder="301호"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">긴급도</label>
                <select
                  value={reportForm.urgency}
                  onChange={(e) => setReportForm({ ...reportForm, urgency: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="low">낮음</option>
                  <option value="normal">보통</option>
                  <option value="high">높음</option>
                  <option value="urgent">긴급</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상세 설명</label>
                <textarea
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  placeholder="고장 내용을 자세히 설명해주세요"
                  rows="3"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">사진</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                {reportForm.image && (
                  <img src={reportForm.image} alt="Preview" className="mt-4 w-full max-h-60 object-contain rounded-lg border" />
                )}
              </div>

              <button
                onClick={handleSubmitReport}
                className="w-full bg-blue-900 text-white py-4 rounded-lg font-bold hover:bg-blue-800"
              >
                신고 제출하기
              </button>
            </div>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">신고 내역</h2>
            
            {getFilteredReports().filter(r => isAdmin || r.studentId === currentUser).length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <p className="text-gray-500">신고 내역이 없습니다</p>
              </div>
            ) : (
              getFilteredReports()
                .filter(r => isAdmin || r.studentId === currentUser)
                .map(report => (
                  <div key={report.id} className="bg-white rounded-xl shadow-md p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold">{report.building} {report.floor} {report.room}</h3>
                          <UrgencyBadge urgency={report.urgency} />
                          <StatusBadge status={report.status} />
                        </div>
                        <p className="text-xs text-gray-500">
                          #{report.id} | {report.date}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-900 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-semibold"
                      >
                        상세 보기
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{report.description}</p>
                    <div className="text-xs text-gray-500 pt-3 border-t">
                      처리 예정: {report.deadline}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'map' && isAdmin && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-bold mb-4">필터</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">기간</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">전체</option>
                    <option value="today">오늘</option>
                    <option value="week">최근 7일</option>
                    <option value="month">최근 30일</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">건물</label>
                  <select
                    value={filters.building}
                    onChange={(e) => setFilters({ ...filters, building: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">전체</option>
                    {buildings.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">접수</p>
                <p className="text-3xl font-bold text-blue-700 mt-2">{stats.statusCount.submitted}</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <p className="text-sm text-yellow-600 font-medium">처리중</p>
                <p className="text-3xl font-bold text-yellow-700 mt-2">{stats.statusCount.processing}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-sm text-green-600 font-medium">완료</p>
                <p className="text-3xl font-bold text-green-700 mt-2">{stats.statusCount.completed}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">캠퍼스 지도</h3>
              <CampusMap 
                reports={getFilteredReports()}
                onMarkerClick={(report) => {
                  setSelectedReport(report);
                  setShowDetailModal(true);
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'statistics' && isAdmin && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">통계</h2>
            
            {/* 카카오맵 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">건물별 신고 현황</h3>
              <StatisticsMap 
                reports={reports}
                onBuildingClick={(building) => {
                  const buildingReports = reports.filter(r => r.building === building);
                  if (buildingReports.length > 0) {
                    setSelectedReport(buildingReports[0]);
                    setShowDetailModal(true);
                  }
                }}
              />
            </div>

            {/* 상태별 신고건수 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 text-center">
                <div className="text-4xl font-bold text-blue-900 mb-2">{stats.statusCount.submitted || 0}</div>
                <div className="text-gray-600 font-medium">접수</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-md p-6 text-center">
                <div className="text-4xl font-bold text-yellow-900 mb-2">{stats.statusCount.processing || 0}</div>
                <div className="text-gray-600 font-medium">처리중</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6 text-center">
                <div className="text-4xl font-bold text-green-900 mb-2">{stats.statusCount.completed || 0}</div>
                <div className="text-gray-600 font-medium">완료</div>
              </div>
            </div>

            {/* 신고 다발 위치 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">신고 다발 위치</h3>
              {stats.topLocations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">데이터 없음</p>
              ) : (
                <div className="space-y-3">
                  {stats.topLocations.map(([location, count], index) => (
                    <div key={location} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{location}</span>
                          <span className="font-bold text-blue-900">{count}건</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="h-3 bg-blue-900 rounded-full"
                            style={{ width: (count / stats.topLocations[0][1] * 100) + '%' }}
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

      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">신고 상세</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-blue-900">#{selectedReport.id}</div>
                <UrgencyBadge urgency={selectedReport.urgency} />
                <StatusBadge status={selectedReport.status} />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <div><span className="font-medium">위치:</span> {selectedReport.building} {selectedReport.floor} {selectedReport.room}</div>
                <div><span className="font-medium">신고일:</span> {selectedReport.date}</div>
                <div><span className="font-medium">처리 예정:</span> {selectedReport.deadline}</div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">고장 내용</h4>
                <p className="bg-gray-50 p-4 rounded-lg">{selectedReport.description}</p>
              </div>
              {selectedReport.image && (
                <div className="bg-gray-100 rounded-lg p-2">
                  <img src={selectedReport.image} alt="신고" className="w-full max-h-96 object-contain rounded-lg" />
                </div>
              )}
              {isAdmin && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium mb-2">상태</label>
                    <select
                      value={selectedReport.status}
                      onChange={(e) => updateStatus(selectedReport.id, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="submitted">접수</option>
                      <option value="processing">처리중</option>
                      <option value="completed">완료</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">처리 예정일</label>
                    <input
                      type="date"
                      value={formatDateForInput(selectedReport.deadlineDate)}
                      onChange={(e) => updateDeadline(selectedReport.id, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilityReportSystem;