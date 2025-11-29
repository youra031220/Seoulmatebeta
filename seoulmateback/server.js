import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateWeights, validateWeights } from './agents/weightAgent.js';
import { scorePOIs } from './agents/scoringAgent.js';

function buildErrorResponse(message, error) {
  return {
    error: {
      message,
      detail: error?.message || String(error),
    },
  };
}

function buildPrefsForWeight(rawPrefs, rawContext) {
  const prefs = rawPrefs && typeof rawPrefs === "object" ? rawPrefs : {};
  const contextFromPrefs =
    prefs.context && typeof prefs.context === "object" ? prefs.context : {};
  const requestContext =
    rawContext && typeof rawContext === "object" ? rawContext : {};

  const safePrefs = prefs || {};

  const structuredPrefs = {
    ...safePrefs,
    poi: {
      mustVisit: safePrefs.poi?.mustVisit ?? [],
      likeThemes: safePrefs.poi?.likeThemes ?? [],
      dislikeThemes: safePrefs.poi?.dislikeThemes ?? [],
    },
    food: {
      likeCategories: safePrefs.food?.likeCategories ?? [],
      dislikeCategories: safePrefs.food?.dislikeCategories ?? [],
      priceLevel: safePrefs.food?.priceLevel ?? "medium",
    },
    time: {
      pace: safePrefs.time?.pace ?? safePrefs.pace ?? "normal",
      preferredHours: safePrefs.time?.preferredHours ?? [],
    },
    budget: {
      level: safePrefs.budget?.level ?? safePrefs.budgetLevel ?? "mid",
      maxPerMeal: safePrefs.budget?.maxPerMeal ?? null,
    },
  };

  return {
    ...structuredPrefs,
    context: { ...contextFromPrefs, ...requestContext },
  };
}

// 🔤 장소명/카테고리 다국어 변환 헬퍼 (Gemini 사용)
async function translatePoisForLanguage(pois, targetLang = "ko") {
  // 1) 유효성/언어 체크
  if (!Array.isArray(pois) || !pois.length) return pois;
  if (!targetLang || targetLang === "ko") return pois; // 한국어면 번역 불필요
  if (!genAIClient) {
    console.warn("⚠️ genAIClient 없음, 번역 생략");
    return pois;
  }

  try {
    const model = genAIClient.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    // 2) 프롬프트에 넣을 최소 정보만 구성
    const minimal = pois.map((p, idx) => ({
      idx,
      name: String(p.title || p.name || "")
        .replace(/<[^>]+>/g, "")
        .trim(),
      category: String(p.category || p.categoryType || "").trim(),
    }));

    const prompt = `
You are a translation helper for a travel itinerary web app.

- Input: JSON array of places (idx, name, category), where "name" and "category" are in Korean.
- Translate both "name" and "category" into language code "${targetLang}".
- Keep brand names (e.g. "Starbucks") as commonly used in that language.
- If something is already not Korean, you can keep it as is.
- Return ONLY valid JSON, no explanations, no comments.

Output format example:
[
  { "idx": 0, "name_translated": "Gyeongbokgung Palace", "category_translated": "Attractions > Palace" },
  { "idx": 1, "name_translated": "Naksan Park", "category_translated": "Park & Viewpoint" }
]

Input JSON:
${JSON.stringify(minimal, null, 2)}
    `;

    const result = await model.generateContent(prompt);
    const text = result?.response?.text() || "[]";

    let parsed = [];
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("❌ translatePoisForLanguage JSON parse error:", e?.message || e);
      return pois;
    }

    const map = new Map();
    for (const item of parsed) {
      if (typeof item.idx === "number") {
        map.set(item.idx, item);
      }
    }

    // 3) 원본 POI에 번역 필드를 붙여서 반환
    return pois.map((p, i) => {
      const tr = map.get(i) || {};
      const originalTitle = String(p.title || p.name || "").trim();

      return {
        ...p,
        // 원본 한글 제목은 그대로 유지 (p.title)
        titleTranslated:
          (tr.name_translated || tr.name || "").trim() || originalTitle,
        categoryTranslated:
          (tr.category_translated || tr.category || "").trim() ||
          String(p.category || p.categoryType || "").trim(),
      };
    });
  } catch (error) {
    console.error("⚠️ translatePoisForLanguage 실패, 원본 사용:", error?.message || error);
    return pois;
  }
}


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ===================== 환경변수 =====================
// 🔹 검색 OpenAPI (지역 검색용)
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

// 🔹 NCP Maps (지오코딩/역지오코딩용)
const NAVER_MAP_KEY_ID = process.env.NAVER_MAP_KEY_ID;
const NAVER_MAP_KEY = process.env.NAVER_MAP_KEY;

// 🔹 Gemini (여행 취향 분석용)
const RAW_GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_KEY = RAW_GEMINI_API_KEY ? RAW_GEMINI_API_KEY.trim() : "";

// 🔐 실제 키 값은 찍지 않고, 길이만 로그로 확인
if (RAW_GEMINI_API_KEY) {
  console.log("GEMINI KEY LOADED (length):", RAW_GEMINI_API_KEY.length);
} else {
  console.error("❌ GEMINI_API_KEY 환경변수가 비어 있습니다.");
}

if (!GEMINI_API_KEY) {
  console.error('❌ 환경변수 GEMINI_API_KEY(Gemini)을 설정하세요.');
}

// ✅ Gemini 클라이언트 초기화
let genAIClient;
try {
  if (GEMINI_API_KEY) {
    genAIClient = new GoogleGenerativeAI(GEMINI_API_KEY);
  } else {
    genAIClient = null;
  }
} catch (error) {
  console.error('❌ Gemini 클라이언트 초기화 실패:', error);
  genAIClient = null;
}

// ===================== 환경변수 체크 =====================
if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
  console.error('❌ NAVER_CLIENT_ID & SECRET이 설정되지 않음');
}
if (!NAVER_MAP_KEY_ID || !NAVER_MAP_KEY) {
  console.error('❌ NAVER_MAP_KEY_ID와 NAVER_MAP_KEY가 설정되지 않음');
}

// ===================== Gemini: 여행 취향 분석 =====================
async function analyzeTravelPreference(message, context = {}, requiredStopNames = []) {
  if (!genAIClient) {
    throw new Error("Gemini 클라이언트가 초기화되지 않았습니다.");
  }

  const modelName = "gemini-2.5-flash";

  const aiModel = genAIClient.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `
당신은 "여행 취향 분석 및 검색 키워드 생성기"입니다.

역할:
- 사용자의 설명과 현재 선택된 옵션(JSON)을 읽고,
- 여행 취향을 구조화하고,
- 네이버 지역/지도 검색에 바로 사용할 수 있는 검색어들을 생성합니다.

다음 JSON 형식으로만 답하세요 (필드는 모두 포함해야 합니다):

{
  "themes": [ "테마1", "테마2" ],
  "poiTags": [ "취향태그1", "취향태그2" ],
  "mustAvoid": [ "피해야 할 것1", "피해야 할 것2" ],
  "budgetLevel": "low | mid | high",
  "pace": "relaxed | normal | tight",
  "searchKeywords": [ "장소 타입 키워드1", "장소 타입 키워드2" ],
  "poiSearchQueries": [ "관광지 검색용 키워드1", "관광지 검색용 키워드2" ],
  "foodSearchQueries": [ "음식/카페 검색용 키워드1", "음식/카페 검색용 키워드2" ],
  "dietPreferences": [ "gluten_free", "vegan", "halal" ],
  "city": "도시 이름 또는 빈 문자열"
}

### 아주 중요한 제약 사항

- **절대** 다음과 같이 너무 일반적인 단어만 단독으로 사용하지 마세요:
  - "맛집", "카페", "명소", "데이트", "핫플레이스"
- 위 단어들을 쓰고 싶다면, 반드시 사용자의 취향을 반영해 구체적으로 만드세요.
  - 예: "야경 맛집", "가성비 맛집", "인스타 감성 카페", "야경 명소", "루프탑 바"
- 사용자의 취향이 문장에 명확히 들어가면, 그 표현을 반드시 키워드에 반영해야 합니다.
  - 예: 
    - "비싼 데는 별로 안가고 싶어" → "가성비 맛집", "저렴한 맛집", "합리적인 가격 식당"
    - "쉬엄쉬엄" → "한가로운 산책", "여유로운 산책 코스"
    - "야경이 멋진 곳" → "야경 명소", "야경 전망대", "야경 포토스팟"
    - "유명한 인스타감성 카페" → "인스타 감성 카페", "인스타그램 핫플 핫 카페", "감성 카페"

### 도시명 포함 여부

- **searchKeywords, poiSearchQueries, foodSearchQueries에는 도시 이름을 넣지 마세요.**
  - 예: "야경 명소", "야경 전망대", "인스타 감성 카페"
- "city" 필드에만 도시 이름을 넣으세요 (예: "서울").
- 실제 쿼리에서 도시는 백엔드 코드에서 앞에 붙일 것입니다.

### 필드별 설명 (요약)

1) themes: 전체 여행을 요약하는 큰 테마들.
2) poiTags: 장소 점수화에 쓸 취향 태그 (야경, 인스타 감성, 골목 산책, 레트로 등).
3) mustAvoid: 싫어하는 것들 (비싼 레스토랑, 사람 많은 곳 등).
4) budgetLevel: "low" | "mid" | "high".
5) pace: "relaxed" | "normal" | "tight".
6) searchKeywords: "감성 카페", "야경 명소", "전통시장"처럼 네이버 지역 검색용 장소 타입.
7) poiSearchQueries: "야경 명소", "야경 전망대", "골목 산책 스팟" 등 관광지 검색용.
8) foodSearchQueries: "가성비 맛집", "인스타 감성 카페", "브런치 카페" 등 음식/카페 검색용.
9) dietPreferences: ["gluten_free", "vegetarian", ...] 등.
10) city: "서울", "부산" 등. 없으면 ""(빈 문자열).

### 규칙 요약

- 반드시 위 JSON 구조 그대로 반환하세요.
- JSON 바깥에 어떤 텍스트도 쓰지 마세요.
- 사용자의 취향(예: "비싼 데는 싫고", "쉬엄쉬엄", "야경", "인스타 감성 카페")은
  - poiTags,
  - searchKeywords,
  - poiSearchQueries,
  - foodSearchQueries
  안에 반드시 녹여서 구체적으로 반영해야 합니다.
- searchKeywords / poiSearchQueries / foodSearchQueries에는 도시 이름을 넣지 마세요.

### 🚨 필수 방문지 처리 규칙

1. 필수 방문지(requiredStops)는 검색 키워드에 포함하지 마세요.
   - 사용자가 "경복궁 꼭 가고 싶어"라고 말해도,
   - searchKeywords, poiSearchQueries, foodSearchQueries에 "경복궁" 같은 필수 방문지 이름을 넣지 마세요.
   - 필수 방문지는 이미 확정된 장소이므로, 검색 키워드는 **그 외의 새로운 장소**를 찾는 데 사용해야 합니다.

2. 현재 필수 방문지 이름 목록(검색에서 제외해야 할 이름들)은 다음과 같습니다:
${JSON.stringify(requiredStopNames || [])}

------------------------

사용자의 여행 취향 설명:
"${message}"

현재 선택된 옵션(JSON):
${JSON.stringify(context, null, 2)}
  `.trim();

  try {
    const result = await aiModel.generateContent(prompt);
    const text = result?.response?.text(); // JSON 문자열일 것

    if (!text) {
      console.error("❌ Gemini 응답이 비어있음");
      throw new Error("Gemini가 응답을 반환하지 않았습니다.");
    }

    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch (e) {
      console.error("❌ Gemini JSON 파싱 실패:", text);
      throw new Error("Gemini가 올바른 JSON을 반환하지 않았습니다.");
    }
  } catch (e) {
    console.error("❌ Gemini API 호출 실패:", e);
    throw e; // Re-throw the error for the calling function to handle
  }
}

// ===================== 검색어 후처리 헬퍼 =====================

// 너무 범용적인 키워드는 제거
const GENERIC_KEYWORDS = new Set(["맛집", "카페", "명소", "관광지", "데이트", "핫플레이스"]);

// Poi/Food 쿼리 개수 상한 (Rate limit 방지용)
const MAX_POI_QUERIES = 15;
const MAX_FOOD_QUERIES = 15;

function isTooGenericKeyword(kw) {
  if (!kw) return true;
  const trimmed = kw.trim();

  // 길이가 너무 짧으면 제거
  if (trimmed.length <= 1) return true;

  // "맛집" 이런 단어 하나만 있으면 제거
  if (GENERIC_KEYWORDS.has(trimmed)) return true;

  // "서울 맛집" 같이 도시 + generic만 있는 것도 제거 (단어 2개 이하 + generic 포함)
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 2 && parts.some((p) => GENERIC_KEYWORDS.has(p))) {
    return true;
  }

  return false;
}

function filterGenericKeywords(keywords) {
  return (keywords || []).filter((kw) => !isTooGenericKeyword(kw));
}

// 🍽️ 음식/카페 관련 키워드 판별
function isFoodKeyword(kw) {
  if (!kw) return false;
  const s = kw.toLowerCase();
  return /(맛집|식당|카페|브런치|디저트|베이커리|레스토랑|분식|포차|고기|고깃집|비건|채식)/i.test(
    s
  );
}

// 키워드 안에 이미 도시가 들어있으면 빼고, 앞에 한 번만 붙이기
function buildCityQuery(city, keyword) {
  const cityTrimmed = (city || "").trim();
  let kw = (keyword || "").trim();

  if (!cityTrimmed && !kw) return "";

  if (cityTrimmed && kw) {
    const cityRegex = new RegExp(cityTrimmed, "g");
    kw = kw.replace(cityRegex, "").trim();
  }

  if (!kw) return cityTrimmed;
  return `${cityTrimmed} ${kw}`.replace(/\s+/g, " ").trim();
}

// 네이버 item을 음식/카페/일반 POI로 분류
function classifyItem(item) {
  const category = `${item.category || ""} ${item.description || ""} ${item.title || ""}`;
  const lower = category.toLowerCase();

  // 카페 우선
  if (/카페|cafe|커피|디저트/.test(category)) {
    return "cafe";
  }

  // 음식점
  if (
    /음식점|식당|한식|양식|중식|일식|뷔페|레스토랑|고기|고깃집|치킨|피자|분식|패스트푸드|브런치|포차|포장마차/.test(
      category
    )
  ) {
    return "restaurant";
  }

  return "poi";
}

// Gemini prefs에서 실제 검색 쿼리들 뽑아내기
function buildSearchQueriesFromPreference(prefs, baseArea = "서울") {
  const city = (prefs?.city?.trim()) || (baseArea || "").trim() || "서울";

  // 1) 원본 키워드
  const poiKeywordsRaw = [
    ...(prefs?.poiSearchQueries || []),
    ...(prefs?.searchKeywords || []),
  ];

  const foodKeywordsRaw = [
    ...(prefs?.foodSearchQueries || []),
  ];

  // 2) Poi 키워드: generic 제거 + 음식 키워드는 제외
  let poiKeywords = filterGenericKeywords(poiKeywordsRaw).filter(
    (kw) => !isFoodKeyword(kw)
  );

  // 3) Food 키워드: 원래 foodSearchQueries + Poi 쪽에 잘못 섞인 음식 키워드를 같이 모음
  let foodKeywords = filterGenericKeywords([
    ...foodKeywordsRaw,
    ...poiKeywordsRaw.filter(isFoodKeyword),
  ]);

  // 4) 예산이 low면 가성비 키워드 자동 추가
  if (prefs?.budgetLevel === "low") {
    foodKeywords.push("가성비 맛집", "저렴한 맛집", "현지인 가는 맛집");
  }

  // 5) 완전 비어 있으면 최소 fallback (그래도 generic은 아님)
  if (poiKeywords.length === 0) {
    poiKeywords = ["야경 명소", "전망대"];
  }
  if (foodKeywords.length === 0) {
    foodKeywords = ["가성비 맛집"];
  }

  // 6) 도시 붙이고, 빈 문자열 제거 + 중복 제거 + 개수 제한
  const poiQueries = Array.from(
    new Set(
      poiKeywords
        .map((kw) => buildCityQuery(city, kw))
        .filter((q) => q && q.length > 0)
    )
  ).slice(0, MAX_POI_QUERIES);

  const foodQueries = Array.from(
    new Set(
      foodKeywords
        .map((kw) => buildCityQuery(city, kw))
        .filter((q) => q && q.length > 0)
    )
  ).slice(0, MAX_FOOD_QUERIES);

  return { city, poiQueries, foodQueries };
}

// ===================== 네이버 지역 검색 헬퍼 =====================
async function naverLocalSearch(query, display = 30) {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    const credentialError = new Error("NAVER API 자격 증명이 없습니다.");
    console.error("❌ Naver local search credential error");
    throw credentialError;
  }

  try {
    const response = await axios.get(
      "https://openapi.naver.com/v1/search/local.json",
      {
        params: { query, display, start: 1, sort: "random" },
        headers: {
          "X-Naver-Client-Id": NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
        },
      }
    );
    return response?.data?.items || [];
  } catch (error) {
    console.error("❌ Naver local search error:", error.response?.data || error.message);
    throw error;
  }
}

// ===================== API 라우트 =====================

// 1️⃣ 키워드 검색 API (검색 OpenAPI - 지역 검색)
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({ items: [] });
    }

    console.log(`🔍 검색: "${q}"`);

    const response = await axios.get('https://openapi.naver.com/v1/search/local.json', {
      params: {
        query: q,
        display: 10,
        start: 1,
        sort: 'random',
      },
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    });

    res.json({ items: response?.data?.items || [] });
  } catch (error) {
    console.error('❌ Search error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// 2️⃣ 주소→좌표 변환 (지오코딩)
app.get('/api/geocode', async (req, res) => {
  try {
    const { addr } = req.query;
    if (!addr || addr.trim() === '') {
      return res.json({ addresses: [] });
    }

    console.log(`📍 지오코딩: "${addr}"`);

    const response = await axios.get(
      'https://maps.apigw.ntruss.com/map-geocode/v2/geocode',
      {
        params: { query: addr },
        headers: {
          'X-NCP-APIGW-API-KEY-ID': NAVER_MAP_KEY_ID,
          'X-NCP-APIGW-API-KEY': NAVER_MAP_KEY,
        },
      }
    );

    res.json({ addresses: response?.data?.addresses || [] });
  } catch (error) {
    console.error('❌ Geocode error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// 3️⃣ 좌표→주소 변환 (역지오코딩)
app.get('/api/reverse-geocode', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.json({ results: [] });
    }

    console.log(`🗺️ 역지오코딩: (${lat}, ${lon})`);

    const response = await axios.get(
      'https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc',
      {
        params: {
          coords: `${lon},${lat}`,
          orders: 'roadaddr,addr',
          output: 'json',
        },
        headers: {
          'X-NCP-APIGW-API-KEY-ID': NAVER_MAP_KEY_ID,
          'X-NCP-APIGW-API-KEY': NAVER_MAP_KEY,
        },
      }
    );

    res.json(response?.data);
  } catch (error) {
    console.error('❌ Reverse geocode error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// 4️⃣ Gemini 여행 취향 JSON 분석 (구조화된 데이터 반환)
app.post("/api/travel-pref", async (req, res) => {
  try {
    const { message = "", context = {} } = req.body || {};

    if (!message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    console.log("🔹 /api/travel-pref 요청");

    let prefs;
    try {
      prefs = await analyzeTravelPreference(message, context, []);
    } catch (error) {
      console.error("❌ /api/travel-pref Gemini 실패:", error?.message || error);
      return res
        .status(500)
        .json(buildErrorResponse("취향 분석 중 오류가 발생했습니다.", error));
    }

    return res.json({ prefs });
  } catch (error) {
    console.error("❌ /api/travel-pref 처리 실패:", error?.message || error);
    return res
      .status(500)
      .json(buildErrorResponse("취향 분석 처리 중 오류가 발생했습니다.", error));
  }
});

// 5️⃣ 취향 + 지역 기반 장소 검색
app.post("/api/search-with-pref", async (req, res) => {
  try {
    // startPoint를 body에서 직접 받을 수도 있고, context 안에서 받을 수도 있게 처리
    const {
      baseArea = "",
      message = "",
      context = {},
      startPoint: bodyStartPoint,
      lang = "ko",  // 🔹 추가: 프론트에서 넘겨줄 언어 코드
    } = req.body || {};

    if (!baseArea.trim() || !message.trim()) {
      return res.status(400).json({ error: "baseArea와 message는 필수입니다." });
    }

    console.log("🔍 /api/search-with-pref 요청");

    // context에 포함된 필수 방문지 이름들을 추출해서 Gemini 프롬프트로 전달
    const requiredStopNames =
      (context?.requiredStops || [])
        .map((r) => r && r.name)
        .filter(Boolean);

    let prefs;
    try {
      prefs = await analyzeTravelPreference(message, context, requiredStopNames);
    } catch (error) {
      console.error("❌ Gemini 취향 분석 실패:", error?.message || error);
      return res
        .status(500)
        .json(
          buildErrorResponse(
            "취향 분석 중 외부 API 오류가 발생했습니다.",
            error
          )
        );
    }

    const safePrefs = prefs && typeof prefs === "object" ? prefs : {};
    const prefsForWeight = buildPrefsForWeight(safePrefs, context || {});
    const weights = generateWeights(prefsForWeight || {});
    const { valid, errors } = validateWeights(weights);
    if (!valid) console.warn("⚠️ Weight validation failed:", errors);
    console.log("⚖️ 가중치 생성 완료");

    // 2) 취향 기반 검색 쿼리 구성
    const { city, poiQueries, foodQueries } = buildSearchQueriesFromPreference(
      safePrefs,
      baseArea
    );

    console.log(`🔍 POI 검색 쿼리 ${poiQueries.length}개, Food ${foodQueries.length}개`);

    // 3) 네이버 지역 검색 수행
    const allResults = [];
    let foodResults = [];

    try {
      for (const q of poiQueries) {
        console.log("🔍 네이버 지역 검색(Poi):", q);
        const items = await naverLocalSearch(q, 10);
        allResults.push(...items);
      }

      for (const q of foodQueries) {
        console.log("🔍 네이버 지역 검색(Food):", q);
        const items = await naverLocalSearch(q, 10);
        foodResults.push(...items);
        allResults.push(...items);
      }
    } catch (error) {
      console.error("❌ 네이버 지역 검색 실패:", error?.message || error);
      return res
        .status(500)
        .json(
          buildErrorResponse(
            "외부 API 호출 중 오류가 발생했습니다.",
            error
          )
        );
    }

    // 4) 음식점이 하나도 없으면 fallback 검색으로 채우기
    const classifiedFood = foodResults.map((item) => ({
      ...item,
      categoryType: classifyItem(item),
    }));
    let restaurantCount = classifiedFood.filter(
      (i) => i.categoryType === "restaurant" || i.categoryType === "cafe"
    ).length;

    if (restaurantCount === 0) {
      const fallbackQuery = buildCityQuery(city, "가성비 맛집");
      console.log("🍚 음식점 Fallback 호출:", fallbackQuery);
      try {
        const fallbackItems = await naverLocalSearch(fallbackQuery, 10);
        fallbackItems.forEach((it) => allResults.push(it));
      } catch (error) {
        console.error("❌ 음식점 Fallback 실패:", error?.message || error);
        return res
          .status(500)
          .json(
            buildErrorResponse(
              "외부 API 호출 중 오류가 발생했습니다.",
              error
            )
          );
      }
    }

    // 5) 중복 제거 (전화번호 + 이름 기준)
    const uniqueMap = new Map();
    for (const item of allResults) {
      const key = `${item.telephone || ""}_${item.title || ""}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }

    // 6) 최종 결과에 categoryType 태그 붙여서 반환
    const pois = Array.from(uniqueMap.values()).map((item) => ({
      ...item,
      name: item.translatedName || item.title, // 영어/기본 이름
      nameKo: item.title,                      // 한국어 원래 이름

      categoryType: classifyItem(item),
    }));

    // 7) 스코어링 에이전트로 점수 계산 + 정렬
    const startPoint = bodyStartPoint || context?.startPoint || null; // { lat, lng } 형식이라고 가정

    // ✅ 디버깅용 로그 추가
    console.log("🔍 scorePOIs 호출 전:");
    console.log("  - pois 개수:", pois?.length);
    console.log("  - startPoint:", startPoint);
    console.log("  - weights:", weights);

    let scoredPOIs;
    try {
      scoredPOIs = scorePOIs(pois, safePrefs, weights, startPoint);
      console.log("✅ scorePOIs 성공, 결과:", scoredPOIs?.length);
    } catch (scoreError) {
      console.error("❌ scorePOIs 에러:", scoreError);
      console.error("❌ 스택:", scoreError.stack);
      throw scoreError;
    }
    // 편향 리포트(Phase C)를 위한 biasDetector 적용
    let biasReport = null;
    try {
      const { detectSearchBias } = await import("./utils/biasDetector.js");
      biasReport = detectSearchBias(
        scoredPOIs,
        context?.requiredStops || [],
        safePrefs.themes || []
      );
    } catch (e) {
      console.warn("⚠️ biasReport 생성 중 오류 (무시하고 진행):", e?.message || e);
    }

    // 🔤 언어에 맞춰 장소명/카테고리 번역 (ko 이면 생략)
    let poisForClient = scoredPOIs;
    try {
      poisForClient = await translatePoisForLanguage(scoredPOIs, lang);
    } catch (e) {
      console.warn("⚠️ POI 번역 실패, 원본 그대로 사용:", e?.message || e);
    }

    return res.json({ prefs: safePrefs, weights, city, pois: poisForClient, biasReport });
  } catch (error) {
    console.error("❌ /api/search-with-pref 처리 실패:", error?.message || error);
    return res
      .status(500)
      .json(
        buildErrorResponse(
          "취향 반영 장소 검색 중 오류가 발생했습니다.",
          error
        )
      );
  }
});
// 8️⃣ 취향 + 앵커 기반 부분 재추천 (/api/route/refine)
// - 기존 검색 결과와 상관없이, 현재 사용자가 마음에 들어한 장소(anchor)를 기준으로
//   근처 + 비슷한 테마의 후보를 다시 가져오는 API입니다.
// - 프론트에서는 일정이 만들어진 뒤, 특정 장소 카드에서
//   "이 근처 더 보기 / 비슷한 곳 추천" 버튼을 눌렀을 때 호출하는 용도로 사용할 수 있습니다.
app.post("/api/route/refine", async (req, res) => {
  try {
    const {
      baseArea = "",
      message = "",
      context = {},
      anchor = null,          // { name, lat, lon, category, rating }
      dislikedNames = [],     // 싫어요 한 장소 이름 목록 (string[])
    } = req.body || {};

    if (!baseArea.trim() || !message.trim()) {
      return res.status(400).json({ error: "baseArea와 message는 필수입니다." });
    }

    if (!anchor || !anchor.lat || !anchor.lon) {
      return res.status(400).json({ error: "anchor(기준 장소)의 lat/lon이 필요합니다." });
    }

    console.log("🧭 /api/route/refine 요청 (anchor):", anchor.name || "");

    // 1) 다시 한 번 취향 분석 (message + context 기반)
    let prefs;
    try {
      // refine에서는 필수 방문지를 별도로 다루지 않으므로 names는 빈 배열로 전달
      prefs = await analyzeTravelPreference(message, context, []);
    } catch (error) {
      console.error("❌ /api/route/refine Gemini 실패:", error?.message || error);
      return res
        .status(500)
        .json(
          buildErrorResponse(
            "취향 분석 중 외부 API 오류가 발생했습니다.",
            error
          )
        );
    }

    const safePrefs = prefs && typeof prefs === "object" ? prefs : {};
    const prefsForWeight = buildPrefsForWeight(safePrefs, context || {});
    const weights = generateWeights(prefsForWeight || {});
    const { valid, errors } = validateWeights(weights);
    if (!valid) console.warn("⚠️ Weight validation failed (refine):", errors);

    // 2) 취향 기반 검색 쿼리 구성 (기존 search-with-pref와 동일)
    const { city, poiQueries, foodQueries } = buildSearchQueriesFromPreference(
      safePrefs,
      baseArea
    );

    console.log(
      `🧭 refine 검색 쿼리 - POI ${poiQueries.length}개, Food ${foodQueries.length}개 (city=${city})`
    );

    // 3) 네이버 지역 검색 호출
    const allResults = [];
    let foodResults = [];

    try {
      for (const q of poiQueries) {
        console.log("🔍 [refine] 네이버 지역 검색(Poi):", q);
        const items = await naverLocalSearch(q, 10);
        allResults.push(...items);
      }

      for (const q of foodQueries) {
        console.log("🔍 [refine] 네이버 지역 검색(Food):", q);
        const items = await naverLocalSearch(q, 10);
        foodResults.push(...items);
        allResults.push(...items);
      }
    } catch (error) {
      console.error("❌ [refine] 네이버 지역 검색 실패:", error?.message || error);
      return res
        .status(500)
        .json(
          buildErrorResponse(
            "외부 API 호출 중 오류가 발생했습니다.",
            error
          )
        );
    }

    // 4) 음식점이 전혀 없으면 fallback
    const classifiedFood = foodResults.map((item) => ({
      ...item,
      categoryType: classifyItem(item),
    }));

    let restaurantCount = classifiedFood.filter(
      (i) => i.categoryType === "restaurant" || i.categoryType === "cafe"
    ).length;

    if (restaurantCount === 0) {
      const fallbackQuery = buildCityQuery(city, "가성비 맛집");
      console.log("🍚 [refine] 음식점 Fallback 호출:", fallbackQuery);
      try {
        const fallbackItems = await naverLocalSearch(fallbackQuery, 10);
        fallbackItems.forEach((it) => allResults.push(it));
      } catch (error) {
        console.error("❌ [refine] 음식점 Fallback 실패:", error?.message || error);
        return res
          .status(500)
          .json(
            buildErrorResponse(
              "외부 API 호출 중 오류가 발생했습니다.",
              error
            )
          );
      }
    }

    // 5) "싫어요" 한 이름들은 필터링
    const dislikeSet = new Set(
      (dislikedNames || [])
        .filter(Boolean)
        .map((n) => n.toString().trim().toLowerCase())
    );

    function stripHtmlTitle(title) {
      if (!title) return "";
      // 네이버 지역 검색 title은 <b>태그가 섞여 있으므로 제거
      return title.replace(/<[^>]+>/g, "").trim();
    }

    const filtered = allResults.filter((item) => {
      const plainTitle = stripHtmlTitle(item.title || "");
      const key = plainTitle.toLowerCase();
      if (!key) return false;
      if (dislikeSet.has(key)) return false;
      return true;
    });

    // 6) 중복 제거 + categoryType 태그 붙이기
    const uniqueMap = new Map();
    for (const item of filtered) {
      const key = `${item.telephone || ""}_${stripHtmlTitle(item.title || "")}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }

    const pois = Array.from(uniqueMap.values()).map((item) => ({
      ...item,
      name: item.translatedName || item.title, // 영어/기본 이름
      nameKo: item.title,                      // 한국어 원래 이름

      categoryType: classifyItem(item),
    }));

    // 7) 기준 anchor 주변 / 취향 기반 점수 계산
    const anchorPoint = { lat: anchor.lat, lng: anchor.lon };
    const anchorForScoring = {
      lat: anchor.lat,
      lon: anchor.lon,
      category: anchor.category || anchor.categoryType || null,
      rating: anchor.rating || null,
    };
    const scoredPOIs = scorePOIs(pois, safePrefs, weights, anchorPoint, anchorForScoring);

    // 8) 상위 N개만 반환 (너무 많지 않게)
    const TOP_N = 30;
    const top = scoredPOIs
      .slice()
      .sort((a, b) => (b._score ?? 0) - (a._score ?? 0))
      .slice(0, TOP_N);

    return res.json({
      prefs: safePrefs,
      weights,
      city,
      anchor: {
        name: anchor.name,
        lat: anchor.lat,
        lon: anchor.lon,
        category: anchor.category || null,
      },
      pois: top,
    });
  } catch (error) {
    console.error("❌ /api/route/refine 처리 실패:", error?.message || error);
    return res
      .status(500)
      .json(
        buildErrorResponse(
          "경로 재추천(refine) 중 오류가 발생했습니다.",
          error
        )
      );
  }
});

// 6️⃣ Gemini 여행 취향 요약 멘트 (자연어)
app.post("/api/travel-wish", async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const modelName = "gemini-2.5-flash";

    console.log("🔹 /api/travel-wish 요청:", message);

    const prompt = `
사용자가 말한 여행 취향:
"${message}"

현재 선택한 옵션:
${JSON.stringify(context, null, 2)}

You are a multilingual travel assistant.

The user wrote the following travel preference message:
"${message}"

Here is the user's selected options (JSON):
${JSON.stringify(context, null, 2)}

About travel themes (context.themes):
  - "shopping"    → shopping-focused
  - "culture"     → culture / exhibitions / history
  - "nature"      → nature / parks
  - "cafe_tour"   → cafe tour
  - "night_photo" → night view / photo spots
  - "healing"     → healing / relaxing
  - "kpop"        → K-pop related
  - "sns_hot"     → SNS-famous hot places

IMPORTANT ABOUT MESSAGE ORDER (context.turn):
- context.turn = 1  → this is the first user message about preferences.
- context.turn >= 2 → the user is answering previous questions or clarifying details.

Your rules:
1. Detect the language of the user's message ("${message}").
   Examples:
   - If the user writes Korean → respond in Korean
   - If the user writes English → respond in English
   - If the user writes Japanese → respond in Japanese
   - If the user writes Chinese → respond in Chinese
   - NEVER use Korean unless the user used Korean.
   - NEVER change the user's language.

2. Analyze the travel style based on both:
   - user's free-text message, and
   - the selected options including themes, meals, diet, required stops, and transport.

3. Write 3-5 friendly, natural sentences.

4. If context.themes is not empty, you MUST:
   - mention those themes at least once, translated naturally into the same language the user used,
   - briefly explain what kind of trip those themes suggest (e.g., shopping-heavy trip, night-view trip, cafe-hopping trip, etc.).

5. Follow-up question rules:
   - If context.turn = 1 AND the user's message is vague, you MAY ask **one block** of short follow-up questions (1–3 questions).
   - If context.turn >= 2, you should normally NOT ask new questions, unless the user's message is still extremely vague.
   - NEVER ask follow-up questions more than once in a row.
   - Follow-up questions must be concise, friendly, and clearly separated.

   When you do need to ask follow-up questions (context.turn = 1):
   You MAY ask things like:
   • what kind of places they imagine for each chosen theme  
   • what type of atmosphere, budget, or walking level they prefer  
   • whether they have specific Seoul areas or tourist spots in mind  

6. If context.requiredStops is not empty, you MUST:
   - mention these places naturally in the user's language,
   - acknowledge that the user definitely wants to include them,
   - If context.turn = 1, you MAY ask 1-2 follow-up questions such as:
       • what time they prefer to visit those must-visit places  
       • whether they want a brief visit or a longer stay  
   - If context.turn >= 2, DO NOT ask more questions about required stops unless absolutely necessary.

Output only the final answer in the user's language.
No explanations. No JSON. No system messages.
 
    `;

    if (!genAIClient) {
      return res.status(500).json({
        error: "Gemini 클라이언트가 초기화되지 않았습니다.",
      });
    }

    const aiModel = genAIClient.getGenerativeModel({ model: modelName });

    const result = await aiModel.generateContent(prompt);
    const reply = result?.response?.text();

    res.json({ reply });

  } catch (error) {
    console.error("❌ Gemini error:", error.response?.data || error.message || error);
    res.status(500).json({
      error: "Gemini API 호출 오류",
      detail: error.response?.data || error.message || String(error),
    });
  }
});

// 7️⃣ 네이버 Directions API 기반 실제 경로 계산
app.post("/api/route", async (req, res) => {
  try {
    const { waypoints, option = "traoptimal" } = req.body || {};

    // waypoints 최소 2개(출발/도착) 없으면 에러
    if (!Array.isArray(waypoints) || waypoints.length < 2) {
      return res.status(400).json({
        success: false,
        error: "waypoints는 최소 2개(출발/도착)가 필요합니다.",
      });
    }

    if (!NAVER_MAP_KEY_ID || !NAVER_MAP_KEY) {
      console.error("❌ NAVER_MAP_KEY_ID 또는 NAVER_MAP_KEY 미설정");
      return res.status(500).json({
        success: false,
        error: "네이버 지도 API 키가 설정되지 않았습니다.",
      });
    }

    // Naver Directions 15: 경도,위도 순서 문자열로 변환
    const points = waypoints.map((w) => `${w.lon},${w.lat}`);

    const start = points[0];
    const goal = points[points.length - 1];
    const via = points.slice(1, -1); // 중간 경유지

    const params = {
      start,
      goal,
      option, // traoptimal 등
    };

    if (via.length > 0) {
      params.waypoints = via.join("|");
    }

    console.log("🚗 Directions API 호출 params:", params);

    const response = await axios.get(
      "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving",
      {
        params,
        headers: {
          "X-NCP-APIGW-API-KEY-ID": NAVER_MAP_KEY_ID,
          "X-NCP-APIGW-API-KEY": NAVER_MAP_KEY,
        },
      }
    );

    const data = response?.data;

    // 응답 구조: data.route.traoptimal[0] 기준으로 사용
    const routeList = data?.route?.[option] || data?.route?.traoptimal;
    const firstRoute = Array.isArray(routeList) ? routeList[0] : null;

    if (!firstRoute) {
      console.error("❌ Directions 응답에 route가 없음:", data);
      return res.status(500).json({
        success: false,
        error: "Directions API 응답에 경로가 없습니다.",
      });
    }

    const summary = firstRoute.summary || {};
    const distance = summary.distance ?? 0;
    const duration = summary.duration ?? 0;
    const path = firstRoute.path || [];

    // section 정보가 있으면 가볍게 변환 (없으면 빈 배열)
    const sectionsRaw = firstRoute.section || summary.section || [];
    const sections = Array.isArray(sectionsRaw)
      ? sectionsRaw.map((s, idx) => ({
          start: s.pointIndex?.[0] ?? 0,
          end: s.pointIndex?.[1] ?? 0,
          distance: s.distance ?? 0,
          duration: s.duration ?? 0,
          index: idx,
        }))
      : [];

    return res.json({
      success: true,
      route: {
        distance,
        duration,
        path, // [ [lon,lat], ... ]
        sections,
      },
    });
  } catch (error) {
    console.error(
      "❌ /api/route error:",
      error.response?.data || error.message || error
    );
    return res.status(500).json({
      success: false,
      error: "네이버 Directions API 호출 중 오류",
      detail: error.response?.data || error.message || String(error),
    });
  }
});

// ===================== 서버 시작 =====================
app.listen(PORT, () => {
  console.log(`\n🚀 백엔드 서버 시작!`);
  console.log(`📍 주소: http://localhost:${PORT}`);
  console.log(`🔮 Gemini 연동됨 (model: gemini-2.0-flash)`);
  console.log(`🌐 네이버 지도 API 연동됨\n`);
});
