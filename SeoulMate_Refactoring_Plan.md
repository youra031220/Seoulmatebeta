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

### 2.10 추가 발견 문제

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

### 3.3 Skeleton 기반 스케줄링 설계

```javascript
// 새로운 scheduleBuilder.js (백엔드)

// Step 1: Skeleton 생성
skeleton = [
  { type: "start", time: startMin, place: startPoint },
  { type: "must", time: null, place: requiredStops[0] },
  { type: "must", time: null, place: requiredStops[1] },
  { type: "end", time: endMin, place: endPoint },
];

// Step 2: 구간별 Available Window 계산
windows = [
  { from: "start", to: "must0", availableMin: 120 },
  { from: "must0", to: "must1", availableMin: 90 },
  { from: "must1", to: "end", availableMin: 60 },
];

// Step 3: 각 Window에 POI 채우기 (시간 역순 불가능하게)
for (window of windows) {
  candidatePOIs = filterByDistance(window.from, window.to);
  while (window.remainingTime > minStayTime) {
    bestPOI = selectBest(candidatePOIs, weights);
    if (canFit(bestPOI, window)) {
      window.stops.push(bestPOI);
      window.remainingTime -= (travelTime + stayTime);
    }
  }
}

// Step 4: 시간표 생성 (arrival < prevDeparture 절대 불가)
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

| 순서 | 작업 | 난이도 | 영향도 | 예상 소요 |
|------|------|--------|--------|-----------|
| 1 | 호텔 강제 포함 + 시간 역전 방지 | ⭐⭐ | 🔥🔥🔥 | 2-3시간 |
| 2 | 체류 시간 카테고리별 적용 | ⭐ | 🔥🔥 | 1-2시간 |
| 3 | 종료 시간 초과 방지 (호텔까지 시간 확보) | ⭐⭐ | 🔥🔥🔥 | 2-3시간 |
| 4 | ItineraryState 타입 정의 + 서버 응답 구조 변경 | ⭐⭐⭐ | 🔥🔥 | 3-4시간 |
| 5 | Skeleton 기반 스케줄링 구현 | ⭐⭐⭐⭐ | 🔥🔥🔥 | 6-8시간 |
| 6 | 좋아요/싫어요 UI + /api/route/refine 연동 | ⭐⭐⭐ | 🔥🔥 | 4-5시간 |
| 7 | 실제 도로 경로 표시 | ⭐⭐ | 🔥 | 2-3시간 |
| 8 | POI 균형 조정 (음식 vs 관광지) | ⭐⭐ | 🔥 | 2-3시간 |

---

## 다음 단계

위 계획을 바탕으로, 구체적인 구현을 진행할 때는 다음과 같이 요청해주세요:

```
"Step 1을 구현해줘" (호텔 강제 포함 + 시간 역전 방지)
"Step 5를 구현해줘" (Skeleton 기반 스케줄링)
```

각 Step에 대해 구체적인 코드와 테스트 방법을 제공해드리겠습니다.
