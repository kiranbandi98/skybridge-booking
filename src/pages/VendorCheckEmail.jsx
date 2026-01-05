// src/pages/VendorCheckEmail.jsx
import React, { useEffect, useState } from "react";
import { getAuth, sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function VendorCheckEmail() {
  const auth = getAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const user = auth.currentUser;

    if (user?.email) {
      setEmail(user.email);
    }
  }, [auth]);

  const handleResend = async () => {
    const user = auth.currentUser;
    if (!user) {
      setMessage("Please login again to resend verification email.");
      return;
    }

    try {
      setLoading(true);
      await sendEmailVerification(user);
      setMessage(
        "Verification email resent. Please check your inbox or spam folder."
      );
    } catch (err) {
      console.error("Resend failed:", err);
      setMessage("Too many requests. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center", color: "#0366a6" }}>
        Verify Your Email
      </h2>

      <p style={{ textAlign: "center", fontSize: 14, color: "#555" }}>
        We’ve sent a verification link to:
        <br />
        <b>{email || "your email address"}</b>
      </p>

      <p style={{ textAlign: "center", fontSize: 13, color: "#666" }}>
        Please verify your email before logging in.
      </p>

      <button
        onClick={() => navigate("/vendor/login")}
        style={primaryButton}
      >
        Go to Login
      </button>

      <p style={{ textAlign: "center", marginTop: 18, fontSize: 13 }}>
        Didn’t receive the email?
      </p>

      <button
        onClick={handleResend}
        disabled={loading}
        style={secondaryButton}
      >
        {loading ? "Resending..." : "Resend Verification Email"}
      </button>

      {message && (
        <p
          style={{
            marginTop: 12,
            textAlign: "center",
            fontSize: 13,
            color: "#2e7d32",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

const primaryButton = {
  width: "100%",
  padding: "12px",
  background: "#0366a6",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 20,
};

const secondaryButton = {
  width: "100%",
  padding: "10px",
  background: "#eee",
  border: "1px solid #ccc",
  borderRadius: 8,
  cursor: "pointer",
};
