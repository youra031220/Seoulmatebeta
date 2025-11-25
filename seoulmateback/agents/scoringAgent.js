// agents/scoringAgent.js
// POI(장소) 점수 계산 모듈

// ===================== 상수 & 헬퍼 =====================
const EARTH_RADIUS_KM = 6371;
const DEFAULT_RATING = 3.5;
const RATING_SCALE = 4; // 평점을 0~4 범위로 환산
const SCORE_BASELINE = 5;
const SCORE_MIN = 0;
const SCORE_MAX = 10;
const DISTANCE_PENALTY_MIN = -4;
const DISTANCE_PENALTY_MAX = 2;
const DEFAULT_PRICE_LEVEL = 2;
const PRICE_MIN_LEVEL = 1;
const PRICE_MAX_LEVEL = 3;

function normalizeNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9+.\-]/g, "").replace(",", ".");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampNumber(value, min, max, fallback = min) {
  if (!Number.isFinite(value)) return fallback;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Haversine 거리 계산 (km 단위)
 * point = { lat, lng }
 */
export function calculateDistance(point1, point2) {
  if (!point1 || !point2 || typeof point1 !== "object" || typeof point2 !== "object") {
    return null;
  }

  const lat1 = parseFloat(point1.lat);
  const lon1 = parseFloat(point1.lng);
  const lat2 = parseFloat(point2.lat);
  const lon2 = parseFloat(point2.lng);

  if (
    Number.isNaN(lat1) ||
    Number.isNaN(lon1) ||
    Number.isNaN(lat2) ||
    Number.isNaN(lon2)
  ) {
    return null;
  }

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * POI 텍스트 합치기
 */
function buildPoiText(poi) {
  if (!poi || typeof poi !== "object") return "";
  const title = poi.title || "";
  const category = poi.category || "";
  const description = poi.description || "";
  return `${title} ${category} ${description}`.toLowerCase();
}

/**
 * POI의 가격 수준 추정 (1: low, 2: mid, 3: high)
 * 정보가 없으면 2(mid)로 가정
 */
export function estimatePriceLevel(poi) {
  if (!poi || typeof poi !== "object") return DEFAULT_PRICE_LEVEL;

  try {
    const text = buildPoiText(poi);

    // 아주 대충 키워드 기반으로 추정
    if (/고급|프리미엄|파인 다이닝|호텔|스테이크|오마카세|코스요리/.test(text)) {
      return PRICE_MAX_LEVEL;
    }
    if (/뷔페|레스토랑|브런치|디저트|카페|바|펍/.test(text)) {
      return DEFAULT_PRICE_LEVEL;
    }
    if (/분식|포장마차|포차|노포|시장|포장/.test(text)) {
      return PRICE_MIN_LEVEL;
    }
  } catch (error) {
    console.warn("⚠️ estimatePriceLevel: 예기치 못한 입력", error);
  }

  // 정보가 거의 없으면 중간
  return DEFAULT_PRICE_LEVEL;
}

/**
 * 태그 매칭 (예: "야경", "인스타 감성" 등)
 */
export function checkTagMatch(poi, tag) {
  if (!poi || typeof poi !== "object" || !tag) return false;

  const target = buildPoiText(poi);
  const t = String(tag).toLowerCase();
  return target.includes(t);
}

/**
 * 회피 대상 매칭 (예: "비싼 레스토랑", "사람 많은 곳")
 * - 아주 러프하게 키워드 단위로만 체크
 */
export function checkAvoidMatch(poi, avoidItem, prefs) {
  if (!poi || typeof poi !== "object" || !avoidItem) return false;

  const target = buildPoiText(poi);
  const a = String(avoidItem).toLowerCase();

  // "비싼", "고급" 관련
  if (/비싼|비싸|고급|프리미엄/.test(a)) {
    if (/고급|프리미엄|파인 다이닝|호텔|오마카세|스테이크/.test(target)) {
      return true;
    }
  }

  // "사람 많은 곳", "복잡한 곳" 등
  if (/사람 많은|복잡한|붐비는/.test(a)) {
    if (/핫플|핫 플레이스|인기|대기|줄 서는/.test(target)) {
      return true;
    }
  }

  // 기본: 단순 포함 여부
  return target.includes(a);
}

/**
 * 개별 POI 스코어링
 * @param {Object} poi - 장소 객체
 * @param {Object} prefs - 여행 취향
 * @param {Object} weights - weightAgent가 만든 가중치
 * @param {Object} startPoint - { lat, lng } 시작점(예: 숙소/출발지)
 * @returns {Object} 점수 정보가 포함된 poi
 */
export function scorePOI(poi, prefs, weights, startPoint) {
  if (!poi || typeof poi !== "object") return poi;

  // 0. 안전장치
  weights = weights || {};
  prefs = prefs || {};
  // 예시) 정보 거의 없는 POI는 약 5점, 취향/가중치가 잘 맞으면 8~9점대까지 상승.

  const budgetW = weights.budget || {};
  const paceW = weights.pace || {};
  const themeW = weights.theme || {};
  const catW = weights.category || {};
  const dietW = weights.diet || {};

  // 1. 기본 점수: 평점 기반 (정보 없으면 DEFAULT_RATING 사용)
  const ratingRaw =
    poi.rating ?? poi.userRating ?? poi.user_score ?? poi.score ?? DEFAULT_RATING;
  const rating = normalizeNumber(ratingRaw, DEFAULT_RATING);
  let baseScore = (rating / 5) * RATING_SCALE; // 0~4

  // 2. 거리 페널티 (시작점 기준 직선거리)
  let distanceKm = null;
  let distanceScore = 0;

  let poiPoint = null;
  if (poi.lat && poi.lng) {
    poiPoint = { lat: poi.lat, lng: poi.lng };
  } else if (poi.mapy && poi.mapx) {
    poiPoint = { lat: poi.mapy, lng: poi.mapx };
  }

  if (startPoint && poiPoint) {
    distanceKm = calculateDistance(startPoint, poiPoint);
    if (distanceKm != null) {
      // pace.distanceWeight는 보통 음수
      const safeDistanceKm = normalizeNumber(distanceKm, 0);
      const distanceWeight = normalizeNumber(paceW.distanceWeight, 0);
      distanceScore = safeDistanceKm * distanceWeight;
      // 너무 과하게 깎이지 않도록 최소/최대 제한
      distanceScore = clampNumber(
        distanceScore,
        DISTANCE_PENALTY_MIN,
        DISTANCE_PENALTY_MAX,
        0
      );
    }
  }

  // 3. 예산 점수
  let budgetScore = 0;
  const budgetLevel = prefs.budgetLevel || "mid";
  const budgetMap = { low: 1, mid: 2, high: 3 };
  const userBudget = budgetMap[budgetLevel] || DEFAULT_PRICE_LEVEL;
  const poiPriceLevel = estimatePriceLevel(poi); // 1~3

  const diff = poiPriceLevel - userBudget;

  // 가격이 사용자의 선호보다 높으면 페널티, 낮으면 valueBonus
  if (diff > 0) {
    budgetScore += normalizeNumber(budgetW.priceWeight, 0) * diff; // 보통 음수
  } else if (diff < 0) {
    budgetScore += normalizeNumber(budgetW.valueBonus, 0) * Math.abs(diff);
  }

  // 고급 선호(high) + 고급 장소면 보너스
  if (budgetLevel === "high" && poiPriceLevel === 3) {
    budgetScore += normalizeNumber(budgetW.luxuryBonus, 0);
  }

  // 4. 테마/태그 매칭 점수
  let themeScore = 0;

  if (Array.isArray(prefs.themes)) {
    prefs.themes.forEach((theme) => {
      if (checkTagMatch(poi, theme)) {
        themeScore += normalizeNumber(themeW.themeMatchBonus, 0);
      }
    });
  }

  if (Array.isArray(prefs.poiTags)) {
    prefs.poiTags.forEach((tag) => {
      if (checkTagMatch(poi, tag)) {
        themeScore += normalizeNumber(themeW.tagMatchBonus, 0);
      }
    });
  }

  if (Array.isArray(prefs.mustAvoid)) {
    prefs.mustAvoid.forEach((avoidItem) => {
      if (checkAvoidMatch(poi, avoidItem, prefs)) {
        themeScore += normalizeNumber(themeW.avoidPenalty, 0); // 보통 음수
      }
    });
  }

  // 5. 카테고리 가중치
  let categoryScore = 0;
  const type = poi.categoryType || "poi";

  if (type === "restaurant") {
    categoryScore += normalizeNumber(catW.restaurantWeight, 0);
  } else if (type === "cafe") {
    categoryScore += normalizeNumber(catW.cafeWeight, 0);
  } else {
    // 일반 POI (관광지 등)
    categoryScore += normalizeNumber(catW.poiWeight, 0);
  }

  // 6. 식단 선호도 (채식, 비건, 할랄 등)
  let dietScore = 0;
  const dietPrefs = prefs.dietPreferences || [];
  if (Array.isArray(dietPrefs) && dietPrefs.length > 0) {
    const poiText = buildPoiText(poi);

    dietPrefs.forEach((d) => {
      const k = String(d).toLowerCase();
      // 아주 러프하게 키워드 매칭
      if (k.includes("vegan") || k === "vegan") {
        if (/비건|vegan/.test(poiText)) {
          dietScore += normalizeNumber(dietW.dietMatchBonus, 0);
        }
      } else if (k.includes("vegetarian")) {
        if (/채식|베지|vegetarian/.test(poiText)) {
          dietScore += normalizeNumber(dietW.dietMatchBonus, 0);
        }
      } else if (k.includes("halal")) {
        if (/할랄|halal/.test(poiText)) {
          dietScore += normalizeNumber(dietW.dietMatchBonus, 0);
        }
      } else {
        // 기타는 이름 포함 정도만
        if (poiText.includes(k)) {
          dietScore += normalizeNumber(dietW.dietMatchBonus, 0);
        }
      }
    });
  }

  // 7. 페이스가 relaxed일 때, 공원/산책/한적 같은 키워드 있으면 보너스
  let paceRelaxScore = 0;
  if ((prefs.pace || "normal") === "relaxed") {
    const poiText = buildPoiText(poi);
    if (/공원|산책|한적|조용|산책로|호숫가|강변|정원/.test(poiText)) {
      paceRelaxScore += normalizeNumber(paceW.relaxationBonus, 0);
    }
  }

  // 8. 전체 합산 후 0~10으로 정규화
  let totalScore =
    SCORE_BASELINE + // 기준점
    baseScore +
    distanceScore +
    budgetScore +
    themeScore +
    categoryScore +
    dietScore +
    paceRelaxScore;

  const safeTotalScore = clampNumber(totalScore, SCORE_MIN, SCORE_MAX, SCORE_MIN);

  return {
    ...poi,
    _score: safeTotalScore,
    _debugScore: {
      baseScore,
      distanceScore,
      budgetScore,
      themeScore,
      categoryScore,
      dietScore,
      paceRelaxScore,
      distanceKm,
    },
  };
}

/**
 * POI 리스트 스코어링 + 정렬
 */
export function scorePOIs(pois, prefs, weights, startPoint) {
  if (!Array.isArray(pois)) return [];

  const scored = pois.map((poi) =>
    scorePOI(poi, prefs || {}, weights || {}, startPoint)
  );

  // 점수 내림차순 정렬
  scored.sort((a, b) => {
    const scoreA = normalizeNumber(a._score, 0);
    const scoreB = normalizeNumber(b._score, 0);
    return scoreB - scoreA;
  });

  return scored;
}
