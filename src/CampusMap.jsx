import React, { useEffect, useRef, useState } from 'react';

// 한국외국어대학교 글로벌캠퍼스 건물 좌표 (실제 위경도)
const buildingCoordinates = {
  '백년관': { lat: 37.33734649116593, lng: 127.26548524902515 },
  '공학관': { lat: 37.33760215213574, lng: 127.26798567357692 },
  '도서관': { lat: 37.33677693774583, lng: 127.26832691635222 },
  '교양관': { lat: 37.339809326464454, lng: 127.27208427942806 },
  '인문경상관': { lat: 37.33977645549827, lng: 127.27461196939714 },
  '어문관': { lat: 37.338136140181824, lng: 127.27285688210742 },
  '기숙사': { lat: 37.33452634133701, lng: 127.26343854797861 },
  '주차장': { lat: 37.33738437241575, lng: 127.26667025522217 },
  '자연과학관': { lat: 37.338935246799004, lng: 127.26917920999111 },
  '후생관': { lat: 37.33778977973904, lng: 127.26868598313412 },
  '학생회관': { lat: 37.33729145709139, lng: 127.26989729060432 }
};

const CampusMap = ({ reports, onMarkerClick }) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // 건물별 신고 그룹화 (완료된 신고 제외)
  const getBuildingClusters = () => {
    const clusters = {};
    reports
      .filter(report => report.status !== 'completed') // 완료된 신고 제외
      .forEach(report => {
        if (!clusters[report.building]) {
          clusters[report.building] = [];
        }
        clusters[report.building].push(report);
      });
    return clusters;
  };

  // 건물의 가장 심각한 상태/긴급도 결정
  const getBuildingColor = (buildingReports) => {
    const hasUrgent = buildingReports.some(r => r.urgency === 'urgent');
    const hasHigh = buildingReports.some(r => r.urgency === 'high');
    const hasProcessing = buildingReports.some(r => r.status === 'processing');
    
    if (hasUrgent) return '#dc2626';
    if (hasHigh) return '#ff6b6b';
    if (hasProcessing) return '#f59e0b';
    return '#3b82f6';
  };

  // 카카오 맵 초기화
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.error('카카오 맵 API가 로드되지 않았습니다.');
      return;
    }

    const centerPosition = new window.kakao.maps.LatLng(37.337, 127.268);
    const mapOption = {
      center: centerPosition,
      level: 4
    };

    const map = new window.kakao.maps.Map(mapContainer.current, mapOption);
    mapInstance.current = map;
  }, []);

  // 클러스터 마커 업데이트
  useEffect(() => {
    if (!mapInstance.current || !window.kakao) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const clusters = getBuildingClusters();

    Object.entries(clusters).forEach(([building, buildingReports]) => {
      const coords = buildingCoordinates[building];
      if (!coords) return;

      const position = new window.kakao.maps.LatLng(coords.lat, coords.lng);
      const color = getBuildingColor(buildingReports);
      const count = buildingReports.length;

      // 커스텀 오버레이 생성
      const content = document.createElement('div');
      content.style.cssText = 'position: relative; cursor: pointer;';

      const markerDiv = document.createElement('div');
      markerDiv.style.cssText = `
        width: ${count >= 5 ? 40 : count >= 3 ? 32 : 28}px;
        height: ${count >= 5 ? 40 : count >= 3 ? 32 : 28}px;
        background-color: ${color};
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${count >= 5 ? 14 : count >= 3 ? 12 : 11}px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transition: transform 0.2s;
      `;
      markerDiv.textContent = count;

      const labelDiv = document.createElement('div');
      labelDiv.style.cssText = `
        position: absolute;
        top: 45px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: bold;
        white-space: nowrap;
        display: none;
      `;
      labelDiv.textContent = building;

      content.appendChild(markerDiv);
      content.appendChild(labelDiv);

      content.addEventListener('mouseenter', () => {
        markerDiv.style.transform = 'scale(1.3)';
        labelDiv.style.display = 'block';
      });

      content.addEventListener('mouseleave', () => {
        markerDiv.style.transform = 'scale(1)';
        labelDiv.style.display = 'none';
      });

      content.addEventListener('click', () => {
        setSelectedBuilding({ building, reports: buildingReports });
      });

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 0.5
      });

      customOverlay.setMap(mapInstance.current);
      markersRef.current.push(customOverlay);
    });
  }, [reports]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '600px' }}>
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
        className="border-2"
      />

      {reports.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            pointerEvents: 'none'
          }}
        >
          신고 내역이 없습니다
        </div>
      )}

      {/* 건물별 신고 목록 모달 */}
      {selectedBuilding && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '350px',
            maxHeight: '580px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            zIndex: 100,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* 헤더 */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f3f4f6'
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                {selectedBuilding.building}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                총 {selectedBuilding.reports.length}건
              </p>
            </div>
            <button
              onClick={() => setSelectedBuilding(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#9ca3af'
              }}
            >
              ✕
            </button>
          </div>

          {/* 신고 목록 */}
          <div style={{ overflow: 'auto', flex: 1, padding: '8px' }}>
            {selectedBuilding.reports.map((report, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onMarkerClick(report);
                  setSelectedBuilding(null);
                }}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid #e5e7eb',
                  fontSize: '13px'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {report.floor} {report.room}
                </div>
                <div style={{ color: '#6b7280', marginBottom: '4px', lineHeight: '1.3' }}>
                  {report.description.substring(0, 40)}...
                </div>
                <div style={{ display: 'flex', gap: '4px', fontSize: '11px' }}>
                  <span
                    style={{
                      backgroundColor: report.urgency === 'urgent' ? '#dc2626' : report.urgency === 'high' ? '#ff6b6b' : '#3b82f6',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '3px'
                    }}
                  >
                    {report.urgency === 'urgent' ? '긴급' : report.urgency === 'high' ? '높음' : '보통'}
                  </span>
                  <span
                    style={{
                      backgroundColor: report.status === 'completed' ? '#10b981' : report.status === 'processing' ? '#f59e0b' : '#3b82f6',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '3px'
                    }}
                  >
                    {report.status === 'completed' ? '완료' : report.status === 'processing' ? '처리중' : '접수'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusMap;