import React, { useEffect, useState, useRef } from 'react';

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

const StatisticsMap = ({ reports, onBuildingClick }) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [buildingStats, setBuildingStats] = useState([]);

  // 건물별 신고 통계 계산
  useEffect(() => {
    const statsMap = {};
    
    reports.forEach(report => {
      const building = report.building;
      if (!statsMap[building]) {
        statsMap[building] = {
          building,
          count: 0,
          reports: [],
          hasUrgent: false,
          hasHigh: false,
          submitted: 0,
          processing: 0,
          completed: 0
        };
      }
      
      statsMap[building].count++;
      statsMap[building].reports.push(report);
      statsMap[building][report.status]++;
      
      if (report.urgency === 'urgent') statsMap[building].hasUrgent = true;
      if (report.urgency === 'high') statsMap[building].hasHigh = true;
    });

    const stats = Object.values(statsMap).map(stat => ({
      ...stat,
      coords: buildingCoordinates[stat.building]
    })).filter(stat => stat.coords);

    setBuildingStats(stats);
  }, [reports]);

  // 마커 색상 결정 (우선순위: 긴급 > 4건 이상 > 높음 > 일반)
  const getMarkerColor = (stat) => {
    if (stat.hasUrgent) return '#dc2626'; // 빨강색 - 긴급
    if (stat.count >= 4) return '#f59e0b'; // 주황색 - 4건 이상
    if (stat.hasHigh) return '#ff6b6b'; // 연한 빨강색 - 높음
    return '#3b82f6'; // 파랑색 - 일반
  };

  // 마커 크기 결정 (신고 개수에 비례)
  const getMarkerSize = (count) => {
    if (count >= 10) return 30;
    if (count >= 5) return 25;
    return 20;
  };

  // 카카오 맵 초기화
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.error('카카오 맵 API가 로드되지 않았습니다.');
      return;
    }

    // 한국외국어대학교 글로벌캠퍼스 중심 좌표
    const centerPosition = new window.kakao.maps.LatLng(37.337, 127.268);

    const mapOption = {
      center: centerPosition,
      level: 4 // 확대 레벨
    };

    // 지도 생성
    const map = new window.kakao.maps.Map(mapContainer.current, mapOption);
    mapInstance.current = map;

  }, []);

  // 마커 업데이트
  useEffect(() => {
    if (!mapInstance.current || !window.kakao) return;

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 새 마커 생성
    const markers = buildingStats.map(stat => {
      const position = new window.kakao.maps.LatLng(stat.coords.lat, stat.coords.lng);
      const size = getMarkerSize(stat.count);
      const color = getMarkerColor(stat);

      // 커스텀 오버레이용 HTML
      const content = document.createElement('div');
      content.style.cssText = 'position: relative; cursor: pointer;';

      const markerDiv = document.createElement('div');
      markerDiv.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${stat.count >= 10 ? '14px' : '12px'};
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transition: transform 0.2s;
      `;
      markerDiv.textContent = stat.count;

      const labelDiv = document.createElement('div');
      labelDiv.style.cssText = `
        position: absolute;
        top: ${size + 5}px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: bold;
        white-space: nowrap;
        display: none;
      `;
      labelDiv.textContent = stat.building;

      content.appendChild(markerDiv);
      content.appendChild(labelDiv);

      // 호버 이벤트
      content.addEventListener('mouseenter', () => {
        markerDiv.style.transform = 'scale(1.2)';
        labelDiv.style.display = 'block';
      });

      content.addEventListener('mouseleave', () => {
        markerDiv.style.transform = 'scale(1)';
        labelDiv.style.display = 'none';
      });

      // 클릭 이벤트
      content.addEventListener('click', () => {
        if (onBuildingClick) {
          onBuildingClick(stat);
        }
      });

      // 커스텀 오버레이 생성
      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 0.5
      });

      customOverlay.setMap(mapInstance.current);
      return customOverlay;
    });

    markersRef.current = markers;

  }, [buildingStats, onBuildingClick]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '600px' }}>
      {/* 카카오 맵 컨테이너 */}
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

      {/* 데이터 없음 메시지 */}
      {buildingStats.length === 0 && (
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

      {/* 범례 */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: '12px',
          zIndex: 10
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>
          신고 유형
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#dc2626',
              border: '1px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
            <span>긴급 신고</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              border: '1px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
            <span>다수 신고 (4건 +)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              border: '1px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
            <span>일반 신고</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsMap;
