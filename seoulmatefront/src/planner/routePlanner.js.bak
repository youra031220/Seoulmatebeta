```javascript
/* ===================== 샘플 POI/기본 위치 ===================== */
/**
 * 실제 서비스에서는 네이버 검색 결과(basePOIs)를 사용하고,
 * ALL_POIS는 백업용 샘플 데이터로만 사용합니다.
 */
export const ALL_POIS = [
  {
    name: "Halal Restaurant",
    lat: 37.5349,
    lon: 126.9945,
    rating: 4.7,
    stay_time: 60,
    category: "restaurant",
    diet_tags: ["halal"],
  },
  {
    name: "Korean BBQ",
    lat: 37.564,
    lon: 126.975,
    rating: 4.6,
    stay_time: 50,
    category: "restaurant",
    diet_tags: [],
  },
  {
    name: "Insadong Cafe",
    lat: 37.5741,
    lon: 126.9849,
    rating: 4.4,
    stay_time: 40,
    category: "cafe",
    diet_tags: [],
  },
  {
    name: "Hongdae Coffee",
    lat: 37.5515,
    lon: 126.9241,
    rating: 4.3,
    stay_time: 35,
    category: "cafe",
    diet_tags: [],
  },
  {
    name: "Gyeongbok Palace",
    lat: 37.5796,
    lon: 126.977,
    rating: 4.9,
    stay_time: 90,
    category: "attraction",
    diet_tags: [],
  },
];

/* ===================== 공통 유틸 함수 ===================== */

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * 위도/경도로부터 두 지점 사이의 거리(km)를 계산 (하버사인)
 */
function distanceKm(a, b) {
  const R = 6371; // 지구 반지름(km)
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

/**
 * 이동 시간(분)을 근사 계산
 * - 기본: 도보/대중교통 혼합 기준 4km/h 정도로 가정
 *   → 1km ≒ 15분
 */
export function travelMinutes(lat1, lon1, lat2, lon2) {
  const dist = distanceKm({ lat: lat1, lon: lon1 }, { lat: lat2, lon: lon2 });
  const speedKmH = 4; // 평균 속도
  const hours = dist / speedKmH;
  return Math.round(hours * 60);
}

/**
 * "HH:MM" 문자열로 변환
 */
function toHM(totalMinutes) {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/* ===================== POI 선택 로직 ===================== */

/**
 * 사용자가 입력한 끼니/식단 제약 기반으로
 * 후보 POI 중에서 numPlaces개를 선택.
 *
 * ⚠️ basePOIs가 있으면 무조건 그걸 사용하고,
 *    없을 때만 샘플 ALL_POIS를 fallback으로 사용합니다.
 */
// numPlaces: 전체 방문 장소 수
// numPlaces: 전체 방문 장소 수
export function selectPOIs(
  numPlaces,
  breakfast,
  lunch,
  dinner,
  cafe,
  dietPrefs = [],
  themes = [],
  basePOIs = []
) {
  // 1) 끼니 → 식당 슬롯 / 카페 슬롯 분리
  const numMealSlots = [breakfast, lunch, dinner].filter(Boolean).length;
  const maxRestaurants = Math.max(0, numMealSlots);
  const maxCafes = cafe ? 1 : 0; // 카페는 기본적으로 1곳만

  // 2) POI 분리: 식당 / 카페 / 기타
  const restaurantPOIs = [];
  const cafePOIs = [];
  const otherPOIs = [];

  for (const p of basePOIs) {
    if (p.categoryType === "cafe") {
      cafePOIs.push(p);
    } else if (
      p.categoryType === "restaurant" ||
      (p.isFood && p.categoryType !== "cafe")
    ) {
      restaurantPOIs.push(p);
    } else {
      otherPOIs.push(p);
    }
  }

  const usedIds = new Set();
  const selectedRestaurants = [];
  const selectedCafes = [];

  const textOf = (p) =>
    (p.name || "") + " " + (p.address || "") + " " + (p.category || "");

  const containsAny = (str, keywords) =>
    keywords.some((kw) => str.toLowerCase().includes(kw.toLowerCase()));

  // 3) 식단 제약별 키워드
  const dietKeywordMap = {
    halal: ["할랄", "halal"],
    vegan: ["비건", "vegan"],
    vegetarian: ["베지테리언", "채식", "vegetarian"],
    kosher: ["코셔", "kosher"],
    gluten_free: ["글루텐프리", "글루텐 프리", "gluten free", "gluten-free"],
    non_alcohol: ["논알콜", "무알콜", "non-alcohol", "0% 알콜"],
  };

  // 3-1) 식단 제약 반영
  for (const diet of dietPrefs) {
    const keywords = dietKeywordMap[diet];
    if (!keywords) continue;

    if (diet === "gluten_free") {
      // 🔥 글루텐프리는 "카페"에만 적용, 최대 maxCafes 안에서만
      if (selectedCafes.length >= maxCafes) continue;

      const c = cafePOIs.find(
        (p) => !usedIds.has(p.id) && containsAny(textOf(p), keywords)
      );
      if (c) {
        selectedCafes.push(c);
        usedIds.add(c.id);
      }
    } else {
      // 나머지(vegan, halal 등)는 우선 식당, 그다음 카페
      let chosen = null;

      if (selectedRestaurants.length < maxRestaurants) {
        chosen = restaurantPOIs.find(
          (p) => !usedIds.has(p.id) && containsAny(textOf(p), keywords)
        );
        if (chosen) {
          selectedRestaurants.push(chosen);
          usedIds.add(chosen.id);
          continue;
        }
      }

      if (selectedCafes.length < maxCafes) {
        chosen = cafePOIs.find(
          (p) => !usedIds.has(p.id) && containsAny(textOf(p), keywords)
        );
        if (chosen) {
          selectedCafes.push(chosen);
          usedIds.add(chosen.id);
        }
      }
    }
  }

  // 3-2) 남은 식당 슬롯 채우기
  for (const p of restaurantPOIs) {
    if (selectedRestaurants.length >= maxRestaurants) break;
    if (usedIds.has(p.id)) continue;
    selectedRestaurants.push(p);
    usedIds.add(p.id);
  }

  // 3-3) 남은 카페 슬롯 채우기
  for (const p of cafePOIs) {
    if (selectedCafes.length >= maxCafes) break;
    if (usedIds.has(p.id)) continue;
    selectedCafes.push(p);
    usedIds.add(p.id);
  }

  let selectedFood = [...selectedRestaurants, ...selectedCafes];

  // food가 numPlaces보다 많으면 잘라내기
  if (selectedFood.length > numPlaces) {
    selectedFood = selectedFood.slice(0, numPlaces);
  }

  // 4) 나머지 슬롯은 관광지(otherPOIs)로 채움
  let remainingSlots = Math.max(0, numPlaces - selectedFood.length);
  const selectedPOIs = [];

  const themeKeywordMap = {
    shopping: ["쇼핑", "백화점", "몰", "market", "아울렛", "편집샵"],
    culture: ["박물관", "미술관", "전시", "뮤지엄", "역사", "문화"],
    nature: ["공원", "자연", "산책", "한강", "숲"],
    cafe_tour: ["카페", "브런치", "디저트"],
    night_photo: ["야경", "전망대", "루프탑", "야간"],
    healing: ["온천", "스파", "힐링", "휴식"],
    kpop: ["K팝", "아이돌", "엔터테인먼트", "굿즈"],
    sns_hot: ["핫플", "인스타", "포토스팟", "포토 스팟"],
  };

  // 4-1) 테마별로 1개씩 우선 배정
  for (const th of themes) {
    if (selectedPOIs.length >= remainingSlots) break;
    const keywords = themeKeywordMap[th] || [];

    const candidate = otherPOIs.find(
      (p) =>
        !usedIds.has(p.id) &&
        (keywords.length === 0 || containsAny(textOf(p), keywords))
    );

    if (candidate) {
      selectedPOIs.push(candidate);
      usedIds.add(candidate.id);
    }
  }

  // 4-2) 아직 남으면 any POI 채우기
  for (const p of otherPOIs) {
    if (selectedPOIs.length >= remainingSlots) break;
    if (usedIds.has(p.id)) continue;
    selectedPOIs.push(p);
    usedIds.add(p.id);
  }

  const finalList = [...selectedFood, ...selectedPOIs].slice(0, numPlaces);

  return {
    pois: finalList,
  };
}




/* ===================== 경로 최적화 ===================== */

/**
 * 간단한 그리디 알고리즘으로
 * - 출발지(startPoint) → 필수 방문지(requiredStops) → 선택 POI(pois) → 도착지(endPoint)
 * 순서를 정하고, 각 구간 이동시간과 체류시간을 계산합니다.
 *
 * - maxLegMin: 한 구간 최대 이동시간(분)
 * - startMin, endMin: 일정 시작/종료 시각 (분 단위, 0~1440)
 */
export function optimizeRoute(
  pois,
  start,
  end,
  startMin,
  endMin,
  maxLegMin,
  requiredStops = []
) {
  if (!start?.lat || !end?.lat) {
    throw new Error("start / end 좌표가 없습니다.");
  }

  // 1) 시작/끝 노드
  const startNode = { lat: start.lat, lon: start.lon };
  const endNode = { lat: end.lat, lon: end.lon };

  // 2) 필수 방문지 → POI 형태로 변환 + isRequired 플래그
  const requiredAsPOIs = (requiredStops || [])
    .filter((r) => r.lat && r.lon)
    .map((r) => ({
      name: r.name || "필수 방문지",
      lat: r.lat,
      lon: r.lon,
      stay_time: r.stay_time ?? 30,
      category: r.category || "required",
      rating: r.rating ?? "-",
      isRequired: true,
    }));

  // 3) 선택 POI (이미 selectPOIs에서 numPlaces만큼 뽑힌 상태라고 가정)
  const optional = (pois || []).map((p) => ({
    name: p.name,
    lat: p.lat,
    lon: p.lon,
    stay_time: p.stay_time ?? 60,
    category: p.category || "spot",
    rating: p.rating ?? "-",
    isRequired: false,
  }));

  // 4) start + (필수 + 선택) + end 순서로 routeArray 구성
  const nodes = [];

  // index 0: start
  nodes.push({
    type: "start",
    lat: startNode.lat,
    lon: startNode.lon,
    poi: null,
  });

  // 1..k: 필수 + 선택
  requiredAsPOIs.forEach((p) =>
    nodes.push({
      type: "poi",
      lat: p.lat,
      lon: p.lon,
      poi: p,
    })
  );
  optional.forEach((p) =>
    nodes.push({
      type: "poi",
      lat: p.lat,
      lon: p.lon,
      poi: p,
    })
  );

  // 마지막: end
  nodes.push({
    type: "end",
    lat: endNode.lat,
    lon: endNode.lon,
    poi: null,
  });

  // routeArray는 [type, node] 구조 유지
  const routeArray = nodes.map((node) => [node.type, node]);
  const n = routeArray.length;

  // 5) 가장 단순한 Greedy Nearest-Neighbor:
  //    - 항상 아직 안 간 곳 중에서 "거리(이동시간)가 가장 짧은 곳" 선택
  //    - 어떤 노드도 time/maxLeg 때문에 버리지 않음 → 무조건 전부 포함
  const route = [0]; // 시작 인덱스
  const waits = {};
  const stays = {};

  let currentIdx = 0;
  let now = startMin;

  const remaining = new Set();
  for (let i = 1; i < n - 1; i++) {
    remaining.add(i); // 1..n-2: 모든 POI (필수+선택)
  }

  // 시작점은 대기/체류 0
  waits[0] = 0;
  stays[0] = 0;

  while (remaining.size) {
    const [_, curNode] = routeArray[currentIdx];

    let bestIdx = null;
    let bestLeg = Infinity;

    for (const idx of remaining) {
      const [__, cand] = routeArray[idx];
      const leg = travelMinutes(curNode.lat, curNode.lon, cand.lat, cand.lon);
      if (leg < bestLeg && now + leg + (cand?.poi?.stay_time ?? 30) <= endMin && leg <= maxLegMin) {
        bestLeg = leg;
        bestIdx = idx;
      }
    }

    if (bestIdx == null) break;

    const [__, nextNode] = routeArray[bestIdx];
    const poi = nextNode.poi || {};
    const stay = Math.max(10, Math.round(poi.stay_time ?? 30));

    waits[bestIdx] = bestLeg;
    stays[bestIdx] = stay;

    now += bestLeg + stay;
    route.push(bestIdx);
    remaining.delete(bestIdx);
    currentIdx = bestIdx;
  }

  // 6) 마지막으로 도착지까지 이동
  if (currentIdx !== n - 1) {
      const [__, lastNode] = routeArray[currentIdx];
      const [___, endNode2] = routeArray[n - 1];
      const legToEnd = travelMinutes(
        lastNode.lat,
        lastNode.lon,
        endNode2.lat,
        endNode2.lon
      );

      if (now + legToEnd <= endMin && legToEnd <= maxLegMin) {
        waits[n - 1] = legToEnd;
        stays[n - 1] = 0;
        route.push(n - 1);
      } else {
        //console.log("End point skipped due to time constraints.");
      }
  }

  // Sort the route based on waits (travel time)
  const sortedRoute = [...route];
  sortedRoute.sort((a, b) => (waits[a] || 0) - (waits[b] || 0));
  
  return { routeArray, route: sortedRoute, waits, stays };
}


/* ===================== 일정 생성 (시간표) ===================== */

/**
 * routeArray, route, waits, stays, 시간 범위를 이용해
 * 화면에서 사용하는 schedule 배열을 생성합니다.
 */
export function generateSchedule(
  routeArray,
  route,
  waits,
  stays,
  startMin,
  endMin,
  startName,
  endName
) {
  const rows = [];
  let now = startMin;

  for (let i = 0; i < route.length; i++) {
    const idx = route[i];
    const [type, node] = routeArray[idx];
    const poi = node.poi || null;

    const category =
      type === "start"
        ? "출발"
        : type === "end"
        ? "도착"
        : poi?.category || "";

    const wait = waits[idx] || 0;
    now += wait;
    const arrival = toHM(now);

    const stay = stays[idx] || 0;
    now += stay;
    const depart = toHM(now);

    const rating = poi?.rating ?? null;

    const name =
      type === "start"
        ? startName
        : type === "end"
        ? endName
        : poi?.name || "";

    rows.push({
      order: i + 1,
      name,
      category,
      arrival,
      depart,
      wait,
      stay,
      rating,
    });

    if (now >= endMin) break;
  }

  return rows;
}
```