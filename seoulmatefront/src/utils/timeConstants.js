/**
 * timeConstants.js
 * 시간 관련 상수 및 유틸리티 함수
 * (SeoulMate_Cursor_Prompts.md Step A-1 기준)
 */

// 1. 끼니 시간대 기본값
export const MEAL_WINDOWS = {
  breakfast: {
    start: "07:30",
    end: "09:30",
    duration: 60, // 분
  },
  lunch: {
    start: "11:30",
    end: "13:30",
    duration: 60,
  },
  dinner: {
    start: "17:30",
    end: "19:30",
    duration: 60,
  },
  cafe: {
    start: "14:00",
    end: "16:00",
    duration: 40,
  },
};

// 2. 카테고리별 기본 체류시간 (분)
export const STAY_TIME_BY_CATEGORY = {
  // 관광지
  "궁궐": 90,
  "박물관": 90,
  "미술관": 75,
  "전통체험": 60,
  "테마파크": 180,

  // 자연
  "공원": 60,
  "산책로": 45,
  "전망대": 30,
  "야경 스팟": 40,

  // 문화
  "K-pop 체험": 60,
  "공연": 120, // 별도 처리 필요

  // 쇼핑
  "쇼핑몰": 90,
  "시장": 60,
  "편집샵": 30,

  // 음식
  "식당": 60,
  "카페": 40,
  "디저트": 30,

  // 기타
  "포토존": 30,
  "전시": 60,

  // 기본값
  "default": 60,
};

// 3. 페이스별 체류시간 배수
export const PACE_MULTIPLIER = {
  relaxed: 1.3, // 여유롭게
  normal: 1.0, // 보통
  tight: 0.7, // 알차게
};

// 4. 10분 단위 반올림 함수
export function roundToTen(minutes) {
  return Math.round(minutes / 10) * 10;
}

// 5. 체류시간 계산 함수
export function calculateStayTime(category, pace = "normal") {
  const baseTime =
    STAY_TIME_BY_CATEGORY[category] || STAY_TIME_BY_CATEGORY["default"];
  const multiplier = PACE_MULTIPLIER[pace] || PACE_MULTIPLIER["normal"];
  const multiplied = baseTime * multiplier;

  return roundToTen(multiplied);
}

// 6. 시간 문자열("HH:MM")을 분 단위로 변환
export function toMinutes(timeString) {
  if (!timeString || typeof timeString !== "string") return 0;
  const parts = timeString.split(":");
  if (parts.length !== 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

// 7. 분 단위를 시간 문자열("HH:MM")로 변환
export function toTimeString(minutes) {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

