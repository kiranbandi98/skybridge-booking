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

    if (!user) {
      // No logged-in user → go back to register
      navigate("/vendor/register");
      return;
    }

    setEmail(user.email);
  }, [auth, navigate]);

  // Optional resend (use carefully)
  const handleResend = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);
      await sendEmailVerification(user);
      setMessage(
        "Verification email resent. Please check Inbox or Spam folder."
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

      <p style={{ textAlign: "center", fontSize: 14 }}>
        We’ve sent a verification link to:
        <br />
        <b>{email}</b>
      </p>

      <p style={{ textAlign: "center", fontSize: 13, color: "#555" }}>
        After verifying your email, you must set your password before logging in.
      </p>

      <p style={{ textAlign: "center", fontSize: 13, color: "#777" }}>
        👉 On the login page, click <b>“Forgot your password”</b> to set it.
      </p>

      <button
        onClick={() => navigate("/vendor/login")}
        style={primaryButton}
      >
        Continue to Login
      </button>

      <p style={{ textAlign: "center", marginTop: 18, fontSize: 13 }}>
        Didn’t get the email?
      </p>

      <button
        onClick={handleResend}
        disabled={loading}
        style={secondaryButton}
      >
        {loading ? "Resending..." : "Resend verification email"}
      </button>

      {message && (
        <p style={{ marginTop: 12, textAlign: "center", fontSize: 13 }}>
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
