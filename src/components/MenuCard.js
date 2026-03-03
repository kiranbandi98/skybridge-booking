import React from "react";

export default function MenuCard({
  item,
  shopActive,
  addedId,
  handleAdd,
}) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        height: 240,
        boxShadow: "0 8px 22px rgba(0,0,0,0.15)",
        transition: "all 0.3s ease",
      }}
    >
      {/* Background Image */}
      <img
        src={item.imageUrl || item.img || "https://via.placeholder.com/300"}
        alt={item.name}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: item.inStock === false ? "blur(2px)" : "none",
          opacity: item.inStock === false ? 0.7 : 1,
          transition: "all 0.3s ease",
        }}
      />

      {/* Veg / Non-Veg Badge */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background:
            item.category === "nonveg" ? "#dc3545" : "#28a745",
          color: "#fff",
          padding: "4px 10px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          zIndex: 2,
        }}
      >
        {item.category === "nonveg" ? "Non-Veg" : "Veg"}
      </div>

      {/* OUT OF STOCK */}
      {item.inStock === false && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "#dc3545",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            zIndex: 3,
            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
          }}
        >
          OUT OF STOCK
        </div>
      )}

      {/* Dark Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.15))",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {item.name}
          </div>
          <div style={{ marginTop: 4, fontWeight: 600 }}>
            ₹{item.price}
          </div>
        </div>

        <button
          onClick={() => handleAdd(item)}
          disabled={!shopActive || item.inStock === false}
          style={{
            background:
              item.inStock === false
                ? "#aaa"
                : addedId === item.id
                ? "#2ecc71"
                : "#ffb400",
            color: "#000",
            padding: "8px 14px",
            borderRadius: 12,
            border: "none",
            fontWeight: 700,
            cursor:
              shopActive && item.inStock !== false
                ? "pointer"
                : "not-allowed",
            transition: "all 0.2s ease",
          }}
        >
          {item.inStock === false
            ? "Unavailable"
            : addedId === item.id
            ? "Added ✓"
            : "Add"}
        </button>
      </div>
    </div>
  );
}