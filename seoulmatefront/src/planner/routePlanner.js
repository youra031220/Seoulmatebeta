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
  // ⚙️ numPlaces를 안전한 정수로 고정
  const limit = Math.max(0, Number(numPlaces) || 0);

  // 1) 끼니 → 식당 슬롯 / 카페 슬롯 분리
  const numMealSlots = [breakfast, lunch, dinner].filter(Boolean).length;
  const maxRestaurants = Math.max(0, numMealSlots);
  const maxCafes = cafe ? 1 : 0; // 카페는 기본적으로 1곳만

  // 2) POI 분리: 식당 / 카페 / 기타
  const restaurantPOIs = [];
  const cafePOIs = [];
  const otherPOIs = [];

  for (const p of basePOIs) {
    const text =
      ((p.name || "") + " " + (p.address || "") + " " + (p.category || "")).toLowerCase();

    // 🟣 카페/디저트/베이커리 관련 키워드는 전부 카페로
    const isCafeLike =
      p.categoryType === "cafe" ||
      /카페|cafe|커피|브런치|디저트|dessert|베이커리|bakery|빵집|케이크|케익/.test(
        text
      );

    // 🔵 식당(레스토랑) 관련 키워드
    const isRestaurantLike =
      p.categoryType === "restaurant" ||
      /음식점|식당|맛집|레스토랑|고기집|한식|중식|일식|양식|뷔페|restaurant/.test(
        text
      );

      if (isCafeLike) {
        // ✅ 카페 느낌이 조금이라도 나면 무조건 카페로
        cafePOIs.push({ ...p, categoryType: "cafe" });
      } else if (isRestaurantLike || p.isFood) {
        // ✅ 나머지 음식 관련은 전부 식당으로
        restaurantPOIs.push({ ...p, categoryType: "restaurant" });
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
        if (selectedCafes.length<maxCafes)
        {
          selectedCafes.push(c);
          usedIds.add(c.id);
        }
      }
    } 
    else {
      // 나머지(vegan, halal 등)는 우선 식당, 그다음 카페
      let chosen = null;

      if (selectedRestaurants.length < maxRestaurants) {
        chosen = restaurantPOIs.find(
          (p) => !usedIds.has(p.id) && containsAny(textOf(p), keywords)
        );
        if (chosen) {
          if (selectedRestaurants.length <maxRestaurants)
          {
            selectedRestaurants.push(chosen);
            usedIds.add(chosen.id);
          }
        }
      }

      if (selectedCafes.length < maxCafes) {
        chosen = cafePOIs.find(
          (p) => !usedIds.has(p.id) && containsAny(textOf(p), keywords)
        );
        if (chosen) {
          if (selectedCafes.length < maxCafes)
          {
            selectedCafes.push(chosen);
            usedIds.add(chosen.id);
          }
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
  if (selectedFood.length > limit) {
    selectedFood = selectedFood.slice(0, limit);
  }

  // 4) 나머지 슬롯은 관광지(otherPOIs)로 채움
  let remainingSlots = Math.max(0, limit - selectedFood.length);
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
      if (selectedPOIs.length<remainingSlots)
      {
        selectedPOIs.push(candidate);
        usedIds.add(candidate.id);
      }
    }
  }

  // 4-2) 아직 남으면 any POI 채우기
  for (const p of otherPOIs) {
    if (selectedPOIs.length >= remainingSlots) break;
    if (usedIds.has(p.id)) continue;
    selectedPOIs.push(p);
    usedIds.add(p.id);
  }

 let finalList = [...selectedFood, ...selectedPOIs];

 // 🔢 현재까지 식당/카페 개수 카운트
 let restaurantCount = finalList.filter(
  (p) => p.categoryType === "restaurant"
).length;
let cafeCount = finalList.filter(
  (p) => p.categoryType === "cafe"
).length;


 // 🔁 아직 개수가 모자라면, basePOIs에서 안 쓴 것들을 추가로 채움
  if (finalList.length < limit) {
    for (const p of basePOIs) {
      if (finalList.length >= limit) break;
      if (usedIds.has(p.id)) continue;

      // 🍽 음식점/카페 개수를 max 한도 내에서만 추가
      if (p.categoryType === "restaurant") {
        if (restaurantCount >= maxRestaurants) continue;
        restaurantCount++;
      } else if (p.categoryType === "cafe") {
        if (cafeCount >= maxCafes) continue;
        cafeCount++;
      }

      finalList.push(p);
      usedIds.add(p.id);
    }
  }

  finalList = finalList.slice(0, limit);

  return { pois: finalList };
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
      
      if (leg < bestLeg) {
        bestLeg = leg;
        bestIdx = idx;
      }
    }

    if (bestIdx == null) break;

    const [__, nextNode] = routeArray[bestIdx];
    const poi = nextNode.poi || {};
    const stay = Math.max(10, Math.round(poi.stay_time ?? 30));

    // 🔥 이 POI까지 갔다가 머무르면 endMin을 넘는지 체크
    const arrivalAtNext = now + bestLeg;
    const departFromNext = arrivalAtNext + stay;
    if (departFromNext > endMin) {
      // 이 다음부터는 시간 초과니까, 더 이상 POI 들르지 않고 도착지로 바로 이동
      break;
    }

    waits[bestIdx] = bestLeg;
    stays[bestIdx] = stay;

    now += bestLeg + stay;
    route.push(bestIdx);
    remaining.delete(bestIdx);
    currentIdx = bestIdx;
  }

  // 6) 마지막으로 도착지까지 이동
  const [__, lastNode] = routeArray[currentIdx];
  const [___, endNode2] = routeArray[n - 1];
  const legToEnd = travelMinutes(
    lastNode.lat,
    lastNode.lon,
    endNode2.lat,
    endNode2.lon
  );

  waits[n - 1] = legToEnd;
  stays[n - 1] = 0;
  route.push(n - 1);

  return { routeArray, route, waits, stays };
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

    const wait = waits[idx] || 0;
    const stay = stays[idx] || 0;

    // 🔐 다음 노드를 추가하면 endMin을 넘는지 먼저 체크

    now += wait;
    let arrivalMin=now;
    now += stay;
    let departMin=now;

    // 도착지는 endMin 기준으로 클램프해도 됨
    if (type === "end") {
      if (arrivalMin > endMin) arrivalMin = endMin;
      if (departMin > endMin) departMin = endMin;
    }

    const arrival = toHM(arrivalMin);
    const depart = toHM(departMin);

    const category =
      type === "start"
        ? "출발"
        : type === "end"
        ? "도착"
        : poi?.category || "";

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
      rating:poi?.rating??null,
    });

    if (type === "end"&& arrivalMin==endMin) {
      // ✅ 도착지는 마지막으로 한 번만
      break;
    }
  }
  return rows;
}

