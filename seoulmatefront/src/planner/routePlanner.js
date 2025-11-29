import {
  MEAL_WINDOWS,
  toMinutes,
  toTimeString,
} from "../utils/timeConstants.js";
import { useTranslation } from "react-i18next";

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

/* ===================== 다국어 선호 장소 + 국기 정보 ===================== */

// 언어 코드별 국기/라벨
const LANGUAGE_FLAGS = {
  en: { code: "en", label: "English user favorite", flag: "🇺🇸" }, // 필요하면 🇬🇧 등으로 변경
  zh_CN: { code: "zh-CN", label: "중국어 사용자 선호",      flag: "🇨🇳" },
  zh_TW: { code: "zh-TW", label: "대만어 사용자 선호",      flag: "🇹🇼" },
  vi: { code: "vi", label: "베트남어 사용자 선호",      flag: "🇻🇳" },
  ja: { code: "ja", label: "일본어 사용자 선호",      flag: "🇯🇵" },
  th: { code: "th", label: "태국어 사용자 선호",      flag: "🇹🇭" },
  id: { code: "id", label: "인도네시아어 사용자 선호",      flag: "🇮🇩" },
  es: { code: "es", label: "스페인어 사용자 선호",      flag: "🇪🇸" },
  de: { code: "de", label: "독일어 사용자 선호",      flag: "🇩🇪" },
};

// 장소 이름을 매칭하기 위한 간단한 정규화
function normalizePlaceName(name = "") {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ""); // 공백 제거
}

/**
 * 언어별 선호 장소 샘플
 * - key: 언어 코드(en/zh/ja)
 * - value: normalizePlaceName() 된 장소 이름의 Set
 *
 * 지금은 ALL_POIS 안에 있는 영어 이름 기준으로만 넣어둘게요.
 * (실제 서비스에서는 각 언어별 실제 이름이나 placeId 기반으로 바꿔도 됨)
 */
const PREFERRED_PLACES_BY_LANG = {
  en: new Set([
    normalizePlaceName("경복궁"),
    normalizePlaceName("북촌 한옥마을"),
    normalizePlaceName("인사동문화의거리"),
    normalizePlaceName("YTN서울타워"),
    normalizePlaceName("신세계백화점 본점 더 리저브"),
    normalizePlaceName("홍대걷고싶은거리"),
    normalizePlaceName("강남역 2호선"),
    normalizePlaceName("코엑스"),
    normalizePlaceName("별마당 도서관"),
    normalizePlaceName("롯데월드타워"),
    normalizePlaceName("동대문디자인플라자"),
    normalizePlaceName("서울숲"),
    normalizePlaceName("여의도 한강공원"),
    normalizePlaceName("익선동한옥거리"),
    normalizePlaceName("롯데월드 아쿠아리움"),
    normalizePlaceName("커먼그라운드"),
    normalizePlaceName("현대백화점 더현대 서울"),
    normalizePlaceName("리움미술관"),
    normalizePlaceName("국립중앙박물관"),
    normalizePlaceName("삼청동문화거리"),
    normalizePlaceName("청계천"),
    normalizePlaceName("압구정로데오거리"),
    normalizePlaceName("봉은사"),
    normalizePlaceName("이태원역 6호선"),
    normalizePlaceName("서울광장"),
    normalizePlaceName("광장시장"),
    normalizePlaceName("남대문시장"),
    normalizePlaceName("블루보틀 성수 카페"),
    normalizePlaceName("성수동카페거리"),
    normalizePlaceName("광화문"), //30
  ]),
  zh_CN: new Set([
    normalizePlaceName("경복궁"),
    normalizePlaceName("창덕궁"),
    normalizePlaceName("북촌 한옥마을"),
    normalizePlaceName("창경궁"),
    normalizePlaceName("롯데면세점 명동본점"),
    normalizePlaceName("롯데월드타워"),
    normalizePlaceName("롯데월드 어드벤처"),
    normalizePlaceName("코엑스"),
    normalizePlaceName("현대백화점 더현대 서울"),
    normalizePlaceName("남대문시장"),
    normalizePlaceName("동대문종합시장"),
    normalizePlaceName("성수동카페거리"),
    normalizePlaceName("광장시장"),
    normalizePlaceName("천주교 서울대교구 주교좌명동대성당"),
    normalizePlaceName("압구정로데오거리"),
    normalizePlaceName("가로수길"),
    normalizePlaceName("서울숲"),
    normalizePlaceName("카페 오쁘띠베르"),
    normalizePlaceName("스타필드 하남"),
    normalizePlaceName("여의도 한강공원"),
    normalizePlaceName("YTN서울타워"),
    normalizePlaceName("동대문디자인플라자"),
    normalizePlaceName("에버랜드"),
    normalizePlaceName("교보문고 광화문점"),
    normalizePlaceName("광화문"),
    normalizePlaceName("쌈지길"),
    normalizePlaceName("롯데마트 제타플렉스 서울역점"),
    normalizePlaceName("올리브영 명동 타운점"),
    normalizePlaceName("아모레 성수"),
    normalizePlaceName("무신사 스탠다드 명동점"), // 30
  ]),
  ja: new Set([
    normalizePlaceName("홍대걷고싶은거리"),
    normalizePlaceName("경복궁"),
    normalizePlaceName("창덕궁"),
    normalizePlaceName("북촌 한옥마을"),
    normalizePlaceName("망원시장"),
    normalizePlaceName("성수동카페거리"),
    normalizePlaceName("아디다스 오리지널스 플래그십 성수"),
    normalizePlaceName("광장시장"),
    normalizePlaceName("서울숲"),
    normalizePlaceName("SM엔터테인먼트"),
    normalizePlaceName("YTN서울타워"),
    normalizePlaceName("동대문디자인플라자"),
    normalizePlaceName("스타필드 하남"),
    normalizePlaceName("압구정로데오거리"),
    normalizePlaceName("여의도 한강공원"),
    normalizePlaceName("익선동한옥거리"),
    normalizePlaceName("가로수길"),
    normalizePlaceName("롯데월드타워"),
    normalizePlaceName("별마당 도서관"),
    normalizePlaceName("교보문고 광화문점"), // 20
    normalizePlaceName("아모레 성수"),
    normalizePlaceName("국립중앙박물관"),
    normalizePlaceName("리움미술관"),
    normalizePlaceName("어니언 성수"),
    normalizePlaceName("기미사 성수"),
    normalizePlaceName("현대백화점 신촌점"),
    normalizePlaceName("이화마을"),
    normalizePlaceName("디뮤지엄"),
    normalizePlaceName("아모레퍼시픽미술관"),
    normalizePlaceName("스타필드 고양"), //30
  ]),
  zh_TW: new Set([
  normalizePlaceName("홍대"),
  normalizePlaceName("명동거리"),
  normalizePlaceName("동대문디자인플라자"),
  normalizePlaceName("광장시장"),
  normalizePlaceName("남산타워"),
  normalizePlaceName("경복궁"),
  normalizePlaceName("북촌 한옥마을"),
  normalizePlaceName("삼청동"),
  normalizePlaceName("가로수길"),
  normalizePlaceName("성수동 카페거리"),
  normalizePlaceName("어니언 성수"),
  normalizePlaceName("아모레 성수"),
  normalizePlaceName("망원시장"),
  normalizePlaceName("서울숲"),
  normalizePlaceName("연남동 카페거리"),
  normalizePlaceName("이태원"),
  normalizePlaceName("한남동"),
  normalizePlaceName("롯데월드타워"),
  normalizePlaceName("잠실 롯데월드몰"),
  normalizePlaceName("코엑스몰"),
  normalizePlaceName("별마당 도서관"),
  normalizePlaceName("교보문고 광화문점"),
  normalizePlaceName("홍대 맛집거리"),
  normalizePlaceName("익선동 한옥거리"),
  normalizePlaceName("더현대 서울"),
  normalizePlaceName("스타필드 고양"),
  normalizePlaceName("아리따움 성수"),
  normalizePlaceName("올리브영 명동 플래그십"),
  normalizePlaceName("하남 스타필드"),
  normalizePlaceName("디뮤지엄")
]),
vi: new Set([
  normalizePlaceName("홍대입구"),
  normalizePlaceName("YG엔터테인먼트"),
  normalizePlaceName("SM엔터테인먼트"),
  normalizePlaceName("하이브 인사이트"),
  normalizePlaceName("코엑스 아쿠아리움"),
  normalizePlaceName("강남역"),
  normalizePlaceName("명동"),
  normalizePlaceName("광장시장"),
  normalizePlaceName("숭례문"),
  normalizePlaceName("남대문시장"),
  normalizePlaceName("롯데월드"),
  normalizePlaceName("경복궁"),
  normalizePlaceName("청계천"),
  normalizePlaceName("이태원"),
  normalizePlaceName("동대문 패션몰"),
  normalizePlaceName("커피한약방"),
  normalizePlaceName("을지로 노포"),
  normalizePlaceName("성수동 카페"),
  normalizePlaceName("어니언 안국"),
  normalizePlaceName("연남동 카페거리"),
  normalizePlaceName("가로수길"),
  normalizePlaceName("서울숲"),
  normalizePlaceName("잠실 석촌호수"),
  normalizePlaceName("한강공원 여의도"),
  normalizePlaceName("롯데타워 전망대 서울스카이"),
  normalizePlaceName("COEX K-pop 광장"),
  normalizePlaceName("디뮤지엄"),
  normalizePlaceName("노량진 수산시장"),
  normalizePlaceName("스타필드 코엑스몰"),
  normalizePlaceName("더현대 서울")
]),
th: new Set([
  normalizePlaceName("명동 화장품거리"),
  normalizePlaceName("올리브영 명동점"),
  normalizePlaceName("가로수길"),
  normalizePlaceName("코엑스몰"),
  normalizePlaceName("별마당 도서관"),
  normalizePlaceName("롯데월드타워"),
  normalizePlaceName("롯데월드"),
  normalizePlaceName("경복궁"),
  normalizePlaceName("북촌 한옥마을"),
  normalizePlaceName("남산타워"),
  normalizePlaceName("홍대 쇼핑거리"),
  normalizePlaceName("홍대 카페거리"),
  normalizePlaceName("성수동 카페거리"),
  normalizePlaceName("망원동 맛집거리"),
  normalizePlaceName("연남동 카페거리"),
  normalizePlaceName("이태원"),
  normalizePlaceName("한남동"),
  normalizePlaceName("더현대 서울"),
  normalizePlaceName("광장시장"),
  normalizePlaceName("을지로 카페"),
  normalizePlaceName("서울숲"),
  normalizePlaceName("올리브영 강남 플래그십"),
  normalizePlaceName("젠틀몬스터 하우스도산"),
  normalizePlaceName("디올 성수"),
  normalizePlaceName("하이브 인사이트"),
  normalizePlaceName("SM타운 코엑스"),
  normalizePlaceName("스타필드 하남"),
  normalizePlaceName("동대문 디자인플라자"),
  normalizePlaceName("청계천"),
  normalizePlaceName("익선동 한옥거리")
]),
id: new Set([
  normalizePlaceName("홍대 K-pop 거리"),
  normalizePlaceName("YG엔터테인먼트"),
  normalizePlaceName("하이브"),
  normalizePlaceName("SM엔터테인먼트"),
  normalizePlaceName("명동"),
  normalizePlaceName("서울타워"),
  normalizePlaceName("경복궁"),
  normalizePlaceName("창덕궁"),
  normalizePlaceName("북촌 한옥마을"),
  normalizePlaceName("이태원 할랄거리"),
  normalizePlaceName("가로수길"),
  normalizePlaceName("성수 카페거리"),
  normalizePlaceName("어니언 성수"),
  normalizePlaceName("연남동 카페거리"),
  normalizePlaceName("망원시장"),
  normalizePlaceName("롯데월드타워"),
  normalizePlaceName("코엑스몰"),
  normalizePlaceName("K스타로드 청담"),
  normalizePlaceName("스타필드 코엑스"),
  normalizePlaceName("더현대 서울"),
  normalizePlaceName("한강공원 여의도"),
  normalizePlaceName("디뮤지엄"),
  normalizePlaceName("올리브영 명동 플래그십"),
  normalizePlaceName("스타필드 하남"),
  normalizePlaceName("홍대 맛집거리"),
  normalizePlaceName("압구정 로데오"),
  normalizePlaceName("삼청동"),
  normalizePlaceName("익선동"),
  normalizePlaceName("동대문 패션거리"),
  normalizePlaceName("잠실 롯데월드몰")
]),
es: new Set([
  normalizePlaceName("경복궁"),
  normalizePlaceName("창덕궁"),
  normalizePlaceName("덕수궁"),
  normalizePlaceName("북촌 한옥마을"),
  normalizePlaceName("남산타워"),
  normalizePlaceName("청계천"),
  normalizePlaceName("명동 쇼핑거리"),
  normalizePlaceName("남대문시장"),
  normalizePlaceName("광장시장"),
  normalizePlaceName("동대문디자인플라자"),
  normalizePlaceName("홍대"),
  normalizePlaceName("가로수길"),
  normalizePlaceName("서울숲"),
  normalizePlaceName("삼청동"),
  normalizePlaceName("롯데월드타워 전망대"),
  normalizePlaceName("한강공원"),
  normalizePlaceName("이태원"),
  normalizePlaceName("한남동"),
  normalizePlaceName("연남동"),
  normalizePlaceName("성수동"),
  normalizePlaceName("코엑스몰"),
  normalizePlaceName("국립중앙박물관"),
  normalizePlaceName("서울시립미술관"),
  normalizePlaceName("리움미술관"),
  normalizePlaceName("김포 현대프리미엄 아울렛"),
  normalizePlaceName("하남 스타필드"),
  normalizePlaceName("더현대 서울"),
  normalizePlaceName("덕수궁 돌담길"),
  normalizePlaceName("홍대 클럽거리"),
  normalizePlaceName("여의도 63빌딩")
]),
de: new Set([
  normalizePlaceName("경복궁"),
  normalizePlaceName("창덕궁 후원"),
  normalizePlaceName("국립중앙박물관"),
  normalizePlaceName("리움미술관"),
  normalizePlaceName("서울역사박물관"),
  normalizePlaceName("전쟁기념관"),
  normalizePlaceName("덕수궁 돌담길"),
  normalizePlaceName("서울숲"),
  normalizePlaceName("북촌 한옥마을"),
  normalizePlaceName("서촌 마을"),
  normalizePlaceName("남산타워"),
  normalizePlaceName("청계천"),
  normalizePlaceName("광장시장"),
  normalizePlaceName("남대문시장"),
  normalizePlaceName("명동성당"),
  normalizePlaceName("한강공원 반포"),
  normalizePlaceName("세빛섬"),
  normalizePlaceName("동대문디자인플라자"),
  normalizePlaceName("이화마을"),
  normalizePlaceName("삼청동길"),
  normalizePlaceName("홍대 걷고싶은거리"),
  normalizePlaceName("서대문형무소 역사관"),
  normalizePlaceName("서울시립미술관"),
  normalizePlaceName("롯데월드타워 전망대"),
  normalizePlaceName("코엑스 아쿠아리움"),
  normalizePlaceName("하남 스타필드"),
  normalizePlaceName("더현대 서울"),
  normalizePlaceName("성수 카페거리"),
  normalizePlaceName("익선동 한옥거리"),
  normalizePlaceName("아모레퍼시픽미술관")
]),
};

/**
 * 특정 장소 이름이 어떤 언어 사용자에게 인기인지 조회
 * @param {string} placeName - 일정에 표시되는 장소 이름 (generateSchedule에서 만들어지는 name)
 * @returns {Array<{code: string, label: string, flag: string}>}
 */
export function getPlaceLangFlags(placeName, activeLangs=[]) {
  if (!placeName) return [];

  const normalized = normalizePlaceName(placeName);
  const isFilterMode = activeLangs.length > 0;
  const result = [];

  for (const [lang, set] of Object.entries(PREFERRED_PLACES_BY_LANG)) {
    if (set.has(normalized)) {
      // 사용자가 선택한 언어(activeLangs)가 있을 때만 필터 적용
      if (!isFilterMode || activeLangs.includes(lang)) {
        result.push(LANGUAGE_FLAGS[lang]);
      }
    }
  }

  return result;
}


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
  basePOIs = [],
  requiredStops = []
) {
  // 1) 끼니 → 식당 슬롯 / 카페 슬롯 분리
  const numMealSlots = [breakfast, lunch, dinner].filter(Boolean).length;
  const maxRestaurants = Math.max(0, numMealSlots);
  const maxCafes = cafe ? 1 : 0; // 카페는 기본적으로 1곳만

  // 2) 필수 방문지 중복 제거 (Step A-3: 정규화 방식으로 개선)
  // 필수 방문지 이름 정규화 함수
  const normalizeKorean = (str) => {
    if (!str || typeof str !== "string") return "";
    return str.replace(/\s+/g, "").toLowerCase();
  };

  const requiredNames = new Set(
    (requiredStops || [])
      .map((r) => normalizeKorean(r.name))
      .filter(Boolean)
  );

  // 중복 제거: 필수 방문지와 이름이 유사한 POI 필터링
  const dedupedPOIs = basePOIs.filter((poi) => {
    const poiName = normalizeKorean(poi.title || poi.name);
    if (!poiName) return false;

    for (const reqName of requiredNames) {
      // 포함 관계 체크 (경복궁, 경복궁역, 경복궁 돌담길 등)
      if (poiName.includes(reqName) || reqName.includes(poiName)) {
        return false; // 중복이므로 제외
      }
    }
    return true; // 중복 없음, 포함
  });

  // 3) POI 분리: 식당 / 카페 / 기타 (필수 방문지와 중복 제거된 POI 사용)
  const restaurantPOIs = [];
  const cafePOIs = [];
  const otherPOIs = [];
  const categoryCounts = {}; // 카테고리별 개수 추적 (최대 2개 제한)

  for (const p of dedupedPOIs) {

    // 카테고리별 개수 제한 (최대 2개)
    const category = p.category || p.categoryType || "기타";
    const categoryKey = category.toLowerCase();
    if (!categoryCounts[categoryKey]) {
      categoryCounts[categoryKey] = 0;
    }
    if (categoryCounts[categoryKey] >= 2) continue; // 같은 카테고리는 최대 2개

    if (p.categoryType === "cafe") {
      cafePOIs.push(p);
      categoryCounts[categoryKey]++;
    } else if (
      p.categoryType === "restaurant" ||
      (p.isFood && p.categoryType !== "cafe")
    ) {
      restaurantPOIs.push(p);
      categoryCounts[categoryKey]++;
    } else {
      otherPOIs.push(p);
      categoryCounts[categoryKey]++;
    }
  }

  const usedIds = new Set();
  const selectedRestaurants = [];
  const selectedCafes = [];
  const selectedCategoryCounts = {}; // 선택된 POI의 카테고리별 개수

  const textOf = (p) =>
    (p.name || "") + " " + (p.address || "") + " " + (p.category || "");

  const containsAny = (str, keywords) =>
    keywords.some((kw) => str.toLowerCase().includes(kw.toLowerCase()));

  // 4) 식단 제약별 키워드
  const dietKeywordMap = {
    halal: ["할랄", "halal"],
    vegan: ["비건", "vegan"],
    vegetarian: ["베지테리언", "채식", "vegetarian"],
    kosher: ["코셔", "kosher"],
    gluten_free: ["글루텐프리", "글루텐 프리", "gluten free", "gluten-free"],
    non_alcohol: ["논알콜", "무알콜", "non-alcohol", "0% 알콜"],
  };

  // 4-1) 식단 제약 반영
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

  // 4-2) 남은 식당 슬롯 채우기 (카테고리 다양성 고려)
  for (const p of restaurantPOIs) {
    if (selectedRestaurants.length >= maxRestaurants) break;
    if (usedIds.has(p.id)) continue;
    const cat = (p.category || p.categoryType || "기타").toLowerCase();
    if (selectedCategoryCounts[cat] >= 2) continue; // 같은 카테고리는 최대 2개
    selectedRestaurants.push(p);
    usedIds.add(p.id);
    selectedCategoryCounts[cat] = (selectedCategoryCounts[cat] || 0) + 1;
  }

  // 4-3) 남은 카페 슬롯 채우기
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

  // 5) 나머지 슬롯은 관광지(otherPOIs)로 채움 (카테고리 다양성 고려)
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

  // 5-1) 테마별로 1개씩 우선 배정 (카테고리 다양성 고려)
  for (const th of themes) {
    if (selectedPOIs.length >= remainingSlots) break;
    const keywords = themeKeywordMap[th] || [];

    const candidate = otherPOIs.find(
      (p) => {
        if (usedIds.has(p.id)) return false;
        const cat = (p.category || p.categoryType || "기타").toLowerCase();
        if (selectedCategoryCounts[cat] >= 2) return false; // 같은 카테고리는 최대 2개
        return keywords.length === 0 || containsAny(textOf(p), keywords);
      }
    );

    if (candidate) {
      selectedPOIs.push(candidate);
      usedIds.add(candidate.id);
      const cat = (candidate.category || candidate.categoryType || "기타").toLowerCase();
      selectedCategoryCounts[cat] = (selectedCategoryCounts[cat] || 0) + 1;
    }
  }

  // 5-2) 아직 남으면 any POI 채우기 (카테고리 다양성 고려)
  for (const p of otherPOIs) {
    if (selectedPOIs.length >= remainingSlots) break;
    if (usedIds.has(p.id)) continue;
    const cat = (p.category || p.categoryType || "기타").toLowerCase();
    if (selectedCategoryCounts[cat] >= 2) continue; // 같은 카테고리는 최대 2개
    selectedPOIs.push(p);
    usedIds.add(p.id);
    selectedCategoryCounts[cat] = (selectedCategoryCounts[cat] || 0) + 1;
  }

  const finalList = [...selectedFood, ...selectedPOIs].slice(0, numPlaces);

  return {
    pois: finalList,
  };
}




/* ===================== 경로 최적화 ===================== */

/**
 * 카테고리별 기본 체류시간 계산 (pace 배수 적용)
 * @param {string} category - POI 카테고리 (restaurant, cafe, attraction, poi 등)
 * @param {string} pace - 여행 페이스 (relaxed, normal, tight)
 * @param {Object} weights - weightAgent가 생성한 가중치 객체 (pace.stayTimeMultiplier 포함)
 * @returns {number} 체류시간(분)
 */
function getStayTime(category, pace = "normal", weights = {}) {
  // 카테고리별 기본 체류시간 (분)
  const baseStayTimes = {
    restaurant: 60,
    cafe: 45,
    attraction: 90,
    poi: 90,
    required: 30,
    spot: 60,
  };

  const baseTime = baseStayTimes[category] || 60;
  const multiplier = weights?.pace?.stayTimeMultiplier ?? 1.0;
  return Math.max(10, Math.round(baseTime * multiplier));
}

/**
 * 간단한 그리디 알고리즘으로
 * - 출발지(startPoint) → 필수 방문지(requiredStops) → 선택 POI(pois) → 도착지(endPoint)
 * 순서를 정하고, 각 구간 이동시간과 체류시간을 계산합니다.
 *
 * - maxLegMin: 한 구간 최대 이동시간(분)
 * - startMin, endMin: 일정 시작/종료 시각 (분 단위, 0~1440)
 * - weights: weightAgent가 생성한 가중치 객체 (pace.stayTimeMultiplier 포함)
 */
export function optimizeRoute(
  pois,
  start,
  end,
  startMin,
  endMin,
  maxLegMin,
  requiredStops = [],
  weights = {},
  mealOptions = {} // { breakfast, lunch, dinner, cafe }
) {
  if (!start?.lat || !end?.lat) {
    throw new Error("start / end 좌표가 없습니다.");
  }

  // 1) 시작/끝 노드
  const startNode = { lat: start.lat, lon: start.lon };
  const endNode = { lat: end.lat, lon: end.lon };

  // 2) 필수 방문지 → POI 형태로 변환 + isMustVisit 플래그 (Step A-5)
  const pace = weights?.pace?.stayTimeMultiplier ? 
    (weights.pace.stayTimeMultiplier >= 1.2 ? "relaxed" : 
     weights.pace.stayTimeMultiplier <= 0.8 ? "tight" : "normal") : "normal";

  const requiredAsPOIs = (requiredStops || [])
    .filter((r) => r.lat && r.lon)
    .map((r) => {
      const category = r.category || "required";
      const calculatedStayTime = getStayTime(category, pace, weights);

      return {
        // 기본 이름
        name: r.name || "필수 방문지",

        // 🔹 한글/영문 이름 모두 보존
        nameKo: r.nameKo || r.name || "필수 방문지",
        nameTranslated: r.nameTranslated || "",

        lat: r.lat,
        lon: r.lon,
        stay_time: r.stay_time ?? calculatedStayTime,

        // 🔹 카테고리도 한글/영문 둘 다 보존
        category,
        categoryKo: r.categoryKo || category,
        categoryTranslated: r.categoryTranslated || "",

        rating: r.rating ?? "-",
        isRequired: true,
        isMustVisit: true, // 필수 방문지 강제 포함
      };
    });
    // 3) 선택 POI (이미 selectPOIs에서 numPlaces만큼 뽑힌 상태라고 가정)
  const optional = (pois || []).map((p) => {
    const category = p.category || p.categoryType || "spot";
    const calculatedStayTime = getStayTime(category, pace, weights);

    return {
      // 기본 표시 이름
      name: p.name,

      // 🔹 한글/영문 이름 모두 전달
      nameKo: p.nameKo || p.name,
      nameTranslated: p.nameTranslated || "",

      lat: p.lat,
      lon: p.lon,
      stay_time: p.stay_time ?? calculatedStayTime,

      // 🔹 카테고리도 한글/영문 정보 유지
      category,
      categoryKo: p.categoryKo || category,
      categoryTranslated: p.categoryTranslated || "",

      rating: p.rating ?? "-",
      isRequired: false,
    };
  });

  // 4) start + (필수 + 선택) + end 순서로 routeArray 구성
  const nodes = [];

  // index 0: start
  nodes.push({
    type: "start",
    lat: startNode.lat,
    lon: startNode.lon,
    poi: null,
  });

  // 1..k: 필수 + 선택 (Step A-5: 필수 방문지는 isMustVisit 플래그 포함)
  requiredAsPOIs.forEach((p) =>
    nodes.push({
      type: "poi",
      lat: p.lat,
      lon: p.lon,
      poi: p,
      isMustVisit: p.isMustVisit || false, // Step A-5: 필수 방문지 강제 포함 플래그
    })
  );
  optional.forEach((p) =>
    nodes.push({
      type: "poi",
      lat: p.lat,
      lon: p.lon,
      poi: p,
      isMustVisit: false, // 선택 POI는 필수 아님
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

  // Step B-1: 끼니 시간대 슬롯 정의 (timeConstants.js의 MEAL_WINDOWS 사용)
  // MEAL_WINDOWS를 분 단위로 변환
  const mealSlots = [];
  if (mealOptions.breakfast) {
    const win = MEAL_WINDOWS.breakfast;
    mealSlots.push({
      type: "meal",
      meal: "breakfast",
      idealStart: toMinutes(win.start),
      idealEnd: toMinutes(win.end),
    });
  }
  if (mealOptions.lunch) {
    const win = MEAL_WINDOWS.lunch;
    mealSlots.push({
      type: "meal",
      meal: "lunch",
      idealStart: toMinutes(win.start),
      idealEnd: toMinutes(win.end),
    });
  }
  if (mealOptions.dinner) {
    const win = MEAL_WINDOWS.dinner;
    mealSlots.push({
      type: "meal",
      meal: "dinner",
      idealStart: toMinutes(win.start),
      idealEnd: toMinutes(win.end),
    });
  }
  if (mealOptions.cafe) {
    const win = MEAL_WINDOWS.cafe;
    mealSlots.push({
      type: "meal",
      meal: "cafe",
      idealStart: toMinutes(win.start),
      idealEnd: toMinutes(win.end),
    });
  }

  // Step B-1: 사용자의 일정 범위(startMin~endMin) 내에 있는 끼니 슬롯만 필터링
  const activeMealSlots = mealSlots.filter(
    (slot) => slot.idealStart >= startMin && slot.idealEnd <= endMin
  );

  // Step B-1: 끼니 슬롯 추적 (각 시간대에 식당/카페가 배치되었는지)
  const mealSlotsFilled = {};
  activeMealSlots.forEach((slot) => {
    mealSlotsFilled[slot.meal] = false;
  });

  // Step B-1: 식당 POI가 현재 시간에 배치 가능한지 체크하는 함수
  const canPlaceRestaurant = (poi, currentTimeMin, mealSlots) => {
    const category = poi.category || poi.categoryType || "";
    const isRestaurant = category === "restaurant";
    const isCafe = category === "cafe";

    // 식당/카페가 아니면 항상 배치 가능
    if (!isRestaurant && !isCafe) return true;

    // 식당/카페는 끼니 시간대에만 배치 가능
    for (const slot of mealSlots) {
      const arrivalTime = currentTimeMin;
      // 시간대 내에 들어가면 배치 가능 (30분 여유 포함)
      if (
        arrivalTime >= slot.idealStart - 30 &&
        arrivalTime <= slot.idealEnd + 30
      ) {
        // 해당 슬롯이 아직 채워지지 않았으면 배치 가능
        if (!mealSlotsFilled[slot.meal]) {
          return true;
        }
      }
    }

    // 끼니 시간대가 아니거나 이미 채워진 슬롯이면 배치 불가
    return false;
  };

  while (remaining.size) {
    const [_, curNode] = routeArray[currentIdx];

    let bestIdx = null;
    let bestLeg = Infinity;

    for (const idx of remaining) {
      const [__, cand] = routeArray[idx];
      const leg = travelMinutes(curNode.lat, curNode.lon, cand.lat, cand.lon);

      // 체류시간 계산
      const poi = cand?.poi || {};
      const stay = Math.max(10, Math.round(poi.stay_time ?? getStayTime(poi.category || "spot", pace, weights)));

      // 시간/최대 구간 제약 체크 + endTime 초과 방지
      const arrivalTime = now + leg;
      const departTime = arrivalTime + stay;

      // Step A-5: 필수 방문지는 시간/거리 제약 무시
      const node = routeArray[idx][1];
      const isMustVisit = node?.isMustVisit || poi.isMustVisit || false;

      // Step B-1: 식당/카페는 끼니 시간대에만 배치 가능 (필수 방문지 제외)
      if (!isMustVisit) {
        if (!canPlaceRestaurant(poi, arrivalTime, activeMealSlots)) {
          continue; // 끼니 시간대가 아니면 스킵
        }
      }

      // Step A-5: mustVisit이면 조건 무시, 아니면 조건 체크
      if (!isMustVisit) {
        if (arrivalTime < now) continue; // 시간 역전 방지
        if (departTime > endMin) continue; // endTime 초과 방지
        if (leg > maxLegMin) continue; // 최대 이동시간 초과 방지
      }

      // Step B-1: 식사 시간대 슬롯 점수 계산 (우선순위 부여)
      let mealSlotScore = 0;
      const category = poi.category || poi.categoryType || "";
      const isRestaurant = category === "restaurant";
      const isCafe = category === "cafe";

      for (const slot of activeMealSlots) {
        if (mealSlotsFilled[slot.meal]) continue; // 이미 채워진 슬롯은 무시

        if (
          (slot.meal === "lunch" && isRestaurant) ||
          (slot.meal === "dinner" && isRestaurant) ||
          (slot.meal === "cafe" && isCafe) ||
          (slot.meal === "breakfast" && isRestaurant)
        ) {
          if (
            arrivalTime >= slot.idealStart - 30 &&
            arrivalTime <= slot.idealEnd + 30
          ) {
            mealSlotScore += slot.meal === "cafe" ? 80 : 100; // 식당은 100, 카페는 80
          } else if (arrivalTime < slot.idealStart) {
            mealSlotScore += 20; // 시간대 전이면 약간의 보너스
          }
        }
      }

      // 기본 제약 조건 확인 (mustVisit은 이미 위에서 처리됨)
      if (true) {
        // 식사 슬롯 점수가 높으면 우선 선택 (거리보다 우선)
        if (mealSlotScore > 0) {
          // 식사 슬롯이 채워지지 않았고, 이 POI가 해당 시간대에 맞으면 우선 선택
          if (mealSlotScore >= 80) {
            // 식사 슬롯에 정확히 맞는 경우 (100점 또는 80점)
            if (bestIdx === null || mealSlotScore > (routeArray[bestIdx]?.[1]?.poi ? 
                (routeArray[bestIdx][1].poi.category === "restaurant" || routeArray[bestIdx][1].poi.categoryType === "restaurant" ? 100 : 0) : 0)) {
              bestLeg = leg;
              bestIdx = idx;
            }
          } else {
            // 식사 슬롯 전 시간대 (20점) - 거리도 고려
            if (bestIdx === null || (mealSlotScore > 0 && leg < bestLeg)) {
              bestLeg = leg;
              bestIdx = idx;
            }
          }
        } else {
          // 식사 슬롯 점수가 없으면 기존처럼 거리 기반 선택
          if (leg < bestLeg) {
            bestLeg = leg;
            bestIdx = idx;
          }
        }
      }
    }

    if (bestIdx == null) {
      // Step A-5: 더 이상 시간 안에 갈 수 있는 곳이 없으면, 필수 방문지가 남아있는지 확인
      const remainingMustVisit = Array.from(remaining).filter(
        (idx) => routeArray[idx][1]?.isMustVisit
      );

      if (remainingMustVisit.length > 0) {
        // 필수 방문지가 남아있으면 강제로 추가 (시간 제약 무시)
        const forcedIdx = remainingMustVisit[0];
        const [__, forcedNode] = routeArray[forcedIdx];
        const forcedPoi = forcedNode?.poi || {};
        const forcedStay = Math.max(
          10,
          Math.round(
            forcedPoi.stay_time ??
              getStayTime(forcedPoi.category || "spot", pace, weights)
          )
        );
        const forcedLeg = travelMinutes(
          curNode.lat,
          curNode.lon,
          forcedNode.lat,
          forcedNode.lon
        );

        waits[forcedIdx] = forcedLeg;
        stays[forcedIdx] = forcedStay;
        now = now + forcedLeg + forcedStay;
        route.push(forcedIdx);
        remaining.delete(forcedIdx);
        currentIdx = forcedIdx;
        console.warn(
          `⚠️ 필수 방문지 "${forcedPoi.name}"를 강제로 추가했습니다 (시간 제약 무시).`
        );
        continue;
      }

      // 필수 방문지도 없으면 종료
      break;
    }

    const [__, nextNode] = routeArray[bestIdx];
    const poi = nextNode.poi || {};
    const stay = Math.max(10, Math.round(poi.stay_time ?? getStayTime(poi.category || "spot", pace, weights)));

    // 시간 역전 방지: 도착시간이 이전 출발시간보다 빠르면 안됨
    const arrivalTime = now + bestLeg;
    if (arrivalTime < now) {
      // 시간 역전 발생 시 이 POI는 건너뛰기
      remaining.delete(bestIdx);
      continue;
    }

    waits[bestIdx] = bestLeg;
    stays[bestIdx] = stay;

    // Step B-1: 식사 시간대 슬롯 채움 여부 업데이트
    const selectedPoi = routeArray[bestIdx][1]?.poi;
    const selectedCategory = selectedPoi?.category || selectedPoi?.categoryType || "";
    const arrivalTimeForMeal = now + bestLeg;

    for (const slot of activeMealSlots) {
      if (mealSlotsFilled[slot.meal]) continue; // 이미 채워진 슬롯은 무시

      const isRestaurant = selectedCategory === "restaurant";
      const isCafe = selectedCategory === "cafe";

      if (
        (slot.meal === "lunch" && isRestaurant) ||
        (slot.meal === "dinner" && isRestaurant) ||
        (slot.meal === "cafe" && isCafe) ||
        (slot.meal === "breakfast" && isRestaurant)
      ) {
        if (
          arrivalTimeForMeal >= slot.idealStart - 30 &&
          arrivalTimeForMeal <= slot.idealEnd + 30
        ) {
          mealSlotsFilled[slot.meal] = true;
        }
      }
    }

    now = arrivalTimeForMeal + stay; // 도착시간 + 체류시간 = 출발시간
    route.push(bestIdx);
    remaining.delete(bestIdx);
    currentIdx = bestIdx;
  }

  // B. endTime 활용: 여유 시간이 60분 이상이면 추가 POI 탐색 또는 체류시간 upscaling
  const remainingTime = endMin - now;
  if (remainingTime >= 60 && remaining.size === 0) {
    // 추가 POI 탐색 (이미 선택된 POI 중에서 체류시간을 늘릴 수 있는 것 찾기)
    let canExtend = false;
    for (let i = route.length - 1; i > 0; i--) {
      const idx = route[i];
      const [__, node] = routeArray[idx];
      const poi = node?.poi;
      if (!poi || poi.isRequired) continue; // 필수 방문지는 건드리지 않음

      const currentStay = stays[idx] || 0;
      const category = poi.category || poi.categoryType || "spot";
      const maxStay = getStayTime(category, pace, weights) * 1.5; // 최대 1.5배까지 확장 가능

      if (currentStay < maxStay) {
        const additionalStay = Math.min(remainingTime - 30, maxStay - currentStay); // 호텔까지 30분은 남겨두기
        if (additionalStay > 10) {
          stays[idx] = currentStay + additionalStay;
          now += additionalStay;
          canExtend = true;
          break;
        }
      }
    }

    // 체류시간 확장이 안 되면, 남은 시간에 맞는 추가 POI를 다시 탐색
    if (!canExtend && remainingTime >= 90) {
      // 남은 시간이 90분 이상이면 한 번 더 POI 탐색 시도
      const [__, lastNode] = routeArray[currentIdx];
      for (let i = 1; i < n - 1; i++) {
        if (route.includes(i)) continue; // 이미 포함된 POI는 제외

        const [___, cand] = routeArray[i];
        const leg = travelMinutes(lastNode.lat, lastNode.lon, cand.lat, cand.lon);
        const poi = cand?.poi || {};
        const stay = Math.max(10, Math.round(poi.stay_time ?? getStayTime(poi.category || "spot", pace, weights)));

        if (now + leg + stay + 30 <= endMin && leg <= maxLegMin) {
          // 호텔까지 30분 여유를 두고 추가 가능
          waits[i] = leg;
          stays[i] = stay;
          route.push(i);
          now += leg + stay;
          currentIdx = i;
          break;
        }
      }
    }
  }

  // Step A-4: 호텔(도착지)를 항상 마지막으로 강제 포함
  // Hard Constraint: 시간 제약이 있어도 호텔은 반드시 포함
  if (currentIdx !== n - 1) {
    const [__, lastNode] = routeArray[currentIdx];
    const [___, endNode2] = routeArray[n - 1];
    let legToEnd = travelMinutes(
      lastNode.lat,
      lastNode.lon,
      endNode2.lat,
      endNode2.lon
    );

    // Step A-4: 호텔까지 이동시간이 endTime을 초과하면, 중간 POI를 제거하여 시간 확보
    // 단, 필수 방문지는 제거하지 않음
    while (now + legToEnd > endMin && route.length > 1) {
      const removedIdx = route.pop();
      if (removedIdx === 0 || removedIdx === n - 1) {
        // start/end는 제거 불가, 강제로 호텔 추가
        break;
      }
      // Step A-5: 필수 방문지는 제거하지 않음
      const [_____, removedNode] = routeArray[removedIdx];
      if (removedNode?.isMustVisit) {
        // 필수 방문지는 다시 추가하고 종료
        route.push(removedIdx);
        break;
      }
      // 제거된 POI의 시간을 빼기
      now -= (waits[removedIdx] || 0) + (stays[removedIdx] || 0);
      currentIdx = route[route.length - 1];
      const [______, prevNode] = routeArray[currentIdx];
      // 호텔까지 거리 재계산
      legToEnd = travelMinutes(
        prevNode.lat,
        prevNode.lon,
        endNode2.lat,
        endNode2.lon
      );
    }

    // Step A-4: 호텔은 무조건 추가 + 경고 플래그
    const isOverTime = now + legToEnd > endMin;
    const isOverDistance = legToEnd > maxLegMin;

    waits[n - 1] = legToEnd;
    stays[n - 1] = 0;
    route.push(n - 1);

    // Step A-4: 경고 메시지 출력
    if (isOverTime) {
      console.warn(
        `⚠️ 도착 예정 시간이 ${endMin}분을 초과합니다. (현재: ${now + legToEnd}분)`
      );
    }
    if (isOverDistance) {
      console.warn(
        `⚠️ 호텔까지 이동시간(${legToEnd}분)이 최대 구간 제한(${maxLegMin}분)을 초과합니다.`
      );
    }
  }

  // ❗ 핵심: "정렬" 안 한다. 방문 순서(route)에 그대로 따라감.
  // 호텔(도착지)가 마지막이 되도록 route를 그대로 사용한다.
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
  let prevDepart = startMin; // 이전 출발 시간 추적

  // 🔹 출발/도착 이름을 문자열/객체 어떤 형태로 받아도 통일해서 쓰기
  const startInfo =
    typeof startName === "string" || !startName
      ? {
          name: startName || "",
          nameKo: startName || "",
          nameTranslated: "",
        }
      : {
          name: startName.name ?? "",
          nameKo: startName.nameKo ?? startName.name ?? "",
          nameTranslated: startName.nameTranslated ?? "",
        };

  const endInfo =
    typeof endName === "string" || !endName
      ? {
          name: endName || "",
          nameKo: endName || "",
          nameTranslated: "",
        }
      : {
          name: endName.name ?? "",
          nameKo: endName.nameKo ?? endName.name ?? "",
          nameTranslated: endName.nameTranslated ?? "",
        };

  // 🔹 타입별로 name / nameKo / nameTranslated를 통일해서 뽑는 함수
  const getNames = (type, poi) => {
    if (type === "start") {
      const base = startPoint?.name ?? "";
      const ko = startPoint?.nameKo ?? base;
      const tr = startPoint?.nameTranslated ?? "";
      return {
        // base는 그냥 참고용, 실제로는 tr이 있으면 그걸 우선 사용
        name: tr || base,
        nameKo: ko,
        nameTranslated: tr,
      };
    }

    if (type === "end") {
      const base = endPoint?.name ?? "";
      const ko = endPoint?.nameKo ?? base;
      const tr = endPoint?.nameTranslated ?? "";
      return {
        name: tr || base,
        nameKo: ko,
        nameTranslated: tr,
      };
    }

    // 그 외 일반 POI
    const base = poi?.name || "";
    const ko = poi?.nameKo ?? poi?.name ?? base;
    const tr = poi?.nameTranslated ?? "";
    return {
      name: base,
      nameKo: ko,
      nameTranslated: tr,
    };
  };

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

    // 시간 역전 방지: 도착시간이 이전 출발시간보다 빠르면 안됨
    const arrivalTime = Math.max(prevDepart, now + wait);
    if (arrivalTime < prevDepart) {
      console.error(`❌ 시간 역전 발생: arrival(${arrivalTime}) < prevDepart(${prevDepart})`);
      // 강제로 이전 출발시간 이후로 설정
      now = prevDepart;
    } else {
      now = arrivalTime;
    }
    const arrival = toHM(now);

    const stay = stays[idx] || 0;
    const departTime = now + stay;

    // endTime 초과 방지: 출발시간이 endTime을 넘으면 안됨
    if (departTime > endMin) {
      // endTime을 초과하는 경우, 체류시간을 조정하여 endTime에 맞춤
      const adjustedStay = Math.max(0, endMin - now);
      now = endMin;
      const depart = toHM(now);

      const rating = poi?.rating ?? null;
    
    // 🔹 타입별로 name / nameKo / nameTranslated 결정
    let name, nameKo, nameTranslated;

    if (type === "start") {
      // 출발지: startInfo 사용
      ({ name, nameKo, nameTranslated } = startInfo);
    } else if (type === "end") {
      // 도착지: endInfo 사용
      ({ name, nameKo, nameTranslated } = endInfo);
    } else {
      // 일반/필수 방문지: POI에서 가져오기
      name = poi?.name || "";
      nameKo = poi?.nameKo ?? poi?.name ?? name;
      nameTranslated = poi?.nameTranslated ?? "";
    }

    const categoryKo = poi?.categoryKo ?? poi?.category ?? category;
    const categoryTranslated = poi?.categoryTranslated ?? "";

    rows.push({
      order: i + 1,
      name,
      nameKo,
      nameTranslated,
      category,
      categoryKo,
      categoryTranslated,
      arrival,
      depart,
      wait,
      stay,
      rating,
    });

      // end 타입이 아니면 중단, end 타입이면 포함 후 종료
      if (type !== "end") {
        break;
      }
      return rows;
    }

    now = departTime;
    prevDepart = now; // 다음 반복을 위해 업데이트
    const depart = toHM(now);

    const rating = poi?.rating ?? null;
    // 🔹 타입별로 name / nameKo / nameTranslated 결정
    let name, nameKo, nameTranslated;

    if (type === "start") {
      // 출발지: startInfo 사용
      ({ name, nameKo, nameTranslated } = startInfo);
    } else if (type === "end") {
      // 도착지: endInfo 사용
      ({ name, nameKo, nameTranslated } = endInfo);
    } else {
      // 일반/필수 방문지: POI에서 가져오기
      name = poi?.name || "";
      nameKo = poi?.nameKo ?? poi?.name ?? name;
      nameTranslated = poi?.nameTranslated ?? "";
    }

    const categoryKo = poi?.categoryKo ?? poi?.category ?? category;
    const categoryTranslated = poi?.categoryTranslated ?? "";

    rows.push({
      order: i + 1,
      name,
      nameKo,
      nameTranslated,
      category,
      categoryKo,
      categoryTranslated,
      arrival,
      depart,
      wait,
      stay,
      rating,
    });
          // end 타입이면 반드시 마지막이어야 함
        if (type === "end") {
          break;
        }
      }

  // 검증: 마지막 항목이 end인지 확인
  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1];
    const lastIdx = route[route.length - 1];
    const [lastType] = routeArray[lastIdx];
    if (lastType !== "end") {
      console.warn("⚠️ 일정의 마지막 항목이 호텔(도착지)이 아닙니다.");
    }
  }

  return rows;
}