# SeoulMate 프로젝트 분석 및 리팩토링 계획

> **작성일**: 2024년  
> **대상 프로젝트**: SeoulMate - 서울 여행 경로 추천 서비스  
> **기술 스택**: React/Vite (Frontend) + Node.js/Express (Backend) + Gemini AI + Naver APIs

---

## 목차

1. [Flow Summary - 전체 데이터/제어 흐름](#1-flow-summary---전체-데이터제어-흐름)
2. [Problem Mapping - 문제와 코드 위치 연결](#2-problem-mapping---문제와-코드-위치-연결)
3. [Design Proposal - 설계 제안](#3-design-proposal---설계-제안)
4. [File-wise Plan - 파일별 수정 계획](#4-file-wise-plan---파일별-수정-계획)
5. [구현 우선순위](#5-구현-우선순위)

---

## 1. Flow Summary - 전체 데이터/제어 흐름

### 1.1 유저 입력 단계 (App.jsx)

```
사용자 입력 수집:
├── startPoint, endPoint (출발지/도착지)
├── requiredStops[] (필수 방문지)
├── 끼니 옵션: breakfast, lunch, dinner, cafe
├── 식단 제약: dietPrefs[]
├── 테마: themes[]
├── 시간: startHour, endHour
├── 이동/장소: maxLeg, numPlaces
└── wishText (자연어 취향 입력)
```

### 1.2 취향 분석 단계 (Server.js → Gemini)

```
handleSendWish() [App.jsx L542]
    ↓
POST /api/travel-wish [server.js L830]
    ↓
Gemini API (gemini-2.0-flash)
    ↓
자연어 응답 반환 → wishLog에 표시 (UI용, 로직에는 미반영)
```

> ⚠️ **문제점**: `handleSendWish()`의 결과가 `onGenerate()`에서 사용되지 않음. 단순 UI 표시용.

### 1.3 POI 검색 단계 (onGenerate → fetchPoisFromServer)

```
onGenerate() [App.jsx L461]
    ↓
fetchPoisFromServer() [App.jsx L373]
    ↓
POST /api/search-with-pref [server.js L508]
    ├── analyzeTravelPreference() → Gemini로 prefs 추출
    │   └── themes[], poiTags[], mustAvoid[], budgetLevel, pace,
    │       searchKeywords[], poiSearchQueries[], foodSearchQueries[], dietPreferences[]
    │
    ├── buildPrefsForWeight() → prefs를 weightAgent용 구조로 변환
    │
    ├── generateWeights() [weightAgent.js] → 가중치 객체 생성
    │   └── budget{priceWeight, luxuryBonus, valueBonus}
    │       pace{distanceWeight, timeWeight, relaxationBonus}
    │       theme{themeMatchBonus, tagMatchBonus, avoidPenalty}
    │       category{poiWeight, restaurantWeight, cafeWeight}
    │       diet{dietMatchBonus}
    │
    ├── buildSearchQueriesFromPreference() → 검색 쿼리 생성
    │   └── poiQueries[], foodQueries[] (도시명 + 키워드)
    │
    ├── naverLocalSearch() × N회 → 네이버 지역 검색
    │
    ├── classifyItem() → "restaurant" | "cafe" | "poi"
    │
    └── scorePOIs() [scoringAgent.js] → 점수 계산 + 정렬
        └── 각 POI에 _score (0~10) 부여
```

### 1.4 POI 선택 단계 (routePlanner.js)

```
selectPOIs() [routePlanner.js L113]
    입력: numPlaces, breakfast/lunch/dinner/cafe, dietPrefs, themes, basePOIs
    ├── POI 분류: restaurantPOIs[], cafePOIs[], otherPOIs[]
    ├── 식단 제약 우선 매칭 (halal, vegan, gluten_free 등)
    ├── 남은 식당/카페 슬롯 채우기
    ├── 나머지 슬롯은 테마 기반 관광지로
    └── 출력: { pois: [...] } (numPlaces개)
```

### 1.5 경로 최적화 단계 (routePlanner.js)

```
optimizeRoute() [routePlanner.js L292]
    입력: pois, start, end, startMin, endMin, maxLegMin, requiredStops
    ├── nodes[] 구성:
    │   [0] = start
    │   [1..k] = requiredStops (필수 방문지, isRequired=true)
    │   [k+1..n-2] = optional POIs
    │   [n-1] = end (호텔)
    │
    ├── Greedy Nearest-Neighbor 알고리즘:
    │   └── 현재 위치에서 가장 가까운 + 시간 내 방문 가능한 곳 선택
    │
    ├── waits{} = 각 노드까지 이동시간
    ├── stays{} = 각 노드 체류시간
    │
    └── 출력: { routeArray, route[], waits{}, stays{} }
```

### 1.6 일정 생성 단계 (routePlanner.js)

```
generateSchedule() [routePlanner.js L463]
    입력: routeArray, route, waits, stays, startMin, endMin, startName, endName
    ├── route[] 순서대로 순회
    ├── now += waits[idx] → arrival 계산
    ├── now += stays[idx] → depart 계산
    ├── toHM()으로 "HH:MM" 형식 변환
    └── 출력: rows[] (order, name, category, arrival, depart, wait, stay, rating)
```

### 1.7 화면 표시 단계 (App.jsx)

```
setPlan({ routeArray, route, waits, stays, schedule }) [App.jsx L533]
    ↓
useEffect [App.jsx L318]
    ├── planMarkersRef → 각 장소 마커 표시
    └── polylineRef → 직선 폴리라인 그리기 (실제 도로 경로 X)
    ↓
schedule-card [App.jsx L1356]
    └── plan.schedule.map() → 테이블 렌더링
```

---

## 2. Problem Mapping - 문제와 코드 위치 연결

### 2.1 문제 1: 도착 시간 < 이전 출발 시간 (시간 역전)

| 항목 | 내용 |
|------|------|
| **원인 위치** | `routePlanner.js` L463-520 `generateSchedule()` |
| **관련 코드** | L489: `now += wait` 후 arrival 계산<br>L493: `now += stay` 후 depart 계산 |
| **문제점** | • `route[]` 배열의 순서가 반드시 시간순이라는 보장이 없음<br>• `optimizeRoute()`의 Greedy 알고리즘이 거리 기반으로만 선택<br>• 필수 방문지가 시간상 비효율적인 위치에 배치될 수 있음<br>• "이전 출발 시간보다 도착 시간이 빠른지" 검증 없음 |

---

### 2.2 문제 2: 호텔이 마지막이 아님

| 항목 | 내용 |
|------|------|
| **원인 위치** | `routePlanner.js` L432-451 |
| **관련 코드** | L443-450: 호텔까지 시간/거리 제약 위반 시 route에서 생략 |
| **문제점** | • 시간이 부족하면 호텔(도착지)을 아예 route에 넣지 않음<br>• 마지막 방문지가 일반 POI가 됨<br>• 호텔은 Hard Constraint인데 선택적으로 처리됨 |

```javascript
// 문제가 되는 코드
if (now + legToEnd <= endMin && legToEnd <= maxLegMin) {
  // 호텔 추가
} else {
  // 호텔 생략됨! ← 문제
}
```

---

### 2.3 문제 3: 종료 시간 초과

| 항목 | 내용 |
|------|------|
| **원인 위치** | `routePlanner.js` L404-412 |
| **관련 코드** | L406-407: 다음 POI 선택 조건 |
| **문제점** | • 각 POI 선택 시 "이 POI까지 + 체류" 시간만 확인<br>• "이 POI 이후 호텔까지 가는 시간"은 고려하지 않음<br>• 마지막 POI 방문 후 호텔 도착 시간이 endMin을 초과 |

```javascript
// 현재 조건 (불충분)
now + leg + (cand?.poi?.stay_time ?? 30) <= endMin

// 필요한 조건
now + leg + stayTime + legToEnd <= endMin
```

---

### 2.4 문제 4: 체류 시간 미고려

| 항목 | 내용 |
|------|------|
| **원인 위치 1** | `App.jsx` L410-442 `fetchPoisFromServer()` |
| **원인 위치 2** | `routePlanner.js` L327-331 |
| **관련 코드** | L434: `stay_time: 60` 하드코딩 |
| **문제점** | • 카페(30분), 레스토랑(60분), 관광지(90분) 등 카테고리별 차이 없음<br>• 사용자의 pace(relaxed/normal/tight)가 체류시간에 전혀 반영 안 됨<br>• `weightAgent.js`에서 pace 가중치를 생성하지만, 실제 체류시간 계산에는 사용 안 함 |

---

### 2.5 문제 5: 필수 방문지 순서 문제

| 항목 | 내용 |
|------|------|
| **원인 위치** | `routePlanner.js` L345-360 |
| **관련 코드** | 필수 방문지를 먼저 nodes에 추가 후 선택 POI 추가 |
| **문제점** | • nodes 배열 추가 순서 ≠ 실제 방문 순서<br>• Greedy 알고리즘이 거리 기반으로 재정렬<br>• 필수 방문지가 중간에 끼어들 수 있음<br>• 사용자가 지정한 시간대(fixedTimeWindow) 미지원 |

---

### 2.6 문제 6: 잠금/좋아요/싫어요 미지원

| 항목 | 내용 |
|------|------|
| **원인 위치** | 전체 시스템 |
| **문제점** | • `ItineraryState` 개념 자체가 없음<br>• `isLockedByUser`, `dislikedStopIds` 등 상태 저장 구조 없음<br>• 매번 `onGenerate()` 호출 시 완전히 새로운 경로 생성<br>• `/api/route/refine`이 있지만 App.jsx에서 호출하지 않음 |

---

### 2.7 문제 7: Skeleton 기반 스케줄링 부재

| 항목 | 내용 |
|------|------|
| **원인 위치** | `routePlanner.js` `optimizeRoute()` |
| **현재 방식** | [start] + [모든 POI를 거리 기반 정렬] + [end 조건부] |
| **필요한 방식** | [start] → [필수1 고정] → [여유 시간에 POI] → [필수2 고정] → ... → [end 강제] |
| **문제점** | 필수 방문지 사이의 "available window"를 계산하고, 그 안에서만 POI를 배치하는 로직 없음 |

---

### 2.8 문제 8: prefs 통합 부재

| 항목 | 내용 |
|------|------|
| **원인 위치** | `App.jsx` L542-632 `handleSendWish()` |
| **관련 코드** | L551-571: /api/travel-wish 호출 → 결과는 wishLog에만 추가 |
| **문제점** | • 챗봇 대화 결과가 실제 경로 생성에 반영 안 됨<br>• UI 선택(themes, dietPrefs 등)과 자연어 입력(wishText)이 별도로 처리됨<br>• "하나의 선호 벡터로 통합" 되지 않음 |

---

### 2.9 문제 9: 지도 직선 표시

| 항목 | 내용 |
|------|------|
| **원인 위치** | `App.jsx` L355-366 |
| **관련 코드** | `Polyline({ path: coords })` - 단순 좌표 배열 |
| **문제점** | • `/api/route` (Naver Directions API)가 구현되어 있지만 사용 안 함<br>• 실제 도로 경로(path)를 받아와서 그리는 로직 없음 |

---

### 2.10 스크린샷 기반 추가 발견 문제 (2차 분석)

#### 스크린샷 2차 분석 결과

```
설정:
  - 출발: 서울역 09:00
  - 도착: 뉴서울호텔 (종료시간: 20시)
  - 점심 ✅, 저녁 ✅
  - 필수 방문지: 경복궁

실제 결과:
  1. 서울역 09:00~09:00 (출발)
  2. 덕수궁 09:21~10:21 (궁궐)
  3. 도랑 10:41~11:41 (중식당) ← ❌ 점심인데 10:41 시작
  4. 경복궁 11:47~12:17 (required) ← 필수 방문지
  5. 경복궁 12:17~13:17 (궁궐) ← ❌ 경복궁 2번 나옴!
  6. 창덕궁 13:38~14:38 (궁궐)
  7. 창경궁 14:44~15:44 (궁궐)
  8. 고궁의아침 15:51~16:51 (한식) ← ❌ 저녁인데 15:51 시작
  9. 뉴서울호텔 17:20 (도착) ← ❌ 20시인데 17:20 도착
```

---

### 2.11 문제 10: 식사 시간대가 여전히 무시됨

| 항목 | 내용 |
|------|------|
| **현상** | 점심 10:41 시작, 저녁 15:51 시작 |
| **기대값** | 점심 11:30~13:30, 저녁 17:30~19:30 |
| **원인** | 끼니 슬롯 예약 로직이 아직 미구현 |
| **결과** | 식당이 "가까운 순서"로 아무 때나 배치됨 |

---

### 2.12 문제 11: 일정이 너무 일찍 끝남 (endMin 미활용)

| 항목 | 내용 |
|------|------|
| **현상** | 종료시간 20:00인데 17:20에 도착 |
| **손실** | 약 2시간 40분의 여행 시간 미활용 |
| **원인 위치** | `routePlanner.js` `optimizeRoute()` |
| **원인** | • Greedy가 "갈 수 있는 곳이 없으면" 바로 종료<br>• endMin까지 채우려는 시도 없음<br>• 남은 시간에 추가 POI 탐색 안 함 |

```javascript
// 현재 코드 (문제)
if (bestIdx == null) {
  break;  // 더 이상 시간 내 갈 수 있는 곳이 없으면 종료
}

// 필요한 로직
// 1. 현재 시간과 endMin 사이에 여유가 있는지 확인
// 2. 여유가 있으면 더 먼 곳의 POI도 검색 범위에 포함
// 3. 또는 체류 시간을 늘려서 시간 채우기
```

---

### 2.13 문제 12: 필수 방문지 중복 + 과도한 영향

| 항목 | 내용 |
|------|------|
| **현상 1** | 경복궁이 4번(required)과 5번(일반 POI)에 2번 나옴 |
| **원인** | • `selectPOIs()`가 requiredStops 중복 체크 안 함<br>• 네이버 검색 결과에 "경복궁"이 포함되어 일반 POI로도 선택됨 |

| 항목 | 내용 |
|------|------|
| **현상 2** | 경복궁 근처 궁궐만 추천 (덕수궁, 창덕궁, 창경궁) |
| **원인** | • 거리 기반 Greedy가 가까운 것만 선택<br>• 경복궁 주변 = 궁궐 밀집 지역<br>• 다른 테마(맛집, K-pop, 카페)는 멀어서 탈락 |

```
사용자가 선택한 테마: 문화·전시·역사, 자연·공원, K-pop 관련
실제 추천된 카테고리: 궁궐, 궁궐, 궁궐, 궁궐...

문제: "거리 최적화"가 "다양성"을 완전히 희생시킴
```

#### 해결 방향

```javascript
// 1. 필수 방문지 중복 제거
const requiredNames = new Set(requiredStops.map(r => r.name.toLowerCase()));
const filteredPOIs = scoredPOIs.filter(poi => 
  !requiredNames.has(poi.name.toLowerCase())
);

// 2. 카테고리 다양성 보장
const categoryCount = {};
const MAX_SAME_CATEGORY = 2;  // 같은 카테고리는 최대 2개

function shouldSelectPOI(poi) {
  const cat = poi.category || 'etc';
  if ((categoryCount[cat] || 0) >= MAX_SAME_CATEGORY) {
    return false;  // 이미 해당 카테고리가 충분함
  }
  categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  return true;
}

// 3. 거리 페널티 완화 + 다양성 보너스
function adjustedScore(poi, weights) {
  let score = poi._score;
  
  // 다양성 보너스: 아직 선택 안 된 카테고리면 +1점
  if ((categoryCount[poi.category] || 0) === 0) {
    score += 1.0;
  }
  
  // 테마 매칭 보너스: 사용자가 선택한 테마면 +0.5점
  if (userThemes.includes(poi.theme)) {
    score += 0.5;
  }
  
  return score;
}
```

---

### 2.14 추가 발견 문제 (1차 분석)

#### A. 중복 POI 검색 (API 비용 낭비)
- `handleSendWish()`에서 Gemini 호출 → 결과 버림
- `onGenerate()` → `fetchPoisFromServer()`에서 다시 Gemini 호출
- 동일한 wishText로 두 번 Gemini API 호출

#### B. searchPois 상태 미활용
- `App.jsx` L82: `const [searchPois, setSearchPois] = useState([]);`
- `fetchPoisFromServer()`에서 set하지만, UI에서 보여주거나 활용하지 않음

#### C. requiredStops가 selectPOIs에 전달 안 됨
- `selectPOIs()` 호출 시 themes까지만 전달 (L494-503)
- requiredStops는 `optimizeRoute()`에서만 사용
- 필수 방문지와 겹치는 POI가 선택될 수 있음

#### D. NaN 방어 불충분
- `scoringAgent.js`에 `normalizeNumber()` 있지만
- Naver API의 `mapy/mapx`가 문자열이고, 1e7으로 나눠야 하는데 `scorePOI()`는 그대로 사용

---

## 3. Design Proposal - 설계 제안

### 3.0 ⭐ 제약 조건 우선순위 (Critical)

스케줄링 시 반드시 지켜야 할 **제약 조건의 우선순위**입니다.

#### 우선순위 계층

```
┌─────────────────────────────────────────────────────────────────┐
│  1️⃣ HARD CONSTRAINT (절대 위반 불가)                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • 출발지 + 출발 시간                                      │    │
│  │ • 도착지 + 도착 시간                                      │    │
│  │ → 무조건 일정의 처음과 끝에 고정                           │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  2️⃣ HARD CONSTRAINT (절대 포함)                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • 필수 방문지 (requiredStops)                             │    │
│  │ → 시간이 부족해도 무조건 일정에 포함                        │    │
│  │ → 다른 선택 POI를 줄여서라도 필수 방문지는 확보             │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  3️⃣ SOFT CONSTRAINT (가능한 반영)                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • 사용자 선호 (themes, dietPrefs, poiTags 등)             │    │
│  │ • 챗봇 대화로 파인튜닝된 prefs                             │    │
│  │ → scoringAgent의 가중치로 반영                            │    │
│  │ → 높은 점수의 POI를 우선 선택                              │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  4️⃣ SOFT CONSTRAINT (시간대 배치)                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • 끼니 시간대 (breakfast/lunch/dinner/cafe)              │    │
│  │   - 아침: 07:30 ~ 09:30                                  │    │
│  │   - 점심: 11:30 ~ 13:30                                  │    │
│  │   - 카페: 14:00 ~ 16:00                                  │    │
│  │   - 저녁: 17:30 ~ 19:30                                  │    │
│  │ → 해당 시간대에 식당/카페를 "슬롯 예약"                     │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  5️⃣ OPTIMIZATION (최적화)                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • 이동 거리 최소화                                        │    │
│  │ • 이동 수단 고려 (도보/대중교통/차량)                      │    │
│  │ → 위 1~4 제약을 모두 만족한 후에 거리 기반 최적화          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

#### 현재 코드의 문제점

| 우선순위 | 현재 상태 | 문제 |
|----------|-----------|------|
| 1️⃣ 출발/도착 | ⚠️ 부분 구현 | 도착지(호텔)가 조건부로만 포함됨 |
| 2️⃣ 필수 방문지 | ❌ 미작동 | `requiredStops`가 전달되지만 Greedy가 건너뜀 |
| 3️⃣ 사용자 선호 | ✅ 작동 | scoringAgent로 점수 계산 중 |
| 4️⃣ 끼니 시간대 | ❌ 미구현 | 시간대 개념 자체가 없음 |
| 5️⃣ 이동 거리 | ✅ 작동 | Greedy Nearest-Neighbor로 구현 중 |

**핵심 문제**: 5번(이동 거리)이 1~4번보다 우선 적용되고 있음!

#### 스크린샷 사례 분석

```
사용자 입력:
  - 출발: 서울역 09:00
  - 도착: 뉴서울호텔 18:00
  - 필수 방문지: 경복궁 ← 일정에 없음! ❌
  - 점심: ✅, 저녁: ✅
  
실제 결과:
  1. 서울역 09:00~09:00 (출발)
  2. 난로연 남영점 09:16~10:16 (식당) ← 아침 시간에 점심용 식당 ❌
  3. 홍게집숯불닭갈비 10:18~11:18 (식당) ← 또 식당 ❌
  4. 식품명인체험홍보관 12:18~13:18 (관광지) ← 점심 시간에 관광지 ❌
  5. 서울풍물시장... 14:10~15:10 ← 마지막이 호텔 아님 ❌
  
누락된 것:
  - 경복궁 (필수 방문지)
  - 저녁 식사 (dinner=true인데 없음)
  - 호텔 도착 (도착지)
```

#### 올바른 결과 예시

```
우선순위 적용 후 예상 결과:
  1. 서울역 09:00 (출발) ← 1️⃣ Hard
  2. 경복궁 09:30~11:00 (필수 방문지) ← 2️⃣ Hard
  3. [점심 식당] 11:30~12:30 ← 4️⃣ 시간대
  4. [관광지 A] 13:00~14:30 ← 3️⃣ 선호 기반
  5. [카페] 15:00~15:40 ← 4️⃣ 시간대 (cafe=true일 경우)
  6. [관광지 B] 16:00~17:00 ← 3️⃣ 선호 기반
  7. [저녁 식당] 17:30~18:30 ← 4️⃣ 시간대
  8. 뉴서울호텔 19:00 (도착) ← 1️⃣ Hard
```

### 3.1 책임 분리 원칙

| 책임 | 담당 위치 | 설명 |
|------|-----------|------|
| 취향 분석 | Backend `/api/travel-pref` | Gemini 호출, prefs 생성 |
| 가중치 생성 | Backend `weightAgent.js` | prefs → weights 변환 |
| POI 검색 | Backend `/api/search-with-pref` | 네이버 검색 + 스코어링 |
| 경로 스케줄링 | **Backend로 이동** | Skeleton 기반 시간표 생성 |
| 상태 관리 | **Backend로 이동** | ItineraryState 유지 |
| UI 렌더링 | Frontend `App.jsx` | 결과 표시, 사용자 피드백 수집 |
| 지도 표시 | Frontend `App.jsx` | 마커 + 폴리라인 |

### 3.2 ItineraryState 기반 아키텍처

#### 초기 생성 흐름

```
App.jsx
  └── POST /api/search-with-pref
        ├── Gemini → prefs
        ├── weightAgent → weights  
        ├── Naver Search → POIs
        ├── scoringAgent → scored POIs
        ├── scheduleBuilder (신규) → skeleton 기반 일정
        └── 응답: { itineraryState, schedule, routePath }
```

#### 부분 수정 흐름

```
App.jsx (좋아요/싫어요/교체 요청)
  └── POST /api/route/refine
        ├── 기존 itineraryState 수신
        ├── lockedStopIds는 유지
        ├── dislikedStopIds는 제외
        ├── 변경된 구간만 재계산
        └── 응답: { itineraryState (updated), schedule, routePath }
```

### 3.3 Skeleton 기반 스케줄링 설계 (제약 조건 우선순위 반영)

#### Phase 1: Hard Constraint 뼈대 생성

```javascript
// Step 1-1: 출발/도착 고정 (우선순위 1️⃣)
skeleton = [
  { type: "start", timeMin: startMin, place: startPoint, fixed: true },
  { type: "end", timeMin: endMin, place: endPoint, fixed: true },
];

// Step 1-2: 필수 방문지 삽입 (우선순위 2️⃣)
// 필수 방문지는 무조건 들어가야 함 - 시간 부족하면 다른 POI를 줄임
for (const must of requiredStops) {
  skeleton.splice(-1, 0, {  // end 바로 앞에 삽입
    type: "must",
    timeMin: null,  // 아직 시간 미정
    place: must,
    fixed: true,
    stayTime: getStayTime(must.category, pace),
  });
}

// 이 시점의 skeleton 예시:
// [start(09:00)] → [must:경복궁] → [end(18:00)]
```

#### Phase 2: 끼니 슬롯 예약

```javascript
// Step 2: 끼니 시간대 슬롯 삽입 (우선순위 4️⃣)
const MEAL_WINDOWS = {
  breakfast: { idealStart: 7*60+30, idealEnd: 9*60+30, duration: 60 },
  lunch:     { idealStart: 11*60+30, idealEnd: 13*60+30, duration: 60 },
  dinner:    { idealStart: 17*60+30, idealEnd: 19*60+30, duration: 60 },
  cafe:      { idealStart: 14*60, idealEnd: 16*60, duration: 40 },
};

const mealSlots = [];
if (lunch) mealSlots.push({ type: "meal", meal: "lunch", ...MEAL_WINDOWS.lunch });
if (dinner) mealSlots.push({ type: "meal", meal: "dinner", ...MEAL_WINDOWS.dinner });
if (breakfast) mealSlots.push({ type: "meal", meal: "breakfast", ...MEAL_WINDOWS.breakfast });
if (cafe) mealSlots.push({ type: "meal", meal: "cafe", ...MEAL_WINDOWS.cafe });

// 시간순 정렬 후 skeleton에 삽입
mealSlots.sort((a, b) => a.idealStart - b.idealStart);

for (const slot of mealSlots) {
  // 사용자의 일정 범위 내에 있는지 확인
  if (slot.idealStart >= startMin && slot.idealEnd <= endMin) {
    insertMealSlotIntoSkeleton(skeleton, slot);
  }
}

// 이 시점의 skeleton 예시:
// [start(09:00)] → [must:경복궁] → [meal:lunch(11:30~13:30)] 
//   → [meal:dinner(17:30~19:30)] → [end(18:00)]
// 
// ⚠️ dinner가 end(18:00) 이후면 조정 필요!
```

#### Phase 3: Available Window 계산

```javascript
// Step 3: 각 고정 슬롯 사이의 여유 시간 계산
function calculateWindows(skeleton) {
  const windows = [];
  
  for (let i = 0; i < skeleton.length - 1; i++) {
    const from = skeleton[i];
    const to = skeleton[i + 1];
    
    const fromEndTime = from.timeMin + (from.stayTime || 0);
    const toStartTime = to.timeMin || to.idealStart;
    
    const travelTime = estimateTravelTime(from.place, to.place);
    const availableTime = toStartTime - fromEndTime - travelTime;
    
    windows.push({
      fromIdx: i,
      toIdx: i + 1,
      fromPlace: from.place,
      toPlace: to.place,
      availableMin: Math.max(0, availableTime),
      travelMin: travelTime,
    });
  }
  
  return windows;
}

// 결과 예시:
// windows = [
//   { from: "start", to: "경복궁", availableMin: 0 },      // 바로 이동
//   { from: "경복궁", to: "lunch", availableMin: 30 },     // 30분 여유
//   { from: "lunch", to: "dinner", availableMin: 240 },   // 4시간 여유 ← 관광지 배치
//   { from: "dinner", to: "end", availableMin: 0 },        // 바로 이동
// ]
```

#### Phase 4: 여유 시간에 POI 채우기

```javascript
// Step 4: 선호 기반 POI 선택 (우선순위 3️⃣) + 거리 최적화 (우선순위 5️⃣)
function fillWindowsWithPOIs(windows, scoredPOIs, weights) {
  const usedPOIs = new Set();
  
  for (const window of windows) {
    if (window.availableMin < 30) continue;  // 최소 30분 이상 여유 있을 때만
    
    // 이 구간 내에서 갈 수 있는 POI들 필터링
    const candidates = scoredPOIs.filter(poi => {
      if (usedPOIs.has(poi.id)) return false;
      
      const travelFromPrev = estimateTravelTime(window.fromPlace, poi);
      const travelToNext = estimateTravelTime(poi, window.toPlace);
      const totalNeeded = travelFromPrev + poi.stayTime + travelToNext;
      
      return totalNeeded <= window.availableMin;
    });
    
    // 점수 높은 순으로 정렬 (이미 scoringAgent가 정렬해줌)
    // 거리 최적화는 candidates 내에서 추가 고려
    candidates.sort((a, b) => {
      const scoreA = a._score;
      const scoreB = b._score;
      // 점수가 비슷하면 (0.5점 이내) 거리로 결정
      if (Math.abs(scoreA - scoreB) < 0.5) {
        const distA = estimateTravelTime(window.fromPlace, a);
        const distB = estimateTravelTime(window.fromPlace, b);
        return distA - distB;
      }
      return scoreB - scoreA;
    });
    
    // 가능한 많이 채우기
    let remainingTime = window.availableMin;
    let currentPlace = window.fromPlace;
    
    for (const poi of candidates) {
      const travelTime = estimateTravelTime(currentPlace, poi);
      const needed = travelTime + poi.stayTime;
      
      if (needed <= remainingTime) {
        window.stops = window.stops || [];
        window.stops.push(poi);
        usedPOIs.add(poi.id);
        remainingTime -= needed;
        currentPlace = poi;
      }
    }
  }
}
```

#### Phase 5: 최종 타임라인 생성

```javascript
// Step 5: 시간 역전 방지 + 최종 검증
function generateTimeline(skeleton, windows) {
  const timeline = [];
  let currentTime = skeleton[0].timeMin;  // 출발 시간
  
  for (let i = 0; i < skeleton.length; i++) {
    const node = skeleton[i];
    const window = windows[i - 1];  // 이전 구간
    
    // 이전 장소에서 이동
    if (window) {
      currentTime += window.travelMin;
      
      // 중간 POI들 추가
      for (const poi of (window.stops || [])) {
        timeline.push({
          ...poi,
          arrivalMin: currentTime,
          departureMin: currentTime + poi.stayTime,
        });
        currentTime += poi.stayTime;
        currentTime += estimateTravelTime(poi, node.place);  // 다음 장소까지
      }
    }
    
    // 현재 노드 추가
    const arrival = currentTime;
    const departure = currentTime + (node.stayTime || 0);
    
    // ⚠️ 시간 역전 검증
    if (timeline.length > 0) {
      const prev = timeline[timeline.length - 1];
      if (arrival < prev.departureMin) {
        console.error(`시간 역전! ${node.place.name} arrival=${arrival} < prev.departure=${prev.departureMin}`);
        // 강제 조정
        arrival = prev.departureMin + estimateTravelTime(prev.place, node.place);
      }
    }
    
    timeline.push({
      ...node,
      arrivalMin: arrival,
      departureMin: departure,
    });
    
    currentTime = departure;
  }
  
  // ⚠️ 최종 검증: 마지막이 반드시 end(호텔)인지
  const lastNode = timeline[timeline.length - 1];
  if (lastNode.type !== "end") {
    throw new Error("마지막 노드가 도착지(호텔)가 아닙니다!");
  }
  
  return timeline;
}
```

#### 전체 흐름 요약

```
입력: startPoint, endPoint, requiredStops, meals, scoredPOIs, pace

Phase 1: [start] ────────────────────────────────── [end]
              ↓ 필수 방문지 삽입
Phase 1: [start] → [must:경복궁] ─────────────────── [end]
              ↓ 끼니 슬롯 삽입  
Phase 2: [start] → [must:경복궁] → [lunch] → [dinner] → [end]
              ↓ 여유 시간 계산
Phase 3: [start] → [경복궁] → [lunch] → [4시간 여유] → [dinner] → [end]
              ↓ POI 채우기
Phase 4: [start] → [경복궁] → [lunch] → [관광A] → [카페] → [관광B] → [dinner] → [end]
              ↓ 타임라인 생성
Phase 5: 09:00 → 09:30~11:00 → 11:30~12:30 → ... → 17:30~18:30 → 19:00

출력: timeline[], itineraryState
```

### 3.4 API 역할 정의

| Endpoint | 역할 | 입력 | 출력 |
|----------|------|------|------|
| `POST /api/travel-pref` | 취향만 분석 | message, context | prefs (JSON) |
| `POST /api/search-with-pref` | **초기 경로 생성** | message, context, startPoint, endPoint, requiredStops | itineraryState, schedule, weights |
| `POST /api/route/refine` | **부분 수정** | itineraryState, anchor?, dislikedNames | itineraryState (updated), schedule |
| `POST /api/route` | 실제 도로 경로 | waypoints[] | path[][] (Naver Directions) |

### 3.5 Stop / ItineraryState 구조

```typescript
// types.d.ts (또는 JSDoc 주석)

interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: "start" | "end" | "restaurant" | "cafe" | "attraction" | "required";
  stayTime: number;  // 분 단위
  
  // 상태 플래그
  isMustVisit?: boolean;
  isLockedByUser?: boolean;
  
  // 시간 정보 (스케줄링 후 채워짐)
  arrivalMin?: number;
  departureMin?: number;
  
  // 고정 시간 (사용자 지정)
  fixedTimeWindow?: { start: string; end: string };
}

interface ItineraryState {
  routeId: string;
  createdAt: string;
  
  start: { placeId: string; time: string };
  end: { placeId: string; time: string };
  
  stops: Stop[];
  
  // 사용자 피드백 누적
  lockedStopIds: string[];
  mustVisitIds: string[];
  dislikedStopIds: string[];
  
  // 통합 선호 벡터
  prefs: FinalPrefVector;
  weights: WeightObject;
}
```

### 3.6 Frontend ↔ Backend 통신 흐름

#### 최초 생성

```
App.jsx
  │
  ├─ [1] 사용자가 옵션 선택 + wishText 입력
  │
  ├─ [2] "여행 계획 생성" 버튼 클릭
  │      └─ POST /api/search-with-pref
  │           body: { message, context, startPoint, endPoint, requiredStops }
  │
  ├─ [3] 서버 응답 수신
  │      └─ { itineraryState, schedule, routePath }
  │
  └─ [4] 상태 저장 + 렌더링
         setItineraryState(...)
         setSchedule(...)
         drawRouteOnMap(routePath)
```

#### 피드백 반영

```
App.jsx
  │
  ├─ [1] 사용자가 특정 장소에 좋아요/싫어요
  │
  ├─ [2] POST /api/route/refine
  │      body: { 
  │        itineraryState,  // 현재 상태 전달
  │        action: "like" | "dislike" | "replace",
  │        targetStopId: "...",
  │        anchor?: { ... }  // 교체 요청 시
  │      }
  │
  ├─ [3] 서버가 부분만 재계산
  │      └─ lockedStopIds는 유지
  │         dislikedStopIds는 후보에서 제외
  │         해당 시간대만 새 POI로 교체
  │
  └─ [4] 응답으로 UI 업데이트
```

---

## 4. File-wise Plan - 파일별 수정 계획

### 4.1 📁 server.js

#### 타입 정의
- [ ] ItineraryState, Stop 구조를 JSDoc 또는 별도 파일로 정의
- [ ] FinalPrefVector 타입 명시

#### /api/search-with-pref 리팩토링
- [ ] startPoint, endPoint, requiredStops를 body에서 필수로 받도록 변경
- [ ] 응답에 itineraryState 포함
- [ ] 스케줄링 로직을 scheduleBuilder.js로 분리 호출
- [ ] 응답 구조: `{ itineraryState, schedule, weights, routePath? }`

#### /api/route/refine 구현 완성
- [ ] 입력: itineraryState, action, targetStopId, anchor?
- [ ] lockedStopIds 유지 로직
- [ ] dislikedStopIds 제외 로직
- [ ] 특정 시간 Window만 재계산
- [ ] 응답: `{ itineraryState (updated), schedule }`

#### /api/travel-wish 결과 활용
- [ ] 현재는 자연어 응답만 반환
- [ ] prefs JSON도 같이 반환하거나, 별도 /api/travel-pref와 통합 검토

#### Naver Directions 연동
- [ ] /api/route 결과를 /api/search-with-pref 응답에 포함시키는 옵션 추가

---

### 4.2 📁 agents/scoringAgent.js

#### 좌표 정규화
- [ ] Naver API의 mapy/mapx (1e7 스케일)를 자동 감지/변환
- [ ] poi.lat이 100 이상이면 1e7로 나누는 로직

#### anchor 유사도 점수
- [ ] scorePOI()에 anchor 파라미터 추가 (옵셔널)
- [ ] anchor와의 카테고리/태그 유사도 → 보너스 점수

#### 거리 점수 개선
- [ ] 현재 startPoint 기준 거리만 계산
- [ ] 이전 장소 → 현재 장소 거리도 고려하도록 확장

#### 체류 시간 반영
- [ ] 카테고리별 기본 체류시간 상수 정의
- [ ] pace에 따른 배수 적용

---

### 4.3 📁 agents/weightAgent.js

#### pace → stayTimeMultiplier 추가
- [ ] relaxed: 1.5, normal: 1.0, tight: 0.7
- [ ] 체류시간 계산 시 사용할 수 있도록 weights에 포함

#### UI 옵션 직접 반영
- [ ] prefs에 breakfast/lunch/dinner/cafe 플래그가 있으면
- [ ] category.restaurantWeight 자동 조정

#### 피드백 누적 반영
- [ ] likedCategories[], dislikedCategories[]를 prefs에서 받아
- [ ] 해당 카테고리 가중치 증감

---

### 4.4 📁 planner/routePlanner.js → 📁 scheduleBuilder.js (신규 또는 대대적 수정)

#### selectPOIs() 개선
- [ ] requiredStops와 중복되는 POI 제외
- [ ] 카테고리 균형 조정 (음식 vs 관광지 비율)

#### optimizeRoute() → buildSkeleton() + fillWindows()로 분리
- [ ] buildSkeleton(): [start] → [must1] → [must2] → [end] 구조 생성
- [ ] fillWindows(): 각 구간의 여유 시간에 POI 채우기

#### 시간 계산 로직 강화
- [ ] arrival = max(prevDeparture, prevDeparture + travelTime)
- [ ] 시간 역전 시 에러 throw 또는 자동 조정
- [ ] endMin 초과 시 마지막 POI 제거 후 재시도

#### 호텔(end) 강제 포함
- [ ] 시간 초과되더라도 end는 무조건 route에 포함
- [ ] 경고 메시지만 추가 (예: "예정보다 30분 늦게 도착")

#### 체류 시간 함수
- [ ] getStayTime(category, pace) → 분 단위 반환
- [ ] 하드코딩 60분 제거

#### generateSchedule() 검증 로직 추가
- [ ] 각 row 생성 시 arrival < prevDepart 체크
- [ ] 마지막 row가 반드시 end인지 확인

---

### 4.5 📁 src/App.jsx

#### 상태 구조 변경
- [ ] plan 대신 itineraryState, schedule 분리
- [ ] `const [itineraryState, setItineraryState] = useState(null);`

#### onGenerate() 수정
- [ ] fetchPoisFromServer() 결과로 itineraryState 수신
- [ ] 별도 스케줄링 호출 제거 (서버에서 처리)

#### handleSendWish() 결과 활용
- [ ] 서버 응답의 prefs를 저장
- [ ] 다음 onGenerate() 호출 시 해당 prefs 재사용

#### 피드백 UI 추가
- [ ] 각 장소 카드에 좋아요/싫어요 버튼
- [ ] onLike(stopId) → lockedStopIds에 추가 + /api/route/refine 호출
- [ ] onDislike(stopId) → dislikedStopIds에 추가 + /api/route/refine 호출

#### 지도 실제 경로 표시
- [ ] /api/route 호출하여 path[][] 수신
- [ ] Polyline에 실제 도로 좌표 사용
- [ ] fallback: 실패 시 직선 연결

#### requiredStops 중복 방지
- [ ] 필수 방문지가 schedule에 두 번 나오지 않도록
- [ ] selectPOIs 호출 전 필터링

#### 로딩/에러 상태 개선
- [ ] 각 API 호출 단계별 상태 표시
- [ ] 네트워크 오류 시 재시도 버튼

---

### 4.6 📁 신규 파일 제안

#### types/itinerary.js
- [ ] Stop, ItineraryState, FinalPrefVector 타입 정의
- [ ] 유틸리티 함수: createItineraryState(), cloneState()

#### agents/scheduleBuilder.js
- [ ] buildSkeleton()
- [ ] calculateWindows()
- [ ] fillWindowsWithPOIs()
- [ ] generateTimeline()
- [ ] validateSchedule()

#### utils/timeUtils.js
- [ ] toMinutes("HH:MM") → number
- [ ] toHM(minutes) → "HH:MM"
- [ ] addMinutes(time, delta)
- [ ] isTimeAfter(t1, t2)

---

## 5. 구현 우선순위

### 제약 조건 기반 재정렬 (2차 업데이트)

새로 발견된 문제점들을 반영하여 우선순위를 재정렬합니다.

| 단계 | 작업 | 제약 조건 | 해결되는 문제 |
|------|------|-----------|--------------|
| **1** | **출발/도착 강제 포함** | 1️⃣ Hard | 호텔 누락 |
| **2** | **필수 방문지 강제 포함 + 중복 제거** | 2️⃣ Hard | 경복궁 누락 & 2번 나옴 |
| **3** | **endMin까지 일정 채우기** | 1️⃣ Hard | 17:20 조기 종료 (20시인데) |
| **4** | **끼니 시간대 슬롯 예약** | 4️⃣ Soft | 점심 10:41, 저녁 15:51 |
| **5** | **카테고리 다양성 보장** | 3️⃣ Soft | 궁궐만 4개 추천 |
| **6** | **거리 페널티 완화** | 5️⃣ Optimization | 먼 곳의 좋은 POI 탈락 |

### 상세 구현 계획

#### Step 1-2: Hard Constraint 보장

```javascript
// 1. 호텔 무조건 포함 (시간 초과해도)
// 2. 필수 방문지 무조건 포함
// 3. 필수 방문지 이름으로 일반 POI에서 중복 제거

const requiredNames = new Set(
  requiredStops.map(r => normalizeKorean(r.name))
);

const dedupedPOIs = scoredPOIs.filter(poi => {
  const normalized = normalizeKorean(poi.name);
  // "경복궁", "경복궁역", "경복궁 돌담길" 등 유사 이름 제거
  for (const reqName of requiredNames) {
    if (normalized.includes(reqName) || reqName.includes(normalized)) {
      return false;
    }
  }
  return true;
});
```

#### Step 3: endMin까지 일정 채우기

```javascript
// 현재: 갈 곳 없으면 바로 종료
// 변경: endMin까지 여유 있으면 계속 탐색

function shouldContinueScheduling(currentTime, endMin, endPoint, currentPlace) {
  const travelToEnd = estimateTravelTime(currentPlace, endPoint);
  const remainingTime = endMin - currentTime - travelToEnd;
  
  // 30분 이상 여유 있으면 계속 탐색
  if (remainingTime >= 30) {
    return true;
  }
  return false;
}

// 가까운 곳에 POI가 없으면?
// → 검색 반경 확대 or 체류 시간 늘리기 or 먼 곳도 포함
```

#### Step 4: 끼니 시간대 슬롯 예약

```javascript
const MEAL_WINDOWS = {
  breakfast: { start: 7*60+30, end: 9*60+30, duration: 60 },
  lunch:     { start: 11*60+30, end: 13*60+30, duration: 60 },
  dinner:    { start: 17*60+30, end: 19*60+30, duration: 60 },
  cafe:      { start: 14*60, end: 16*60, duration: 40 },
};

// 식당 POI는 해당 시간대에만 배치 가능
function canPlaceRestaurant(poi, currentTime) {
  if (poi.categoryType !== 'restaurant') return true;
  
  // 점심 시간대인가?
  if (lunch && currentTime >= MEAL_WINDOWS.lunch.start - 30 
            && currentTime <= MEAL_WINDOWS.lunch.end) {
    return true;
  }
  // 저녁 시간대인가?
  if (dinner && currentTime >= MEAL_WINDOWS.dinner.start - 30 
             && currentTime <= MEAL_WINDOWS.dinner.end) {
    return true;
  }
  return false;  // 식당은 끼니 시간대만!
}
```

#### Step 5: 카테고리 다양성 보장

```javascript
const MAX_SAME_CATEGORY = 2;  // 같은 세부 카테고리 최대 2개
const categoryCount = {};

function selectWithDiversity(candidates, numToSelect) {
  const selected = [];
  
  // 점수 높은 순으로 정렬
  const sorted = [...candidates].sort((a, b) => b._score - a._score);
  
  for (const poi of sorted) {
    if (selected.length >= numToSelect) break;
    
    const cat = poi.detailCategory || poi.category || 'etc';
    
    // 같은 카테고리가 이미 MAX_SAME_CATEGORY개 있으면 스킵
    if ((categoryCount[cat] || 0) >= MAX_SAME_CATEGORY) {
      continue;
    }
    
    selected.push(poi);
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  }
  
  return selected;
}

// 예시 결과:
// Before: 궁궐, 궁궐, 궁궐, 궁궐 (전부 궁궐)
// After:  궁궐, 궁궐, 전통체험, 카페 (다양하게)
```

#### Step 6: 거리 페널티 완화

```javascript
// 현재: distanceWeight = -0.3 ~ -0.4 (거리 멀면 크게 감점)
// 변경: 점수가 높으면 거리 페널티 상쇄

function adjustedDistancePenalty(poi, weights, userThemes) {
  const basePenalty = poi.distanceKm * weights.pace.distanceWeight;
  
  // 테마 매칭 시 거리 페널티 50% 감소
  const matchesTheme = userThemes.some(t => 
    poi.tags?.includes(t) || poi.category?.includes(t)
  );
  
  if (matchesTheme) {
    return basePenalty * 0.5;  // 거리 페널티 절반
  }
  
  return basePenalty;
}

// 예시:
// K-pop 굿즈샵이 5km 떨어져 있어도
// 사용자가 "K-pop 관련" 테마 선택했으면 거리 페널티 절반
```

### 구현 그룹 (업데이트)

#### 🔴 Phase A: Hard Constraint 보장 (Step 1-3)
> **목표**: 호텔 + 필수 방문지 + endMin까지 채우기

```
해결되는 문제:
✅ 경복궁 누락
✅ 경복궁 2번 나옴
✅ 호텔 17:20 도착 (20시인데)
```

#### 🟡 Phase B: 시간대 배치 (Step 4)
> **목표**: 점심/저녁이 올바른 시간대에

```
해결되는 문제:
✅ 점심 10:41 시작 → 11:30~13:30으로
✅ 저녁 15:51 시작 → 17:30~19:30으로
```

#### 🟢 Phase C: 다양성 확보 (Step 5-6)
> **목표**: 궁궐만 4개 X → 다양한 카테고리

```
해결되는 문제:
✅ 궁궐, 궁궐, 궁궐, 궁궐 → 궁궐, 체험, 카페, 맛집
✅ K-pop 굿즈샵 (멀어도) 추천에 포함
```

---

## 다음 단계

위 계획을 바탕으로, 구체적인 구현을 진행할 때는 다음과 같이 요청해주세요:

```
"Phase A를 구현해줘" (Hard Constraint 보장)
"Step 4를 구현해줘" (끼니 시간대 슬롯 예약)
```

**권장 순서**:
1. `Phase A` → 필수 방문지 + 호텔 문제 해결
2. `Step 4` → 끼니 시간대 문제 해결
3. 나머지는 순차적으로

각 Step에 대해 구체적인 코드와 테스트 방법을 제공해드리겠습니다.
