// src/components/CandidateSelector.jsx
import React, { useMemo, useState } from "react";

const POICard = ({ poi, isSelected, onToggle, selectionMode }) => {
  const id = poi.id || poi.title;

  const handleClick = () => {
    onToggle(id);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "10px 12px",
        borderRadius: 12,
        border: isSelected ? "2px solid #6366f1" : "1px solid #e5e7eb",
        background: isSelected ? "#eef2ff" : "#ffffff",
        boxShadow: isSelected
          ? "0 4px 12px rgba(79,70,229,0.35)"
          : "0 2px 8px rgba(15,23,42,0.08)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        transition: "all 0.15s ease-out",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: "#111827",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {poi.name || poi.title}
        </div>

        {isSelected && (
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 999,
              background:
                "linear-gradient(90deg,#6366f1 0%,#ec4899 50%,#f97316 100%)",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            ✓
          </span>
        )}
      </div>

      {poi.address && (
        <div
          style={{
            fontSize: 11,
            color: "#6b7280",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {poi.address}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          color: "#6b7280",
        }}
      >
        {poi.category && (
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 999,
              background: "#f3f4f6",
              fontSize: 11,
            }}
          >
            {poi.categoryTranslated || poi.category}
          </span>
        )}

        {poi.rating && (
          <span>
            ⭐ {Number(poi.rating).toFixed(1)}
          </span>
        )}
      </div>
    </button>
  );
};

const CategorySection = ({
  title,
  icon,
  pois,
  selectedIds,
  onToggle,
  selectionMode = "multiple",
  maxSelection = null,
  description = "",
  t = (k) => k,
}) => {
  const selectedCount = pois.filter((p) => selectedIds.has(p.id || p.title))
    .length;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* 섹션 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <span style={{ fontSize: 13, color: "#888" }}>
            ({selectedCount}/{pois.length}
            {maxSelection
              ? t("candidate.maxSelectionLabel", { max: maxSelection })
              : ""}
            )
          </span>
        </div>
      </div>

      {/* 설명 */}
      {description && (
        <p
          style={{
            fontSize: 13,
            color: "#666",
            margin: "0 0 12px",
          }}
        >
          {description}
        </p>
      )}

      {/* POI 리스트 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pois.length === 0 ? (
          <div style={{ color: "#999", fontSize: 14, padding: 12 }}>
            {t("candidate.no_results")}
          </div>
        ) : (
          pois.map((poi) => {
            const id = poi.id || poi.title;
            return (
              <POICard
                key={id}
                poi={poi}
                isSelected={selectedIds.has(id)}
                onToggle={onToggle}
                selectionMode={selectionMode}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

const categorizeCandidates = (candidates = []) => {
  const attractions = [];
  const restaurants = [];
  const cafes = [];

  candidates.forEach((p) => {
    const type = p.categoryType || "poi";
    if (type === "restaurant") {
      restaurants.push(p);
    } else if (type === "cafe") {
      cafes.push(p);
    } else {
      attractions.push(p);
    }
  });

  return { attractions, restaurants, cafes };
};

export default function CandidateSelector({
  candidates = [],
  onConfirm,
  onCancel,
  mealOptions = { breakfast: false, lunch: true, dinner: true, cafe: false },
  t,
}) {
  const categorized = useMemo(
    () => categorizeCandidates(candidates),
    [candidates]
  );

  // 관광지: 다중 선택
  const [selectedAttractions, setSelectedAttractions] = useState(
    new Set()
  );
  // 점심/저녁/카페: 각각 1개만 선택
  const [selectedLunch, setSelectedLunch] = useState(null);
  const [selectedDinner, setSelectedDinner] = useState(null);
  const [selectedCafe, setSelectedCafe] = useState(null);

  const toggleAttraction = (id) => {
    setSelectedAttractions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectLunch = (id) => {
    setSelectedLunch((prev) => (prev === id ? null : id));
  };

  const selectDinner = (id) => {
    setSelectedDinner((prev) => (prev === id ? null : id));
  };

  const selectCafe = (id) => {
    setSelectedCafe((prev) => (prev === id ? null : id));
  };

  const handleConfirm = () => {
    const allSelectedIds = new Set();

    selectedAttractions.forEach((id) => allSelectedIds.add(id));
    if (selectedLunch) allSelectedIds.add(selectedLunch);
    if (selectedDinner) allSelectedIds.add(selectedDinner);
    if (selectedCafe) allSelectedIds.add(selectedCafe);

    const result = candidates.filter((p) =>
      allSelectedIds.has(p.id || p.title)
    );

    if (onConfirm) {
      onConfirm(result);
    }
  };

  const totalSelected =
    selectedAttractions.size +
    (selectedLunch ? 1 : 0) +
    (selectedDinner ? 1 : 0) +
    (selectedCafe ? 1 : 0);

  return (
  <div
    style={{
      backgroundColor: "#ffffff",
      borderRadius: 24,
      padding: 20,
      boxShadow: "0 20px 50px rgba(15,23,42,0.4)",
      maxHeight: "90vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}
  >


      {/* 헤더 */}
      <header>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          🗺️ {t("candidate.title")}
        </h2>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 14,
            color: "#666",
          }}
        >
          {t("candidate.subtitle")}
        </p>
      </header>

      {/* 내용 영역 (스크롤) */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: 4,
          marginTop: 8,
        }}
      >
        {/* 관광지 */}
        <CategorySection
          title={t("candidate.attractions.title")}
          icon="🏛️"
          pois={categorized.attractions}
          selectedIds={selectedAttractions}
          onToggle={toggleAttraction}
          selectionMode="multiple"
          description={t("candidate.attractions.desc")}
          t={t}
        />

        {/* 점심 */}
        {mealOptions.lunch && (
          <CategorySection
            title={t("candidate.lunch.title")}
            icon="🍽️"
            pois={categorized.restaurants}
            selectedIds={new Set(selectedLunch ? [selectedLunch] : [])}
            onToggle={selectLunch}
            selectionMode="single"
            maxSelection={1}
            description={t("candidate.lunch.desc")}
            t={t}
          />
        )}

        {/* 저녁 */}
        {mealOptions.dinner && (
          <CategorySection
            title={t("candidate.dinner.title")}
            icon="🍽️"
            pois={categorized.restaurants}
            selectedIds={new Set(selectedDinner ? [selectedDinner] : [])}
            onToggle={selectDinner}
            selectionMode="single"
            maxSelection={1}
            description={t("candidate.dinner.desc")}
            t={t}
          />
        )}

        {/* 카페 */}
        {mealOptions.cafe && (
          <CategorySection
            title={t("candidate.cafe.title")}
            icon="☕"
            pois={categorized.cafes}
            selectedIds={new Set(selectedCafe ? [selectedCafe] : [])}
            onToggle={selectCafe}
            selectionMode="single"
            maxSelection={1}
            description={t("candidate.cafe.desc")}
            t={t}
          />
        )}
      </div>

      {/* 하단 버튼 영역 */}
      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 8,
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("candidate.cancel")}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={totalSelected === 0}
          style={{
            flex: 2,
            padding: "10px 14px",
            borderRadius: 999,
            border: "none",
            background:
              totalSelected === 0
                ? "#e5e7eb"
                : "linear-gradient(90deg,#6366f1 0%,#ec4899 50%,#f97316 100%)",
            color: totalSelected === 0 ? "#9ca3af" : "#ffffff",
            fontSize: 14,
            fontWeight: 700,
            cursor: totalSelected === 0 ? "not-allowed" : "pointer",
            boxShadow:
              totalSelected === 0
                ? "none"
                : "0 4px 14px rgba(249,115,22,0.45)",
            transition: "all 0.15s ease-out",
          }}
        >
          {t("candidate.confirm", { count: totalSelected })}
        </button>
      </footer>
    </div>
  );
}

