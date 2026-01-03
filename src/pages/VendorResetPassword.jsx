// src/pages/VendorResetPassword.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function VendorResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // 🔒 UI ONLY — real reset logic will be added later
    setTimeout(() => {
      setLoading(false);
      navigate("/vendor/login");
    }, 1000);
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center", color: "#0366a6" }}>
        Reset Password
      </h2>

      <p style={{ textAlign: "center", fontSize: 13, color: "#555" }}>
        Create a new password for your vendor account.
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
        {error && (
          <div style={{ color: "#c62828", marginBottom: 10 }}>
            {error}
          </div>
        )}

        <label>New Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <label>Confirm New Password</label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? "Updating..." : "Reset Password"}
        </button>

        <div style={{ marginTop: 16, textAlign: "center", fontSize: 13 }}>
          <Link to="/vendor/login">Back to Login</Link>
        </div>
      </form>
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
