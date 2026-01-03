// src/pages/VendorCheckEmail.jsx
import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { getAuth } from "firebase/auth";

export default function VendorCheckEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  // Data from VendorRegister
  const registrationData = location.state?.registrationData;

  // Safety check
  if (!registrationData) {
    return (
      <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
        <h3>Invalid access</h3>
        <p>Please start vendor registration again.</p>
        <Link to="/vendor/register">Go to Vendor Registration</Link>
      </div>
    );
  }

  async function handleCheckVerification() {
    setError("");
    setChecking(true);

    try {
      const user = auth.currentUser;

      if (!user) {
        setError("Session expired. Please register again.");
        setChecking(false);
        return;
      }

      // 🔄 Refresh user data from Firebase
      await user.reload();

      if (user.emailVerified) {
        navigate("/vendor/set-password", {
          state: {
            registrationData,
          },
        });
      } else {
        setError(
          "Email not verified yet. Please check your inbox and click the verification link."
        );
      }
    } catch (err) {
      console.error("Verification check failed:", err);
      setError("Failed to check verification. Please try again.");
    }

    setChecking(false);
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center", color: "#0366a6" }}>
        Verify Your Email
      </h2>

      <p style={{ textAlign: "center", fontSize: 13, color: "#555" }}>
        We’ve sent a verification link to:
        <br />
        <b>{registrationData.email}</b>
        <br />
        <br />
        Please open your email and click the verification link to continue.
      </p>

      {error && (
        <div style={{ color: "#c62828", marginTop: 10, textAlign: "center" }}>
          {error}
        </div>
      )}

      <button
        onClick={handleCheckVerification}
        disabled={checking}
        style={{
          marginTop: 20,
          width: "100%",
          background: "#0366a6",
          padding: "12px 16px",
          border: "none",
          borderRadius: 10,
          color: "white",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {checking ? "Checking..." : "I’ve verified my email"}
      </button>

      <div style={{ marginTop: 16, textAlign: "center", fontSize: 13 }}>
        Didn’t get the email? Check spam or{" "}
        <span
          style={{ color: "#0366a6", cursor: "pointer" }}
          onClick={() =>
            alert("Resend verification can be added later")
          }
        >
          resend link
        </span>
      </div>
    </div>
  );
}
