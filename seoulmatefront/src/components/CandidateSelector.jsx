// components/CandidateSelector.jsx
// 후보 장소를 카테고리별로 표시하고 사용자가 선택할 수 있는 컴포넌트

import React, { useState, useMemo } from "react";

/**
 * 단일 POI 카드 컴포넌트
 */
const POICard = ({ poi, isSelected, onToggle, selectionMode = "multiple" }) => {
  const scoreDisplay = poi._score ? poi._score.toFixed(1) : "-";
  const categoryIcon = {
    restaurant: "🍽️",
    cafe: "☕",
    poi: "📍",
    attraction: "🏛️",
  }[poi.categoryType] || "📍";

  return (
    <div
      onClick={() => onToggle(poi)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 10,
        border: isSelected ? "2px solid #FF6B6B" : "1px solid #e0e0e0",
        backgroundColor: isSelected ? "#FFF5F5" : "#fff",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {/* 선택 표시 */}
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: selectionMode === "single" ? "50%" : 4,
          border: isSelected ? "2px solid #FF6B6B" : "2px solid #ccc",
          backgroundColor: isSelected ? "#FF6B6B" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isSelected && (
          <span style={{ color: "#fff", fontSize: 14 }}>✓</span>
        )}
      </div>

      {/* 카테고리 아이콘 */}
      <span style={{ fontSize: 20 }}>{categoryIcon}</span>

      {/* 장소 정보 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          dangerouslySetInnerHTML={{ __html: poi.title || poi.name }}
        />
        <div
          style={{
            fontSize: 12,
            color: "#666",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {poi.category || poi.categoryType}
        </div>
      </div>

      {/* 점수 */}
      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "4px 8px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          color: "#666",
        }}
      >
        ⭐ {scoreDisplay}
      </div>
    </div>
  );
};

/**
 * 카테고리 섹션 컴포넌트
 */
const CategorySection = ({
  title,
  icon,
  pois,
  selectedIds,
  onToggle,
  selectionMode = "multiple",
  maxSelection = null,
  description = "",
}) => {
  const selectedCount = pois.filter((p) => selectedIds.has(p.id || p.title)).length;

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
            {maxSelection ? `, 최대 ${maxSelection}개` : ""})
          </span>
        </div>
      </div>

      {/* 설명 */}
      {description && (
        <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>
          {description}
        </p>
      )}

      {/* POI 리스트 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pois.length === 0 ? (
          <div style={{ color: "#999", fontSize: 14, padding: 12 }}>
            검색 결과가 없습니다.
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

/**
 * 메인 후보 선택 컴포넌트
 */
export default function CandidateSelector({
  candidates = [],
  onConfirm,
  onCancel,
  mealOptions = { breakfast: false, lunch: true, dinner: true, cafe: true },
  t = (key) => key, // i18n 함수
}) {
  // 선택된 POI ID들
  const [selectedAttractions, setSelectedAttractions] = useState(new Set());
  const [selectedLunch, setSelectedLunch] = useState(null);
  const [selectedDinner, setSelectedDinner] = useState(null);
  const [selectedCafe, setSelectedCafe] = useState(null);

  // POI 카테고리별 분류
  const categorized = useMemo(() => {
    const result = {
      attractions: [],
      restaurants: [],
      cafes: [],
    };

    for (const poi of candidates) {
      const id = poi.id || poi.title;
      const type = poi.categoryType || "poi";

      const enrichedPoi = { ...poi, id };

      if (type === "restaurant") {
        result.restaurants.push(enrichedPoi);
      } else if (type === "cafe") {
        result.cafes.push(enrichedPoi);
      } else {
        result.attractions.push(enrichedPoi);
      }
    }

    return result;
  }, [candidates]);

  // 관광지 토글
  const toggleAttraction = (poi) => {
    const id = poi.id || poi.title;
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

  // 식당 선택 (점심)
  const selectLunch = (poi) => {
    const id = poi.id || poi.title;
    setSelectedLunch((prev) => (prev === id ? null : id));
  };

  // 식당 선택 (저녁)
  const selectDinner = (poi) => {
    const id = poi.id || poi.title;
    setSelectedDinner((prev) => (prev === id ? null : id));
  };

  // 카페 선택
  const selectCafe = (poi) => {
    const id = poi.id || poi.title;
    setSelectedCafe((prev) => (prev === id ? null : id));
  };

  // 선택 완료 핸들러
  const handleConfirm = () => {
    const selected = [];

    // 선택된 관광지 추가
    categorized.attractions.forEach((poi) => {
      if (selectedAttractions.has(poi.id)) {
        selected.push({ ...poi, slotType: "attraction" });
      }
    });

    // 선택된 점심 추가
    if (mealOptions.lunch && selectedLunch) {
      const lunch = categorized.restaurants.find((p) => p.id === selectedLunch);
      if (lunch) selected.push({ ...lunch, slotType: "lunch" });
    }

    // 선택된 저녁 추가
    if (mealOptions.dinner && selectedDinner) {
      const dinner = categorized.restaurants.find((p) => p.id === selectedDinner);
      if (dinner) selected.push({ ...dinner, slotType: "dinner" });
    }

    // 선택된 카페 추가
    if (mealOptions.cafe && selectedCafe) {
      const cafe = categorized.cafes.find((p) => p.id === selectedCafe);
      if (cafe) selected.push({ ...cafe, slotType: "cafe" });
    }

    onConfirm(selected);
  };

  // 선택된 총 개수
  const totalSelected =
    selectedAttractions.size +
    (selectedLunch ? 1 : 0) +
    (selectedDinner ? 1 : 0) +
    (selectedCafe ? 1 : 0);

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        maxHeight: "70vh",
        overflowY: "auto",
      }}
    >
      {/* 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          🗺️ 방문할 장소를 선택하세요
        </h2>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "#666" }}>
          추천된 장소 중 원하는 곳을 선택하면 일정을 생성합니다.
        </p>
      </div>

      {/* 관광지 섹션 */}
      <CategorySection
        title="관광지"
        icon="🏛️"
        pois={categorized.attractions}
        selectedIds={selectedAttractions}
        onToggle={toggleAttraction}
        selectionMode="multiple"
        description="여러 개 선택 가능"
      />

      {/* 점심 식당 섹션 */}
      {mealOptions.lunch && (
        <CategorySection
          title="점심 식당"
          icon="🍽️"
          pois={categorized.restaurants}
          selectedIds={new Set(selectedLunch ? [selectedLunch] : [])}
          onToggle={selectLunch}
          selectionMode="single"
          maxSelection={1}
          description="1개 선택"
        />
      )}

      {/* 저녁 식당 섹션 */}
      {mealOptions.dinner && (
        <CategorySection
          title="저녁 식당"
          icon="🍽️"
          pois={categorized.restaurants}
          selectedIds={new Set(selectedDinner ? [selectedDinner] : [])}
          onToggle={selectDinner}
          selectionMode="single"
          maxSelection={1}
          description="1개 선택 (점심과 다른 곳 추천)"
        />
      )}

      {/* 카페 섹션 */}
      {mealOptions.cafe && (
        <CategorySection
          title="카페"
          icon="☕"
          pois={categorized.cafes}
          selectedIds={new Set(selectedCafe ? [selectedCafe] : [])}
          onToggle={selectCafe}
          selectionMode="single"
          maxSelection={1}
          description="1개 선택"
        />
      )}

      {/* 하단 버튼 */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid #eee",
        }}
      >
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "14px 0",
            borderRadius: 10,
            border: "1px solid #ddd",
            backgroundColor: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          취소
        </button>
        <button
          onClick={handleConfirm}
          disabled={totalSelected === 0}
          style={{
            flex: 2,
            padding: "14px 0",
            borderRadius: 10,
            border: "none",
            backgroundColor: totalSelected > 0 ? "#FF6B6B" : "#ccc",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: totalSelected > 0 ? "pointer" : "not-allowed",
          }}
        >
          선택 완료 ({totalSelected}개) → 일정 생성
        </button>
      </div>
    </div>
  );
}
