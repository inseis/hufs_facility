import React, { useEffect, useRef, useState } from 'react';

// 한국외국어대학교 글로벌캠퍼스 건물 좌표
const buildingCoordinates = {
  '백년관': { lat: 37.3392, lng: 127.2665 },
  '공학관': { lat: 37.3385, lng: 127.2680 },
  '도서관': { lat: 37.3380, lng: 127.2660 },
  '교양관': { lat: 37.3375, lng: 127.2675 },
  '인문경상관': { lat: 37.3368, lng: 127.2668 },
  '어문관': { lat: 37.3360, lng: 127.2655 },
  '기숙사': { lat: 37.3405, lng: 127.2695 },
  '주차장': { lat: 37.3398, lng: 127.2650 },
  '자연과학관': { lat: 37.3390, lng: 127.2690 },
  '후생관': { lat: 37.3372, lng: 127.2650 },
  '학생회관': { lat: 37.3382, lng: 127.2652 }
};

const CampusMap = ({ reports, onMarkerClick }) => {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

  // 1. 지도 초기화 (한 번만 실행)
  useEffect(() => {
    const initMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        console.warn('카카오 맵 API가 아직 로드되지 않았습니다. 다시 시도합니다...');
        // API가 로드될 때까지 계속 시도
        setTimeout(initMap, 500);
        return;
      }
      
      if (mapContainer.current && !map) {
        try {
          const kakao = window.kakao;
          const container = mapContainer.current;
          const options = {
            center: new kakao.maps.LatLng(37.3385, 127.2670), // 지도의 중심좌표 (글로벌캠퍼스 중심)
            level: 4 // 지도의 확대 레벨
          };
          const mapInstance = new kakao.maps.Map(container, options);
          setMap(mapInstance);
          console.log('✅ 카카오 맵이 정상적으로 로드되었습니다.');
        } catch (error) {
          console.error('❌ 지도 초기화 오류:', error);
        }
      }
    };

    initMap();
  }, []);
  
  // 2. 신고 데이터가 변경될 때마다 마커 업데이트
  useEffect(() => {
    if (!map) return;
    const kakao = window.kakao;
    
    // 기존 마커 제거
    markers.forEach(marker => marker.setMap(null));
    
    // 새 마커 생성
    const newMarkers = reports.map(report => {
      const coords = buildingCoordinates[report.building];
      if (!coords) return null;
      
      const position = new kakao.maps.LatLng(coords.lat, coords.lng);
      
      const marker = new kakao.maps.Marker({
        position: position,
        title: `${report.building} ${report.room}`
      });
      
      marker.setMap(map);
      
      kakao.maps.event.addListener(marker, 'click', function() {
        onMarkerClick(report);
      });
      
      return marker;
    }).filter(Boolean); // null 값 제거
    
    setMarkers(newMarkers);
    
  }, [map, reports, onMarkerClick]);

  return (
    <div>
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '500px',
          minHeight: '500px',
          position: 'relative',
          backgroundColor: '#f0f0f0'
        }} 
        className="rounded-lg border-2"
      />
      {!map && (
        <div className="text-center py-8 text-gray-500">
          지도를 로딩중입니다... 카카오 맵 API 키를 확인하세요.
        </div>
      )}
    </div>
  );
};

export default CampusMap;