# SeoulMate 구현 가이드 - Cursor용 프롬프트

> 각 Phase/Step별로 Cursor에 복사-붙여넣기 할 수 있는 프롬프트 모음

---

## 📁 파일 구조 개요

### 현재 집중 파일 (5개)

```
seoulmateback/
├── server.js          # API 엔드포인트, Gemini 연동
├── routePlanner.js    # 경로 최적화, 스케줄 생성
├── scoringAgent.js    # POI 점수 계산
└── weightAgent.js     # 가중치 생성

seoulmatefront/
└── src/
    └── App.jsx        # 메인 UI, 상태 관리
```

### 추가 필요 파일 (신규 생성 권장)

```
seoulmateback/
├── constants/
│   ├── timeConstants.js    # 끼니 시간대, 체류시간 기본값
│   └── scenarios.json      # 혼잡도/날씨 시나리오
├── utils/
│   ├── timeUtils.js        # 시간 계산 유틸리티
│   └── biasDetector.js     # 편향 감지 로직
├── agents/
│   └── scheduleBuilder.js  # Skeleton 기반 스케줄링 (routePlanner 대체/보완)
└── types/
    └── itinerary.js        # 타입 정의 (JSDoc)

seoulmatefront/
└── src/
    ├── components/
    │   ├── PaceSelector.jsx      # 페이스 선택 UI
    │   ├── MealTimeCustomizer.jsx # 끼니 시간 조정 UI
    │   ├── RequiredStopCard.jsx  # 필수 장소 카드 (시간 지정)
    │   └── LinkedRecommendation.jsx # 연계 추천 선택 UI
    ├── hooks/
    │   └── useActionTracker.js   # 사용자 행동 추적
    └── utils/
        └── timeUtils.js          # 프론트엔드 시간 유틸
```

---

## 🔧 Phase A: 검색 쿼리 분리 + Hard Constraint

### Step A-1: 시간 상수 파일 생성

**파일**: `seoulmateback/constants/timeConstants.js` (신규)

**Cursor 프롬프트**:
```
새 파일 constants/timeConstants.js를 생성해줘.

다음 내용을 포함해야 해:

1. MEAL_WINDOWS 객체
- breakfast: { start: "07:30", end: "09:30", duration: 60 }
- lunch: { start: "11:30", end: "13:30", duration: 60 }
- dinner: { start: "17:30", end: "19:30", duration: 60 }
- cafe: { start: "14:00", end: "16:00", duration: 40 }

2. STAY_TIME_BY_CATEGORY 객체
- 궁궐: 90, 박물관: 90, 전통체험: 60, 카페: 40, 식당: 60, 포토존: 30 등

3. PACE_MULTIPLIER 객체
- relaxed: 1.3, normal: 1.0, tight: 0.7

4. roundToTen(minutes) 함수
- 10분 단위 반올림

5. calculateStayTime(category, pace) 함수
- 기본값 × 배수 → 10분 단위 반올림

6. toMinutes(timeString) 함수
- "09:30" → 570 변환

7. toTimeString(minutes) 함수
- 570 → "09:30" 변환

모두 export 해줘.
```

---

### Step A-2: Gemini 프롬프트 수정 (검색 쿼리에서 필수 방문지 제외)

**파일**: `seoulmateback/server.js`

**Cursor 프롬프트**:
```
server.js의 analyzeTravelPreference 함수에서 Gemini 프롬프트를 수정해줘.

현재 문제:
- 사용자가 "경복궁 꼭 가고 싶어"라고 하면 모든 검색 쿼리에 "경복궁"이 포함됨
- 예: "서울 경복궁 맛집", "서울 경복궁 볼거리" 등

수정 사항:
프롬프트에 다음 규칙을 추가해줘:

"""
### 🚨 중요한 규칙

1. 필수 방문지(requiredStops)는 검색 키워드에 포함하지 마세요!
   - 사용자가 "경복궁 꼭 가고 싶어"라고 해도
   - searchKeywords, poiSearchQueries, foodSearchQueries에 "경복궁"을 넣지 마세요
   - 필수 방문지는 이미 확정되었으므로, 다른 장소를 찾아야 합니다

2. 지역을 도시 단위로 검색하세요
   - "경복궁 맛집" ❌
   - "서울 전통 맛집" ✅

3. 현재 필수 방문지 목록 (검색에서 제외):
${JSON.stringify(requiredStopNames)}
"""

그리고 analyzeTravelPreference 함수의 파라미터에 requiredStopNames를 추가하고,
이를 프롬프트에 포함시켜줘.
```

---

### Step A-3: 필수 방문지 중복 제거

**파일**: `seoulmateback/routePlanner.js`

**Cursor 프롬프트**:
```
routePlanner.js의 selectPOIs 함수를 수정해줘.

현재 문제:
- requiredStops에 "경복궁"이 있는데, 네이버 검색 결과에도 "경복궁"이 포함됨
- 결과적으로 일정에 경복궁이 2번 나옴

수정 사항:
selectPOIs 함수 시작 부분에 다음 로직을 추가:

1. requiredStops의 이름들을 Set으로 만들기 (정규화 포함)
2. scoredPOIs에서 requiredStops와 이름이 유사한 것 필터링

코드 예시:
```javascript
// 필수 방문지 이름 정규화
const normalizeKorean = (str) => str.replace(/\s+/g, '').toLowerCase();
const requiredNames = new Set(
  (requiredStops || []).map(r => normalizeKorean(r.name))
);

// 중복 제거
const dedupedPOIs = pois.filter(poi => {
  const normalized = normalizeKorean(poi.title || poi.name);
  for (const reqName of requiredNames) {
    // 포함 관계 체크 (경복궁, 경복궁역, 경복궁 돌담길 등)
    if (normalized.includes(reqName) || reqName.includes(normalized)) {
      return false;
    }
  }
  return true;
});
```

그리고 이후 로직에서 pois 대신 dedupedPOIs를 사용하도록 해줘.
```

---

### Step A-4: 호텔(도착지) 강제 포함

**파일**: `seoulmateback/routePlanner.js`

**Cursor 프롬프트**:
```
routePlanner.js의 optimizeRoute 함수를 수정해줘.

현재 문제 (라인 432-451 근처):
- 시간/거리 조건이 안 맞으면 호텔(endPoint)이 일정에서 제외됨
- 코드: if (now + legToEnd <= endMin && legToEnd <= maxLegMin) { 호텔 추가 }

수정 사항:
호텔은 무조건 마지막에 포함되어야 함. 조건문을 다음과 같이 변경:

```javascript
// 기존: 조건부 추가
// if (now + legToEnd <= endMin && legToEnd <= maxLegMin) { ... }

// 변경: 무조건 추가 + 경고 플래그
const isOverTime = now + legToEnd > endMin;
const isOverDistance = legToEnd > maxLegMin;

route.push({
  ...endNode,
  _warnings: {
    overTime: isOverTime,
    overDistance: isOverDistance,
  }
});

if (isOverTime) {
  console.warn(`⚠️ 도착 예정 시간이 ${endMin}분을 초과합니다.`);
}
```

이렇게 하면 호텔은 항상 포함되고, 시간 초과 여부는 경고로 표시돼.
```

---

### Step A-5: 필수 방문지 강제 포함

**파일**: `seoulmateback/routePlanner.js`

**Cursor 프롬프트**:
```
routePlanner.js의 optimizeRoute 함수를 수정해줘.

현재 문제:
- requiredStops가 nodes에 포함되지만, Greedy 알고리즘이 시간/거리 제약으로 스킵할 수 있음
- 결과적으로 필수 방문지가 일정에 없을 수 있음

수정 사항:
필수 방문지는 무조건 일정에 포함되어야 함.

1. nodes 배열 생성 시, requiredStops에 isMustVisit: true 플래그 추가

2. Greedy 루프에서 mustVisit 노드는 스킵하지 않도록 수정:
```javascript
// 기존: 시간/거리 조건 체크
if (now + leg + stay > endMin) continue;
if (leg > maxLegMin) continue;

// 변경: mustVisit이면 조건 무시
if (!node.isMustVisit) {
  if (now + leg + stay > endMin) continue;
  if (leg > maxLegMin) continue;
}
```

3. mustVisit 노드가 선택되지 않았으면 마지막에 강제 삽입하는 로직 추가
```

---

## 🔧 Phase B: 끼니 시간대 슬롯 예약

### Step B-1: 끼니 슬롯 삽입 로직

**파일**: `seoulmateback/routePlanner.js` 또는 `seoulmateback/agents/scheduleBuilder.js` (신규)

**Cursor 프롬프트**:
```
routePlanner.js에 끼니 시간대 스케줄링 로직을 추가해줘.

목표:
- 점심(lunch=true)이면 11:30~13:30 사이에 식당이 배치되어야 함
- 저녁(dinner=true)이면 17:30~19:30 사이에 식당이 배치되어야 함

새로운 함수 추가:

1. getMealSlots(meals, startMin, endMin) 함수
- meals: { breakfast, lunch, dinner, cafe }
- 사용자의 일정 범위(startMin~endMin) 내에 있는 끼니 슬롯만 반환
- 반환값: [{ type: "meal", meal: "lunch", idealStart: 690, idealEnd: 810 }, ...]

2. canPlaceRestaurant(poi, currentTimeMin, mealSlots) 함수
- 식당 POI가 현재 시간에 배치 가능한지 체크
- 식당은 끼니 시간대에만 배치 가능
- 반환값: true/false

3. optimizeRoute 함수 수정
- 식당 POI 선택 시 canPlaceRestaurant 체크 추가
- 끼니 시간대가 되면 해당 시간대의 식당을 우선 선택

timeConstants.js의 MEAL_WINDOWS를 import해서 사용해줘.
```

---

## 🔧 Phase C: 다양성 + 연계 추천

### Step C-1: 카테고리 다양성 보장

**파일**: `seoulmateback/routePlanner.js`

**Cursor 프롬프트**:
```
routePlanner.js의 selectPOIs 함수에 카테고리 다양성 로직을 추가해줘.

현재 문제:
- 거리 기반으로만 선택하다 보니 궁궐만 4개 추천되는 경우가 있음

수정 사항:
같은 세부 카테고리는 최대 2개까지만 선택

```javascript
const MAX_SAME_CATEGORY = 2;
const categoryCount = {};

function selectWithDiversity(candidates, numToSelect) {
  const selected = [];
  const sorted = [...candidates].sort((a, b) => b._score - a._score);
  
  for (const poi of sorted) {
    if (selected.length >= numToSelect) break;
    
    // 카테고리 추출 (예: "여행,명소>궁궐" → "궁궐")
    const cat = poi.category?.split('>').pop() || 'etc';
    
    if ((categoryCount[cat] || 0) >= MAX_SAME_CATEGORY) {
      continue;  // 이미 해당 카테고리가 충분함
    }
    
    selected.push(poi);
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  }
  
  return selected;
}
```

기존 POI 선택 로직을 이 함수로 대체해줘.
```

---

### Step C-2: 편향 감지 로직

**파일**: `seoulmateback/utils/biasDetector.js` (신규)

**Cursor 프롬프트**:
```
새 파일 utils/biasDetector.js를 생성해줘.

detectSearchBias(pois, requiredStops, userThemes) 함수를 만들어줘.

체크할 항목:
1. 카테고리 집중도: 한 카테고리가 40% 이상이면 편향
2. 지역 집중도: 필수 방문지 주변 3km 내에 60% 이상이면 편향
3. 테마 매칭률: 사용자 테마와 매칭되는 POI가 30% 미만이면 부족
4. 데이터 부족: POI가 10개 미만이면 부족

반환값:
{
  isBiased: boolean,
  issues: string[],
  suggestions: string[],
}

예시:
{
  isBiased: true,
  issues: ["'궁궐' 카테고리가 50%를 차지해요"],
  suggestions: ["다른 종류의 장소도 보고 싶으시면 알려주세요!"]
}
```

---

### Step C-3: 서버 응답에 편향 리포트 추가

**파일**: `seoulmateback/server.js`

**Cursor 프롬프트**:
```
server.js의 /api/search-with-pref 엔드포인트를 수정해줘.

1. utils/biasDetector.js에서 detectSearchBias를 import

2. POI 검색 결과에 대해 편향 감지 실행:
```javascript
const biasReport = detectSearchBias(scoredPOIs, requiredStops, prefs.themes || []);
```

3. 응답에 biasReport 추가:
```javascript
return res.json({
  prefs: safePrefs,
  weights,
  city,
  pois: scoredPOIs,
  biasReport,  // 추가
});
```
```

---

### Step C-4: 프론트엔드에서 편향 알림 표시

**파일**: `seoulmatefront/src/App.jsx`

**Cursor 프롬프트**:
```
App.jsx의 onGenerate 함수 (또는 fetchPoisFromServer 호출 후)를 수정해줘.

서버 응답에 biasReport가 있으면 챗봇에 알림을 표시해야 해.

```javascript
// POI 검색 응답 받은 후
if (response.biasReport?.isBiased) {
  const issues = response.biasReport.issues.join('\n• ');
  const suggestions = response.biasReport.suggestions.join('\n');
  
  setWishLog(prev => [...prev, {
    id: Date.now(),
    role: "assistant",
    text: `📊 추천 결과를 분석해봤어요:\n• ${issues}\n\n💡 ${suggestions}`,
  }]);
}
```

이 코드를 적절한 위치에 추가해줘.
```

---

## 🔧 Phase D: 페이스 + UI 개선

### Step D-1: 페이스 선택 UI

**파일**: `seoulmatefront/src/App.jsx` 또는 `components/PaceSelector.jsx` (신규)

**Cursor 프롬프트**:
```
App.jsx에 여행 페이스 선택 UI를 추가해줘.

1. state 추가:
```javascript
const [pace, setPace] = useState("normal");  // relaxed, normal, tight
```

2. 시간 설정 섹션에 라디오 버튼 추가:
```jsx
<div className="pace-selector">
  <label>여행 페이스:</label>
  <div className="pace-options">
    <label>
      <input 
        type="radio" 
        value="relaxed" 
        checked={pace === "relaxed"}
        onChange={(e) => setPace(e.target.value)}
      />
      여유롭게 (×1.3)
    </label>
    <label>
      <input 
        type="radio" 
        value="normal" 
        checked={pace === "normal"}
        onChange={(e) => setPace(e.target.value)}
      />
      보통 (×1.0)
    </label>
    <label>
      <input 
        type="radio" 
        value="tight" 
        checked={pace === "tight"}
        onChange={(e) => setPace(e.target.value)}
      />
      알차게 (×0.7)
    </label>
  </div>
  <small>💡 체류시간이 10분 단위로 조정돼요</small>
</div>
```

3. onGenerate 호출 시 pace를 서버에 전달하도록 수정
```

---

### Step D-2: 필수 장소 시간 지정 UI

**파일**: `seoulmatefront/src/App.jsx`

**Cursor 프롬프트**:
```
App.jsx의 필수 방문지 입력 부분을 수정해줘.

현재: 장소만 입력 가능
변경: 장소 + 방문 시간 지정 가능

requiredStops의 각 항목에 timePreference 필드 추가:
```javascript
// 기존
{ name: "경복궁", lat: ..., lng: ... }

// 변경
{ 
  name: "경복궁", 
  lat: ..., 
  lng: ...,
  timePreference: {
    type: "auto" | "specific" | "slot",
    value: null | "14:00~16:00" | "afternoon"
  }
}
```

UI에서 각 필수 장소 카드에 시간 선택 옵션 추가:
- 자동 배정 (기본값)
- 직접 지정 (시간 입력)
- 시간대 지정 (오전/오후/저녁 드롭다운)
```

---

## 🔧 Phase E: 시나리오 + LLM 동적 정보

### Step E-1: 시나리오 JSON 생성

**파일**: `seoulmateback/constants/scenarios.json` (신규)

**Cursor 프롬프트**:
```
새 파일 constants/scenarios.json을 생성해줘.

다음 구조로 만들어줘:

{
  "scenarios": {
    "crowdedness": {
      "crowded": {
        "id": "crowded",
        "label": "혼잡",
        "adjustments": {
          "stayTimeMultiplier": 1.2,
          "travelTimeMultiplier": 1.3
        }
      },
      "normal": {
        "id": "normal",
        "label": "무난",
        "adjustments": {
          "stayTimeMultiplier": 1.0,
          "travelTimeMultiplier": 1.0
        }
      }
    },
    "weather": {
      "outdoor_ok": {
        "id": "outdoor_ok",
        "label": "외부활동 적절",
        "adjustments": {
          "categoryBoost": { "공원": 0.3, "산책로": 0.3 },
          "categoryPenalty": {}
        }
      },
      "outdoor_hard": {
        "id": "outdoor_hard",
        "label": "외부활동 힘듦",
        "adjustments": {
          "categoryBoost": { "박물관": 0.4, "쇼핑몰": 0.3, "카페": 0.3 },
          "categoryPenalty": { "공원": -0.5, "산책로": -0.5 }
        }
      }
    }
  }
}
```

---

## 📋 파일별 수정 요약

### 기존 파일 수정

| 파일 | 수정 내용 | Phase |
|------|-----------|-------|
| `server.js` | Gemini 프롬프트 수정, biasReport 추가 | A, C |
| `routePlanner.js` | 중복 제거, 호텔 강제, 필수장소 강제, 끼니 슬롯, 다양성 | A, B, C |
| `scoringAgent.js` | (큰 수정 없음, 좌표 정규화 정도) | - |
| `weightAgent.js` | pace 반영 | D |
| `App.jsx` | 페이스 UI, 시간 지정 UI, 편향 알림, 행동 추적 | C, D |

### 신규 파일 생성

| 파일 | 용도 | Phase |
|------|------|-------|
| `constants/timeConstants.js` | 시간 상수, 체류시간 계산 | A |
| `constants/scenarios.json` | 혼잡도/날씨 시나리오 | E |
| `utils/timeUtils.js` | 시간 변환 유틸리티 | A |
| `utils/biasDetector.js` | 편향 감지 | C |
| `agents/scheduleBuilder.js` | Skeleton 스케줄링 (선택) | B |

---

## 🚀 권장 구현 순서

```
1️⃣ constants/timeConstants.js 생성 (모든 곳에서 사용)
2️⃣ server.js - Gemini 프롬프트 수정
3️⃣ routePlanner.js - 필수 방문지 중복 제거
4️⃣ routePlanner.js - 호텔 강제 포함
5️⃣ routePlanner.js - 필수 방문지 강제 포함
6️⃣ routePlanner.js - 카테고리 다양성
7️⃣ routePlanner.js - 끼니 시간대 슬롯
8️⃣ utils/biasDetector.js 생성
9️⃣ server.js - biasReport 추가
🔟 App.jsx - 편향 알림 + 페이스 UI
```

각 단계를 완료할 때마다 테스트하고 다음 단계로 진행하세요!
