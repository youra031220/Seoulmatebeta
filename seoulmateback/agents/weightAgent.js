/**
 * weightAgent.js
 * 여행 취향(prefs)을 기반으로 POI 점수화를 위한 가중치를 생성하고 검증하는 모듈
 */

/**
 * 여행 취향을 기반으로 가중치 객체 생성
 * @param {Object} prefs - Gemini가 분석한 여행 취향 객체
 * @returns {Object} weights - POI 점수화에 사용할 가중치 객체
 */
export function generateWeights(prefs) {
  // 기본 가중치 구조
  const weights = {
    // 예산 수준에 따른 가중치
    budget: {
      priceWeight: 0,
      luxuryBonus: 0,
      valueBonus: 0,
    },
    // 페이스에 따른 가중치
    pace: {
      distanceWeight: 0,
      timeWeight: 0,
      relaxationBonus: 0,
      stayTimeMultiplier: 1.0,
    },
    // 테마/태그 매칭 가중치
    theme: {
      themeMatchBonus: 0,
      tagMatchBonus: 0,
      avoidPenalty: 0,
    },
    // 카테고리별 가중치
    category: {
      poiWeight: 0,
      restaurantWeight: 0,
      cafeWeight: 0,
    },
    // 식이 선호도 가중치
    diet: {
      dietMatchBonus: 0,
    },
  };

  // 1. 예산 수준에 따른 가중치 설정
  const budgetLevel = prefs?.budgetLevel || "mid";

  if (budgetLevel === "low") {
    weights.budget.priceWeight = -0.3; // 가격이 낮을수록 점수 증가
    weights.budget.valueBonus = 0.4; // 가성비 높은 장소 보너스
    weights.budget.luxuryBonus = -0.2; // 고급 장소 페널티
  } else if (budgetLevel === "mid") {
    weights.budget.priceWeight = -0.1;
    weights.budget.valueBonus = 0.2;
    weights.budget.luxuryBonus = 0.1;
  } else if (budgetLevel === "high") {
    weights.budget.priceWeight = 0.1; // 가격이 높을수록 점수 증가
    weights.budget.valueBonus = 0;
    weights.budget.luxuryBonus = 0.5; // 고급 장소 큰 보너스
  }

  // 2. 페이스에 따른 가중치 설정
  const pace = prefs?.pace || "normal";

  if (pace === "relaxed") {
    weights.pace.distanceWeight = -0.3; // 거리가 멀면 페널티
    weights.pace.timeWeight = -0.2; // 시간이 오래 걸리면 페널티
    weights.pace.relaxationBonus = 0.5; // 여유로운 장소 보너스
    weights.pace.stayTimeMultiplier = 1.3; // 체류시간 30% 증가
  } else if (pace === "normal") {
    weights.pace.distanceWeight = -0.15;
    weights.pace.timeWeight = -0.1;
    weights.pace.relaxationBonus = 0.2;
    weights.pace.stayTimeMultiplier = 1.0; // 기본 체류시간
  } else if (pace === "tight") {
    weights.pace.distanceWeight = -0.4; // 빡빡한 일정에선 거리가 중요
    weights.pace.timeWeight = -0.3;
    weights.pace.relaxationBonus = 0;
    weights.pace.stayTimeMultiplier = 0.7; // 체류시간 30% 감소
  }

  // 3. 테마/태그 매칭 가중치 설정
  const hasThemes = (prefs?.themes || []).length > 0;
  const hasTags = (prefs?.poiTags || []).length > 0;
  const hasAvoid = (prefs?.mustAvoid || []).length > 0;

  weights.theme.themeMatchBonus = hasThemes ? 0.6 : 0.3;
  weights.theme.tagMatchBonus = hasTags ? 0.5 : 0.2;
  weights.theme.avoidPenalty = hasAvoid ? -1.0 : 0;

  // 4. 카테고리별 가중치 설정
  // 음식 쿼리가 많으면 음식점/카페 가중치 증가
  const foodQueryCount = (prefs?.foodSearchQueries || []).length;
  const poiQueryCount = (prefs?.poiSearchQueries || []).length + (prefs?.searchKeywords || []).length;

  const totalQueries = foodQueryCount + poiQueryCount;

  if (totalQueries > 0) {
    const foodRatio = foodQueryCount / totalQueries;
    const poiRatio = poiQueryCount / totalQueries;

    weights.category.restaurantWeight = 0.3 + (foodRatio * 0.4);
    weights.category.cafeWeight = 0.3 + (foodRatio * 0.3);
    weights.category.poiWeight = 0.4 + (poiRatio * 0.4);
  } else {
    // 기본값
    weights.category.poiWeight = 0.4;
    weights.category.restaurantWeight = 0.3;
    weights.category.cafeWeight = 0.3;
  }

  // 5. 식이 선호도 가중치
  const hasDietPrefs = (prefs?.dietPreferences || []).length > 0;
  weights.diet.dietMatchBonus = hasDietPrefs ? 0.7 : 0;

  // 메타데이터 추가
  weights._meta = {
    generatedAt: new Date().toISOString(),
    budgetLevel,
    pace,
    themesCount: (prefs?.themes || []).length,
    tagsCount: (prefs?.poiTags || []).length,
    avoidCount: (prefs?.mustAvoid || []).length,
    dietPrefsCount: (prefs?.dietPreferences || []).length,
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
  const requiredFields = ['budget', 'pace', 'theme', 'category', 'diet'];

  for (const field of requiredFields) {
    if (!weights[field] || typeof weights[field] !== 'object') {
      errors.push(`Missing or invalid field: ${field}`);
    }
  }

  // 2. budget 필드 검증
  if (weights.budget) {
    const budgetFields = ['priceWeight', 'luxuryBonus', 'valueBonus'];
    for (const field of budgetFields) {
      if (typeof weights.budget[field] !== 'number') {
        errors.push(`weights.budget.${field} must be a number`);
      }
    }
  }

  // 3. pace 필드 검증
  if (weights.pace) {
    const paceFields = ['distanceWeight', 'timeWeight', 'relaxationBonus', 'stayTimeMultiplier'];
    for (const field of paceFields) {
      if (typeof weights.pace[field] !== 'number') {
        errors.push(`weights.pace.${field} must be a number`);
      }
    }
  }

  // 4. theme 필드 검증
  if (weights.theme) {
    const themeFields = ['themeMatchBonus', 'tagMatchBonus', 'avoidPenalty'];
    for (const field of themeFields) {
      if (typeof weights.theme[field] !== 'number') {
        errors.push(`weights.theme.${field} must be a number`);
      }
    }
  }

  // 5. category 필드 검증
  if (weights.category) {
    const categoryFields = ['poiWeight', 'restaurantWeight', 'cafeWeight'];
    for (const field of categoryFields) {
      if (typeof weights.category[field] !== 'number') {
        errors.push(`weights.category.${field} must be a number`);
      }
      // 가중치는 0 이상이어야 함
      if (typeof weights.category[field] === 'number' && weights.category[field] < 0) {
        errors.push(`weights.category.${field} must be >= 0`);
      }
    }
  }

  // 6. diet 필드 검증
  if (weights.diet) {
    if (typeof weights.diet.dietMatchBonus !== 'number') {
      errors.push(`weights.diet.dietMatchBonus must be a number`);
    }
  }

  // 7. 범위 검증 (선택적, 하지만 합리적인 범위 체크)
  const allWeights = [
    ...Object.values(weights.budget || {}),
    ...Object.values(weights.pace || {}),
    ...Object.values(weights.theme || {}),
    ...Object.values(weights.category || {}),
    ...Object.values(weights.diet || {}),
  ].filter(w => typeof w === 'number');

  for (const w of allWeights) {
    if (w < -2 || w > 2) {
      errors.push(`Weight value ${w} is outside reasonable range [-2, 2]`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
