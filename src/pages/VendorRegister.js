// src/pages/VendorRegister.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VendorRegister() {
  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    email: "",
  });

  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();

    // ✅ OPTION B – EMAIL FIRST
    // No password
    // No Firebase auth
    // No shop creation
    // Only move to email verification

    navigate("/vendor/verify-email", {
      state: {
        registrationData: form,
      },
    });
  }

  return (
    <div style={{ maxWidth: 600, margin: "30px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center", color: "#0366a6" }}>
        Vendor Registration
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      >
        <label>Shop Name</label>
        <input
          required
          placeholder="Enter shop name"
          value={form.shopName}
          onChange={(e) =>
            setForm({
              ...form,
              shopName: e.target.value.replace(/[^A-Za-z ]/g, ""),
            })
          }
          style={inputStyle}
        />

        <label>Owner Name</label>
        <input
          required
          placeholder="Enter owner name"
          value={form.ownerName}
          onChange={(e) =>
            setForm({
              ...form,
              ownerName: e.target.value.replace(/[^A-Za-z ]/g, ""),
            })
          }
          style={inputStyle}
        />

        <label>Phone Number</label>
        <input
          required
          type="tel"
          placeholder="10-digit Indian mobile number"
          maxLength={10}
          inputMode="numeric"
          value={form.phone}
          onChange={(e) =>
            setForm({
              ...form,
              phone: e.target.value.replace(/\D/g, ""),
            })
          }
          style={inputStyle}
        />

        <label>Email</label>
        <input
          required
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          style={inputStyle}
        />

        <button
          type="submit"
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
          Verify Email
        </button>

        <p style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
          You must verify your email before creating a password and completing
          registration.
        </p>
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
