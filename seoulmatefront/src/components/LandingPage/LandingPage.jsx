// LandingPage.jsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./LandingPage.css";
import Logo from "./Logo"; // 작은 로고도 여기서 재사용한다고 가정 :contentReference[oaicite:0]{index=0}

const countryToLang = {
  KR: "ko",
  US: "en",
  GB: "en",
  CA: "en",
  AU: "en",
  JP: "ja",
  CN: "zh-CN",
  TW: "zh-TW",
  FR: "fr",
};

const carouselGreetings = [
  "Hello", // en
  "안녕하세요", // ko
  "Bonjour", // fr
  "こんにちは", // ja
  "你好", // zh-CN/zh-TW 공용 인삿말
  "Hola", // es
  "Guten Tag", // de
  "Xin chào", // vi
  "สวัสดีค่ะ", // th
  "Halo", // id
  "Ciao",
];

const featureItems = [
  {
    id: "usp",
    icon: "✨",
    label: "What makes Seoulmate special",
    title: "Seoul, matched to your soul.",
    description:
      "AI analyzes your food preferences, waiting tolerance, walking stamina, and must-see spots to build a route that actually fits you – not just a list of tourist places.",
  },
  {
    id: "how",
    icon: "⚙️",
    label: "How it works",
    title: "Answer. Analyze. Route.",
    description:
      "1) Answer a few quick questions about your day. 2) Our AI interprets your style. 3) Seoulmate generates a time-ordered route with cafés, restaurants, and spots that match you.",
  },
  {
    id: "sample",
    icon: "🗺️",
    label: "Sample itinerary",
    title: "1-day Hongdae café & photo tour",
    description:
      "10:00 Hongdae Station → 11:00 gluten-friendly dessert café → 14:00 Yeonnam-dong photo walk → 18:00 gluten-friendly dinner. Just one example of what Seoulmate can create.",
  },
  {
    id: "who",
    icon: "👥",
    label: "Who is this for?",
    title: "For travelers like you",
    description:
      "First-time visitors, exchange students, and café / photo-spot lovers who want to see more with less stress – especially if you care about diet, queues, and efficient routes.",
  },
];

function LandingPage({ onFinish }) {
  const { i18n } = useTranslation();

  const [selectedCountry, setSelectedCountry] = useState("");
  const [currentGreetingIndex, setCurrentGreetingIndex] = useState(0);
  const [activeFeatureId, setActiveFeatureId] = useState("usp");

  // 인삿말 회전
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGreetingIndex(
        (prev) => (prev + 1) % carouselGreetings.length
      );
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  const handleContinue = () => {
    if (!selectedCountry) return;

    const lang = countryToLang[selectedCountry] || "en";
    i18n.changeLanguage(lang);

    if (onFinish) {
      onFinish();
    }
  };

  const activeFeature =
    featureItems.find((f) => f.id === activeFeatureId) || featureItems[0];

  const activeFeatureIndex = featureItems.findIndex(
    (f) => f.id === activeFeatureId
  );

  return (
    <div className="landing-root">
      <section className="landing-hero">
        {/* 왼쪽 위 로고 + 문구 */}
        <div className="landing-header">
          {/* <Logo className="landing-logo" /> */}
          <span className="landing-header-text">
            Plan your route with SeoulM8!
          </span>
        </div>

        <div className="landing-hero-inner">
          {/* 1행: 인삿말 */}
          <div className="hero-greeting-col">
            <div className="greeting-carousel-container hero-greeting">
              <div className="greeting-carousel">
                <div
                  key={currentGreetingIndex}
                  className="greeting-carousel-item"
                >
                  {carouselGreetings[currentGreetingIndex]}
                </div>
              </div>
            </div>
          </div>

          {/* 2행: 카드 + (중간 로고) + 아이콘 */}
          <div className="hero-middle-row">
            {/* 왼쪽: Where are you from 카드 */}
            <div className="hero-card-col">
              <div className="card hero-card">
                <h2 className="question">Where are you from?</h2>
                <p className="sub">
                  Choose your country so we can greet you in your language
                </p>

                <select
                  className="country-select"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                >
                  <option value="">Select your country</option>
                  {/* ko / en 계열 */}
                  <option value="KR">Korea</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>

                  {/* 동아시아 */}
                  <option value="JP">Japan</option>
                  <option value="CN">China</option>
                  <option value="TW">Taiwan</option>

                  {/* 유럽 */}
                  <option value="FR">France</option>
                  <option value="DE">Germany</option>
                  <option value="ES">Spain</option>

                  {/* 동남아 */}
                  <option value="VN">Vietnam</option>
                  <option value="TH">Thailand</option>
                  <option value="ID">Indonesia</option>
                </select>

                <button
                  className="continue-btn"
                  onClick={handleContinue}
                  disabled={!selectedCountry}
                >
                  Continue
                </button>
              </div>
            </div>

            {/* 가운데: 카드와 아이콘 사이에 작은 로고 */}
            <div className="hero-connector">
              <div className="hero-connector-line" />
              <div
                className="hero-connector-logo"
                style={{
                  transform: `translateY(${activeFeatureIndex * 70}px)`,
                }}
              >
                <Logo className="between-logo" />
              </div>
            </div>

            {/* 오른쪽: 기능 아이콘 + 설명 박스 */}
            <div className="hero-right">
              <div className="feature-box">
                <div className="feature-list">
                  {featureItems.map((item) => (
                    <button
                      key={item.id}
                      className={
                        "feature-icon" +
                        (activeFeatureId === item.id ? " active" : "")
                      }
                      onMouseEnter={() => setActiveFeatureId(item.id)}
                      onClick={() => setActiveFeatureId(item.id)}
                      type="button"
                    >
                      <span className="feature-icon-emoji">{item.icon}</span>
                      <span className="feature-icon-label">{item.label}</span>
                    </button>
                  ))}
                </div>

                <div key={activeFeature.id} className="feature-content">
                  <div className="feature-content-pill">
                    {activeFeature.label}
                  </div>
                  <h3 className="feature-content-title">
                    {activeFeature.title}
                  </h3>
                  <p className="feature-content-desc">
                    {activeFeature.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 슬로건 */}
        <div className="hero-slogan">
          Your Soul,
          <br />
          Your Seoul!
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
