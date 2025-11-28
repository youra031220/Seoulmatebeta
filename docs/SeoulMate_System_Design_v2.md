# SeoulMate 시스템 설계 v2

> 사용자 피드백 반영 버전 (2024)

---

## 1. 전체 흐름 개요

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SeoulMate 사용자 플로우                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │ Step 1      │    │ Step 2      │    │ Step 3      │                 │
│  │ 시간 설정    │ → │ 장소 설정    │ → │ 끼니 설정    │                 │
│  │             │    │             │    │             │                 │
│  │ • 출발시간   │    │ • 출발지    │    │ • 아침 ☐    │                 │
│  │ • 도착시간   │    │ • 도착지    │    │ • 점심 ☑    │                 │
│  │             │    │             │    │ • 저녁 ☑    │                 │
│  │             │    │             │    │ (시간 조정可)│                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│         │                 │                 │                          │
│         └─────────────────┴─────────────────┘                          │
│                           │                                            │
│                           ▼                                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │ Step 4      │    │ Step 5      │    │ Step 6      │                 │
│  │ 필수 장소    │ → │ 카테고리    │ → │ 챗봇 대화    │                 │
│  │             │    │             │    │             │                 │
│  │ • 경복궁    │    │ • 문화·역사 │    │ 자연어로     │                 │
│  │   (14:00~)  │    │ • K-pop     │    │ 선호 파악    │                 │
│  │ • 남산타워  │    │ • 자연      │    │             │                 │
│  │   (저녁)    │    │             │    │             │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│         │                 │                 │                          │
│         └─────────────────┴─────────────────┘                          │
│                           │                                            │
│                           ▼                                            │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │ Step 7: 가중치 기반 추천 생성                                   │     │
│  │                                                                │     │
│  │ • 음식점: 리뷰/별점 기준 or 테마 근처                          │     │
│  │ • 관광지: 연계 추천 (물리적/테마적/시간적) → 사용자 선택       │     │
│  │ • 남은 시간 처리: 1시간 이상 → 간단 장소 추천 + 의사 확인       │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                           │                                            │
│                           ▼                                            │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │ Step 8-9: 피드백 루프 (반복)                                    │     │
│  │                                                                │     │
│  │ 사용자 행동 추적:                                              │     │
│  │ • 상세정보 클릭 → 가중치 ↑                                    │     │
│  │ • 챗봇에 "여기 좋아" → 가중치 ↑                               │     │
│  │ • 시간 계획표에서 클릭 → 가중치 ↑                             │     │
│  │                                                                │     │
│  │ 챗봇 심화 질문:                                                │     │
│  │ • 일정 생성 직후                                               │     │
│  │ • 특정 행동 감지 시                                            │     │
│  │ • 편향 감지 시                                                 │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 각 Step 상세 설계

### 2.1 Step 1: 시간 설정

```
┌─────────────────────────────────────┐
│ 시간 설정                           │
├─────────────────────────────────────┤
│                                     │
│  출발 시간: [09:00 ▼]              │
│                                     │
│  도착 시간: [20:00 ▼]              │
│                                     │
│  여행 페이스:                       │
│  ○ 여유롭게 (×1.3)                 │
│  ● 보통 (×1.0)                     │
│  ○ 알차게 (×0.7)                   │
│                                     │
│  💡 체류시간이 10분 단위로 조정돼요  │
│     예) 카페: 50분/40분/30분        │
│                                     │
└─────────────────────────────────────┘
```

#### 설계 결정사항

| 항목 | 결정 | 비고 |
|------|------|------|
| 시간 입력 | 드롭다운 (30분 단위) | 00:00~23:30 |
| 페이스 입력 | 라디오 버튼 3개 | 체류시간 배수에 영향 |

#### 페이스별 체류시간 계산 (10분 단위 반올림)

```javascript
const PACE_MULTIPLIER = {
  relaxed: 1.3,  // 여유롭게
  normal: 1.0,   // 보통
  tight: 0.7,    // 알차게
};

// 10분 단위 반올림 함수
function roundToTen(minutes) {
  return Math.round(minutes / 10) * 10;
}

// 최종 체류시간 계산
function calculateStayTime(baseMinutes, pace = "normal") {
  const multiplied = baseMinutes * PACE_MULTIPLIER[pace];
  return roundToTen(multiplied);
}

// 예시
// calculateStayTime(40, "relaxed") → 40 × 1.3 = 52 → 50분
// calculateStayTime(40, "normal")  → 40 × 1.0 = 40 → 40분
// calculateStayTime(40, "tight")   → 40 × 0.7 = 28 → 30분

// calculateStayTime(90, "relaxed") → 90 × 1.3 = 117 → 120분
// calculateStayTime(90, "normal")  → 90 × 1.0 = 90 → 90분
// calculateStayTime(90, "tight")   → 90 × 0.7 = 63 → 60분
```

#### 테마별 체류시간 표 (pace 적용 후)

| 테마 | 기본값 | 여유롭게 | 보통 | 알차게 |
|------|--------|----------|------|--------|
| 궁궐/박물관 | 90분 | 120분 | 90분 | 60분 |
| 전통체험 | 60분 | 80분 | 60분 | 40분 |
| 쇼핑 | 60분 | 80분 | 60분 | 40분 |
| 카페 | 40분 | 50분 | 40분 | 30분 |
| 식당 | 60분 | 80분 | 60분 | 40분 |
| 포토존/전망대 | 30분 | 40분 | 30분 | 20분 |
| 공원/자연 | 60분 | 80분 | 60분 | 40분 |
| K-pop 체험 | 60분 | 80분 | 60분 | 40분 |
| 야경 스팟 | 40분 | 50분 | 40분 | 30분 |

---

### 2.2 Step 2: 장소 설정

```
┌─────────────────────────────────────┐
│ 출발지·도착지 설정                  │
├─────────────────────────────────────┤
│                                     │
│  🟢 출발지: [서울역 (고속철도)  ✕]  │
│                                     │
│  🔴 도착지: [뉴서울호텔        ✕]  │
│                                     │
│  ☐ 출발지·도착지가 동일             │
│                                     │
└─────────────────────────────────────┘
```

#### 설계 결정사항

| 항목 | 결정 | 비고 |
|------|------|------|
| 검색 방식 | 네이버 지역 검색 API | 자동완성 지원 |
| 동일 체크 | 체크박스 | 당일치기 여행용 |

---

### 2.3 Step 3: 끼니 시간대 설정 (하이브리드 방식)

```
┌─────────────────────────────────────────────────────────────┐
│ 끼니 설정                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ☐ 아침   기본: 07:30~09:30  [커스텀: ____~____]           │
│                                                             │
│  ☑ 점심   기본: 11:30~13:30  [커스텀: 12:00~13:00]  ← 조정  │
│                                                             │
│  ☑ 저녁   기본: 17:30~19:30  [커스텀: ____~____]           │
│                                                             │
│  ☐ 카페·디저트  기본: 14:00~16:00                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 설계 결정사항 (Option C 선택)

| 항목 | 결정 | 비고 |
|------|------|------|
| 기본값 | 시스템 자동 배정 | 아래 표 참조 |
| 사용자 조정 | 가능 | 커스텀 시간 입력 |

#### 끼니별 기본 시간대

```javascript
const MEAL_WINDOWS = {
  breakfast: { 
    default: { start: "07:30", end: "09:30" },
    duration: 60,  // 분
  },
  lunch: { 
    default: { start: "11:30", end: "13:30" },
    duration: 60,
  },
  dinner: { 
    default: { start: "17:30", end: "19:30" },
    duration: 60,
  },
  cafe: { 
    default: { start: "14:00", end: "16:00" },
    duration: 40,
  },
};
```

---

### 2.4 Step 4: 필수 장소 입력 (시간 지정 가능)

```
┌─────────────────────────────────────────────────────────────────┐
│ 필수 방문지 검색·추가                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [남산타워, 경복궁, 한옥카페...        🔍]                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🏛️ 경복궁                                    [✕ 삭제]   │   │
│  │    방문 시간: ○ 자동 배정  ● 직접 지정 [14:00~16:00]    │   │
│  │    메모: 한복 대여 예정                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🗼 남산타워                                   [✕ 삭제]   │   │
│  │    방문 시간: ○ 자동 배정  ● 직접 지정 [저녁 시간대]    │   │
│  │    메모: 야경 보고 싶음                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 설계 결정사항 (Option C 선택)

| 항목 | 결정 | 비고 |
|------|------|------|
| 시간 지정 | 3가지 옵션 | 아래 참조 |
| 메모 | 선택사항 | LLM이 참고 |

#### 시간 지정 옵션

```javascript
const TIME_PREFERENCE_OPTIONS = {
  auto: "자동 배정",           // 시스템이 최적 시간 계산
  specific: "직접 지정",       // 예: 14:00~16:00
  slot: "시간대 지정",         // 예: 오전, 오후, 저녁
};

// 시간대 옵션
const TIME_SLOTS = {
  morning: { label: "오전", range: "09:00~12:00" },
  afternoon: { label: "오후", range: "12:00~17:00" },
  evening: { label: "저녁", range: "17:00~21:00" },
  dinner_time: { label: "저녁 식사 시간대", range: "17:30~19:30" },
};
```

---

### 2.5 Step 5: 카테고리/테마 선택

(기존과 동일 - 생략)

---

### 2.6 Step 6: 챗봇 대화

(기존과 동일 - 생략)

---

### 2.7 Step 7: 가중치 기반 추천 생성

#### 연계 추천 로직 (Option D: 복합 + 선택)

```
┌─────────────────────────────────────────────────────────────────┐
│ 연계 추천 시스템                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  필수 장소: 경복궁                                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 💡 연계 추천                                             │   │
│  │                                                          │   │
│  │ 다음 중 하나를 선택하시거나, 스킵하실 수 있어요:         │   │
│  │                                                          │   │
│  │ ┌────────────────────────────────────────────────────┐  │   │
│  │ │ 📍 물리적 연계                                      │  │   │
│  │ │ • 북촌 한옥마을 (도보 10분)                         │  │   │
│  │ │   체류시간: 약 60분                                 │  │   │
│  │ └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │ ┌────────────────────────────────────────────────────┐  │   │
│  │ │ 🎭 테마적 연계                                      │  │   │
│  │ │ • 한복 대여점 "온고을" (경복궁 입장 전 추천)        │  │   │
│  │ │   체류시간: 약 40분 (대여+반납)                     │  │   │
│  │ └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │ ┌────────────────────────────────────────────────────┐  │   │
│  │ │ 🍽️ 시간적 연계                                      │  │   │
│  │ │ • 토속촌 삼계탕 (점심 식사 후 경복궁 방문 추천)     │  │   │
│  │ │   체류시간: 약 60분                                 │  │   │
│  │ └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │ [선택 안 함 - 다양한 장소 자동 추천 받기]               │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 연계 추천의 다양성 문제 해결

**문제**: 연계 추천을 선택하면 체류시간이 고정되어 다양성이 저해됨

**해결책**: 
```
Option 1: 사용자가 선택 → 해당 장소 확정 + 체류시간 고정
Option 2: "선택 안 함" → 시스템이 다양한 장소 자동 추천
```

```javascript
// 연계 추천 선택 시
if (user.selectedLinkedRecommendation) {
  // 해당 장소를 "준-필수"로 추가 (체류시간 고정)
  itinerary.semiRequired.push({
    place: linkedPlace,
    stayTime: linkedPlace.suggestedStayTime,
    linkedTo: requiredPlace.id,
  });
} else {
  // 다양성 모드: 자동 추천 (체류시간 유동적)
  itinerary.diversityMode = true;
}
```

---

### 2.8 남은 시간 처리 (Option A + C)

#### 기준: 1시간 이상 남으면 추천 + 질문

```javascript
const REMAINING_TIME_THRESHOLD = 60;  // 분

function handleRemainingTime(lastPlace, endPoint, endTime, currentTime) {
  const travelToEnd = estimateTravelTime(lastPlace, endPoint);
  const remainingTime = endTime - currentTime - travelToEnd;
  
  if (remainingTime >= REMAINING_TIME_THRESHOLD) {
    return {
      action: "recommend_and_ask",
      recommendations: getQuickStops(endPoint, remainingTime),
      message: `${Math.floor(remainingTime / 60)}시간 ${remainingTime % 60}분 여유가 있어요. 
                도착지 근처에서 더 즐기실래요, 아니면 여유롭게 마무리하실래요?`,
      options: [
        { label: "더 추천받기", action: "add_stops" },
        { label: "여유롭게 마무리", action: "end_early" },
      ],
    };
  }
  
  return { action: "proceed_to_end" };
}

// 간단한 장소 추천 (도착지 근처)
function getQuickStops(endPoint, availableTime) {
  const quickCategories = [
    "카페",
    "포토존",
    "산책로",
    "편집샵",
    "야경 스팟",
    "디저트",
  ];
  
  return searchNearby(endPoint, quickCategories, availableTime);
}
```

---

### 2.9 체류 시간 테마별 기본값

```javascript
const STAY_TIME_BY_CATEGORY = {
  // 관광지
  "궁궐": 90,
  "박물관": 90,
  "미술관": 75,
  "전통체험": 60,
  "테마파크": 180,
  
  // 자연
  "공원": 60,
  "산책로": 45,
  "전망대": 30,
  "야경 스팟": 40,
  
  // 문화
  "K-pop 체험": 60,
  "공연": 120,  // 별도 처리 필요
  
  // 쇼핑
  "쇼핑몰": 90,
  "시장": 60,
  "편집샵": 30,
  
  // 음식
  "식당": 60,
  "카페": 40,
  "디저트": 30,
  
  // 기타
  "포토존": 30,
  "전시": 60,
  
  // 기본값
  "default": 60,
};

const PACE_MULTIPLIER = {
  relaxed: 1.3,  // 여유롭게
  normal: 1.0,   // 보통
  tight: 0.7,    // 알차게
};

// 10분 단위 반올림
function roundToTen(minutes) {
  return Math.round(minutes / 10) * 10;
}

// 최종 체류시간 계산
function calculateStayTime(category, pace = "normal") {
  const baseTime = STAY_TIME_BY_CATEGORY[category] 
                || STAY_TIME_BY_CATEGORY["default"];
  const multiplied = baseTime * PACE_MULTIPLIER[pace];
  
  return roundToTen(multiplied);
}

// 사용 예시
// calculateStayTime("카페", "relaxed")  → 40 × 1.3 = 52 → 50분
// calculateStayTime("궁궐", "tight")    → 90 × 0.7 = 63 → 60분
```

---

## 3. 사용자 행동 추적 시스템

### 3.1 추적 대상 행동

```javascript
const TRACKED_ACTIONS = {
  // 클릭 기반
  DETAIL_CLICK: {
    event: "상세정보 클릭",
    weightBoost: 0.3,
    target: "place",
  },
  SCHEDULE_CLICK: {
    event: "시간 계획표에서 클릭",
    weightBoost: 0.2,
    target: "place",
  },
  
  // 챗봇 기반
  CHATBOT_POSITIVE: {
    event: "챗봇에 긍정 피드백",
    patterns: ["좋아", "괜찮", "맘에 들어", "여기로", "이거"],
    weightBoost: 0.5,
    target: "place_or_category",
  },
  CHATBOT_NEGATIVE: {
    event: "챗봇에 부정 피드백",
    patterns: ["싫어", "별로", "다른 곳", "안 갈래"],
    weightBoost: -0.3,
    target: "place_or_category",
  },
};
```

### 3.2 가중치 업데이트 로직

```javascript
function updateWeightsFromAction(action, target, currentWeights) {
  const actionConfig = TRACKED_ACTIONS[action];
  
  if (target.type === "place") {
    // 해당 장소의 카테고리 가중치 증가
    const category = target.place.category;
    currentWeights.category[category] += actionConfig.weightBoost;
    
    // 해당 지역 가중치도 약간 증가
    const area = target.place.area;
    currentWeights.area[area] += actionConfig.weightBoost * 0.5;
    
  } else if (target.type === "category") {
    // 해당 카테고리 가중치 증가
    currentWeights.category[target.category] += actionConfig.weightBoost;
  }
  
  return normalizeWeights(currentWeights);
}
```

---

## 4. 챗봇 심화 질문 시스템 (Option D: 전체 타이밍)

### 4.1 질문 트리거

```javascript
const CHATBOT_TRIGGERS = {
  // 일정 생성 직후
  AFTER_GENERATION: {
    condition: () => true,  // 항상
    questions: [
      "이 일정 어떠세요? 수정하고 싶은 부분이 있으면 말씀해주세요!",
      "특별히 더 추가하고 싶은 장소가 있으신가요?",
    ],
  },
  
  // 특정 행동 감지 시
  AFTER_DETAIL_CLICK: {
    condition: (action) => action.type === "DETAIL_CLICK",
    questions: [
      "{place}에 관심 있으시군요! 비슷한 곳 더 추천해드릴까요?",
      "{place} 근처에 좋은 맛집도 있는데, 추가해드릴까요?",
    ],
  },
  
  // 편향 감지 시
  BIAS_DETECTED: {
    condition: (biasReport) => biasReport.isBiased,
    questions: [
      "추천이 {area} 주변에 집중되어 있어요. 다른 지역도 볼까요?",
      "{category}가 많은 편이에요. 다른 종류의 장소도 추천해드릴까요?",
    ],
  },
  
  // 일정이 너무 빈 경우
  SPARSE_SCHEDULE: {
    condition: (schedule) => schedule.gaps.some(g => g > 120),
    questions: [
      "일정에 여유 시간이 많아요. 더 추천받으실래요, 아니면 여유롭게 즐기실래요?",
    ],
  },
};
```

### 4.2 심화 질문 예시

```javascript
const FOLLOW_UP_QUESTIONS = {
  // 선호 파악
  preference: [
    "실내와 야외 중 어디를 더 선호하세요?",
    "사진 찍기 좋은 곳을 좋아하시나요?",
    "현지인들이 가는 숨은 명소 vs 유명 관광지, 어디가 좋으세요?",
  ],
  
  // 구체화
  specificity: [
    "한식 중에서도 특별히 좋아하는 종류가 있으세요? (국물, 고기, 해산물 등)",
    "K-pop 중 특별히 좋아하는 아티스트가 있으신가요?",
  ],
  
  // 제약 확인
  constraints: [
    "혹시 피해야 할 음식이나 장소가 있으신가요?",
    "계단이나 언덕이 많은 곳은 괜찮으세요?",
  ],
};
```

---

## 5. 외부 변수 처리 시스템

### 5.1 시나리오 기반 JSON 구조

#### 파일: `scenarios.json`

```json
{
  "scenarios": {
    "crowdedness": {
      "crowded": {
        "id": "crowded",
        "label": "혼잡",
        "description": "주말, 공휴일, 성수기",
        "adjustments": {
          "stayTimeMultiplier": 1.2,
          "travelTimeMultiplier": 1.3,
          "recommendations": {
            "avoid": ["명동", "홍대 메인거리", "경복궁 (주말)"],
            "prefer": ["숨은 명소", "로컬 맛집", "한적한 공원"]
          }
        }
      },
      "normal": {
        "id": "normal",
        "label": "무난",
        "description": "평일, 비수기",
        "adjustments": {
          "stayTimeMultiplier": 1.0,
          "travelTimeMultiplier": 1.0,
          "recommendations": {
            "avoid": [],
            "prefer": []
          }
        }
      }
    },
    
    "weather": {
      "outdoor_ok": {
        "id": "outdoor_ok",
        "label": "외부활동 적절",
        "description": "맑음, 흐림 (비 없음)",
        "adjustments": {
          "categoryBoost": {
            "공원": 0.3,
            "산책로": 0.3,
            "야경 스팟": 0.2,
            "전망대": 0.2
          },
          "categoryPenalty": {}
        }
      },
      "outdoor_hard": {
        "id": "outdoor_hard",
        "label": "외부활동 힘듦",
        "description": "비, 눈, 폭염, 한파",
        "adjustments": {
          "categoryBoost": {
            "박물관": 0.4,
            "쇼핑몰": 0.3,
            "카페": 0.3,
            "실내 체험": 0.3
          },
          "categoryPenalty": {
            "공원": -0.5,
            "산책로": -0.5,
            "야외 시장": -0.3
          }
        }
      }
    }
  },
  
  "combinations": [
    {
      "name": "최악의 상황",
      "crowdedness": "crowded",
      "weather": "outdoor_hard",
      "message": "혼잡하고 날씨가 좋지 않아요. 실내 위주로 여유롭게 추천해드릴게요."
    },
    {
      "name": "최적의 상황", 
      "crowdedness": "normal",
      "weather": "outdoor_ok",
      "message": "날씨도 좋고 한적해요! 야외 활동을 추천해드릴게요."
    }
  ]
}
```

### 5.2 시나리오 적용 로직

```javascript
function applyScenario(weights, scenario) {
  const { crowdedness, weather } = scenario;
  
  // 혼잡도 적용
  const crowdConfig = SCENARIOS.crowdedness[crowdedness];
  weights.stayTimeMultiplier *= crowdConfig.adjustments.stayTimeMultiplier;
  weights.travelTimeMultiplier *= crowdConfig.adjustments.travelTimeMultiplier;
  
  // 날씨 적용
  const weatherConfig = SCENARIOS.weather[weather];
  for (const [category, boost] of Object.entries(weatherConfig.adjustments.categoryBoost)) {
    weights.category[category] = (weights.category[category] || 0) + boost;
  }
  for (const [category, penalty] of Object.entries(weatherConfig.adjustments.categoryPenalty)) {
    weights.category[category] = (weights.category[category] || 0) + penalty;
  }
  
  return weights;
}
```

### 5.3 UI에서 시나리오 선택

```
┌─────────────────────────────────────────────────────────────┐
│ 여행 환경 설정 (선택사항)                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  예상 혼잡도:  ○ 혼잡 (주말/공휴일)  ● 무난 (평일)          │
│                                                             │
│  예상 날씨:    ● 외부활동 적절       ○ 외부활동 힘듦        │
│                                                             │
│  💡 선택하지 않으면 기본값(무난, 외부활동 적절)으로 추천해요  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. LLM 기반 동적 정보 조회

### 6.1 LLM이 조회해야 할 정보

| 정보 | 조회 방법 | 활용 |
|------|-----------|------|
| **영업시간** | 네이버 API + LLM 보완 | 휴무일 제외 |
| **예약 필요 여부** | LLM 웹 검색 | 사전 안내 |
| **계절성** | LLM 지식 | 벚꽃/단풍 시즌 추천 |
| **특별 이벤트** | LLM 웹 검색 | 축제, 전시 정보 |

### 6.2 LLM 프롬프트 설계

```javascript
const DYNAMIC_INFO_PROMPT = `
당신은 서울 여행 정보 전문가입니다.

다음 장소에 대해 아래 정보를 JSON 형식으로 제공해주세요:

장소: {placeName}
방문 예정일: {visitDate}

조회할 정보:
1. 영업시간 (해당 요일)
2. 휴무일 여부 (해당 날짜가 휴무인지)
3. 예약 필요 여부 (필수/권장/불필요)
4. 계절 특이사항 (현재 시즌에 특별한 점)
5. 주의사항 (공사 중, 임시 휴관 등)

응답 형식:
{
  "operatingHours": { "open": "09:00", "close": "18:00" },
  "isClosedOnDate": false,
  "reservationRequired": "권장",
  "seasonalNote": "가을 단풍 시즌으로 경치가 좋습니다",
  "warnings": [],
  "confidence": 0.85
}

confidence가 0.7 미만이면 해당 정보는 null로 표시하세요.
`;
```

### 6.3 정보 조회 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                    동적 정보 조회 흐름                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 일정 생성 시                                                │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ 각 장소에 대해 LLM에 정보 요청                       │    │
│     │ → 병렬 처리 (Promise.all)                           │    │
│     │ → 캐싱 (같은 장소는 재조회 안 함)                    │    │
│     └─────────────────────────────────────────────────────┘    │
│                              ↓                                  │
│  2. 정보 검증                                                   │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ • confidence < 0.7 → 해당 정보 제외                  │    │
│     │ • 휴무일 발견 → 대체 장소 추천                       │    │
│     │ • 예약 필수 → 사용자에게 알림                        │    │
│     └─────────────────────────────────────────────────────┘    │
│                              ↓                                  │
│  3. 일정에 반영                                                 │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ • 영업시간 내에만 방문 배치                          │    │
│     │ • 계절 특이사항 → 챗봇에서 안내                      │    │
│     │ • 주의사항 → 일정표에 표시                           │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 휴무일 처리 로직

```javascript
async function checkAndHandleClosedPlaces(schedule, visitDate) {
  const results = await Promise.all(
    schedule.stops.map(stop => fetchDynamicInfo(stop.place, visitDate))
  );
  
  const closedPlaces = [];
  const warnings = [];
  
  results.forEach((info, idx) => {
    const stop = schedule.stops[idx];
    
    if (info.isClosedOnDate) {
      closedPlaces.push({
        original: stop,
        reason: `${visitDate} 휴무`,
      });
    }
    
    if (info.reservationRequired === "필수") {
      warnings.push({
        place: stop.place.name,
        message: "사전 예약이 필요합니다",
        link: info.reservationLink,
      });
    }
    
    if (info.seasonalNote) {
      warnings.push({
        place: stop.place.name,
        message: info.seasonalNote,
        type: "info",
      });
    }
  });
  
  // 휴무 장소가 있으면 대체 추천
  if (closedPlaces.length > 0) {
    return {
      needsReplacement: true,
      closedPlaces,
      suggestions: await findAlternatives(closedPlaces),
      warnings,
    };
  }
  
  return { needsReplacement: false, warnings };
}
```

---

## 7. 미해결 이슈 (염두)

### 7.1 현재 단계에서 보류

| 이슈 | 현재 상태 | 다음 단계 |
|------|-----------|-----------|
| **실시간 혼잡도** | 시나리오 기반으로 대체 | 실시간 API 연동 검토 |
| **실시간 이동 시간** | 고정 값 or 거리 기반 추정 | 네이버 길찾기 API 연동 |
| **교통 수단별 시간** | 대중교통 기준 고정 | 수단별 분기 처리 |

### 7.2 향후 고려 사항

```
Phase 2에서 고려:
- 실시간 교통 정보 연동
- 날씨 API 연동 (기상청)
- 혼잡도 API (있다면)

Phase 3에서 고려:
- 사용자 피드백 기반 학습
- 추천 정확도 분석
- A/B 테스트
```

---

## 8. 요약: 설계 결정사항

| 항목 | 결정 | 비고 |
|------|------|------|
| Q1. 끼니 시간 | **하이브리드** | 기본값 자동 + 사용자 조정 가능 |
| Q2. 필수 장소 순서 | **사용자 지정** | 자동/직접/시간대 3가지 옵션 |
| Q3. 연계 추천 | **복합 + 선택** | 물리적/테마적/시간적 + "선택 안 함" |
| Q4. 남은 시간 | **1시간 기준** | 추천 + 질문 |
| Q5. 체류 시간 | **테마별 기본값** | + pace 입력 (여유/보통/빡빡) |
| Q6. 행동 추적 | **3가지** | 상세클릭, 챗봇, 계획표 클릭 |
| Q7. 심화 질문 | **전체 타이밍** | 생성 후, 행동 후, 편향 감지 시 |
| Q8. 외부 변수 | **시나리오 JSON** | 혼잡도 2종, 날씨 2종 |

---

## 다음 단계

이 설계를 바탕으로:

1. **Phase A**: 검색 쿼리 분리 + Hard Constraint 구현
2. **Phase B**: 끼니 시간대 슬롯 예약
3. **Phase C**: 연계 추천 + 사용자 선택 UI
4. **Phase D**: 행동 추적 + 심화 질문 시스템
5. **Phase E**: 시나리오 JSON + LLM 동적 정보 조회
