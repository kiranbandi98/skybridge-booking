// src/pages/VendorRegister.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

// 🔥 ADD FIRESTORE IMPORTS
import { db } from "../utils/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function VendorRegister() {
  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const auth = getAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 🔐 Firebase requires a password → use temporary random one
      const tempPassword = Math.random().toString(36).slice(-10);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        tempPassword
      );

      const user = userCredential.user;

      // 🔥 CREATE SHOP DOCUMENT IN FIRESTORE (THIS FIXES LOGIN ISSUE)
      await setDoc(doc(db, "shops", user.uid), {
        ownerUid: user.uid,
        shopName: form.shopName,
        ownerName: form.ownerName,
        phone: form.phone,
        email: form.email,
        createdAt: new Date(),
      });

      // 📧 Send verification email (LINK-BASED)
      await sendEmailVerification(user);

      // 👉 Move to "Check your email" screen
      navigate("/vendor/check-email");
    } catch (err) {
      console.error("Registration failed:", err);

      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError("Failed to register vendor. Please try again.");
      }
    }

    setLoading(false);
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
        {error && (
          <div style={{ color: "#c62828", marginBottom: 10 }}>
            {error}
          </div>
        )}

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
          disabled={loading}
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
          {loading ? "Sending verification email..." : "Verify Email"}
        </button>

        <p style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
          We’ll send a verification link to your email.
          You must verify before setting a password.
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
