import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  selectPOIs,
  optimizeRoute,
  generateSchedule,
} from "./planner/routePlanner";

import LocationSearch from "./components/LocationSearch/LocationSearch";
import RequiredStops from "./components/RequiredStops/RequiredStops";
import Header from "./components/Header/Header";
import "./App.css";

export default function App() {

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "ko";   // 🔹 이 줄만 추가

  // 🔹 번역 + 한국어 표기용 헬퍼 (App 컴포넌트 안에!)
  const formatPlaceName = (poi) => {
    if (!poi) return "";

    const ko = poi.nameKo || poi.name || "";
    const tr = poi.nameTranslated || "";

    // 한국어 UI면 그냥 한글만
    if (currentLang === "ko") {
      return ko;
    }

    // 번역이 없거나, 번역이랑 한글이 같으면 한글만
    if (!tr || tr === ko) {
      return ko;
    }

    // 예: "Gyeongbokgung Palace (경복궁)"
    return `${tr} (${ko})`;
  };

  const formatCategory = (poiCategoryTranslated, poiCategoryKo) => {
    const ko = poiCategoryKo || poiCategoryTranslated || "";
    const tr = poiCategoryTranslated || "";

    if (currentLang === "ko") return ko;
    if (!tr || tr === ko) return ko;

    // 번역만 보여주고 싶으면 `return tr;`
    // 번역 + 한글 같이 보고 싶으면:
    return `${tr} / ${ko}`;
  };

  /** 출발 / 도착 */
  const [startPoint, setStartPoint] = useState(null); // {name, lat, lon}
  const [endPoint, setEndPoint] = useState(null);
  const [sameStartEnd, setSameStartEnd] = useState(false); // 출발·도착 동일 여부

  /** 필수 방문지 */
  const [requiredStops, setRequiredStops] = useState([]);

  /** 결과 */
  const [plan, setPlan] = useState(null);
  const [statusKey, setStatusKey] = useState("");

  /** 지도 관련 */
  const mapRef = useRef(null);
  const mapDivRef = useRef(null);
  const planMarkersRef = useRef([]);
  const polylineRef = useRef(null);
  const seMarkersRef = useRef([]);
  const requiredMarkersRef = useRef([]);
  const requiredInfoWindowRef = useRef(null);

  /** 여행 취향 입력 */
  const [wishText, setWishText] = useState(""); // 입력창 내용
  const [wishLog, setWishLog] = useState([]); // 보관용

  /** 끼니 선택 */
  const [breakfast, setBreakfast] = useState(false);
  const [lunch, setLunch] = useState(true);
  const [dinner, setDinner] = useState(true);
  const [cafe, setCafe] = useState(false);

  /** 끼니 버튼 hover 상태 */
  const [hoveredMeal, setHoveredMeal] = useState(null);

  /** 선호 이동수단 */
  const [transportMode, setTransportMode] = useState("public"); // "walk" | "public" | "car"
  const [hoveredTransport, setHoveredTransport] = useState(null);

  /** 식단 제약 */
  const [dietPrefs, setDietPrefs] = useState([]); // ["halal", "vegan", "kosher", "gluten_free", "non_alcohol"]
  const [hoveredDiet, setHoveredDiet] = useState(null);

  /** 여행 테마 (최대 3개 선택) */
  const [themes, setThemes] = useState([]); // ["shopping","culture","nature","cafe_tour","night_photo","healing","kpop","sns_hot"]
  const [hoveredTheme, setHoveredTheme] = useState(null);

  /** 대기 선호 */
  const [waitTolerance, setWaitTolerance] = useState("medium"); // "low" | "medium" | "high"
  const [hoveredWait, setHoveredWait] = useState(null);

  /** 여행 페이스 (여유/보통/알차게) */
  const [pace, setPace] = useState("normal"); // relaxed | normal | tight

  /** 이동 / 장소 옵션 */
  const [maxLeg, setMaxLeg] = useState("60"); // 구간당 최대 이동시간(분)
  const [numPlaces, setNumPlaces] = useState("6"); // 총 방문 장소 수

  /** 시간 설정 (문자열로 관리 → 0 고정 문제 해결) */
  const [startHour, setStartHour] = useState("9");
  const [endHour, setEndHour] = useState("18"); // 24까지 허용

  /** 여행에 있어서 바라는 게 있나요? 도움말 호버 */
  const [showWishHelp, setShowWishHelp] = useState(false);

  /** Send 버튼 호버 */
  const [isSendHover, setIsSendHover] = useState(false);

  /** 네이버 검색 기반 POI (실제 장소 목록) */
  const [searchPois, setSearchPois] = useState([]);
  
  /** 백엔드에서 받은 가중치 (체류시간 계산용) */
  const [weights, setWeights] = useState(null);
  
  /** refine API 호출용 상태 */
  const [refineLoading, setRefineLoading] = useState(false);

  


  /** 지도 초기화 */
  useEffect(() => {
    if (!mapDivRef.current) return;
    if (!window.naver?.maps) {
      console.error("Naver Maps SDK 로드 실패");
      return;
    }

    mapRef.current = new window.naver.maps.Map(mapDivRef.current, {
      center: new window.naver.maps.LatLng(37.5665, 126.978),
      zoom: 12,
    });
  }, []);

  /** 출발/도착 마커 */
  useEffect(() => {
    if (!mapRef.current) return;

    // 기존 마커 제거
    seMarkersRef.current.forEach((m) => m.setMap(null));
    seMarkersRef.current = [];

    const map = mapRef.current;

    // 출발·도착 동일 → 통합 마커 1개만
    if (sameStartEnd && startPoint?.lat && startPoint?.lon) {
      const pos = new window.naver.maps.LatLng(startPoint.lat, startPoint.lon);

      seMarkersRef.current.push(
        new window.naver.maps.Marker({
          map,
          position: pos,
          title: startPoint.name,
          icon: {
            content: `
              <div style="
                position: relative;
                transform: translate(-50%, -100%);
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                background: linear-gradient(135deg,#6366f1,#ec4899);
                color: #fff;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 700;
                box-shadow: 0 6px 14px rgba(79,70,229,0.45);
              ">
                <span style="font-size: 13px;">${t("map.marker.start_end")}</span>
                <span style="font-size: 10px; opacity: 0.9;">🔁</span>
                <div style="
                  position: absolute;
                  left: 50%;
                  bottom: -6px;
                  width: 8px;
                  height: 8px;
                  background: #6366f1;
                  transform: translateX(-50%) rotate(45deg);
                  border-radius: 2px;
                "></div>
              </div>
            `,
          },
        })
      );

      return; // 통합 마커만 표시하고 종료
    }

    // 출발·도착이 서로 다를 때 → 각각 표시
    if (startPoint?.lat && startPoint?.lon) {
      const pos = new window.naver.maps.LatLng(startPoint.lat, startPoint.lon);

      seMarkersRef.current.push(
        new window.naver.maps.Marker({
          map,
          position: pos,
          title: startPoint.name,
          icon: {
            content: `
              <div style="
                position: relative;
                transform: translate(-50%, -100%);
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                background: linear-gradient(135deg,#22c55e,#16a34a);
                color: #fff;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 700;
                box-shadow: 0 6px 14px rgba(22, 163, 74, 0.45);
              ">
                <span style="font-size: 13px;">${t("map.marker.start")}</span>
                <span style="font-size: 10px; opacity: 0.85;">🚩</span>
                <div style="
                  position: absolute;
                  left: 50%;
                  bottom: -6px;
                  width: 8px;
                  height: 8px;
                  background: #16a34a;
                  transform: translateX(-50%) rotate(45deg);
                  border-radius: 2px;
                "></div>
              </div>
            `,
          },
        })
      );
    }

    if (endPoint?.lat && endPoint?.lon) {
      const pos = new window.naver.maps.LatLng(endPoint.lat, endPoint.lon);

      seMarkersRef.current.push(
        new window.naver.maps.Marker({
          map,
          position: pos,
          title: endPoint.name,
          icon: {
            content: `
              <div style="
                position: relative;
                transform: translate(-50%, -100%);
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                background: linear-gradient(135deg,#f97373,#ef4444);
                color: #fff;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 700;
                box-shadow: 0 6px 14px rgba(239, 68, 68, 0.45);
              ">
                <span style="font-size: 13px;">${t("map.marker.end")}</span>
                <span style="font-size: 10px; opacity: 0.9;">🏁</span>
                <div style="
                  position: absolute;
                  left: 50%;
                  bottom: -6px;
                  width: 8px;
                  height: 8px;
                  background: #ef4444;
                  transform: translateX(-50%) rotate(45deg);
                  border-radius: 2px;
                "></div>
              </div>
            `,
          },
        })
      );
    }
  }, [startPoint, endPoint, sameStartEnd, t]);

  /** 필수 방문지 마커 + hover 시 이름 말풍선 */
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // InfoWindow 하나만 만들어서 재사용
    if (!requiredInfoWindowRef.current) {
      requiredInfoWindowRef.current = new window.naver.maps.InfoWindow({
        backgroundColor: "transparent",
        borderWidth: 0,
        disableAnchor: true,
      });
    }
    const infoWindow = requiredInfoWindowRef.current;

    // 기존 필수 방문지 마커 제거
    requiredMarkersRef.current.forEach((m) => m.setMap(null));
    requiredMarkersRef.current = [];

    (requiredStops || []).forEach((p) => {
      if (!p.lat || !p.lon) return;

      const pos = new window.naver.maps.LatLng(p.lat, p.lon);

      const marker = new window.naver.maps.Marker({
        map,
        position: pos,
        title: p.name,
        icon: {
          content: `
            <div style="
              width: 14px;
              height: 14px;
              border-radius: 999px;
              background: #7b2fff;
              border: 2px solid #ffffff;
              box-shadow: 0 4px 10px rgba(15,23,42,0.25);
              transform: translate(-50%, -50%);
            "></div>
          `,
        },
      });

      // 마우스 올렸을 때: 바로 열기
      window.naver.maps.Event.addListener(marker, "mouseover", () => {
        infoWindow.setContent(`
          <div style="
            pointer-events: none;
            padding: 4px 8px;
            border-radius: 999px;
            background: #111827;
            color: #ffffff;
            font-size: 11px;
            box-shadow: 0 4px 10px rgba(15,23,42,0.35);
            white-space: nowrap;
          ">
            ${p.name}
          </div>
        `);
        infoWindow.open(map, marker);
      });

      // 마우스 뗐을 때: 바로 닫기
      window.naver.maps.Event.addListener(marker, "mouseout", () => {
        infoWindow.close();
      });

      requiredMarkersRef.current.push(marker);
    });
  }, [requiredStops]);

  /** 경로 마커 + 폴리라인 */
  useEffect(() => {
    if (!mapRef.current) return;

    // 기존 경로 마커 제거
    planMarkersRef.current.forEach((m) => m.setMap(null));
    planMarkersRef.current = [];

    // 기존 폴리라인 제거
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (!plan) return;

    const map = mapRef.current;
    const coords = [];

    plan.route.forEach((idx) => {
      const [type, c] = plan.routeArray[idx];
      const pos = new window.naver.maps.LatLng(c.lat, c.lon);
      coords.push(pos);

      planMarkersRef.current.push(
        new window.naver.maps.Marker({
          map,
          position: pos,
          title:
            type === "start"
              ? t("map.marker.start")
              : type === "end"
              ? t("map.marker.end")
              : c.poi?.name,
        })
      );
    });

    if (coords.length >= 2) {
      polylineRef.current = new window.naver.maps.Polyline({
        map,
        path: coords,
        strokeColor: "#2563eb",
        strokeWeight: 4,
      });

      const bounds = new window.naver.maps.LatLngBounds(coords[0], coords[0]);
      coords.forEach((c) => bounds.extend(c));
      map.fitBounds(bounds);
    }
  }, [plan, t]);

  /**
   * 네이버 + Gemini 기반 POI 가져오기
   * → /api/search-with-pref 사용
   */
  const fetchPoisFromServer = async () => {
    if (!startPoint?.name) return [];

    // 1️⃣ wishLog를 복사해서 작업용 배열 생성
    const trimmedLog = [...wishLog];

    // 2️⃣ 마지막이 assistant라면 잘라낸다
    while (
      trimmedLog.length > 0 &&
      trimmedLog[trimmedLog.length - 1].role === "assistant"
    ) {
      trimmedLog.pop();
    }

    // 3️⃣ user / assistant 대화 전체를 문자열로 변환 (마지막 assistant는 제거된 상태)
    const fullConversation = trimmedLog
      .map((msg) => {
        const speaker = msg.role === "user" ? "User" : "Assistant";
        return `${speaker}: ${msg.text}`;
      })
      .join("\n\n");
    
    // 4️⃣ 대화가 완전 비어 있으면 placeholder 사용
    const travelMessage =
      fullConversation && fullConversation.trim().length > 0
        ? fullConversation
        : t("wish.placeholder");

    try {
      const res = await fetch("http://localhost:5000/api/search-with-pref", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseArea: "서울",
          message: travelMessage,
          lang: i18n.language,   // 🔹 ko / en / ja

          context: {
            breakfast,
            lunch,
            dinner,
            cafe,
            dietPrefs,
            waitTolerance,
            transportMode,
            maxLeg,
            numPlaces,
            startHour,
            endHour,
            themes,
            requiredStops,
            pace,
          },
        }),
      });

      if (!res.ok) {
        console.error("❌ /api/search-with-pref 요청 실패:", res.status);
        return [];
      }

      const data = await res.json();
      const { prefs, pois, weights: weightsFromServer, biasReport } = data || {};
      
      // weights 저장 (체류시간 계산용)
      if (weightsFromServer) {
        setWeights(weightsFromServer);
      }

      // 편향 리포트가 있으면 챗봇 로그에 안내 메시지 추가
      if (biasReport?.isBiased) {
        const issuesText = (biasReport.issues || []).join("\n• ");
        const suggestionsText = (biasReport.suggestions || []).join("\n");

        setWishLog((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: "assistant",
            text: `📊 추천 결과를 간단히 분석해봤어요:\n• ${issuesText}\n\n💡 ${suggestionsText}`,
          },
        ]);
      }

      // Naver local API raw → routePlanner용 형식으로 변환
      const converted =
  (pois || [])
    .map((p, idx) => {

      // 원본 한글 이름 (HTML 태그 제거)
      const originalName = String(p.title || p.name || "")
        .replace(/<[^>]+>/g, "")
        .trim();

      // 번역된 이름 (백엔드가 붙여준 필드, 없으면 빈 문자열)
      const translatedName = String(p.titleTranslated || "")
        .replace(/<[^>]+>/g, "")
        .trim();
      
      const lat = p.mapy ? parseFloat(p.mapy) / 1e7 : null;
      const lon = p.mapx ? parseFloat(p.mapx) / 1e7 : null;
      if (!lat || !lon) return null;

      const originalCategory = String(p.category || p.categoryType || "").trim();
      const translatedCategory = String(p.categoryTranslated || "").trim();

      const categoryType = p.categoryType || "poi";
      const isFood =
        categoryType === "restaurant" ||
        categoryType === "cafe" ||
        /카페|cafe|커피|디저트|음식점|식당|맛집|레스토랑/i.test(
          p.category || ""
        );

      return {
        id: idx,
        // 🔹 이름은 일단 둘 다 저장해 둔다
        nameKo: originalName,
        nameTranslated: translatedName,
        // 기본 name은 번역 우선, 없으면 한글
        name: translatedName || originalName,
        address: p.roadAddress || p.address,
        lat,
        lon,
        categoryKo: originalCategory,
        categoryTranslated: translatedCategory,
        category: translatedCategory || originalCategory,
        rating: p.rating ? Number(p.rating) : 4.0,
        stay_time: 60,
        diet_tags: [],
        categoryType,  // 🔹 식당/카페/기타
        isFood,        // 🔹 음식 관련 여부
        _raw: p,
        _prefs: prefs,
      };
    })
    .filter(Boolean) || [];



      setSearchPois(converted);
      return converted;
    } catch (err) {
      console.error("❌ fetchPoisFromServer 에러:", err);
      return [];
    }
  };

  /** 시간 → 분 변환 헬퍼 (예: 9 → 540) */
  const hourToMinutes = (h) => {
    const n = Math.min(24, Math.max(0, Number(h) || 0));
    return n * 60;
  };

  /**
   * 앵커 기반 재추천 API 호출 (/api/route/refine)
   * @param {Object} anchor - { name, lat, lon, category, rating }
   * @param {Array<string>} dislikedNames - 싫어요 한 장소 이름 목록
   * @returns {Promise<Array>} 추천된 POI 배열
   */
  const fetchRefinedPois = async (anchor, dislikedNames = []) => {
    if (!anchor || !anchor.lat || !anchor.lon) {
      console.error("❌ anchor 정보가 없습니다.");
      return [];
    }

    setRefineLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/route/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseArea: "서울",
          message: wishText.trim() || t("wish.placeholder"),
          context: {
            breakfast,
            lunch,
            dinner,
            cafe,
            dietPrefs,
            waitTolerance,
            transportMode,
            maxLeg,
            numPlaces,
            startHour,
            endHour,
            themes,
            requiredStops,
            pace,
          },
          anchor: {
            name: anchor.name,
            lat: anchor.lat,
            lon: anchor.lon,
            category: anchor.category || anchor.categoryType || null,
            rating: anchor.rating || null,
          },
          dislikedNames: dislikedNames || [],
        }),
      });

      if (!res.ok) {
        console.error("❌ /api/route/refine 요청 실패:", res.status);
        return [];
      }

      const data = await res.json();
      const { pois } = data || {};

      // Naver local API raw → routePlanner용 형식으로 변환
      const converted = (pois || [])
        .map((p, idx) => {
          const name = (p.title || "").replace(/<[^>]+>/g, "");
          const lat = p.mapy ? parseFloat(p.mapy) / 1e7 : null;
          const lon = p.mapx ? parseFloat(p.mapx) / 1e7 : null;
          if (!lat || !lon) return null;

          const categoryType = p.categoryType || "poi";
          const isFood =
            categoryType === "restaurant" ||
            categoryType === "cafe" ||
            /카페|cafe|커피|디저트|음식점|식당|맛집|레스토랑/i.test(
              p.category || ""
            );

          return {
            id: `refine_${idx}_${Date.now()}`,
            name,
            address: p.roadAddress || p.address,
            lat,
            lon,
            category: p.category || "기타",
            rating: p.rating ? Number(p.rating) : 4.0,
            stay_time: 60,
            diet_tags: [],
            categoryType,
            isFood,
            _raw: p,
            _isRefined: true, // refine으로 추가된 POI 표시
          };
        })
        .filter(Boolean);

      return converted;
    } catch (err) {
      console.error("❌ fetchRefinedPois 에러:", err);
      return [];
    } finally {
      setRefineLoading(false);
    }
  };

  /** 🍀 여행 계획 생성 */
  const onGenerate = async () => {
  if (!startPoint || !endPoint) {
    alert(t("alert.need_start_end"));
    return;
  }

  // 상태: "생성 중..."
  setStatusKey("status.generating");

  /** 문자열로 입력받은 시간을 숫자로 변환 + 0~24 범위 클램프 */
  const startMin = hourToMinutes(startHour);
  const endMin = hourToMinutes(endHour);

  if (endMin <= startMin) {
    setStatusKey("status.time_invalid");
    return;
  }

  const maxLegNum = Math.max(5, Number(maxLeg) || 0); // 최소 5분
  const numPlacesNum = Math.max(1, Number(numPlaces) || 0); // 최소 1개

  try {
    // ✅ 1) 매번 새로 POI 요청 (캐시 재사용 X)
    const basePOIs = await fetchPoisFromServer();
    // 원하면 최근 검색 결과를 state에 저장해서 디버깅/추가 기능에 쓸 수 있음
    setSearchPois(basePOIs);

    // basePOIs가 비어 있으면 routePlanner의 ALL_POIS(샘플)로 fallback (지금은 콘솔 경고만)
    if (!basePOIs.length) {
      console.warn("네이버+Gemini POI 없음 → 샘플 ALL_POIS 사용");
    }

    // ✅ 2) 선택 옵션 기반으로 POI 선택
    const { pois } = selectPOIs(
      numPlacesNum,
      breakfast,
      lunch,
      dinner,
      cafe,
      dietPrefs,
      themes,
      basePOIs,
      requiredStops // 필수 방문지 전달 (중복 방지용)
    );

    if (!pois || !pois.length) {
      setStatusKey("status.no_pois");
      return;
    }

    // ✅ 3) 경로 최적화 (+ 필수 방문지 강제 포함 + 식사 시간대 배치)
    const opt = optimizeRoute(
      pois,
      startPoint,
      endPoint,
      startMin,
      endMin,
      maxLegNum,
      requiredStops, // 필수 방문지 포함
      weights || {}, // 가중치 (체류시간 계산용)
      { breakfast, lunch, dinner, cafe } // 식사 옵션 (시간대 배치용)
    );

    // ✅ 4) 시간별 일정 생성
    const schedule = generateSchedule(
      opt.routeArray,
      opt.route,
      opt.waits,
      opt.stays,
      startMin,
      endMin,
      startPoint.name,
      endPoint.name
    );

    setPlan({ ...opt, schedule });
    setStatusKey("status.success");
  } catch (e) {
    console.error(e);
    setStatusKey("status.error");
  }
};

/** 🗨 여행 취향 입력 SEND 버튼 핸들러 (Gemini 백엔드 자리 포함) */
const handleSendWish = async () => {
  const text = wishText.trim();
  if (!text) return;

  // 1️⃣ 이번이 몇 번째 유저 발화인지 계산 (1부터 시작)
  const userTurn =
    wishLog.filter((msg) => msg.role === "user").length + 1;

  // 2️⃣ 유저 메시지를 먼저 로그에 추가
  setWishLog((prev) => [
    ...prev,
    { id: Date.now(), role: "user", text },
  ]);

  // 3️⃣ 입력창은 비움 (대신 wishLog에 기록이 남아 있음)
  setWishText("");

  try {
    const res = await fetch("http://localhost:5000/api/travel-wish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
          message: text,
          context: {
          breakfast,
          lunch,
          dinner,
          cafe,
          dietPrefs,
          waitTolerance,
          transportMode,
          maxLeg,
          numPlaces,
          startHour,
          endHour,
          themes,
          requiredStops,
          pace,
          // 🔴 여기! turn 정보를 함께 보냄
          turn: userTurn,
          },
      }),
    });

    // 4️⃣ 응답 content-type에 따라 파싱
    const contentType = res.headers.get("content-type");
    let data = null;

    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const rawText = await res.text();
      data = { raw: rawText };
    }

    // 5️⃣ 에러 응답 → assistant 말풍선으로 보여주기
    if (!res.ok) {
      console.error("❌ /api/travel-wish 상태코드:", res.status, data);

      setWishLog((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text:
            `서버 응답에 문제가 있어요 (status ${res.status}).\n` +
            (data?.error
              ? `에러 메시지: ${data.error}`
              : data?.raw
              ? `응답 내용: ${data.raw}`
              : "자세한 정보는 콘솔을 확인해주세요."),
        },
      ]);
      return;
    }

    // 6️⃣ 정상 응답 → Gemini 답변을 assistant 말풍선으로 추가
    setWishLog((prev) => [
      ...prev,
      {
        id: Date.now() + 2,
        role: "assistant",
        text:
          data?.reply ??
          "여행 취향을 잘 받았어요! 일정에 반영해 볼게요 :)",
      },
    ]);
  } catch (err) {
    console.error("❌ handleSendWish 에러:", err);

    // 7️⃣ 네트워크/예외 에러도 말풍선으로 알려주기
    setWishLog((prev) => [
      ...prev,
      {
        id: Date.now() + 3,
        role: "assistant",
        text:
          "선호 분석 중 알 수 없는 오류가 발생했어요 🥲\n" +
          "브라우저 콘솔과 서버 로그를 함께 확인해 주세요.",
      },
    ]);
  }
};

  /** 공통 버튼 스타일 util */
  const gradientBtnStyle = (active) => ({
    padding: "10px 18px",
    borderRadius: 16,
    border: active ? "1px solid transparent" : "1px solid #e5e7eb",
    background: active
      ? "linear-gradient(90deg,#6366f1 0%,#ec4899 50%,#f97316 100%)"
      : "#ffffff",
    color: active ? "#ffffff" : "#111827",
    fontSize: 13,
    boxShadow: active
      ? "0 4px 12px rgba(249,115,22,0.45)"
      : "0 4px 10px rgba(15,23,42,0.06)",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.15s ease-out",
  });

  return (
    <div className="app-root">
      <Header />

      {/* 데스크탑: 850px / 1fr 2열, 모바일: 세로로 쌓이는 레이아웃 */}
      <div className="app-layout">
        {/* ================= 왼쪽 패널 ================= */}
        <aside className="left-panel">
          {/* 2열: 왼쪽(출발지 + 옵션들), 오른쪽(필수방문지 + 챗봇) */}
          <div className="left-columns">

            {/* ===== 왼쪽 컬럼 ===== */}
            <div>
              {/* 출발지·도착지 검색 */}
              <div style={{ marginBottom: 16 }}>
                <LocationSearch
                  onChange={({ start, end, sameStartEnd }) => {
                    setStartPoint(start);
                    setEndPoint(end);
                    setSameStartEnd(!!sameStartEnd);
                  }}
                />
              </div>

              {/* 끼니 */}
              <section style={{ marginBottom: 16 }}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    margin: "0 0 12px",
                  }}
                >
                  {t("meals.title")}
                </h3>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { key: "breakfast", label: t("meals.breakfast") },
                    { key: "lunch", label: t("meals.lunch") },
                    { key: "dinner", label: t("meals.dinner") },
                    { key: "cafe", label: t("meals.cafe") },
                  ].map(({ key, label }) => {
                    const checked =
                      key === "breakfast"
                        ? breakfast
                        : key === "lunch"
                        ? lunch
                        : key === "dinner"
                        ? dinner
                        : key === "cafe"
                        ? cafe
                        : false;

                    const isHovered = hoveredMeal === key;
                    const isActive = checked || isHovered;

                    const toggle = () => {
                      if (key === "breakfast") setBreakfast((v) => !v);
                      if (key === "lunch") setLunch((v) => !v);
                      if (key === "dinner") setDinner((v) => !v);
                      if (key === "cafe") setCafe((v) => !v);

                      // 클릭할 때마다 hover도 같이 초기화 → 모바일에서 절대 안 붙잡힘
                      setHoveredMeal(null);
                    };

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={toggle}
                        onMouseEnter={() => setHoveredMeal(key)}
                        onMouseLeave={() => setHoveredMeal(null)}
                        style={gradientBtnStyle(isActive)}
                      >
                        {label}
                      </button>
                    );

                  })}
                </div>
              </section>

              {/* 식단 제약 */}
              <section style={{ marginBottom: 16 }}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    margin: "0 0 12px",
                  }}
                >
                  {t("diet.title")}
                </h3>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { key: "halal", label: t("diet.halal") },
                    { key: "vegan", label: t("diet.vegan") },
                    { key: "kosher", label: t("diet.kosher") },
                    { key: "gluten_free", label: t("diet.gluten_free") },
                    { key: "non_alcohol", label: t("diet.non_alcohol") },
                    { key: "vegetarian", label: t("diet.vegetarian") },
                  ].map(({ key, label }) => {
                    const checked = dietPrefs.includes(key);
                    const isHovered = hoveredDiet === key;
                    const isActive = checked || isHovered;

                    const toggle = () => {
                      if (checked) {
                        setDietPrefs(dietPrefs.filter((t) => t !== key));
                      } else {
                        setDietPrefs([...dietPrefs, key]);
                      }
                      setHoveredDiet(null); // 클릭 시 hover 초기화
                    };

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={toggle}
                        onMouseEnter={() => setHoveredDiet(key)}
                        onMouseLeave={() => setHoveredDiet(null)}
                        style={gradientBtnStyle(isActive)}
                      >
                        {label}
                      </button>
                    );

                  })}
                </div>
              </section>

              {/* 여행 테마 (최대 3개) */}
              <section style={{ marginBottom: 16 }}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    margin: "0 0 12px",
                  }}
                >
                  {t("theme.title")}
                </h3>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { key: "shopping", label: t("theme.shopping") },
                    { key: "culture", label: t("theme.culture") },
                    { key: "nature", label: t("theme.nature") },
                    { key: "cafe_tour", label: t("theme.cafe_tour") },
                    { key: "night_photo", label: t("theme.night_photo") },
                    { key: "healing", label: t("theme.healing") },
                    { key: "kpop", label: t("theme.kpop") },
                    { key: "sns_hot", label: t("theme.sns_hot") },
                  ].map(({ key, label }) => {
                    const checked = themes.includes(key);
                    const isHovered = hoveredTheme === key;
                    const isActive = checked || isHovered;

                    const toggle = () => {
                      setThemes((prev) => {
                        const already = prev.includes(key);

                        // 이미 선택된 거면 해제
                        if (already) {
                          return prev.filter((t) => t !== key);
                        }

                        // 새로 선택하려고 하는데 이미 3개 선택되어 있으면 막기
                        if (prev.length >= 3) {
                          alert("여행 테마는 최대 3개까지 선택할 수 있어요.");
                          return prev;
                        }

                        // 아직 3개 미만이면 추가
                        return [...prev, key];
                      });

                      setHoveredTheme(null);
                    };

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={toggle}
                        onMouseEnter={() => setHoveredTheme(key)}
                        onMouseLeave={() => setHoveredTheme(null)}
                        style={gradientBtnStyle(isActive)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 대기 선호도 */}
              <section style={{ marginBottom: 24 }}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    margin: "0 0 12px",
                  }}
                >
                  {t("wait.title")}
                </h3>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { key: "low", label: t("wait.low") },
                    { key: "medium", label: t("wait.medium") },
                    { key: "high", label: t("wait.high") },
                  ].map((opt) => {
                    const checked = waitTolerance === opt.key;
                    const isHovered = hoveredWait === opt.key;
                    const isActive = checked || isHovered;

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setWaitTolerance(opt.key)}
                        onMouseEnter={() => setHoveredWait(opt.key)}
                        onMouseLeave={() => setHoveredWait(null)}
                        style={gradientBtnStyle(isActive)}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 이동 · 장소 */}
              <section style={{ marginBottom: 24 }}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    margin: "0 0 12px",
                  }}
                >
                  {t("move.title")}
                </h3>

                {/* 선호 이동수단 */}
                <div
                  style={{
                    marginBottom: 12,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    { key: "walk", label: t("transport.walk") },
                    { key: "public", label: t("transport.transit") },
                    { key: "car", label: t("transport.taxi") },
                  ].map((m) => {
                    const checked = transportMode === m.key;
                    const isHovered = hoveredTransport === m.key;
                    const isActive = checked || isHovered;

                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setTransportMode(m.key)}
                        onMouseEnter={() => setHoveredTransport(m.key)}
                        onMouseLeave={() => setHoveredTransport(null)}
                        style={gradientBtnStyle(isActive)}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>

                {/* 구간당 이동시간 / 총 방문장소 */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: 16,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 10px rgba(15,23,42,0.06)",
                      fontSize: 13,
                    }}
                  >
                    {t("move.max_leg")}:
                    <input
                      type="number"
                      value={maxLeg}
                      onChange={(e) => setMaxLeg(e.target.value)}
                      style={{
                        width: 60,
                        border: "none",
                        outline: "none",
                        marginLeft: 6,
                      }}
                    />
                    {" "}{t("unit.minute")}
                  </div>

                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: 16,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 10px rgba(15,23,42,0.06)",
                      fontSize: 13,
                    }}
                  >
                    {t("move.num_places")}:
                    <input
                      type="number"
                      value={numPlaces}
                      onChange={(e) => setNumPlaces(e.target.value)}
                      style={{
                        width: 60,
                        border: "none",
                        outline: "none",
                        marginLeft: 6,
                      }}
                    />
                    {" "}{t("unit.place_count")}
                  </div>
                </div>
              </section>

              {/* 시간 설정 */}
              <section style={{ marginBottom: 20 }}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    margin: "0 0 12px",
                  }}
                >
                  {t("time.title")}
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 16,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 10px rgba(15,23,42,0.06)",
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {t("time.start")}:
                    <input
                      type="number"
                      min={0}
                      max={24}
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      style={{
                        width: 60,
                        border: "none",
                        outline: "none",
                        marginLeft: 6,
                      }}
                    />
                    {" "}{t("unit.hour")}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 16,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 10px rgba(15,23,42,0.06)",
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {t("time.end")}:
                    <input
                      type="number"
                      min={0}
                      max={24}
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      style={{
                        width: 60,
                        border: "none",
                        outline: "none",
                        marginLeft: 6,
                      }}
                    />
                    {" "}{t("unit.hour")}
                  </div>
                </div>
              </section>
            </div>

            {/* ===== 오른쪽 컬럼 ===== */}
            <div>
              {/* 필수방문지 검색 · 추가 */}
              <div style={{ marginBottom: 32 }}>
                <RequiredStops
                  value={requiredStops}
                  onChange={setRequiredStops}
                />
              </div>

              {/* 여행에 있어서 바라는 점이 있나요? */}
              <section>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    margin: "0 0 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    position: "relative",
                  }}
                  onMouseEnter={() => setShowWishHelp(true)}
                  onMouseLeave={() => setShowWishHelp(false)}
                >
                  <span style={{ fontSize: 20 }}>✶</span>
                  <span>{t("wish.title")}</span>

                  {/* 제목 hover 시 보이는 도움말 툴팁 */}
                  {showWishHelp && (
                    <div
                      style={{
                        position: "absolute",
                        top: "120%",
                        left: 28,
                        zIndex: 10,
                        width: 260,
                        padding: "10px 12px",
                        borderRadius: 16,
                        background: "#111827",
                        color: "#e5e7eb",
                        fontSize: 11,
                        boxShadow: "0 8px 20px rgba(15,23,42,0.35)",
                      }}
                    >
                      <div
                        style={{
                          marginBottom: 6,
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        {t("wish.hover")}
                      </div>

                      {/* 챗봇 말풍선 예시 */}
                      <div
                        style={{
                          borderRadius: 999,
                          padding: "6px 10px",
                          background: "#fbededff",
                          color: "#4b5563",
                          marginBottom: 6,
                          width: "fit-content",
                          fontSize: 11,
                        }}
                      >
                        {t("wish.hover1")} 👇
                      </div>

                      {/* 사용자 말풍선 예시 */}
                      <div
                        style={{
                          borderRadius: 999,
                          padding: "6px 10px",
                          background: "#e5e7eb",
                          color: "#4b5563",
                          marginBottom: 6,
                          width: "fit-content",
                          fontSize: 11,
                        }}
                      >
                        {t("wish.hover2")}
                      </div>
                      <div
                        style={{
                          borderRadius: 999,
                          padding: "6px 10px",
                          background: "#e5e7eb",
                          color: "#4b5563",
                          marginBottom: 6,
                          width: "fit-content",
                          fontSize: 11,
                        }}
                      >
                        {t("wish.hover3")}
                      </div>
                      <div
                        style={{
                          borderRadius: 999,
                          padding: "6px 10px",
                          background: "#e5e7eb",
                          color: "#4b5563",
                          marginBottom: 6,
                          width: "fit-content",
                          fontSize: 11,
                        }}
                      >
                        {t("wish.hover4")}
                      </div>
                      <div
                        style={{
                          borderRadius: 999,
                          padding: "6px 10px",
                          background: "#e5e7eb",
                          color: "#4b5563",
                          marginBottom: 6,
                          width: "fit-content",
                          fontSize: 11,
                        }}
                      >
                        {t("wish.hover5")}
                      </div>
                    </div>
                  )}
                </h3>

                {/* ===================== 실제 대화 말풍선 영역 ===================== */}
                <div
                  style={{
                    height: 500,
                    marginBottom: 12,
                    paddingRight: 4,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    background: "#f6f9ffff",
                    borderRadius: 12,
                    boxShadow: "0 10px 25px rgba(15,23,42,0.25)",
                  }}
                >
                  {wishLog.length === 0 && (
                    <div
                      style={{
                        fontSize: 13,
                        marginTop: 5,
                        marginLeft: 10,
                        color: "#9ca3af",
                      }}
                    >
                      {t("wish.placeholder")}
                    </div>
                  )}

                  {wishLog.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        justifyContent:
                          m.role === "user" ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          borderRadius: m.role === "user" ? 999 : 16,
                          marginLeft: m.role === "user" ? 0 : 6,
                          marginTop: m.role === "user" ? 5 : 0,
                          padding: "8px 14px",
                          fontSize: 12,
                          maxWidth: "90%",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.4,
                          background:
                            m.role === "user" ? "#e0f2fe" : "#fbe7eeff",
                          color: "#374151",
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ===================== 실제 입력창 + SEND ===================== */}
                <div
                  style={{
                    borderRadius: 18,
                    border: "1px solid #d1d5db",
                    display: "grid",
                    gridTemplateColumns: "1fr 90px",
                    overflow: "hidden",
                    boxShadow: "0 10px 25px rgba(15,23,42,0.25)",
                  }}
                >
                  <textarea
                  value={wishText}
                  onChange={(e) => setWishText(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter만 치면 전송, Shift+Enter는 줄바꿈
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendWish();
                    }
                  }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  rows={1}
                  style={{
                    border: "none",
                    padding: "10px 14px",
                    fontSize: 13,
                    outline: "none",
                    width: "100%",
                    resize: "none",
                    overflowY: "hidden",
                    boxSizing: "border-box",
                  }}
                />



                  <button
                    type="button"
                    onClick={handleSendWish}
                    onMouseEnter={() => setIsSendHover(true)}
                    onMouseLeave={() => setIsSendHover(false)}
                    onMouseDown={(e) => e.preventDefault()} // ← 클릭 시 테두리 제거
                    style={{
                      border: "none",
                      background: isSendHover ? "#e5e7eb" : "#f3f4f6",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                      outline: "none",
                      boxShadow: "none", // 기본 focus-shadow 제거
                    }}
                  >
                    {t("button.send")}
                  </button>
                </div>
              </section>
            </div>
          </div>

          {/* 하단: 여행계획 생성 버튼 */}
          <button
            onClick={onGenerate}
            style={{
              marginTop: 5,
              width: "100%",
              padding: 14,
              borderRadius: 999,
              border: "none",
              background:
                "linear-gradient(90deg,#6622F6 0%,#ec4899 50%,#F63E6B 100%)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              outline: "none",
            }}
          >
            {t("button.generate")}
          </button>

          {/* 상태 메시지 */}
          {statusKey && (
            <div style={{ marginTop: 12, fontSize: 13, color: "#16a34a" }}>
              {t(statusKey)}
            </div>
          )}
        </aside>

        {/* ================= 오른쪽: 지도 + 아래에 일정/장소 ================= */}
        <main className="right-main">
          {/* 1) 지도 카드 */}
          <section className="map-card">
            <div ref={mapDivRef} className="map-container" />
          </section>

          {/* 2) 시간별 일정 카드 */}
          <section className="schedule-card">
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>
              {t("schedule.title")}
            </h3>
            {plan?.schedule?.length ? (
              <table
                style={{
                  width: "100%",
                  fontSize: 13,
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", paddingBottom: 6 }}>
                      {t("schedule.col.order")}
                    </th>
                    <th style={{ textAlign: "left", paddingBottom: 6 }}>
                      {t("schedule.col.name")}
                    </th>
                    <th style={{ textAlign: "left", paddingBottom: 6 }}>
                      {t("schedule.col.category")}
                    </th>
                    <th style={{ textAlign: "left", paddingBottom: 6 }}>
                      {t("schedule.col.arrival")}
                    </th>
                    <th style={{ textAlign: "left", paddingBottom: 6 }}>
                      {t("schedule.col.depart")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plan.schedule.map((r) => (
                    <tr key={r.order}>
                      <td style={{ padding: "4px 0" }}>{r.order}</td>

                    {/* 🔹 장소명: 번역 + (한국어) */}
                    <td style={{ padding: "4px 0" }}>
                      {currentLang === "ko"
                        ? (r.nameKo || r.name) // 한국어 UI면 그냥 한글만
                        : r.nameTranslated && r.nameTranslated !== (r.nameKo || r.name)
                        ? `${r.nameTranslated} (${r.nameKo || r.name})` // 예: Gyeongbokgung Palace (경복궁)
                        : (r.nameKo || r.name)}
                    </td>

                    {/* 🔹 카테고리: 번역 + / + 한국어 */}
                    <td style={{ padding: "4px 0" }}>
                      {currentLang === "ko"
                        ? (r.categoryKo || r.category)
                        : r.categoryTranslated &&
                          r.categoryTranslated !== (r.categoryKo || r.category)
                        ? `${r.categoryTranslated} / ${r.categoryKo || r.category}`
                        : (r.categoryKo || r.category)}
                    </td>

                    <td style={{ padding: "4px 0" }}>{r.arrival}</td>
                    <td style={{ padding: "4px 0" }}>{r.depart}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            ) : (
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                {t("schedule.none")}
              </div>
            )}
          </section>

          {/* 3) 장소 세부정보 카드 */}
          <section className="details-card">
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>
              {t("specifics.title")}
            </h3>
            {plan?.schedule?.length ? (
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
                {plan.schedule.map((r) => (
                  <li key={r.order} style={{ marginBottom: 6 }}>
                    <b>
                      {r.order}. {r.name}
                    </b>{" "}
                    — {r.category} / {r.arrival} ~ {r.depart}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                {t("specifics.none")}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}


