// src/pages/VendorSetPassword.jsx
import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../utils/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function VendorSetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔑 Hooks MUST be declared unconditionally
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Registration data from previous steps
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

  const { shopName, ownerName, phone, email } = registrationData;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Create Firebase Auth vendor
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const vendorUser = userCredential.user;

      // 2️⃣ Create shop document
      const shopsCol = collection(db, "shops");

      await addDoc(shopsCol, {
        name: shopName,
        ownerName,
        phone,
        email,

        vendorUid: vendorUser.uid,
        ownerUid: vendorUser.uid,

        settings: {},
        createdAt: serverTimestamp(),
        active: true,
        menu: {},
      });

      // 3️⃣ Registration complete → go to login
      navigate("/vendor/login");
    } catch (err) {
      console.error("Final vendor registration failed:", err);

      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError("Failed to complete registration. Please try again.");
      }
    }

    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center", color: "#0366a6" }}>
        Set Your Password
      </h2>

      <p style={{ textAlign: "center", fontSize: 13, color: "#555" }}>
        Email verified successfully.
        <br />
        Create a password to complete your vendor registration.
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

        <label>Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <label>Confirm Password</label>
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
          {loading ? "Completing Registration..." : "Complete Registration"}
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
