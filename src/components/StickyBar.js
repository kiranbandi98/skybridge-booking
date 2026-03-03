import React from "react";

export default function StickyBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  availableCategories,
  scrollToCategory,
}) {
  return (
    <>
      {/* 🧲 STICKY SEARCH BAR */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#fff",
          paddingTop: 10,
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        }}
      >
        {/* 🔍 SEARCH */}
        <div style={{ position: "relative", margin: "12px 0 20px" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6c757d",
              fontSize: 16,
            }}
          >
            🔍
          </span>

          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 36px",
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 14,
            }}
          />

          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                fontSize: 16,
                cursor: "pointer",
                color: "#999",
              }}
              aria-label="Clear search"
            >
              ❌
            </button>
          )}
        </div>
      </div>

      {/* 🏷 CATEGORY FILTER */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["all", "veg", "nonveg", "drinks"]
          .filter((cat) => cat === "all" || availableCategories[cat])
          .map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                if (cat !== "all") scrollToCategory(cat);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "1px solid #ccc",
                background:
                  selectedCategory === cat ? "#0d6efd" : "#f8f9fa",
                color:
                  selectedCategory === cat ? "white" : "#333",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {cat === "all"
                ? "All"
                : cat === "veg"
                ? "Veg"
                : cat === "nonveg"
                ? "Non-Veg"
                : "Drinks"}
            </button>
          ))}
      </div>
    </>
  );
}