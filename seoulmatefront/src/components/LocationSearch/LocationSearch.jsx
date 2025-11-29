import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * props:
 *  - onChange({ start, end, sameStartEnd })
 *    start / end: { name, lat, lon, raw } 혹은 null
 */
export default function LocationSearch({ onChange }) {
  const { t } = useTranslation();

  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [sameStartEnd, setSameStartEnd] = useState(false);

  const [activeField, setActiveField] = useState(null); // 'start' | 'end' | null
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);

  const boxRef = useRef(null);
  const debounceRef = useRef(null);
  const lastPayloadRef = useRef(null);

  // 부모에게 위치 변경 전달
  useEffect(() => {
    if (!onChange) return;

    const convert = (item) => {
      if (!item) return null;

      const name = item.title?.replace(/<[^>]+>/g, "") || item.title || "";

      const lon = item.mapx ? Number(item.mapx) / 1e7 : null;
      const lat = item.mapy ? Number(item.mapy) / 1e7 : null;

      return {
        name,
        lat,
        lon,
        raw: item,
      };
    };

    const payload = {
      start: convert(selectedStart),
      end: sameStartEnd ? convert(selectedStart) : convert(selectedEnd),
      sameStartEnd,
    };

    // 🔒 이전에 부모에게 넘긴 값과 완전히 같으면 다시 호출하지 않음 → 무한 루프 방지
    const last = lastPayloadRef.current;
    if (last && JSON.stringify(last) === JSON.stringify(payload)) {
      return;
    }

    lastPayloadRef.current = payload;
    onChange(payload);
  }, [selectedStart, selectedEnd, sameStartEnd, onChange]);

  // 인풋 값 변경 → 디바운싱 검색
  useEffect(() => {
    const keyword =
      activeField === "start"
        ? startInput.trim()
        : activeField === "end"
        ? endInput.trim()
        : "";

    if (!activeField || keyword === "") {
      setResults([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
        const data = await res.json();
        const items = data.items || [];

        setResults(items);
      } catch (e) {
        console.error("search error", e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [activeField, startInput, endInput]);

  // 박스 밖 클릭하면 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setActiveField(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPlace = (field, item) => {
    const plainTitle =
      item.title?.replace(/<[^>]+>/g, "") || item.title || t("schedule.col.name");

    if (field === "start") {
      setSelectedStart(item);
      setStartInput(plainTitle);
      if (sameStartEnd) {
        setSelectedEnd(item);
        setEndInput(plainTitle);
      }
    } else {
      setSelectedEnd(item);
      setEndInput(plainTitle);
      if (sameStartEnd) {
        setSelectedStart(item);
        setStartInput(plainTitle);
      }
    }
    setActiveField(null);
    setResults([]);
  };

  const handleSwap = () => {
    // 동일 체크면 스왑 의미 없으니 무시
    if (sameStartEnd) return;

    // 둘 다 비어 있으면 할 일 없음
    if (!startInput && !endInput) return;

    // 입력값 스왑
    const tempInput = startInput;
    setStartInput(endInput);
    setEndInput(tempInput);

    // 선택된 장소 객체도 스왑
    const tempSelected = selectedStart;
    setSelectedStart(selectedEnd);
    setSelectedEnd(tempSelected);
  };

  const handleToggleSame = () => {
    setSameStartEnd((prev) => {
      const next = !prev;

      if (next) {
        // 체크 ON: 출발지 → 도착지 복사
        if (selectedStart) {
          setSelectedEnd(selectedStart);
          setEndInput(startInput);
        }
      } else {
        // 체크 OFF: 도착지 비우기
        setSelectedEnd(null);
        setEndInput("");
      }

      return next;
    });
  };

  const clearField = (field) => {
    if (field === "start") {
      setStartInput("");
      setSelectedStart(null);
      if (sameStartEnd) {
        setEndInput("");
        setSelectedEnd(null);
      }
    } else {
      setEndInput("");
      setSelectedEnd(null);
    }
  };

  const renderResults = () => {
    if (!activeField || results.length === 0) return null;

    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          marginTop: 8,
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 8px 20px rgba(15,23,42,0.12)",
          maxHeight: 260,
          overflowY: "auto",
          zIndex: 20,
        }}
      >
        {loading && (
          <div
            style={{
              padding: "8px 12px",
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            검색 중...
          </div>
        )}
        {results.map((item, idx) => {
          const plainTitle =
            item.title?.replace(/<[^>]+>/g, "") || item.title || "";
          const addr = item.roadAddress || item.address || "";

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPlace(activeField, item)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                borderBottom:
                  idx === results.length - 1
                    ? "none"
                    : "1px solid #f3f4f6",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f9fafb")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {plainTitle}
              </div>
              {addr && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    marginTop: 2,
                  }}
                >
                  {addr}
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ width: "100%" }} ref={boxRef}>
      <label
        style={{
          display: "block",
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {t("startend.pointsetting")}
      </label>

      <div
        style={{
          position: "relative",
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
          padding: "12px 16px 12px 32px",
        }}
      >
        {/* 🔁 출발/도착 교체 버튼 */}
        <button
          type="button"
          onClick={handleSwap}
          style={{
            position: "absolute",
            left: 8,
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "transparent",
            cursor: sameStartEnd ? "default" : "pointer",
            color: sameStartEnd ? "#d1d5db" : "#9ca3af",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 10,
            padding: 0,
          }}
        >
          <span>↑</span>
          <span>↓</span>
        </button>
        {/* 출발지 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "999px",
              backgroundColor: "#22c55e",
            }}
          />
          <input
            type="text"
            placeholder={t("search.start")}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 13,
              background: "transparent",
            }}
            value={startInput}
            onChange={(e) => {
              setStartInput(e.target.value);
              setActiveField("start");
            }}
            onFocus={() => setActiveField("start")}
          />
          {startInput && (
            <button
              type="button"
              onClick={() => clearField("start")}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
                color: "#9ca3af",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* 구분선 */}
        <div
          style={{
            width: "100%",
            height: 1,
            backgroundColor: "#e5e7eb",
            margin: "10px 0",
          }}
        />

        {/* 도착지 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "999px",
              backgroundColor: "#f97373",
            }}
          />
          <input
            type="text"
            placeholder={t("search.end")}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 13,
              background: "transparent",
              color: sameStartEnd ? "#9ca3af" : "#111827",
            }}
            value={endInput}
            onChange={(e) => {
              setEndInput(e.target.value);
              setActiveField("end");
            }}
            onFocus={() => !sameStartEnd && setActiveField("end")}
            disabled={sameStartEnd}
          />
          {endInput && !sameStartEnd && (
            <button
              type="button"
              onClick={() => clearField("end")}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
                color: "#9ca3af",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* 출발지·도착지 동일 스위치 (커스텀 버튼) */}
        <button
          type="button"
          onClick={handleToggleSame}
          style={{
            marginTop: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 999,
            border: "none",
            background: sameStartEnd ? "rgba(79,70,229,0.15)" : "#f3f4f6",
            cursor: "pointer",
            fontSize: 12,
            color: "#111827",
            boxShadow: sameStartEnd
              ? "0 2px 6px rgba(79,70,229,0.25)"
              : "0 1px 3px rgba(0,0,0,0.06)",
            transition: "all 0.15s ease-out",
            outline: "none",
          }}
          onFocus={(e) => {
            e.preventDefault();
            e.target.style.outline = "none";
            e.target.style.boxShadow = sameStartEnd
              ? "0 2px 6px rgba(79,70,229,0.25)"
              : "0 1px 3px rgba(0,0,0,0.06)";
          }}
          onMouseDown={(e) => e.preventDefault()} // 포커스 자체 방지
        >
          {/* 동그라미 체크 아이콘 (border 없음) */}
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: sameStartEnd ? "#4f46e5" : "#d1d5db", // 꽉 찬 보라색 / 연회색
              transition: "background 0.15s ease-out",
            }}
          />

          <span style={{ userSelect: "none" }}>
            {t("same.startend")}
          </span>
        </button>

        {renderResults()}
      </div>
    </div>
  );
}

