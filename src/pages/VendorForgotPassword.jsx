// src/pages/VendorForgotPassword.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function VendorForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // 🔒 UI ONLY — real reset logic will be added later
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center", color: "#0366a6" }}>
        Forgot Password
      </h2>

      {!submitted ? (
        <>
          <p style={{ textAlign: "center", fontSize: 13, color: "#555" }}>
            Enter your registered email address.
            <br />
            We’ll send you instructions to reset your password.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 12,
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
              marginTop: 20,
            }}
          >
            <label>Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 14,
                width: "100%",
                background: "#0366a6",
                padding: "10px 12px",
                border: "none",
                borderRadius: 8,
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {loading ? "Sending..." : "Send Reset Instructions"}
            </button>
          </form>
        </>
      ) : (
        <div
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            marginTop: 20,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, color: "#333" }}>
            If an account exists with this email,
            <br />
            you will receive password reset instructions shortly.
          </p>

          <div style={{ marginTop: 16 }}>
            <Link to="/vendor/login">Back to Login</Link>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 10,
  marginTop: 6,
  marginBottom: 12,
  borderRadius: 8,
  border: "1px solid #ccc",
};
