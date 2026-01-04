// src/pages/VendorResetPassword.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function VendorResetPassword() {
  const navigate = useNavigate();

  useEffect(() => {
    // Firebase already handled password reset.
    // Just redirect user to login after a short delay.
    const timer = setTimeout(() => {
      navigate("/vendor/login");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 20, textAlign: "center" }}>
      <h2 style={{ color: "#0366a6" }}>Password Updated</h2>

      <p style={{ fontSize: 14, color: "#555", marginTop: 10 }}>
        Your password has been successfully updated.
      </p>

      <p style={{ fontSize: 13, color: "#777" }}>
        Redirecting you to login...
      </p>
    </div>
  );
}
