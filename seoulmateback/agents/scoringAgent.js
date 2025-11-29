// agents/scoringAgent.js
// POI(장소) 점수 계산 모듈 - 정규화된 가중치 버전

// ===================== 상수 & 헬퍼 =====================
const EARTH_RADIUS_KM = 6371;
const DEFAULT_RATING = 3.5;
const SCORE_MIN = 0;
const SCORE_MAX = 10;
const DEFAULT_PRICE_LEVEL = 2;

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * 좌표 정규화 - lng/lon 키 불일치 문제 해결
 */
function normalizeCoord(point) {
  if (!point || typeof point !== "object") return null;
  
  const lat = parseFloat(point.lat ?? point.mapy);
  const lng = parseFloat(point.lng ?? point.lon ?? point.mapx);
  
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  
  return { lat, lng };
}

/**
 * Haversine 거리 계산 (km 단위)
 */
export function calculateDistance(point1, point2) {
  const p1 = normalizeCoord(point1);
  const p2 = normalizeCoord(point2);
  
  if (!p1 || !p2) return null;

  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
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
  const title = poi.title || poi.name || "";
  const category = poi.category || "";
  const description = poi.description || "";
  return `${title} ${category} ${description}`.toLowerCase();
}

/**
 * POI의 가격 수준 추정 (1: low, 2: mid, 3: high)
 */
export function estimatePriceLevel(poi) {
  if (!poi || typeof poi !== "object") return DEFAULT_PRICE_LEVEL;

  const text = buildPoiText(poi);

  if (/고급|프리미엄|파인 다이닝|호텔|스테이크|오마카세|코스요리/.test(text)) {
    return 3;
  }
  if (/뷔페|레스토랑|브런치|디저트|카페|바|펍/.test(text)) {
    return 2;
  }
  if (/분식|포장마차|포차|노포|시장|포장/.test(text)) {
    return 1;
  }

  return DEFAULT_PRICE_LEVEL;
}

/**
 * 태그 매칭
 */
export function checkTagMatch(poi, tag) {
  if (!poi || typeof poi !== "object" || !tag) return false;
  const target = buildPoiText(poi);
  const t = String(tag).toLowerCase();
  return target.includes(t);
}

/**
 * 회피 대상 매칭
 */
export function checkAvoidMatch(poi, avoidItem) {
  if (!poi || typeof poi !== "object" || !avoidItem) return false;

  const target = buildPoiText(poi);
  const a = String(avoidItem).toLowerCase();

  if (/비싼|비싸|고급|프리미엄/.test(a)) {
    if (/고급|프리미엄|파인 다이닝|호텔|오마카세|스테이크/.test(target)) {
      return true;
    }
  }

  if (/사람 많은|복잡한|붐비는/.test(a)) {
    if (/핫플|핫 플레이스|인기|대기|줄 서는/.test(target)) {
      return true;
    }
  }

  return target.includes(a);
}

/**
 * 개별 POI 스코어링 (정규화된 가중치 사용)
 * 
 * @param {Object} poi - 장소 객체
 * @param {Object} prefs - 여행 취향
 * @param {Object} weights - 정규화된 가중치 (generateWeights 결과)
 * @param {Object} startPoint - 시작점 { lat, lng }
 * @param {Object} anchor - 앵커 장소 (옵션, refine API용)
 * @returns {Object} 점수 정보가 포함된 poi
 */
export function scorePOI(poi, prefs, weights, startPoint, anchor = null) {
  if (!poi || typeof poi !== "object") return poi;

  // 안전장치
  weights = weights || {};
  prefs = prefs || {};
  
  const scoreW = weights.scoreWeights || {
    base: 0.15, distance: 0.20, budget: 0.15,
    theme: 0.25, category: 0.10, diet: 0.10, pace: 0.05
  };
  const budgetW = weights.budget || {};
  const paceW = weights.pace || {};
  const themeW = weights.theme || {};
  const catW = weights.category || {};
  const dietW = weights.diet || {};

  // ============================================
  // 1. 기본 점수 (평점 기반, 0~1 정규화)
  // ============================================
  const ratingRaw = poi.rating ?? poi.userRating ?? poi.user_score ?? poi.score ?? DEFAULT_RATING;
  const rating = normalizeNumber(ratingRaw, DEFAULT_RATING);
  const baseScore = rating / 5; // 0~1

  // ============================================
  // 2. 거리 점수 (가까울수록 높음, 0~1)
  // ============================================
  let distanceScore = 0.5; // 기본값 (정보 없을 때)
  let distanceKm = null;
  
  const poiCoord = normalizeCoord(poi);
  const startCoord = normalizeCoord(startPoint);

  if (poiCoord && startCoord) {
    distanceKm = calculateDistance(startCoord, poiCoord);
    if (distanceKm != null) {
      // 5km 이내면 1.0, 20km 이상이면 0.0 (선형 감소)
      distanceScore = clamp(1 - (distanceKm / 20), 0, 1);
      
      // 테마 매칭 시 거리 페널티 50% 감소
      const hasThemeMatch = (prefs.themes || []).some(t => checkTagMatch(poi, t)) ||
                           (prefs.poiTags || []).some(t => checkTagMatch(poi, t));
      if (hasThemeMatch) {
        distanceScore = 0.5 + distanceScore * 0.5; // 최소 0.5 보장
      }
    }
  }

  // ============================================
  // 3. 예산 점수 (매칭도, 0~1)
  // ============================================
  const budgetLevel = prefs.budgetLevel || "mid";
  const budgetMap = { low: 1, mid: 2, high: 3 };
  const userBudget = budgetMap[budgetLevel] || 2;
  const poiPriceLevel = estimatePriceLevel(poi);
  
  let budgetScore = 0.5;
  const priceDiff = Math.abs(poiPriceLevel - userBudget);
  
  if (priceDiff === 0) {
    budgetScore = 1.0; // 완벽 매칭
  } else if (priceDiff === 1) {
    budgetScore = 0.6; // 근접
  } else {
    budgetScore = 0.2; // 불일치
  }

  // 가성비 보너스 (low budget + low price)
  if (budgetLevel === "low" && poiPriceLevel === 1) {
    budgetScore = Math.min(1.0, budgetScore + normalizeNumber(budgetW.valueBonus, 0) * 0.3);
  }
  // 럭셔리 보너스 (high budget + high price)
  if (budgetLevel === "high" && poiPriceLevel === 3) {
    budgetScore = Math.min(1.0, budgetScore + normalizeNumber(budgetW.luxuryBonus, 0) * 0.3);
  }

  // ============================================
  // 4. 테마/태그 점수 (매칭 수 기반, 0~1)
  // ============================================
  let themeScore = 0;
  let themeMatches = 0;
  let tagMatches = 0;
  let avoidMatches = 0;

  if (Array.isArray(prefs.themes)) {
    prefs.themes.forEach(theme => {
      if (checkTagMatch(poi, theme)) themeMatches++;
    });
  }

  if (Array.isArray(prefs.poiTags)) {
    prefs.poiTags.forEach(tag => {
      if (checkTagMatch(poi, tag)) tagMatches++;
    });
  }

  if (Array.isArray(prefs.mustAvoid)) {
    prefs.mustAvoid.forEach(avoid => {
      if (checkAvoidMatch(poi, avoid)) avoidMatches++;
    });
  }

  // 테마 점수 계산 (0~1)
  const totalPossibleMatches = (prefs.themes?.length || 0) + (prefs.poiTags?.length || 0);
  if (totalPossibleMatches > 0) {
    const positiveMatches = themeMatches + tagMatches;
    themeScore = positiveMatches / totalPossibleMatches;
  }
  
  // 회피 대상이면 페널티
  if (avoidMatches > 0) {
    themeScore = Math.max(0, themeScore - 0.5);
  }

  // ============================================
  // 5. 카테고리 점수 (0~1)
  // ============================================
  const categoryType = poi.categoryType || "poi";
  let categoryScore = 0.5;

  if (categoryType === "restaurant") {
    categoryScore = normalizeNumber(catW.restaurantWeight, 0.33);
  } else if (categoryType === "cafe") {
    categoryScore = normalizeNumber(catW.cafeWeight, 0.33);
  } else {
    categoryScore = normalizeNumber(catW.poiWeight, 0.34);
  }

  // ============================================
  // 6. 식단 점수 (0~1)
  // ============================================
  let dietScore = 0.5; // 기본값
  const dietPrefs = prefs.dietPreferences || [];
  
  if (dietPrefs.length > 0) {
    const poiText = buildPoiText(poi);
    let dietMatches = 0;

    dietPrefs.forEach(d => {
      const k = String(d).toLowerCase();
      if ((k.includes("vegan") || k === "vegan") && /비건|vegan/.test(poiText)) {
        dietMatches++;
      } else if (k.includes("vegetarian") && /채식|베지|vegetarian/.test(poiText)) {
        dietMatches++;
      } else if (k.includes("halal") && /할랄|halal/.test(poiText)) {
        dietMatches++;
      } else if (poiText.includes(k)) {
        dietMatches++;
      }
    });

    dietScore = dietMatches > 0 ? 1.0 : 0.2;
  }

  // ============================================
  // 7. 페이스 점수 (relaxed 선호 장소 매칭, 0~1)
  // ============================================
  let paceScore = 0.5;
  
  if ((prefs.pace || "normal") === "relaxed") {
    const poiText = buildPoiText(poi);
    if (/공원|산책|한적|조용|산책로|호숫가|강변|정원/.test(poiText)) {
      paceScore = 1.0;
    }
  }

  // ============================================
  // 8. 앵커 기반 유사도 보너스 (refine API용)
  // ============================================
  let anchorBonus = 0;
  if (anchor && anchor.lat && anchor.lon && poiCoord) {
    const anchorCoord = normalizeCoord(anchor);
    const anchorDist = calculateDistance(anchorCoord, poiCoord);
    
    if (anchorDist != null && anchorDist <= 5) {
      anchorBonus += (5 - anchorDist) / 5 * 0.1; // 최대 0.1
    }
    
    const poiCategory = poi.categoryType || poi.category || "";
    const anchorCategory = anchor.category || anchor.categoryType || "";
    if (poiCategory === anchorCategory) {
      anchorBonus += 0.05;
    }
  }

  // ============================================
  // 9. 최종 점수 계산 (가중 평균, 0~10)
  // ============================================
  const weightedScore = 
    scoreW.base * baseScore +
    scoreW.distance * distanceScore +
    scoreW.budget * budgetScore +
    scoreW.theme * themeScore +
    scoreW.category * categoryScore +
    scoreW.diet * dietScore +
    scoreW.pace * paceScore +
    anchorBonus;

  // 0~1을 0~10으로 변환
  const finalScore = clamp(weightedScore * 10, SCORE_MIN, SCORE_MAX);

  return {
    ...poi,
    _score: finalScore,
    _debugScore: {
      baseScore: (baseScore * 10).toFixed(2),
      distanceScore: (distanceScore * 10).toFixed(2),
      budgetScore: (budgetScore * 10).toFixed(2),
      themeScore: (themeScore * 10).toFixed(2),
      categoryScore: (categoryScore * 10).toFixed(2),
      dietScore: (dietScore * 10).toFixed(2),
      paceScore: (paceScore * 10).toFixed(2),
      anchorBonus: (anchorBonus * 10).toFixed(2),
      distanceKm: distanceKm?.toFixed(2) || null,
      themeMatches,
      tagMatches,
      avoidMatches,
    },
  };
}

/**
 * POI 리스트 스코어링 + 정렬
 */
export function scorePOIs(pois, prefs, weights, startPoint, anchor = null) {
  if (!Array.isArray(pois)) return [];

  const scored = pois.map(poi =>
    scorePOI(poi, prefs || {}, weights || {}, startPoint, anchor)
  );

  // 점수 내림차순 정렬
  scored.sort((a, b) => {
    const scoreA = normalizeNumber(a._score, 0);
    const scoreB = normalizeNumber(b._score, 0);
    return scoreB - scoreA;
  });

  return scored;
}

/**
 * POI를 카테고리별로 분류
 */
export function categorizePOIs(pois) {
  const result = {
    attractions: [],  // 관광지
    restaurants: [],  // 식당
    cafes: [],        // 카페
  };

  for (const poi of pois) {
    const type = poi.categoryType || "poi";
    
    if (type === "restaurant") {
      result.restaurants.push(poi);
    } else if (type === "cafe") {
      result.cafes.push(poi);
    } else {
      result.attractions.push(poi);
    }
  }

  return result;
}
