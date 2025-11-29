/**
 * weightAgent.js
 * 여행 취향(prefs)을 기반으로 POI 점수화를 위한 가중치를 생성하고 검증하는 모듈
 * 
 * 변경사항:
 * - 모든 가중치를 정규화하여 합이 1이 되도록 조정
 * - 상위 레벨 가중치(scoreWeights) 도입으로 각 요소의 기여도 명확화
 */

/**
 * 배열을 softmax로 정규화 (합이 1이 되도록)
 */
function softmax(values, temperature = 1.0) {
  const maxVal = Math.max(...values);
  const exps = values.map(v => Math.exp((v - maxVal) / temperature));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

/**
 * 단순 정규화 (합이 1이 되도록)
 */
function normalize(values) {
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum === 0) return values.map(() => 1 / values.length);
  return values.map(v => v / sum);
}

/**
 * 객체의 값들을 정규화
 */
function normalizeObject(obj) {
  const keys = Object.keys(obj);
  const values = keys.map(k => Math.abs(obj[k])); // 절대값으로 정규화
  const normalized = normalize(values);
  
  const result = {};
  keys.forEach((key, i) => {
    // 원래 부호 유지
    result[key] = obj[key] >= 0 ? normalized[i] : -normalized[i];
  });
  return result;
}

/**
 * 여행 취향을 기반으로 가중치 객체 생성
 * @param {Object} prefs - Gemini가 분석한 여행 취향 객체
 * @returns {Object} weights - POI 점수화에 사용할 가중치 객체
 */
export function generateWeights(prefs) {
  // ============================================
  // 1. 상위 레벨 가중치 (각 스코어 요소의 기여도)
  // ============================================
  // 이 값들의 합은 1.0
  const scoreWeights = {
    base: 0.15,        // 평점 기반 기본 점수
    distance: 0.20,    // 거리 페널티
    budget: 0.15,      // 예산 매칭
    theme: 0.25,       // 테마/태그 매칭 (가장 중요)
    category: 0.10,    // 카테고리 가중치
    diet: 0.10,        // 식단 선호도
    pace: 0.05,        // 페이스 보너스
  };

  // ============================================
  // 2. 예산 수준에 따른 세부 가중치
  // ============================================
  const budgetLevel = prefs?.budgetLevel || "mid";
  let budgetRaw = { priceWeight: 0, luxuryBonus: 0, valueBonus: 0 };

  if (budgetLevel === "low") {
    budgetRaw = { priceWeight: -0.4, luxuryBonus: -0.2, valueBonus: 0.4 };
  } else if (budgetLevel === "mid") {
    budgetRaw = { priceWeight: -0.1, luxuryBonus: 0.1, valueBonus: 0.2 };
  } else if (budgetLevel === "high") {
    budgetRaw = { priceWeight: 0.1, luxuryBonus: 0.5, valueBonus: 0.0 };
  }

  // 예산 가중치 정규화 (부호 유지, 절대값 합 = 1)
  const budgetSum = Math.abs(budgetRaw.priceWeight) + Math.abs(budgetRaw.luxuryBonus) + Math.abs(budgetRaw.valueBonus);
  const budget = budgetSum > 0 ? {
    priceWeight: budgetRaw.priceWeight / budgetSum,
    luxuryBonus: budgetRaw.luxuryBonus / budgetSum,
    valueBonus: budgetRaw.valueBonus / budgetSum,
  } : { priceWeight: -0.33, luxuryBonus: 0.33, valueBonus: 0.34 };

  // ============================================
  // 3. 페이스에 따른 세부 가중치
  // ============================================
  const pace = prefs?.pace || "normal";
  let paceRaw = { distanceWeight: 0, timeWeight: 0, relaxationBonus: 0 };
  let stayTimeMultiplier = 1.0;

  if (pace === "relaxed") {
    paceRaw = { distanceWeight: -0.3, timeWeight: -0.2, relaxationBonus: 0.5 };
    stayTimeMultiplier = 1.3;
  } else if (pace === "normal") {
    paceRaw = { distanceWeight: -0.15, timeWeight: -0.1, relaxationBonus: 0.2 };
    stayTimeMultiplier = 1.0;
  } else if (pace === "tight") {
    paceRaw = { distanceWeight: -0.4, timeWeight: -0.3, relaxationBonus: 0.0 };
    stayTimeMultiplier = 0.7;
  }

  // 페이스 가중치 정규화
  const paceSum = Math.abs(paceRaw.distanceWeight) + Math.abs(paceRaw.timeWeight) + Math.abs(paceRaw.relaxationBonus);
  const paceWeights = paceSum > 0 ? {
    distanceWeight: paceRaw.distanceWeight / paceSum,
    timeWeight: paceRaw.timeWeight / paceSum,
    relaxationBonus: paceRaw.relaxationBonus / paceSum,
    stayTimeMultiplier,
  } : { distanceWeight: -0.4, timeWeight: -0.3, relaxationBonus: 0.3, stayTimeMultiplier };

  // ============================================
  // 4. 테마/태그 매칭 가중치
  // ============================================
  const hasThemes = (prefs?.themes || []).length > 0;
  const hasTags = (prefs?.poiTags || []).length > 0;
  const hasAvoid = (prefs?.mustAvoid || []).length > 0;

  // 테마 매칭이 있으면 더 높은 보너스
  const themeRaw = {
    themeMatchBonus: hasThemes ? 0.5 : 0.2,
    tagMatchBonus: hasTags ? 0.4 : 0.15,
    avoidPenalty: hasAvoid ? -0.3 : -0.1,
  };

  // 정규화 (부호 유지)
  const themeSum = Math.abs(themeRaw.themeMatchBonus) + Math.abs(themeRaw.tagMatchBonus) + Math.abs(themeRaw.avoidPenalty);
  const theme = {
    themeMatchBonus: themeRaw.themeMatchBonus / themeSum,
    tagMatchBonus: themeRaw.tagMatchBonus / themeSum,
    avoidPenalty: themeRaw.avoidPenalty / themeSum,
  };

  // ============================================
  // 5. 카테고리별 가중치 (합 = 1)
  // ============================================
  const foodQueryCount = (prefs?.foodSearchQueries || []).length;
  const poiQueryCount = (prefs?.poiSearchQueries || []).length + (prefs?.searchKeywords || []).length;
  const totalQueries = foodQueryCount + poiQueryCount;

  let categoryRaw;
  if (totalQueries > 0) {
    const foodRatio = foodQueryCount / totalQueries;
    const poiRatio = poiQueryCount / totalQueries;
    categoryRaw = {
      poiWeight: 0.4 + (poiRatio * 0.3),
      restaurantWeight: 0.3 + (foodRatio * 0.2),
      cafeWeight: 0.3 + (foodRatio * 0.15),
    };
  } else {
    categoryRaw = { poiWeight: 0.4, restaurantWeight: 0.3, cafeWeight: 0.3 };
  }

  // 카테고리 가중치 정규화 (합 = 1)
  const category = normalizeObject(categoryRaw);

  // ============================================
  // 6. 식단 선호도 가중치
  // ============================================
  const hasDietPrefs = (prefs?.dietPreferences || []).length > 0;
  const diet = {
    dietMatchBonus: hasDietPrefs ? 1.0 : 0.0, // 있으면 1, 없으면 0
  };

  // ============================================
  // 최종 가중치 객체 구성
  // ============================================
  const weights = {
    // 상위 레벨 가중치 (각 스코어 요소의 기여도, 합 = 1)
    scoreWeights,
    
    // 세부 가중치들 (각 그룹 내에서 정규화됨)
    budget,
    pace: paceWeights,
    theme,
    category,
    diet,

    // 메타데이터
    _meta: {
      generatedAt: new Date().toISOString(),
      budgetLevel,
      pace,
      themesCount: (prefs?.themes || []).length,
      tagsCount: (prefs?.poiTags || []).length,
      avoidCount: (prefs?.mustAvoid || []).length,
      dietPrefsCount: (prefs?.dietPreferences || []).length,
      normalized: true,
    },
  };

  return weights;
}

/**
 * 가중치 객체의 유효성 검증
 * @param {Object} weights - 검증할 가중치 객체
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateWeights(weights) {
  const errors = [];

  if (!weights || typeof weights !== 'object') {
    return { valid: false, errors: ['Weights object is missing or invalid'] };
  }

  // 1. 필수 최상위 필드 확인
  const requiredFields = ['scoreWeights', 'budget', 'pace', 'theme', 'category', 'diet'];

  for (const field of requiredFields) {
    if (!weights[field] || typeof weights[field] !== 'object') {
      errors.push(`Missing or invalid field: ${field}`);
    }
  }

  // 2. scoreWeights 합이 1인지 확인
  if (weights.scoreWeights) {
    const sum = Object.values(weights.scoreWeights).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      errors.push(`scoreWeights sum is ${sum.toFixed(3)}, expected 1.0`);
    }
  }

  // 3. category 가중치 합이 1인지 확인
  if (weights.category) {
    const sum = Object.values(weights.category).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      errors.push(`category weights sum is ${sum.toFixed(3)}, expected 1.0`);
    }
  }

  // 4. 개별 가중치 범위 검증 (-1 ~ 1)
  const checkRange = (obj, prefix) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'number' && (value < -1.5 || value > 1.5)) {
        errors.push(`${prefix}.${key} = ${value} is outside range [-1.5, 1.5]`);
      }
    }
  };

  if (weights.budget) checkRange(weights.budget, 'budget');
  if (weights.pace) checkRange(weights.pace, 'pace');
  if (weights.theme) checkRange(weights.theme, 'theme');
  if (weights.category) checkRange(weights.category, 'category');

  return {
    valid: errors.length === 0,
    errors,
  };
}
