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
  ko: { code: "ko", label: "한국어 사용자 선호", flag: "🇰🇷" },
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

// --- 필수 방문지 중복 제거용 강한 정규화 함수 ---
function normalizeTitleForDedup(name = "") {
  return String(name)
    .normalize("NFD")                // 한글 자모 분리 제거 준비
    .replace(/[\u0300-\u036f]/g, "") // 자모/발음기호 제거
    .replace(/<[^>]+>/g, "")         // <b> 같은 HTML 태그 제거
    .replace(/\s+/g, "")             // 모든 공백 제거
    .replace(/[^가-힣a-zA-Z0-9]/g, "") // 한글/영문/숫자 외 제거
    .toLowerCase();
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
  ko: new Set([
  normalizePlaceName("성수동카페거리"),
  normalizePlaceName("연남동 연트럴파크"),
  normalizePlaceName("망원시장"),
  normalizePlaceName("합정 메세나폴리스"),
  normalizePlaceName("여의도 한강공원"),
  normalizePlaceName("반포 한강공원"),
  normalizePlaceName("서촌 마을"),
  normalizePlaceName("삼청동길"),
  normalizePlaceName("을지로 노가리 골목"),
  normalizePlaceName("을지로 카페거리"),
  normalizePlaceName("혜화 대학로"),
  normalizePlaceName("상수동 카페거리"),
  normalizePlaceName("홍대 걷고싶은거리"),
  normalizePlaceName("더현대 서울"),
  normalizePlaceName("코엑스 별마당 도서관"),
  normalizePlaceName("압구정 로데오거리"),
  normalizePlaceName("청담 가로수길"),
  normalizePlaceName("석촌호수"),
  normalizePlaceName("롯데타워 전망대"),
  normalizePlaceName("뚝섬 서울숲"),
  normalizePlaceName("잠실 롯데월드몰"),
  normalizePlaceName("익선동 한옥거리"),
  normalizePlaceName("한남동 카페거리"),
  normalizePlaceName("노량진 수산시장"),
  normalizePlaceName("광장시장"),
  normalizePlaceName("서울식물원"),
  normalizePlaceName("양재 시민의숲"),
  normalizePlaceName("북서울 꿈의 숲"),
  normalizePlaceName("디뮤지엄 성수"),
  normalizePlaceName("아모레 성수") // 30
]),

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
    // 2) 필수 방문지 중복 제거 (필수 방문지는 POI 후보에서 제외)
  //  - 네이버 title에는 <b>태그가 들어있고, 역/점/카페 등 꼬리가 붙어 있을 수 있으므로
  //    강한 정규화 함수를 사용해서 비교한다.
  const requiredNames = new Set(
    (requiredStops || [])
      .map((r) => normalizeTitleForDedup(r.name))
      .filter(Boolean)
  );

  const dedupedPOIs = basePOIs.filter((poi) => {
    const rawName = poi.title || poi.name;
    const poiName = normalizeTitleForDedup(rawName);
    if (!poiName) return false;

    for (const reqName of requiredNames) {
      if (!reqName) continue;

      // 1) 완전히 같으면 제외
      if (poiName === reqName) return false;

      // 2) 한쪽이 다른 쪽을 포함하는 경우 (경복궁 / 경복궁역 / 경복궁돌담길)
      if (poiName.includes(reqName) || reqName.includes(poiName)) {
        return false;
      }
    }

    return true; // 필수 방문지와 겹치지 않는 POI만 남긴다
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
 * ❗시간/식사/최대이동제약으로 POI를 버리지 않고,
 *   들어온 POI는 전부 경로에 포함시키는 단순 버전입니다.
 */
/**
 * 간단한 그리디 알고리즘으로
 * - 출발지(startPoint) → 필수 방문지(requiredStops) → 선택 POI(pois) → 도착지(endPoint)
 * 순서를 정하고, 각 구간 이동시간과 체류시간을 계산합니다.
 *
 * ⏱ 시간/식사 시간대 제약은 쓰지 않고,
 * 🍽 순서 제약만 적용합니다:
 *   - 음식점 사이에는 최소 1개 이상의 관광지(spot)가 있어야 함
 *   - 카페는 적어도 한 번 이상 음식점을 다녀온 후에만 등장 가능
 *   - 카페는 "마지막 음식점 이후 관광지 1개 이상" 지난 뒤에만 등장 가능
 *   - 카페가 연속으로 나오지 않음
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
  mealOptions = {} // { breakfast, lunch, dinner, cafe } - 여기서는 사용 안 함
) {
  if (!start?.lat || !end?.lat) {
    throw new Error("start / end 좌표가 없습니다.");
  }

  // 🔹 pace 추론
  const pace =
    weights?.pace?.stayTimeMultiplier != null
      ? weights.pace.stayTimeMultiplier >= 1.2
        ? "relaxed"
        : weights.pace.stayTimeMultiplier <= 0.8
        ? "tight"
        : "normal"
      : "normal";

  // 🔹 카테고리를 논리 타입으로 정규화: restaurant / cafe / spot
  const toLogicalType = (catRaw) => {
    const c = (catRaw || "").toString().toLowerCase();

    if (
      c.includes("restaurant") ||
      c.includes("food") ||
      c.includes("dining") ||
      c.includes("식당") ||
      c.includes("음식점") ||
      c.includes("맛집")
    ) {
      return "restaurant";
    }

    if (
      c.includes("cafe") ||
      c.includes("coffee") ||
      c.includes("카페") ||
      c.includes("커피") ||
      c.includes("디저트")
    ) {
      return "cafe";
    }

    return "spot"; // 그 외는 전부 관광지 취급
  };

  // 1) 필수 방문지 → POI 형태로 변환 + isMustVisit 플래그
  const requiredAsPOIs = (requiredStops || [])
    .filter((r) => r.lat && r.lon)
    .map((r) => {
      const category = r.category || "required";
      const calculatedStayTime = getStayTime(category, pace, weights);

      return {
        // 기본 이름
        name: r.name || "필수 방문지",

        // 한글/영문 이름 모두 보존
        nameKo: r.nameKo || r.name || "필수 방문지",
        nameTranslated: r.nameTranslated || "",

        lat: r.lat,
        lon: r.lon,
        stay_time: r.stay_time ?? calculatedStayTime,

        // 카테고리도 한글/영문 둘 다 보존
        category,
        categoryKo: r.categoryKo || category,
        categoryTranslated: r.categoryTranslated || "",

        rating: r.rating ?? "-",
        isRequired: true,
        isMustVisit: true, // 필수 방문지는 항상 must
      };
    });

  // 2) 필수 방문지와 pois 사이 중복 제거 (좌표+이름 기준)
  const requiredKeySet = new Set(
    requiredAsPOIs.map((p) => {
      const name = (p.name || p.nameKo || "").trim().toLowerCase();
      const lat = Number(p.lat).toFixed(6);
      const lon = Number(p.lon).toFixed(6);
      return `${lat}_${lon}_${name}`;
    })
  );

  const optionalPOIsRaw = (pois || []).filter((p) => {
    if (!p.lat || !p.lon) return false;

    const name = (p.name || p.nameKo || "").trim().toLowerCase();
    const lat = Number(p.lat).toFixed(6);
    const lon = Number(p.lon).toFixed(6);
    const key = `${lat}_${lon}_${name}`;

    // required에 이미 있는 애는 optional에서 제외
    return !requiredKeySet.has(key);
  });

  const optional = optionalPOIsRaw.map((p) => {
    const category = p.category || p.categoryType || "spot";
    const calculatedStayTime = getStayTime(category, pace, weights);

    return {
      // 기본 표시 이름
      name: p.name,

      // 한글/영문 이름 모두 전달
      nameKo: p.nameKo || p.name,
      nameTranslated: p.nameTranslated || "",

      lat: p.lat,
      lon: p.lon,
      stay_time: p.stay_time ?? calculatedStayTime,

      // 카테고리도 한글/영문 정보 유지
      category,
      categoryKo: p.categoryKo || category,
      categoryTranslated: p.categoryTranslated || "",

      rating: p.rating ?? "-",
      isRequired: false,
      isMustVisit: !!p.isMustVisit, // App.jsx에서 넘긴 플래그 (사용자 선택)
    };
  });

  // 3) start + (필수 + 선택) + end 노드 구성
  const startNode = { lat: start.lat, lon: start.lon };
  const endNode = { lat: end.lat, lon: end.lon };

  const nodes = [];

  // index 0: start
  nodes.push({
    type: "start",
    lat: startNode.lat,
    lon: startNode.lon,
    poi: null,
    isMustVisit: false,
  });

  // 1..k: 필수 + 선택
  requiredAsPOIs.forEach((p) =>
    nodes.push({
      type: "poi",
      lat: p.lat,
      lon: p.lon,
      poi: p,
      isMustVisit: !!p.isMustVisit,
    })
  );
  optional.forEach((p) =>
    nodes.push({
      type: "poi",
      lat: p.lat,
      lon: p.lon,
      poi: p,
      isMustVisit: !!p.isMustVisit,
    })
  );

  // 마지막: end
  nodes.push({
    type: "end",
    lat: endNode.lat,
    lon: endNode.lon,
    poi: null,
    isMustVisit: false,
  });

  const routeArray = nodes.map((node) => [node.type, node]);
  const n = routeArray.length;

  // 4) Greedy + "점수 기반" 순서 제약 (soft constraints)
  const route = [0]; // 시작 인덱스
  const waits = {};
  const stays = {};

  let currentIdx = 0;
  let now = startMin;

  const remaining = new Set();
  for (let i = 1; i < n - 1; i++) {
    remaining.add(i); // 1..n-2: 모든 POI (필수+선택)
  }

  waits[0] = 0;
  stays[0] = 0;

  // 🔹 순서 상태
  let lastVisitType = "start"; // "start" | "restaurant" | "cafe" | "spot"
  let hasVisitedRestaurant = false;
  let sinceLastRestaurantSpotCount = 0; // 마지막 음식점 이후 지나온 spot 수

  while (remaining.size) {
    const [, curNode] = routeArray[currentIdx];

    let bestIdx = null;
    let bestScore = -Infinity;
    let bestLeg = 0;

    for (const idx of remaining) {
      const [, cand] = routeArray[idx];
      const poi = cand?.poi || {};
      const logicalType = toLogicalType(
        poi.category || poi.categoryType || "spot"
      );
      const isMustVisit = !!poi.isMustVisit;

      const leg = travelMinutes(
        curNode.lat,
        curNode.lon,
        cand.lat,
        cand.lon
      );

      // === 점수 계산 ===
      // 기본: 거리 짧을수록 좋게 (음수)
      let score = -leg;

      // 1) 내가 직접 고른 곳(필수 / 선택 isMustVisit)에는 보너스
      if (isMustVisit) {
        score += 40; // mustVisit이면 무조건 높은 점수
      }

      // 2) 순서 패턴 보정 (soft penalty/bonus)
      if (logicalType === "restaurant") {
        // 연속 식당은 별로 → 강한 패널티
        if (lastVisitType === "restaurant") {
          score -= 80;
        } else {
          // 관광지/출발 뒤에 오는 식당은 예쁨
          score += 15;
        }

        // 이미 한 번 식당 갔는데, 그 이후 spot 없이 또 식당 → 페널티
        if (hasVisitedRestaurant && sinceLastRestaurantSpotCount === 0) {
          score -= 25;
        }
      } else if (logicalType === "cafe") {
        // 음식점 전 카페는 되도록 피하기
        if (!hasVisitedRestaurant) {
          score -= 40;
        } else if (sinceLastRestaurantSpotCount === 0) {
          // 식당 바로 뒤 카페보다는, 식당-관광지-카페 패턴 선호
          score -= 20;
        } else {
          score += 10;
        }

        // 카페 연속도 살짝 페널티
        if (lastVisitType === "cafe") {
          score -= 50;
        }
      } else if (logicalType === "spot") {
        // 식당 → 관광지 패턴 선호
        if (lastVisitType === "restaurant") {
          score += 10;
        }
        // 카페 뒤에는 관광지도 무난
        if (lastVisitType === "cafe") {
          score += 5;
        }
      }

      // === 최고 점수 후보 갱신 ===
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
        bestLeg = leg;
      }
    }

    // 이론상 remaining.size > 0 이면 항상 뭔가는 선택됨
    if (bestIdx == null) {
      // 안전장치: 점수 계산에 뭔가 이상 있으면 아무거나 하나 고른다
      bestIdx = remaining.values().next().value;
      const [, cand] = routeArray[bestIdx];
      bestLeg = travelMinutes(
        curNode.lat,
        curNode.lon,
        cand.lat,
        cand.lon
      );
    }

    const [, nextNode] = routeArray[bestIdx];
    const poi = nextNode.poi || {};
    const categoryRaw = poi.category || poi.categoryType || "spot";
    const logicalTypeChosen = toLogicalType(categoryRaw);

    const stay = Math.max(
      10,
      Math.round(
        poi.stay_time ?? getStayTime(categoryRaw || "spot", pace, weights)
      )
    );

    waits[bestIdx] = bestLeg;
    stays[bestIdx] = stay;

    now = now + bestLeg + stay;
    route.push(bestIdx);
    remaining.delete(bestIdx);
    currentIdx = bestIdx;

    // 🔄 순서 상태 업데이트
    if (logicalTypeChosen === "restaurant") {
      hasVisitedRestaurant = true;
      sinceLastRestaurantSpotCount = 0;
      lastVisitType = "restaurant";
    } else if (logicalTypeChosen === "cafe") {
      lastVisitType = "cafe";
      // spot 카운트는 유지
    } else {
      // spot
      lastVisitType = "spot";
      if (hasVisitedRestaurant) {
        sinceLastRestaurantSpotCount += 1;
      }
    }
  }

  // 5) 마지막에 호텔(도착지) 붙이기 — 뒤 POI 자르지 않음
  const lastIdx = route[route.length - 1];
  const [, lastNode] = routeArray[lastIdx];
  const endIdx = n - 1;
  const [, endNode2] = routeArray[endIdx];

  const legToEnd = travelMinutes(
    lastNode.lat,
    lastNode.lon,
    endNode2.lat,
    endNode2.lon
  );

  waits[endIdx] = legToEnd;
  stays[endIdx] = 0;
  route.push(endIdx);

  return { routeArray, route, waits, stays };
}



/* ===================== 일정 생성 (시간표) ===================== */

/**
 * routeArray, route, waits, stays, 시간 범위를 이용해
 * 화면에서 사용하는 schedule 배열을 생성합니다.
 *
 * ❗endMin(종료 시간)을 넘더라도 일정을 자르지 않고
 *   전부 표시하는 단순 버전입니다.
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

  // 출발/도착 이름 정규화
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

  for (let i = 0; i < route.length; i++) {
    const idx = route[i];
    const [type, node] = routeArray[idx];
    const poi = node.poi || null;

    const categoryBase =
      type === "start"
        ? "출발"
        : type === "end"
        ? "도착"
        : poi?.category || "";

    const wait = waits[idx] || 0;

    // 도착 시간 계산 (이전 출발시간보다 빠르지 않게 보정)
    const arrivalTime = Math.max(prevDepart, now + wait);
    now = arrivalTime;
    const arrival = toHM(now);

    const stay = stays[idx] || 0;
    const departTime = now + stay;
    const depart = toHM(departTime);

    const rating = poi?.rating ?? null;

    // 타입별로 name / nameKo / nameTranslated 결정
    let name, nameKo, nameTranslated;

    if (type === "start") {
      ({ name, nameKo, nameTranslated } = startInfo);
    } else if (type === "end") {
      ({ name, nameKo, nameTranslated } = endInfo);
    } else {
      name = poi?.name || "";
      nameKo = poi?.nameKo ?? poi?.name ?? name;
      nameTranslated = poi?.nameTranslated ?? "";
    }

    const categoryKo = poi?.categoryKo ?? poi?.category ?? categoryBase;
    const categoryTranslated = poi?.categoryTranslated ?? "";

    rows.push({
      order: i + 1,
      name,
      nameKo,
      nameTranslated,
      category: categoryBase,
      categoryKo,
      categoryTranslated,
      arrival,
      depart,
      wait,
      stay,
      rating,
    });

    now = departTime;
    prevDepart = departTime;
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
