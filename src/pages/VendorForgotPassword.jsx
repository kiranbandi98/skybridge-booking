// src/pages/VendorForgotPassword.jsx
import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export default function VendorForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent. Please check your inbox.");
    } catch (err) {
      console.error(err);
      setError("Failed to send reset email. Please check the email address.");
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center", color: "#0366a6" }}>
        Forgot Password
      </h2>

      <form
        onSubmit={handleReset}
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        {message && (
          <p style={{ color: "green", fontSize: 13 }}>{message}</p>
        )}
        {error && (
          <p style={{ color: "red", fontSize: 13 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "#0366a6",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
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
