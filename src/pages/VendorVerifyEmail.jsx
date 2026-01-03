import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

export default function VendorVerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Hooks MUST be at the top (unconditional)
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Data from VendorRegister
  const registrationData = location.state?.registrationData;

  // 🚫 Safety check AFTER hooks
  if (!registrationData) {
    return (
      <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
        <h3>Invalid access</h3>
        <p>Please start vendor registration again.</p>
        <Link to="/vendor/register">Go to Vendor Registration</Link>
      </div>
    );
  }

  function handleVerify(e) {
    e.preventDefault();
    setLoading(true);

    // UI-only verification
    setTimeout(() => {
      setLoading(false);
      navigate("/vendor/set-password", {
        state: { registrationData },
      });
    }, 1000);
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center", color: "#0366a6" }}>
        Verify Your Email
      </h2>

      <p style={{ textAlign: "center", fontSize: 13, color: "#555" }}>
        We’ve sent a 6-digit verification code to:
        <br />
        <b>{registrationData.email}</b>
      </p>

      <form
        onSubmit={handleVerify}
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
          marginTop: 20,
        }}
      >
        <label>Verification Code</label>
        <input
          type="text"
          placeholder="Enter 6-digit code"
          maxLength={6}
          inputMode="numeric"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, ""))
          }
          style={inputStyle}
          required
        />

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
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
          {loading ? "Verifying..." : "Verify Email"}
        </button>

        <div style={{ marginTop: 14, textAlign: "center", fontSize: 13 }}>
          Didn’t receive the code?{" "}
          <span
            style={{ color: "#0366a6", cursor: "pointer" }}
            onClick={() => alert("Resend code (UI only)")}
          >
            Resend code
          </span>
        </div>

        <div style={{ marginTop: 10, textAlign: "center", fontSize: 13 }}>
          Entered the wrong email?{" "}
          <Link to="/vendor/register">Change email</Link>
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 10,
  marginTop: 6,
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  textAlign: "center",
  fontSize: 18,
  letterSpacing: 4,
};
