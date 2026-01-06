// src/pages/VendorCheckEmail.js
import React from "react";
import { useNavigate } from "react-router-dom";

export default function VendorCheckEmail() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 500, margin: "60px auto", textAlign: "center" }}>
      <h2 style={{ color: "#0366a6" }}>Verify Your Email</h2>

      <p style={{ marginTop: 20 }}>
        We have sent a verification link to your email address.
      </p>

      <p>
        Please open your Gmail, click the <b>Verify Email</b> link,
        then come back and log in.
      </p>

      <p style={{ fontSize: 13, color: "#666", marginTop: 10 }}>
        (Check Spam folder if you don’t see the email.)
      </p>

      <button
        onClick={() => navigate("/vendor/login")}
        style={{
          marginTop: 30,
          padding: "12px 20px",
          background: "#0366a6",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        I have verified my email → Login
      </button>
    </div>
  );
}
