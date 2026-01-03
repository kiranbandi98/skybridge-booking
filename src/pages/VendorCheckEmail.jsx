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

  const handleResend = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);
      await sendEmailVerification(user);
      setMessage("Verification email resent. Please check your inbox or spam.");
    } catch (err) {
      console.error("Resend failed:", err);
      setMessage("Failed to resend email. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = async () => {
    const user = auth.currentUser;
    if (!user) return;

    await user.reload();

    if (user.emailVerified) {
      navigate("/vendor/set-password");
    } else {
      alert("Email not verified yet. Please click the link in your email.");
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

      <button
        onClick={handleVerified}
        style={primaryButton}
      >
        I’ve verified my email
      </button>

      <p style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
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
};

const secondaryButton = {
  width: "100%",
  padding: "10px",
  background: "#eee",
  border: "1px solid #ccc",
  borderRadius: 8,
  cursor: "pointer",
};
