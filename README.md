# 🏫 HUFS Facility Report System

한국외국어대학교 시설물 고장 신고 시스템 (HUFS Facility Report System)  
학생과 관리자가 캠퍼스 내 시설물 고장 상황을 효율적으로 보고·관리할 수 있도록 만든 웹 애플리케이션입니다.

---

## 🚀 주요 기능

### 🧑‍🎓 학생용
- **시설물 신고**: 건물, 층, 호수, 상세 설명, 사진 업로드 가능  
- **긴급도 선택**: 긴급 / 높음 / 보통 / 낮음  
- **중복 신고 방지**: 동일 위치 1시간 이내 중복 등록 방지  
- **신고 내역 확인**: 처리 상태, 예정일, 완료일 확인  

### 🛠️ 관리자용
- **신고 목록 관리**: 상태 변경(접수됨 / 처리중 / 완료), 기한 수정  
- **검색 및 필터링**: 건물·층·호수·신고자 기준 검색  
- **통계 분석 대시보드**: 상태별/위치별 신고 건수, TOP 10 위치 시각화  

---

## 💻 기술 스택

| 구분 | 사용 기술 |
|------|------------|
| **Frontend** | React (Vite) |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **State Management** | React Hooks (`useState`, `useEffect`, `useMemo`) |
| **Storage** | LocalStorage (임시 데이터 저장) |
| **Build Tool** | Vite |
| **Version Control** | Git + GitHub |

