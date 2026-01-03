// src/pages/VendorLogin.js
import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

import { db } from "../utils/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function VendorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const auth = getAuth();

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // ✅ BLOCK LOGIN IF EMAIL NOT VERIFIED
      if (!user.emailVerified) {
        await auth.signOut();
        setError("Please verify your email before logging in.");
        setLoading(false);
        return;
      }

      // 🔍 Find vendor shop
      const q = query(
        collection(db, "shops"),
        where("ownerUid", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("No shop found for this vendor account.");
        setLoading(false);
        return;
      }

      const shopDoc = snapshot.docs[0];
      const shopId = shopDoc.id;

      navigate(`/vendor/${shopId}`);
    } catch (err) {
      console.error("Vendor login failed:", err);

      if (err.code === "auth/user-not-found") {
        setError("No vendor account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else {
        setError("Unable to login. Please check your details.");
      }
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center", color: "#0366a6", marginBottom: 6 }}>
        Vendor Login
      </h2>

      <p style={{ textAlign: "center", fontSize: 13, color: "#555" }}>
        Login using your registered email and password
      </p>

      <form
        onSubmit={handleLogin}
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 10,
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
          marginTop: 20,
        }}
      >
        {error && (
          <div style={{ color: "#c62828", marginBottom: 12 }}>
            {error}
          </div>
        )}

        <label>Email address</label>
        <input
          type="email"
          placeholder="your@email.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <div style={{ textAlign: "right", marginBottom: 10 }}>
          <small>
            <Link to="/vendor/forgot-password">
              Forgot your password?
            </Link>
          </small>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 6,
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
          {loading ? "Logging in…" : "Login"}
        </button>

        <div style={{ marginTop: 14, textAlign: "center" }}>
          <small>
            Don’t have a vendor account?{" "}
            <Link to="/vendor/register">Register your shop</Link>
          </small>
        </div>

        <div
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "#777",
            textAlign: "center",
          }}
        >
          Email verification is required before login.
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
};
