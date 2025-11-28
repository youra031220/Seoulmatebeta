// utils/biasDetector.js
// POI 검색 결과에 대한 편향 감지 로직

/**
 * Haversine 거리 계산 (km)
 */
function haversineDistanceKm(a, b) {
  if (!a || !b || !("lat" in a) || !("lng" in a)) return null;
  if (!("lat" in b) || !("lng" in b)) return null;

  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

/**
 * POI에서 사람이 이해하기 쉬운 카테고리(궁궐/카페/쇼핑 등)를 추출
 * - 네이버 category 문자열이 "여행,명소>궁궐" 형태인 것을 가정
 */
function extractCategory(poi) {
  const raw = poi.category || poi.categoryType || "";
  if (!raw) return "기타";
  const parts = String(raw).split(">");
  return parts[parts.length - 1].trim() || "기타";
}

/**
 * 검색 편향 감지
 * @param {Array} pois - scorePOIs 결과 (각 항목에 _score 포함)
 * @param {Array} requiredStops - 필수 방문지 목록 (이름/좌표 포함 가능)
 * @param {Array} userThemes - 사용자 테마 배열
 * @returns {{ isBiased: boolean, issues: string[], suggestions: string[] }}
 */
export function detectSearchBias(pois, requiredStops = [], userThemes = []) {
  const result = {
    isBiased: false,
    issues: [],
    suggestions: [],
  };

  if (!Array.isArray(pois) || pois.length === 0) {
    result.issues.push("검색된 장소가 거의 없습니다.");
    result.suggestions.push("다른 지역이나 테마로 다시 요청해 보셔도 좋아요.");
    result.isBiased = true;
    return result;
  }

  // 1) 카테고리 집중도: 한 카테고리가 40% 이상이면 편향
  const categoryCount = {};
  for (const poi of pois) {
    const cat = extractCategory(poi);
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  }

  const total = pois.length;
  Object.entries(categoryCount).forEach(([cat, count]) => {
    const ratio = count / total;
    if (ratio >= 0.4) {
      result.issues.push(
        `'${cat}' 카테고리가 전체 추천의 ${(ratio * 100).toFixed(0)}%를 차지하고 있어요.`
      );
    }
  });

  // 2) 지역 집중도: 필수 방문지 주변 3km 내에 60% 이상이면 편향
  const anchorStops = (requiredStops || []).filter(
    (r) => typeof r.lat === "number" && typeof r.lon === "number"
  );

  if (anchorStops.length > 0) {
    const anchors = anchorStops.map((r) => ({ lat: r.lat, lng: r.lon }));
    let nearCount = 0;

    for (const poi of pois) {
      const lat = poi.lat ?? (poi.mapy ? parseFloat(poi.mapy) : null);
      const lon = poi.lon ?? (poi.mapx ? parseFloat(poi.mapx) / 1e7 : null);
      if (lat == null || lon == null) continue;

      const p = { lat, lng: lon };
      const isNear = anchors.some((a) => {
        const d = haversineDistanceKm(a, p);
        return d != null && d <= 3;
      });

      if (isNear) nearCount++;
    }

    const nearRatio = nearCount / total;
    if (nearRatio >= 0.6) {
      result.issues.push(
        `추천이 필수 방문지 주변 3km 이내에 ${(nearRatio * 100).toFixed(
          0
        )}% 이상 몰려 있어요.`
      );
    }
  }

  // 3) 테마 매칭률: 사용자 테마와 매칭되는 POI가 30% 미만이면 부족
  if (Array.isArray(userThemes) && userThemes.length > 0) {
    const themeKeywords = {
      shopping: ["쇼핑", "백화점", "몰", "아울렛", "market", "시장"],
      culture: ["박물관", "미술관", "전시", "뮤지엄", "역사", "문화"],
      nature: ["공원", "자연", "산책", "한강", "숲", "호수"],
      cafe_tour: ["카페", "브런치", "디저트", "coffee"],
      night_photo: ["야경", "전망대", "루프탑", "야간", "night view"],
      healing: ["온천", "스파", "힐링", "마사지", "휴식"],
      kpop: ["K팝", "아이돌", "엔터테인먼트", "굿즈", "팬"],
      sns_hot: ["핫플", "인스타", "포토스팟", "포토 스팟", "SNS"],
    };

    const textOf = (p) =>
      `${p.title || ""} ${p.category || ""} ${p.description || ""}`.toLowerCase();

    let matchedCount = 0;
    for (const poi of pois) {
      const text = textOf(poi);
      const hasMatch = userThemes.some((th) => {
        const kws = themeKeywords[th] || [];
        return kws.some((k) => text.includes(String(k).toLowerCase()));
      });
      if (hasMatch) matchedCount++;
    }

    const themeRatio = matchedCount / total;
    if (themeRatio < 0.3) {
      result.issues.push(
        `사용자가 선택한 테마와 잘 맞는 장소가 전체의 ${(themeRatio * 100).toFixed(
          0
        )}% 정도로 조금 적어요.`
      );
    }
  }

  if (result.issues.length > 0) {
    result.isBiased = true;
    // 기본 제안 메시지
    result.suggestions.push(
      "원하시면 다른 지역이나 테마를 알려주시면, 더 다양한 장소를 찾아볼게요."
    );
    result.suggestions.push(
      "사람이 적은 곳 / 실내 위주 / 자연 위주처럼 더 구체적인 선호를 말해주셔도 좋아요."
    );
  }

  return result;
}


