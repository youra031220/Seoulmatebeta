import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./RequiredStops.css";

export default function RequiredStops({ value = [], onChange }) {
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);

  const debounceRef = useRef(null);
  const boxRef = useRef(null);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setActive(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 검색 디바운싱
  useEffect(() => {
    if (!active || !query.trim()) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [active, query]);

  // 선택 시: 칩 목록에 추가 (+ 지오코딩으로 좌표까지)
  const handleAdd = async (item) => {
    const plainTitle =
      item.title?.replace(/<[^>]+>/g, "") ||
      item.title ||
      t("schedule.col.name");
    const addr = item.roadAddress || item.address || "";

    // ① 기본: 검색 결과의 mapx/mapy로 바로 좌표 계산
    let lon = item.mapx ? Number(item.mapx) / 1e7 : null;
    let lat = item.mapy ? Number(item.mapy) / 1e7 : null;

    // ② 혹시 mapx/mapy가 없을 때만 geocode로 보완 (옵션)
    if ((lat === null || lon === null) && addr) {
      try {
        const g = await fetch(
          `/api/geocode?addr=${encodeURIComponent(addr)}`
        ).then((r) => r.json());
        if (g?.addresses?.[0]) {
          lon = parseFloat(g.addresses[0].x);
          lat = parseFloat(g.addresses[0].y);
        }
      } catch (e) {
        console.error("geocode error", e);
      }
    }

    const poi = { name: plainTitle, addr, lat, lon, raw: item };

    if (onChange) {
      const exists = (value || []).some(
        (v) => v.name === poi.name && v.addr === poi.addr
      );
      if (!exists) {
        onChange([...(value || []), poi]);
      }
    }

    setQuery("");
    setResults([]);
    setActive(false);
  };

  const handleRemove = (idx) => {
    if (!onChange) return;
    const next = (value || []).filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div ref={boxRef} className="required-stops-container">
      <label className="required-stops-label">
        {t("required.title")}
      </label>

      <div className="required-stops-box">
        {/* 검색 인풋 줄 */}
        <div className="required-stops-input-row">
          <input
            type="text"
            placeholder={t("required.examples")}
            className="required-stops-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(true);
            }}
            onFocus={() => setActive(true)}
          />
          {query && (
            <button
              type="button"
              className="required-stops-clear"
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* 선택된 필수 방문지 칩들 */}
        <div className="required-stops-chip-list">
          {(value || []).map((p, idx) => (
            <div key={`${p.name}-${idx}`} className="required-stops-chip">
              <span className="required-stops-chip-label">{p.name}</span>
              <button
                type="button"
                className="required-stops-chip-remove"
                onClick={() => handleRemove(idx)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* 검색 결과 드롭다운 */}
        {active && results.length > 0 && (
          <div className="required-stops-dropdown">
            {loading && (
              <div className="required-stops-loading">검색 중...</div>
            )}
            {results.map((item, idx) => {
              const title =
                item.title?.replace(/<[^>]+>/g, "") || item.title || "";
              const addr = item.roadAddress || item.address || "";
              return (
                <button
                  key={idx}
                  type="button"
                  className="required-stops-item"
                  onClick={() => handleAdd(item)}
                >
                  <div className="required-stops-item-title">{title}</div>
                  {addr && (
                    <div className="required-stops-item-addr">{addr}</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
