// src/components/Header/Header.jsx
import "./Header.css";
import Logo from "./Logo";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export default function Header() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // i18n.js에 정의한 언어 키 기준 라벨 매핑
  const LANG_LABELS = {
    ko: "한국어 (KOR)",
    en: "English (ENG)",
    ja: "日本語 (JPN)",          // ✅ jp 아님!
    "zh-CN": "简体中文 (CN)",
    "zh-TW": "繁體中文 (TW)",
    vi: "Tiếng Việt (VI)",
    th: "ไทย (TH)",
    id: "Bahasa Indonesia (ID)",
    es: "Español (ES)",
    de: "Deutsch (DE)",
    fr: "French (FR)",
  };

  // i18n에 등록된 리소스 키 가져오기
  const langCodes = Object.keys(i18n.options.resources || LANG_LABELS);

  // 현재 언어 코드 정규화 (en-US → en 같은 경우 대비)
  const baseLang = (i18n.language || "ko").split("-")[0];
  const currentCode = langCodes.includes(i18n.language)
    ? i18n.language
    : langCodes.includes(baseLang)
    ? baseLang
    : "ko";

  const currentLabel = LANG_LABELS[currentCode] || currentCode.toUpperCase();
  const pillLabel = currentLabel.split(" ")[0]; // "한국어", "English" 부분만 pill에 표시

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  // 바깥 클릭하면 dropdown 닫기
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sm-header">
      <div className="sm-header-left">
        {/* 로고 아이콘 */}
        <Logo />

        {/* 로고 텍스트 (다국어) */}
        <span className="sm-logo-text">{t("app.title")}</span>
      </div>

      {/* 서브타이틀 (다국어) */}
      <p className="sm-header-subtitle">{t("header.subtitle")}</p>

      {/* 언어 선택 */}
      <div className="sm-lang-container" ref={dropdownRef}>
        <button
          type="button"
          className="sm-lang-pill"
          onClick={() => setOpen((v) => !v)}
        >
          {pillLabel}
        </button>

        {open && (
          <div className="sm-lang-dropdown">
            {langCodes.map((code) => (
              <div
                key={code}
                onClick={() => changeLang(code)}
                className={
                  code === currentCode
                    ? "sm-lang-item sm-lang-item-active"
                    : "sm-lang-item"
                }
              >
                {LANG_LABELS[code] || code}
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}



