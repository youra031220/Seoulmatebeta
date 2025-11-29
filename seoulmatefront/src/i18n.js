// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  ko: {
    translation: {
      "app.title": "Seoulmate",

      "header.subtitle":
        "식단 제약 · 대기/부분체류 · 시작/종료시간까지 반영된 최적의 여행 경로를 제공하는 서울메이트와 함께 여행계획을 세워봐요!",

      "startend.pointsetting": "출발지 · 도착지 설정",
      "search.start": "출발지 검색",
      "search.end": "도착지 검색",
      "same.startend": "출발지·도착지가 동일",

      "map.marker.start_end": "출발 / 도착",
      "map.marker.start": "출발",
      "map.marker.end": "도착",

      "alert.need_start_end": "출발지와 도착지를 모두 선택해 주세요.",
      "status.generating": "여행 계획을 생성하고 있어요...",
      "status.time_invalid": "종료시간이 시작시간보다 늦어야 합니다.",
      "status.no_pois": "추천할 장소를 찾지 못했어요.",
      "status.success": "✔️ 여행 계획이 생성되었습니다!",
      "status.error": "일정 생성 중 오류가 발생했습니다.",

      "unit.minute": "분",
      "unit.place_count": "개",
      "unit.hour": "시",

      "button.generate": "여행계획 생성하기",
      "button.send": "SEND",
      "button.reset": "초기화",

      "meals.title": "끼니",
      "meals.breakfast": "아침",
      "meals.lunch": "점심",
      "meals.dinner": "저녁",
      "meals.cafe": "카페 · 디저트",

      "diet.title": "식단 제약",
      "diet.halal": "Halal",
      "diet.vegan": "Vegan",
      "diet.vegetarian": "Vegetarian",
      "diet.kosher": "Kosher",
      "diet.gluten_free": "Gluten Free",
      "diet.non_alcohol": "Non-Alcohol",

      "theme.title": "여행테마 (최대 3개)",
      "theme.shopping": "쇼핑",
      "theme.culture": "문화 · 전시 · 역사",
      "theme.nature": "자연·공원",
      "theme.cafe_tour": "카페 투어",
      "theme.night_photo": "야경 · 사진 스팟",
      "theme.healing": "힐링",
      "theme.kpop": "K-pop 관련",
      "theme.sns_hot": "SNS 핫플",


      "wait.title": "대기 선호도",
      "wait.low": "줄 서는 거 싫어요",
      "wait.medium": "어느 정도 괜찮아요",
      "wait.high": "맛집 위해서라면 줄도 OK",

      "transport.title": "선호 이동수단",
      "transport.walk": "도보 위주",
      "transport.transit": "대중교통 위주",
      "transport.taxi": "택시·자가용 위주",

      "move.title": "이동 · 장소",
      "move.max_leg": "구간 당 최대 이동시간",
      "move.num_places": "총 방문장소",

      "time.title": "시간 설정",
      "time.start": "시작시간",
      "time.end": "종료시간",

      "required.title": "필수 방문지 검색 · 추가",
      "required.examples": "남산타워, 경복궁, 한옥카페...",

      "wish.title": "여행에 있어서 바라는 점이 있나요?",
      "wish.placeholder":
      "기본 카테고리를 모두 선택한 뒤, 간단한 인삿말로 대화를 시작해 주세요! 예산, 분위기, 걷는 정도, 선호 스타일 등 자세한 여행 취향을 말해주셔도 좋아요.",
      "wish.hover":
        "여행 취향을 자유롭게 말씀해주시면 일정 옵션을 자동으로 추천해드릴게요!",
      "wish.hover1": "이렇게 적어보세요",
      "wish.hover2": "많이 걷는건 싫고 점심은 맛집 중심으로!",
      "wish.hover3": "유명한 Korean BBQ 맛집에 꼭 가고 싶어요",
      "wish.hover4": "나는 scifi 느낌의 전시회에 가고싶어",
      "wish.hover5": "나는 서울야경을 꼭 보고싶어",

      "schedule.title": "시간별 일정",
      "schedule.none":
        "아직 생성된 일정이 없습니다. 왼쪽 옵션을 설정하고 '여행계획 생성하기' 버튼을 눌러주세요.",
      "schedule.col.order": "#",
      "schedule.col.name": "장소",
      "schedule.col.category": "카테고리",
      "schedule.col.arrival": "도착",
      "schedule.col.depart": "출발",

      "specifics.title": "장소 세부정보",
      "specifics.none": "생성된 일정이 없어서 장소 정보를 불러올 수 없습니다.",

      "category.start": "출발",
      "category.end": "도착",
      "category.required": "필수 방문지",
    },
  },

  en: {
    translation: {
      "app.title": "Seoulmate",

      "header.subtitle":
        "Plan your trip with Seoulmate, fully optimized for dietary preferences, waiting tolerance, partial stays, and start/end times!",

      "startend.pointsetting": "Set Start · End Points",
      "search.start": "Search starting point",
      "search.end": "Search destination",
      "same.startend": "Start and end are the same",

      "map.marker.start_end": "Start / End",
      "map.marker.start": "Start",
      "map.marker.end": "End",

      "alert.need_start_end": "Please select both a starting point and a destination.",
      "status.generating": "Generating your trip plan...",
      "status.time_invalid": "End time must be later than start time.",
      "status.no_pois": "We couldn't find any suitable places to recommend.",
      "status.success": "✔️ Trip plan has been generated!",
      "status.error": "An error occurred while generating the schedule.",

      "unit.minute": "min",
      "unit.place_count": "places",
      "unit.hour": "h",

      "button.generate": "Generate Trip Plan",
      "button.send": "SEND",
      "button.reset": "Reset",

      "meals.title": "Meals",
      "meals.breakfast": "Breakfast",
      "meals.lunch": "Lunch",
      "meals.dinner": "Dinner",
      "meals.cafe": "Cafe · Dessert",

      "diet.title": "Dietary Preferences",
      "diet.halal": "Halal",
      "diet.vegan": "Vegan",
      "diet.vegetarian": "Vegetarian",
      "diet.kosher": "Kosher",
      "diet.gluten_free": "Gluten Free",
      "diet.non_alcohol": "Non-Alcohol",

      "theme.title": "Travel Themes (up to 3)",
      "theme.shopping": "Shopping",
      "theme.culture": "Culture · Exhibitions · History",
      "theme.nature": "Nature · Parks",
      "theme.cafe_tour": "Cafe Hopping",
      "theme.night_photo": "Night View · Photo Spots",
      "theme.healing": "Healing / Relaxing",
      "theme.kpop": "K-pop Related",
      "theme.sns_hot": "SNS Hot Places",

      "wait.title": "Waiting Tolerance",
      "wait.low": "I hate waiting in line",
      "wait.medium": "A little waiting is fine",
      "wait.high": "I can wait for famous spots",

      "transport.title": "Preferred Transportation",
      "transport.walk": "Mostly walking",
      "transport.transit": "Mostly public transit",
      "transport.taxi": "Mostly taxi / car",

      "move.title": "Movement · Places",
      "move.max_leg": "Max travel time per section",
      "move.num_places": "Total number of places",

      "time.title": "Time Settings",
      "time.start": "Start Time",
      "time.end": "End Time",

      "required.title": "Search · add must-visit places",
      "required.examples": "Namsan Tower, Gyeongbokgung, hanok cafe...",

      "wish.title": "Anything you're hoping for in your trip?",
      "wish.placeholder":"After selecting all the basic categories, start the conversation with a simple greeting! You’re also welcome to share more details about your travel preferences, such as budget, mood, walking level, and preferred style.",
      "wish.hover":
        "Tell us your travel preferences freely and we'll recommend itinerary options automatically!",
      "wish.hover1": "Try writing like this",
      "wish.hover2":
        "I don't like walking too much, but want famous lunch spots!",
      "wish.hover3": "I really want to try a famous Korean BBQ restaurant.",
      "wish.hover4": "I want to visit a sci-fi style exhibition.",
      "wish.hover5": "I really want to see the night view of Seoul.",

      "schedule.title": "Schedule",
      "schedule.none": "No schedule has been generated yet.",
      "schedule.col.order": "#",
      "schedule.col.name": "Place",
      "schedule.col.category": "Category",
      "schedule.col.arrival": "Arrival",
      "schedule.col.depart": "Departure",

      "specifics.title": "Place Details",
      "specifics.none":
        "No schedule has been generated yet, so place details are not available.",
    },
  },

  // Japanese
  ja: {
    translation: {
      "app.title": "Seoulmate",

      "header.subtitle":
        "食事制限・待ち時間・途中合流/離脱・開始/終了時間まで反映した最適なソウル旅行ルートを、Seoulmateで一緒に計画しましょう！",

      "startend.pointsetting": "出発地・到着地の設定",
      "search.start": "出発地を検索",
      "search.end": "到着地を検索",
      "same.startend": "出発地と到着地が同じ",

      "map.marker.start_end": "出発 / 到着",
      "map.marker.start": "出発",
      "map.marker.end": "到着",

      "alert.need_start_end": "出発地と到着地を両方選択してください。",
      "status.generating": "旅行プランを作成しています...",
      "status.time_invalid": "終了時間は開始時間より後に設定してください。",
      "status.no_pois": "おすすめできるスポットが見つかりませんでした。",
      "status.success": "✔️ 旅行プランが作成されました！",
      "status.error": "スケジュール作成中にエラーが発生しました。",

      "unit.minute": "分",
      "unit.place_count": "件",
      "unit.hour": "時",

      "button.generate": "旅行プランを作成",
      "button.send": "SEND",
      "button.reset": "リセット",

      "meals.title": "食事",
      "meals.breakfast": "朝食",
      "meals.lunch": "昼食",
      "meals.dinner": "夕食",
      "meals.cafe": "カフェ・デザート",

      "theme.title": "旅行テーマ（最大3つ）",
      "theme.shopping": "ショッピング",
      "theme.culture": "文化・展示・歴史",
      "theme.nature": "自然・公園",
      "theme.cafe_tour": "カフェ巡り",
      "theme.night_photo": "夜景・写真スポット",
      "theme.healing": "ヒーリング / リラックス",
      "theme.kpop": "K-pop 関連",
      "theme.sns_hot": "SNS 人気スポット",


      "diet.title": "食事制限",
      "diet.halal": "ハラール",
      "diet.vegan": "ヴィーガン",
      "diet.vegetarian": "ベジタリアン",
      "diet.kosher": "コーシャー",
      "diet.gluten_free": "グルテンフリー",
      "diet.non_alcohol": "ノンアルコール",

      "wait.title": "待ち時間の許容度",
      "wait.low": "並ぶのはあまり好きじゃない",
      "wait.medium": "少しなら並んでも大丈夫",
      "wait.high": "人気店のためなら並んでもOK",

      "transport.title": "移動手段の好み",
      "transport.walk": "徒歩メイン",
      "transport.transit": "公共交通機関メイン",
      "transport.taxi": "タクシー・車メイン",

      "move.title": "移動・スポット数",
      "move.max_leg": "区間ごとの最大移動時間",
      "move.num_places": "訪問スポット数",

      "time.title": "時間設定",
      "time.start": "開始時間",
      "time.end": "終了時間",

      "required.title": "必須スポットの検索・追加",
      "required.examples": "南山タワー、景福宮、韓屋カフェ...",

      "wish.title": "旅に関して希望はありますか？",
      "wish.placeholder":"まずは基本カテゴリーをすべて選択してから、簡単なあいさつで会話を始めてください！予算や雰囲気、歩く量、好みのスタイルなど、詳しい旅行の好みを教えていただいても大歓迎です。",
      "wish.hover1": "こんなふうに書いてみてください",
      "wish.hover2":
        "たくさん歩くのは苦手で、お昼は有名店中心がいいです！",
      "wish.hover3": "有名な韓国焼肉のお店に絶対行きたいです。",
      "wish.hover4": "SFっぽい感じの展示会に行きたい。",
      "wish.hover5": "ソウルの夜景を必ず見たいです。",

      "schedule.title": "スケジュール",
      "schedule.none": "まだ作成されたスケジュールはありません。",
      "schedule.col.order": "#",
      "schedule.col.name": "スポット",
      "schedule.col.category": "カテゴリー",
      "schedule.col.arrival": "到着",
      "schedule.col.depart": "出発",

      "specifics.title": "スポット詳細",
      "specifics.none":
        "スケジュールがまだ作成されていないため、スポット情報を取得できません。",

      "category.start": "出発",
      "category.end": "到着",
      "category.required": "必須スポット",
    },
  },

  // Chinese (Simplified) - zh-CN
  "zh-CN": {
    translation: {
      "app.title": "Seoulmate",

      "header.subtitle":
        "使用 Seoulmate 规划你的首尔之旅，我们会综合饮食限制、排队耐心、部分同行以及出发/结束时间，为你推荐最优路线！",

      "startend.pointsetting": "出发地 · 到达地设置",
      "search.start": "搜索出发地",
      "search.end": "搜索目的地",
      "same.startend": "出发地和到达地相同",

      "map.marker.start_end": "出发 / 到达",
      "map.marker.start": "出发",
      "map.marker.end": "到达",

      "alert.need_start_end": "请同时选择出发地和目的地。",
      "status.generating": "正在为你生成旅行行程...",
      "status.time_invalid": "结束时间必须晚于开始时间。",
      "status.no_pois": "未找到合适的推荐地点。",
      "status.success": "✔️ 已生成旅行行程！",
      "status.error": "生成行程时发生错误。",

      "unit.minute": "分钟",
      "unit.place_count": "个地点",
      "unit.hour": "小时",

      "button.generate": "生成旅行行程",
      "button.send": "SEND",
      "button.reset": "重置",

      "meals.title": "用餐",
      "meals.breakfast": "早餐",
      "meals.lunch": "午餐",
      "meals.dinner": "晚餐",
      "meals.cafe": "咖啡 · 甜点",

      "theme.title": "旅行主题（最多 3 个）",
      "theme.shopping": "购物",
      "theme.culture": "文化 · 展览 · 历史",
      "theme.nature": "自然 · 公园",
      "theme.cafe_tour": "咖啡馆巡礼",
      "theme.night_photo": "夜景 · 拍照热点",
      "theme.healing": "疗愈 · 放松",
      "theme.kpop": "K-pop 相关",
      "theme.sns_hot": "SNS 热门地点",


      "diet.title": "饮食偏好",
      "diet.halal": "清真",
      "diet.vegan": "纯素",
      "diet.vegetarian": "素食",
      "diet.kosher": "犹太洁食",
      "diet.gluten_free": "无麸质",
      "diet.non_alcohol": "不含酒精",

      "wait.title": "排队接受度",
      "wait.low": "不喜欢排队",
      "wait.medium": "稍微排一下可以",
      "wait.high": "为了网红美食排队也没问题",

      "transport.title": "偏好交通方式",
      "transport.walk": "以步行为主",
      "transport.transit": "以公共交通为主",
      "transport.taxi": "以出租车/自驾为主",

      "move.title": "移动 · 景点",
      "move.max_leg": "每一段的最多移动时间",
      "move.num_places": "总共想去的地点数",

      "time.title": "时间设置",
      "time.start": "开始时间",
      "time.end": "结束时间",

      "required.title": "搜索 · 添加必去景点",
      "required.examples": "南山塔、景福宫、韩屋咖啡厅...",

      "wish.title": "这次旅行有什么特别的期待吗？",
      "wish.placeholder":
        "请先选择所有基础分类，然后用一句简单的问候开始对话吧！也可以一起告诉我你的旅行偏好，比如预算、氛围、步行程度以及偏好的风格等。",
      "wish.hover1": "可以这样写",
      "wish.hover2": "不想走太多路，中午想以网红美食为主！",
      "wish.hover3": "一定要去有名的韩式烤肉店。",
      "wish.hover4": "我想去看科幻感十足的展览。",
      "wish.hover5": "我一定要看看首尔的夜景。",

      "schedule.title": "行程表",
      "schedule.none": "目前还没有生成行程。",
      "schedule.col.order": "#",
      "schedule.col.name": "地点",
      "schedule.col.category": "类别",
      "schedule.col.arrival": "到达",
      "schedule.col.depart": "离开",

      "specifics.title": "地点详细信息",
      "specifics.none":
        "目前尚未生成行程，因此无法显示地点的详细信息。",

      "schedule.category.start": "出发",
      "schedule.category.end": "到达",
      "schedule.category.required": "必去景点",
    },
  },

  // Chinese (Traditional) - zh-TW
  "zh-TW": {
    translation: {
      "app.title": "Seoulmate",

      "header.subtitle":
        "使用 Seoulmate 規劃你的首爾旅行，我們會根據飲食限制、排隊耐心、部分同行，以及出發/結束時間，為你推薦最佳路線！",

      "startend.pointsetting": "出發地 · 抵達地設定",
      "search.start": "搜尋出發地",
      "search.end": "搜尋目的地",
      "same.startend": "出發地與抵達地相同",

      "map.marker.start_end": "出發 / 抵達",
      "map.marker.start": "出發",
      "map.marker.end": "抵達",

      "alert.need_start_end": "請同時選擇出發地和目的地。",
      "status.generating": "正在為你產生旅行行程...",
      "status.time_invalid": "結束時間必須晚於開始時間。",
      "status.no_pois": "找不到合適的推薦景點。",
      "status.success": "✔️ 已成功產生旅行行程！",
      "status.error": "產生行程時發生錯誤。",

      "unit.minute": "分鐘",
      "unit.place_count": "個地點",
      "unit.hour": "小時",

      "button.generate": "產生旅行行程",
      "button.send": "SEND",
      "button.reset": "重設",

      "meals.title": "用餐",
      "meals.breakfast": "早餐",
      "meals.lunch": "午餐",
      "meals.dinner": "晚餐",
      "meals.cafe": "咖啡 · 甜點",

      "diet.title": "飲食偏好",
      "diet.halal": "清真",
      "diet.vegan": "純素",
      "diet.vegetarian": "素食",
      "diet.kosher": "猶太潔食",
      "diet.gluten_free": "無麩質",
      "diet.non_alcohol": "無酒精",

      "theme.title": "旅行主題（最多 3 個）",
      "theme.shopping": "購物",
      "theme.culture": "文化・展覽・歷史",
      "theme.nature": "自然・公園",
      "theme.cafe_tour": "咖啡巡禮",
      "theme.night_photo": "夜景・拍照熱點",
      "theme.healing": "療癒・放鬆",
      "theme.kpop": "K-pop 相關",
      "theme.sns_hot": "SNS 熱門地點",


      "wait.title": "排隊接受度",
      "wait.low": "不太喜歡排隊",
      "wait.medium": "排一下可以接受",
      "wait.high": "為了名店排隊也沒問題",

      "transport.title": "偏好交通方式",
      "transport.walk": "以步行為主",
      "transport.transit": "以大眾運輸為主",
      "transport.taxi": "以計程車/自駕為主",

      "move.title": "移動 · 景點數",
      "move.max_leg": "每一段最多移動時間",
      "move.num_places": "想造訪的景點總數",

      "time.title": "時間設定",
      "time.start": "開始時間",
      "time.end": "結束時間",

      "required.title": "搜尋 · 新增必去景點",
      "required.examples": "南山塔、景福宮、韓屋咖啡廳...",

      "wish.title": "這趟旅行有什麼特別期待嗎？",
      "wish.placeholder":
        "請先選擇所有基本分類，然後用簡單的問候語開始對話吧！也可以一併告訴我你的旅行預算、想要的氛圍、能接受的步行程度以及偏好的風格等更詳細的喜好。",
      "wish.hover":
        "只要自由輸入你的旅行偏好，我們就會自動推薦合適的行程選項！",
      "wish.hover1": "可以這樣寫寫看",
      "wish.hover2":
        "不想走太多路，中午想以名店美食為主！",
      "wish.hover3": "一定要去吃有名的韓式烤肉。",
      "wish.hover4": "我想去逛帶有科幻感的展覽。",
      "wish.hover5": "我一定要看看首爾的夜景。",

      "schedule.title": "行程表",
      "schedule.none": "目前尚未產生任何行程。",
      "schedule.col.order": "#",
      "schedule.col.name": "地點",
      "schedule.col.category": "類別",
      "schedule.col.arrival": "抵達",
      "schedule.col.depart": "出發",

      "specifics.title": "地點詳細資訊",
      "specifics.none":
        "目前尚未產生行程，因此無法顯示地點資訊。",

      "schedule.category.start": "出發",
      "schedule.category.end": "抵達",
      "schedule.category.required": "必去景點",
    },
  },

  // Vietnamese
  vi: {
    translation: {
      "app.title": "Seoulmate",

      "header.subtitle":
        "Lập kế hoạch chuyến đi cùng Seoulmate – tuyến đường du lịch Seoul tối ưu theo chế độ ăn, thời gian chờ, thời gian ở lại và giờ bắt đầu/kết thúc!",

      "startend.pointsetting": "Cài đặt điểm xuất phát · điểm kết thúc",
      "search.start": "Tìm điểm xuất phát",
      "search.end": "Tìm điểm đến",
      "same.startend": "Điểm xuất phát và kết thúc giống nhau",

      "map.marker.start_end": "Xuất phát / Kết thúc",
      "map.marker.start": "Xuất phát",
      "map.marker.end": "Kết thúc",

      "alert.need_start_end":
        "Vui lòng chọn cả điểm xuất phát và điểm kết thúc.",
      "status.generating": "Đang tạo kế hoạch chuyến đi của bạn...",
      "status.time_invalid": "Giờ kết thúc phải muộn hơn giờ bắt đầu.",
      "status.no_pois": "Không tìm được địa điểm phù hợp để gợi ý.",
      "status.success": "✔️ Kế hoạch chuyến đi đã được tạo!",
      "status.error": "Đã xảy ra lỗi khi tạo lịch trình.",

      "unit.minute": "phút",
      "unit.place_count": "địa điểm",
      "unit.hour": "giờ",

      "button.generate": "Tạo kế hoạch chuyến đi",
      "button.send": "SEND",
      "button.reset": "Đặt lại",

      "meals.title": "Bữa ăn",
      "meals.breakfast": "Bữa sáng",
      "meals.lunch": "Bữa trưa",
      "meals.dinner": "Bữa tối",
      "meals.cafe": "Cà phê · Tráng miệng",

      "theme.title": "Chủ đề chuyến đi (tối đa 3)",
      "theme.shopping": "Mua sắm",
      "theme.culture": "Văn hoá · Triển lãm · Lịch sử",
      "theme.nature": "Thiên nhiên · Công viên",
      "theme.cafe_tour": "Cafe tour",
      "theme.night_photo": "Điểm ngắm đêm · Chụp ảnh",
      "theme.healing": "Thư giãn / Healing",
      "theme.kpop": "Liên quan K-pop",
      "theme.sns_hot": "Địa điểm hot trên SNS",


      "diet.title": "Chế độ ăn",
      "diet.halal": "Halal",
      "diet.vegan": "Thuần chay",
      "diet.vegetarian": "Chay",
      "diet.kosher": "Kosher",
      "diet.gluten_free": "Không gluten",
      "diet.non_alcohol": "Không cồn",

      "wait.title": "Mức độ chấp nhận xếp hàng",
      "wait.low": "Mình không thích xếp hàng",
      "wait.medium": "Xếp một chút cũng được",
      "wait.high": "Vì quán nổi tiếng thì xếp hàng cũng OK",

      "transport.title": "Phương tiện di chuyển ưa thích",
      "transport.walk": "Chủ yếu đi bộ",
      "transport.transit": "Chủ yếu công cộng",
      "transport.taxi": "Chủ yếu taxi / ô tô",

      "move.title": "Di chuyển · Địa điểm",
      "move.max_leg": "Thời gian di chuyển tối đa mỗi chặng",
      "move.num_places": "Tổng số địa điểm muốn đi",

      "time.title": "Cài đặt thời gian",
      "time.start": "Giờ bắt đầu",
      "time.end": "Giờ kết thúc",

      "required.title": "Tìm kiếm · thêm địa điểm bắt buộc",
      "required.examples":
        "Tháp Namsan, Cung Gyeongbokgung, quán cà phê hanok...",

      "wish.title": "Bạn mong đợi điều gì trong chuyến đi này?",
      "wish.placeholder":
        "Sau khi chọn xong tất cả các danh mục cơ bản, hãy bắt đầu cuộc trò chuyện bằng một lời chào đơn giản nhé! Bạn cũng có thể chia sẻ chi tiết hơn về sở thích du lịch của mình, như ngân sách, không khí mong muốn, mức độ đi bộ và phong cách ưa thích.",
      "wish.hover":
        "Chỉ cần chia sẻ tự do về gu du lịch của bạn, chúng tôi sẽ tự động gợi ý các lựa chọn lịch trình phù hợp!",
      "wish.hover1": "Bạn có thể viết như thế này",
      "wish.hover2":
        "Mình không thích đi bộ quá nhiều, nhưng bữa trưa muốn tập trung vào quán ngon!",
      "wish.hover3":
        "Mình rất muốn ăn thử một quán thịt nướng Hàn nổi tiếng.",
      "wish.hover4":
        "Mình muốn đi một triển lãm có cảm giác khoa học viễn tưởng.",
      "wish.hover5": "Mình nhất định muốn ngắm cảnh đêm Seoul.",

      "schedule.title": "Lịch trình",
      "schedule.none": "Chưa có lịch trình nào được tạo.",
      "schedule.col.order": "#",
      "schedule.col.name": "Địa điểm",
      "schedule.col.category": "Loại",
      "schedule.col.arrival": "Đến",
      "schedule.col.depart": "Rời đi",

      "specifics.title": "Chi tiết địa điểm",
      "specifics.none":
        "Chưa có lịch trình nên chưa thể hiển thị thông tin địa điểm.",

      "schedule.category.start": "Khởi hành",
      "schedule.category.end": "Kết thúc",
      "schedule.category.required": "Điểm bắt buộc",
    },
  },

  // Thai
  th: {
    translation: {
      "app.title": "Seoulmate",

      "header.subtitle":
        "วางแผนเที่ยวโซลกับ Seoulmate เส้นทางจะถูกปรับให้เหมาะกับข้อจำกัดด้านอาหาร ความทนต่อการต่อคิว การแยก/มาร่วมกลุ่ม และเวลาเริ่ม/จบของคุณ!",

      "startend.pointsetting": "ตั้งค่าจุดออกเดินทาง · จุดสิ้นสุด",
      "search.start": "ค้นหาจุดออกเดินทาง",
      "search.end": "ค้นหาจุดหมาย",
      "same.startend": "จุดออกเดินทางและจุดสิ้นสุดเหมือนกัน",

      "map.marker.start_end": "จุดเริ่ม / สิ้นสุด",
      "map.marker.start": "เริ่มต้น",
      "map.marker.end": "สิ้นสุด",

      "alert.need_start_end":
        "โปรดเลือกทั้งจุดเริ่มต้นและจุดหมายปลายทาง",
      "status.generating": "กำลังสร้างแผนการเดินทางของคุณ...",
      "status.time_invalid":
        "เวลาสิ้นสุดต้องช้ากว่าเวลาเริ่มต้น",
      "status.no_pois": "ไม่พบสถานที่ที่เหมาะสมสำหรับแนะนำ",
      "status.success": "✔️ สร้างแผนการเดินทางเรียบร้อยแล้ว!",
      "status.error": "เกิดข้อผิดพลาดระหว่างสร้างตารางทริป",

      "unit.minute": "นาที",
      "unit.place_count": "สถานที่",
      "unit.hour": "ชม.",

      "button.generate": "สร้างแผนการเดินทาง",
      "button.send": "SEND",
      "button.reset": "รีเซ็ต",

      "meals.title": "มื้ออาหาร",
      "meals.breakfast": "มื้อเช้า",
      "meals.lunch": "มื้อกลางวัน",
      "meals.dinner": "มื้อเย็น",
      "meals.cafe": "คาเฟ่ · ของหวาน",

      "diet.title": "ข้อจำกัดด้านอาหาร",
      "diet.halal": "ฮาลาล",
      "diet.vegan": "วีแกน",
      "diet.vegetarian": "มังสวิรัติ",
      "diet.kosher": "โคเชอร์",
      "diet.gluten_free": "ปลอดกลูเตน",
      "diet.non_alcohol": "ไม่มีแอลกอฮอล์",

      "theme.title": "ธีมท่องเที่ยว (เลือกได้สูงสุด 3)",
      "theme.shopping": "ช้อปปิ้ง",
      "theme.culture": "วัฒนธรรม · นิทรรศการ · ประวัติศาสตร์",
      "theme.nature": "ธรรมชาติ · สวนสาธารณะ",
      "theme.cafe_tour": "คาเฟ่ฮอปปิ้ง",
      "theme.night_photo": "จุดชมวิวกลางคืน · ถ่ายรูป",
      "theme.healing": "ผ่อนคลาย / ฮีลลิ่ง",
      "theme.kpop": "เกี่ยวกับ K-pop",
      "theme.sns_hot": "จุดฮิตบน SNS",

      "wait.title": "ความทนต่อการต่อคิว",
      "wait.low": "ไม่ชอบต่อคิวเลย",
      "wait.medium": "ต่อคิวนิดหน่อยพอได้",
      "wait.high": "ถ้าเป็นร้านดัง ต่อคิวก็ไม่เป็นไร",

      "transport.title": "วิธีการเดินทางที่ชอบ",
      "transport.walk": "เดินเป็นหลัก",
      "transport.transit": "ขนส่งสาธารณะเป็นหลัก",
      "transport.taxi": "แท็กซี่ / รถส่วนตัวเป็นหลัก",

      "move.title": "การเดินทาง · สถานที่",
      "move.max_leg": "เวลาเดินทางสูงสุดต่อหนึ่งช่วง",
      "move.num_places": "จำนวนสถานที่ทั้งหมด",

      "time.title": "การตั้งเวลา",
      "time.start": "เวลาเริ่ม",
      "time.end": "เวลาจบ",

      "required.title": "ค้นหา · เพิ่มสถานที่ที่ต้องไป",
      "required.examples":
        "นัมซานทาวเวอร์ พระราชวังเคียงบกกุง คาเฟ่บ้านฮันอก...",

      "wish.title": "ทริปนี้มีอะไรที่อยากได้เป็นพิเศษไหม?",
      "wish.placeholder":
       "หลังจากเลือกหมวดหมู่พื้นฐานครบแล้ว ลองเริ่มคุยด้วยประโยคทักทายง่าย ๆ ได้เลย! คุณยังสามารถเล่ารายละเอียดเพิ่มเติมเกี่ยวกับสไตล์การเที่ยวของคุณได้ เช่น งบประมาณ บรรยากาศที่อยากได้ ระดับการเดิน และสไตล์ที่ชอบ เป็นต้น",
      "wish.hover":
        "บอกสไตล์การเที่ยวของคุณได้อย่างอิสระ แล้วเราจะเสนอแผนเที่ยวที่เหมาะสมให้โดยอัตโนมัติ!",
      "wish.hover1": "ตัวอย่างการเขียน",
      "wish.hover2":
        "ไม่อยากเดินเยอะเกินไป และมื้อกลางวันอยากเน้นร้านอร่อยยอดนิยม!",
      "wish.hover3": "อยากไปกินปิ้งย่างเกาหลีร้านดังให้ได้เลย",
      "wish.hover4": "อยากไปดูนิทรรศการที่มีฟีลไซไฟหน่อย ๆ",
      "wish.hover5": "อยากเห็นวิวเมืองโซลตอนกลางคืนให้ได้",

      "schedule.title": "ตารางทริป",
      "schedule.none": "ยังไม่มีการสร้างตารางทริป",
      "schedule.col.order": "#",
      "schedule.col.name": "สถานที่",
      "schedule.col.category": "หมวดหมู่",
      "schedule.col.arrival": "ถึง",
      "schedule.col.depart": "ออกเดินทาง",

      "specifics.title": "รายละเอียดสถานที่",
      "specifics.none":
        "ยังไม่มีตารางทริป จึงไม่สามารถแสดงข้อมูลสถานที่ได้ในตอนนี้",

      "schedule.category.start": "ออกเดินทาง",
      "schedule.category.end": "สิ้นสุด",
      "schedule.category.required": "จุดที่ต้องไป",
    },
  },

  // Indonesian
  id: {
    translation: {
      "app.title": "Seoulmate",

      "header.subtitle":
        "Rencanakan perjalanan ke Seoul bersama Seoulmate – rute wisatanya sudah dioptimalkan sesuai pola makan, toleransi antre, lama tinggal, dan jam mulai/selesai!",

      "startend.pointsetting": "Atur titik berangkat · titik tujuan",
      "search.start": "Cari titik berangkat",
      "search.end": "Cari tujuan",
      "same.startend": "Titik berangkat dan tujuan sama",

      "map.marker.start_end": "Berangkat / Tiba",
      "map.marker.start": "Berangkat",
      "map.marker.end": "Tiba",

      "alert.need_start_end":
        "Silakan pilih titik berangkat dan tujuan terlebih dahulu.",
      "status.generating": "Sedang membuat rencana perjalanan kamu...",
      "status.time_invalid":
        "Waktu selesai harus lebih lambat dari waktu mulai.",
      "status.no_pois": "Tidak ditemukan tempat yang cocok untuk direkomendasikan.",
      "status.success": "✔️ Rencana perjalanan berhasil dibuat!",
      "status.error": "Terjadi kesalahan saat membuat jadwal.",

      "unit.minute": "menit",
      "unit.place_count": "tempat",
      "unit.hour": "jam",

      "button.generate": "Buat Rencana Perjalanan",
      "button.send": "SEND",
      "button.reset": "Reset",

      "meals.title": "Waktu makan",
      "meals.breakfast": "Sarapan",
      "meals.lunch": "Makan siang",
      "meals.dinner": "Makan malam",
      "meals.cafe": "Kafe · Dessert",

      "theme.title": "Tema Perjalanan (maks. 3)",
      "theme.shopping": "Belanja",
      "theme.culture": "Budaya · Pameran · Sejarah",
      "theme.nature": "Alam · Taman",
      "theme.cafe_tour": "Cafe Hopping",
      "theme.night_photo": "Spot Foto · Pemandangan Malam",
      "theme.healing": "Relaksasi / Healing",
      "theme.kpop": "Terkait K-pop",
      "theme.sns_hot": "Tempat Populer di SNS",

      "diet.title": "Preferensi makanan",
      "diet.halal": "Halal",
      "diet.vegan": "Vegan",
      "diet.vegetarian": "Vegetarian",
      "diet.kosher": "Kosher",
      "diet.gluten_free": "Bebas gluten",
      "diet.non_alcohol": "Tanpa alkohol",

      "wait.title": "Toleransi antre",
      "wait.low": "Tidak suka antre",
      "wait.medium": "Antre sebentar tidak apa-apa",
      "wait.high": "Demi resto terkenal, antre juga oke",

      "transport.title": "Transportasi yang disukai",
      "transport.walk": "Lebih banyak jalan kaki",
      "transport.transit": "Lebih banyak transportasi umum",
      "transport.taxi": "Lebih banyak taksi / mobil",

      "move.title": "Perpindahan · Tempat",
      "move.max_leg": "Waktu tempuh maksimal per segmen",
      "move.num_places": "Total jumlah tempat",

      "time.title": "Pengaturan waktu",
      "time.start": "Waktu mulai",
      "time.end": "Waktu selesai",

      "required.title": "Cari · tambahkan tempat wajib dikunjungi",
      "required.examples":
        "Namsan Tower, Istana Gyeongbokgung, kafe hanok...",

      "wish.title": "Ada harapan khusus untuk perjalanan ini?",
      "wish.placeholder":
         "Setelah memilih semua kategori dasar, mulailah obrolan dengan sapaan singkat! Kamu juga boleh menceritakan lebih detail tentang preferensi perjalananmu, seperti budget, suasana yang diinginkan, sejauh mana ingin berjalan, dan gaya yang kamu sukai.",
      "wish.hover":
        "Ceritakan saja preferensi perjalananmu dengan bebas, dan kami akan otomatis merekomendasikan opsi itinerary yang cocok!",
      "wish.hover1": "Contohnya bisa seperti ini",
      "wish.hover2":
        "Tidak ingin terlalu banyak berjalan, dan makan siang ingin fokus ke tempat hits!",
      "wish.hover3":
        "Aku sangat ingin mencoba restoran Korean BBQ yang terkenal.",
      "wish.hover4": "Aku ingin ke pameran yang bernuansa sci-fi.",
      "wish.hover5": "Aku benar-benar ingin melihat pemandangan malam Seoul.",

      "schedule.title": "Jadwal",
      "schedule.none": "Belum ada jadwal yang dibuat.",
      "schedule.col.order": "#",
      "schedule.col.name": "Tempat",
      "schedule.col.category": "Kategori",
      "schedule.col.arrival": "Tiba",
      "schedule.col.depart": "Berangkat",

      "specifics.title": "Detail tempat",
      "specifics.none":
        "Belum ada jadwal, jadi detail tempat belum tersedia.",

      "schedule.category.start": "Mulai",
      "schedule.category.end": "Selesai",
      "schedule.category.required": "Tempat wajib",
    },
  },

  // Spanish
  es: {
    translation: {
      "app.title": "Seoulmate",

      "header.subtitle":
        "Planifica tu viaje a Seúl con Seoulmate: optimizamos tu ruta según tus restricciones alimentarias, tolerancia a las colas, estancias parciales y horario de inicio/fin.",

      "startend.pointsetting": "Configurar origen · destino",
      "search.start": "Buscar origen",
      "search.end": "Buscar destino",
      "same.startend": "El origen y el destino son iguales",

      "map.marker.start_end": "Origen / Destino",
      "map.marker.start": "Origen",
      "map.marker.end": "Destino",

      "alert.need_start_end":
        "Por favor, selecciona tanto el origen como el destino.",
      "status.generating": "Generando tu plan de viaje...",
      "status.time_invalid":
        "La hora de fin debe ser posterior a la hora de inicio.",
      "status.no_pois":
        "No hemos encontrado lugares adecuados para recomendar.",
      "status.success": "✔️ ¡El plan de viaje se ha generado!",
      "status.error":
        "Se ha producido un error al generar el itinerario.",

      "unit.minute": "min",
      "unit.place_count": "lugares",
      "unit.hour": "h",

      "button.generate": "Generar plan de viaje",
      "button.send": "SEND",
      "button.reset": "Reiniciar",

      "meals.title": "Comidas",
      "meals.breakfast": "Desayuno",
      "meals.lunch": "Almuerzo",
      "meals.dinner": "Cena",
      "meals.cafe": "Café · Postre",

      "theme.title": "Temas de viaje (máx. 3)",
      "theme.shopping": "Compras",
      "theme.culture": "Cultura · Exhibiciones · Historia",
      "theme.nature": "Naturaleza · Parques",
      "theme.cafe_tour": "Ruta de cafés",
      "theme.night_photo": "Miradores · Fotos nocturnas",
      "theme.healing": "Relajación / Healing",
      "theme.kpop": "Relacionado con K-pop",
      "theme.sns_hot": "Lugares populares en redes",


      "diet.title": "Preferencias alimentarias",
      "diet.halal": "Halal",
      "diet.vegan": "Vegano",
      "diet.vegetarian": "Vegetariano",
      "diet.kosher": "Kosher",
      "diet.gluten_free": "Sin gluten",
      "diet.non_alcohol": "Sin alcohol",

      "wait.title": "Tolerancia a las colas",
      "wait.low": "No me gusta hacer cola",
      "wait.medium": "Un poco de cola está bien",
      "wait.high":
        "Por un sitio famoso no me importa esperar",

      "transport.title": "Transporte preferido",
      "transport.walk": "Principalmente a pie",
      "transport.transit": "Principalmente transporte público",
      "transport.taxi": "Principalmente taxi / coche",

      "move.title": "Desplazamiento · Lugares",
      "move.max_leg": "Tiempo máximo por tramo",
      "move.num_places": "Número total de lugares",

      "time.title": "Ajustes de tiempo",
      "time.start": "Hora de inicio",
      "time.end": "Hora de fin",

      "required.title": "Buscar · añadir lugares imprescindibles",
      "required.examples":
        "Namsan Tower, Palacio Gyeongbokgung, cafetería hanok...",

      "wish.title": "¿Qué esperas de este viaje?",
      "wish.placeholder":
       "Después de seleccionar todas las categorías básicas, comienza la conversación con un saludo sencillo. También puedes contarnos con más detalle tus preferencias de viaje, como tu presupuesto, el tipo de ambiente que buscas, cuánto te apetece caminar y el estilo que prefieres.",
      "wish.hover":
        "Cuéntanos libremente tus preferencias de viaje y te propondremos itinerarios automáticamente.",
      "wish.hover1": "Puedes escribir algo así:",
      "wish.hover2":
        "No quiero caminar demasiado y al mediodía quiero ir a sitios de comida famosa.",
      "wish.hover3":
        "Quiero ir sí o sí a un restaurante de Korean BBQ famoso.",
      "wish.hover4":
        "Quiero visitar una exposición con ambiente de ciencia ficción.",
      "wish.hover5":
        "Quiero ver sí o sí las vistas nocturnas de Seúl.",

      "schedule.title": "Itinerario",
      "schedule.none":
        "Todavía no se ha generado ningún itinerario.",
      "schedule.col.order": "#",
      "schedule.col.name": "Lugar",
      "schedule.col.category": "Categoría",
      "schedule.col.arrival": "Llegada",
      "schedule.col.depart": "Salida",

      "specifics.title": "Detalles del lugar",
      "specifics.none":
        "Aún no se ha generado un itinerario, por lo que no hay información de lugares.",

      "schedule.category.start": "Salida",
      "schedule.category.end": "Llegada",
      "schedule.category.required": "Parada obligatoria",
    },
  },

  // German
  de: {
    translation: {
      "app.title": "Seoulmate",

      "header.subtitle":
        "Plane deine Seoul-Reise mit Seoulmate – wir optimieren deine Route nach Ernährungspräferenzen, Wartebereitschaft, Teilaufenthalten und Start-/Endzeiten!",

      "startend.pointsetting": "Start- · Zielpunkt festlegen",
      "search.start": "Startpunkt suchen",
      "search.end": "Zielpunkt suchen",
      "same.startend": "Start- und Zielpunkt sind gleich",

      "map.marker.start_end": "Start / Ziel",
      "map.marker.start": "Start",
      "map.marker.end": "Ziel",

      "alert.need_start_end":
        "Bitte wähle sowohl einen Start- als auch einen Zielpunkt aus.",
      "status.generating": "Dein Reiseplan wird gerade erstellt...",
      "status.time_invalid":
        "Die Endzeit muss nach der Startzeit liegen.",
      "status.no_pois":
        "Es konnten keine passenden Orte für Empfehlungen gefunden werden.",
      "status.success":
        "✔️ Der Reiseplan wurde erfolgreich erstellt!",
      "status.error":
        "Beim Erstellen des Zeitplans ist ein Fehler aufgetreten.",

      "unit.minute": "Min.",
      "unit.place_count": "Orte",
      "unit.hour": "Std.",

      "button.generate": "Reiseplan erstellen",
      "button.send": "SEND",
      "button.reset": "Zurücksetzen",

      "meals.title": "Mahlzeiten",
      "meals.breakfast": "Frühstück",
      "meals.lunch": "Mittagessen",
      "meals.dinner": "Abendessen",
      "meals.cafe": "Café · Dessert",
      
      "theme.title": "Reisethemen (max. 3)",
      "theme.shopping": "Shopping",
      "theme.culture": "Kultur · Ausstellungen · Geschichte",
      "theme.nature": "Natur · Parks",
      "theme.cafe_tour": "Cafe-Hopping",
      "theme.night_photo": "Nachtblick · Fotospots",
      "theme.healing": "Entspannung / Healing",
      "theme.kpop": "K-pop-bezogen",
      "theme.sns_hot": "Beliebte SNS-Orte",

      "diet.title": "Ernährungspräferenzen",
      "diet.halal": "Halal",
      "diet.vegan": "Vegan",
      "diet.vegetarian": "Vegetarisch",
      "diet.kosher": "Koscher",
      "diet.gluten_free": "Glutenfrei",
      "diet.non_alcohol": "Ohne Alkohol",

      "wait.title": "Wartebereitschaft",
      "wait.low": "Ich mag es nicht, in der Schlange zu stehen",
      "wait.medium": "Ein bisschen Warten ist okay",
      "wait.high":
        "Für berühmte Lokale warte ich gerne",

      "transport.title": "Bevorzugtes Verkehrsmittel",
      "transport.walk": "Überwiegend zu Fuß",
      "transport.transit":
        "Überwiegend öffentliche Verkehrsmittel",
      "transport.taxi": "Überwiegend Taxi / Auto",

      "move.title": "Wege · Orte",
      "move.max_leg": "Maximale Wegzeit pro Abschnitt",
      "move.num_places": "Gesamtanzahl der Orte",

      "time.title": "Zeiteinstellungen",
      "time.start": "Startzeit",
      "time.end": "Endzeit",

      "required.title": "Pflichtorte suchen · hinzufügen",
      "required.examples":
        "Namsan Tower, Gyeongbokgung-Palast, Hanok-Café...",

      "wish.title": "Was wünschst du dir von deiner Reise?",
      "wish.placeholder":
        "Nachdem du alle Basiskategorien ausgewählt hast, kannst du mit einer kurzen Begrüßung ins Gespräch einsteigen! Du kannst auch gerne genauer von deinen Reisevorlieben erzählen – zum Beispiel Budget, gewünschte Stimmung, wie viel du laufen möchtest und welchen Stil du bevorzugst.",
      "wish.hover":
        "Erzähl uns frei von deinen Reisevorlieben, und wir schlagen dir automatisch passende Routen vor!",
      "wish.hover1":
        "Du kannst zum Beispiel so schreiben:",
      "wish.hover2":
        "Ich möchte nicht zu viel laufen und mittags gerne in bekannte Restaurants gehen.",
      "wish.hover3":
        "Ich möchte unbedingt ein berühmtes Korean-BBQ-Restaurant ausprobieren.",
      "wish.hover4":
        "Ich möchte eine Ausstellung mit Sci-Fi-Atmosphäre besuchen.",
      "wish.hover5":
        "Ich möchte auf jeden Fall die Nachtansicht von Seoul sehen.",

      "schedule.title": "Zeitplan",
      "schedule.none":
        "Es wurde noch kein Zeitplan erstellt.",
      "schedule.col.order": "#",
      "schedule.col.name": "Ort",
      "schedule.col.category": "Kategorie",
      "schedule.col.arrival": "Ankunft",
      "schedule.col.depart": "Abfahrt",

      "specifics.title": "Details zum Ort",
      "specifics.none":
        "Es wurde noch kein Zeitplan erstellt, daher sind keine Ortsinformationen verfügbar.",

      "schedule.category.start": "Start",
      "schedule.category.end": "Ziel",
      "schedule.category.required": "Pflichtstopp",
    },
  },
  fr: {
    translation: {
      "app.title": "Seoulmate",

      "header.subtitle":
        "Planifie ton voyage à Séoul avec Seoulmate, optimisé pour tes préférences alimentaires, ta tolérance à l’attente, les passages partiels et les heures de début/fin !",

      "startend.pointsetting": "Définir le point de départ et d’arrivée",
      "search.start": "Rechercher le point de départ",
      "search.end": "Rechercher la destination",
      "same.startend": "Départ et arrivée identiques",

      "map.marker.start_end": "Départ / Arrivée",
      "map.marker.start": "Départ",
      "map.marker.end": "Arrivée",

      "alert.need_start_end":
        "Merci de sélectionner un point de départ et une destination.",
      "status.generating": "Génération de ton itinéraire...",
      "status.time_invalid":
        "L’heure de fin doit être plus tardive que l’heure de début.",
      "status.no_pois":
        "Aucun lieu adapté n’a pu être trouvé.",
      "status.success": "✔️ Ton itinéraire a été généré !",
      "status.error":
        "Une erreur est survenue lors de la génération de l’itinéraire.",

      "unit.minute": "min",
      "unit.place_count": "lieux",
      "unit.hour": "h",

      "button.generate": "Générer l’itinéraire",
      "button.send": "SEND",
      "button.reset": "Réinitialiser",

      "meals.title": "Repas",
      "meals.breakfast": "Petit-déjeuner",
      "meals.lunch": "Déjeuner",
      "meals.dinner": "Dîner",
      "meals.cafe": "Café · Dessert",

      "diet.title": "Préférences alimentaires",
      "diet.halal": "Halal",
      "diet.vegan": "Vegan",
      "diet.vegetarian": "Végétarien",
      "diet.kosher": "Kasher",
      "diet.gluten_free": "Sans gluten",
      "diet.non_alcohol": "Sans alcool",

      "theme.title": "Thèmes de voyage (jusqu’à 3)",
      "theme.shopping": "Shopping",
      "theme.culture": "Culture · Expositions · Histoire",
      "theme.nature": "Nature · Parcs",
      "theme.cafe_tour": "Café hopping",
      "theme.night_photo": "Vue de nuit · Spots photo",
      "theme.healing": "Détente / Healing",
      "theme.kpop": "Lié au K-pop",
      "theme.sns_hot": "Lieux populaires sur les réseaux",

      "wait.title": "Tolérance à l’attente",
      "wait.low": "Je n’aime pas faire la queue",
      "wait.medium": "Un peu d’attente, ça va",
      "wait.high":
        "Pour un spot célèbre, je peux patienter",

      "transport.title": "Moyen de transport préféré",
      "transport.walk": "Principalement à pied",
      "transport.transit": "Principalement transports en commun",
      "transport.taxi": "Principalement taxi / voiture",

      "move.title": "Déplacements · Lieux",
      "move.max_leg": "Temps de trajet max par segment",
      "move.num_places": "Nombre total de lieux",

      "time.title": "Réglages de l’horaire",
      "time.start": "Heure de début",
      "time.end": "Heure de fin",

      "required.title": "Rechercher · ajouter des lieux incontournables",
      "required.examples":
        "Namsan Tower, Palais Gyeongbokgung, café hanok...",

      "wish.title": "Qu’attends-tu de ce voyage ?",
      "wish.placeholder":
        "Après avoir sélectionné toutes les catégories de base, commence la conversation avec un petit salut ! Tu peux aussi détailler tes préférences de voyage : budget, ambiance souhaitée, niveau de marche, style préféré, etc.",
      "wish.hover":
        "Parle librement de tes préférences de voyage et nous te proposerons automatiquement des options d’itinéraire adaptées !",
      "wish.hover1": "Tu peux par exemple écrire :",
      "wish.hover2":
        "Je ne veux pas trop marcher et je veux des restaurants célèbres pour le déjeuner.",
      "wish.hover3":
        "Je veux absolument essayer un restaurant de Korean BBQ réputé.",
      "wish.hover4":
        "Je veux visiter une exposition avec une ambiance science-fiction.",
      "wish.hover5":
        "Je veux absolument voir la vue nocturne de Séoul.",

      "schedule.title": "Itinéraire",
      "schedule.none":
        "Aucun itinéraire n’a encore été généré.",
      "schedule.col.order": "#",
      "schedule.col.name": "Lieu",
      "schedule.col.category": "Catégorie",
      "schedule.col.arrival": "Arrivée",
      "schedule.col.depart": "Départ",

      "specifics.title": "Détails du lieu",
      "specifics.none":
        "Aucun itinéraire n’a été généré pour le moment, les informations de lieu ne sont donc pas disponibles.",
    },
  },

};

i18n.use(initReactI18next).init({
  resources,
  lng: "ko", // 기본 언어
  fallbackLng: "en", // 번역 없는 키가 있을 때 기본 fallback
  supportedLngs: Object.keys(resources), // 등록된 모든 언어 키 지원
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
