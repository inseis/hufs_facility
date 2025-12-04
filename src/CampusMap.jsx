import React, { useEffect, useRef, useState } from 'react';

// 한국외국어대학교 글로벌캠퍼스 건물 좌표 (이미지 위치 기준 %)
const buildingCoordinates = {
  '백년관': { x: 35, y: 35 },
  '공학관': { x: 55, y: 32 },
  '도서관': { x: 68, y: 40 },
  '교양관': { x: 48, y: 50 },
  '인문경상관': { x: 28, y: 55 },
  '어문관': { x: 58, y: 60 },
  '기숙사': { x: 75, y: 28 },
  '주차장': { x: 20, y: 45 },
  '자연과학관': { x: 38, y: 28 },
  '후생관': { x: 52, y: 48 },
  '학생회관': { x: 62, y: 38 }
};

const CampusMap = ({ reports, onMarkerClick }) => {
  const mapContainer = useRef(null);
  const [markers, setMarkers] = useState([]);

  // 마커 업데이트
  useEffect(() => {
    const newMarkers = reports.map(report => {
      const coords = buildingCoordinates[report.building];
      if (!coords) return null;
      
      return {
        id: report.id,
        building: report.building,
        room: report.room,
        x: coords.x,
        y: coords.y,
        status: report.status,
        urgency: report.urgency,
        data: report
      };
    }).filter(Boolean);

    setMarkers(newMarkers);
  }, [reports]);

  const getMarkerColor = (status, urgency) => {
    if (status === 'completed') return '#10b981'; // 초록색
    if (status === 'processing') return '#f59e0b'; // 주황색
    if (urgency === 'urgent') return '#dc2626'; // 빨강색
    if (urgency === 'high') return '#ff6b6b'; // 연한 빨강색
    return '#3b82f6'; // 파랑색
  };

  return (
    <div
      ref={mapContainer}
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      className="border-2"
    >
      {/* 캠퍼스 지도 이미지 */}
      <img
        src="/hufsmap.png"
        alt="캠퍼스 맵"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block'
        }}
      />

      {/* 마커 오버레이 */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      >
        {markers.map(marker => (
          <g key={marker.id}>
            {/* 마커 배경 원 */}
            <circle
              cx={`${marker.x}%`}
              cy={`${marker.y}%`}
              r="20"
              fill={getMarkerColor(marker.status, marker.urgency)}
              opacity="0.9"
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              onClick={() => onMarkerClick(marker.data)}
            />
            {/* 마커 텍스트 */}
            <text
              x={`${marker.x}%`}
              y={`${marker.y}%`}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {markers.filter(m => m.building === marker.building).length}
            </text>
            {/* 마커 테두리 */}
            <circle
              cx={`${marker.x}%`}
              cy={`${marker.y}%`}
              r="20"
              fill="none"
              stroke="white"
              strokeWidth="2"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        ))}
      </svg>

      {/* 마커 정보 레이어 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      >
        {markers.map(marker => (
          <div
            key={marker.id}
            style={{
              position: 'absolute',
              left: `${marker.x}%`,
              top: `${marker.y}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => onMarkerClick(marker.data)}
            title={`${marker.building} ${marker.room}`}
          />
        ))}
      </div>

      {/* 로딩 메시지 */}
      {markers.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '14px'
          }}
        >
          신고 내역이 없습니다
        </div>
      )}
    </div>
  );
};

export default CampusMap;