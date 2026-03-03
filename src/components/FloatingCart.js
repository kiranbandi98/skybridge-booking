import React from "react";
import { Link } from "react-router-dom";

export default function FloatingCart({
  totalItems,
  cartTotal,
  shopId,
  search,
}) {
  if (totalItems <= 0) return null;

  return (
    <Link to={`/cart/${shopId}${search}`}>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#111",
          color: "#fff",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.25)",
          cursor: "pointer",
          zIndex: 50,
          transform: "translateY(0)",
          transition: "transform 0.3s ease, opacity 0.3s ease",
          opacity: 1,
        }}
      >
        <div style={{ fontWeight: 600 }}>
          🛒 {totalItems} item{totalItems > 1 ? "s" : ""} | ₹{cartTotal}
        </div>

        <div
          style={{
            background: "#0d6efd",
            padding: "8px 16px",
            borderRadius: 20,
            fontWeight: 700,
          }}
        >
          View Cart →
        </div>
      </div>
    </Link>
  );
}