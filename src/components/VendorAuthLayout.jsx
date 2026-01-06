import React from "react";

export default function VendorAuthLayout({ title, subtitle, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 420,
          background: "#fff",
          padding: 28,
          borderRadius: 14,
          boxShadow: "0 10px 28px rgba(0,0,0,0.12)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#0366a6",
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          {title}
        </h2>

        {subtitle && (
          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: "#666",
              marginBottom: 20,
            }}
          >
            {subtitle}
          </p>
        )}

        {children}
      </div>
    </div>
  );
}
