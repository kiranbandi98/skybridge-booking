// src/pages/VendorLogin.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";

export default function VendorLogin() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      setLoading(true);

      const res = await signInWithEmailAndPassword(auth, email, password);
      await res.user.reload();

      if (!res.user.emailVerified) {
        setMessage("Please verify your email before logging in.");
        return;
      }

      const shopRef = doc(db, "shops", res.user.uid);
      const snap = await getDoc(shopRef);

      if (!snap.exists()) {
        setMessage("Shop not found for this account.");
        return;
      }

      navigate(`/vendor/shop/${res.user.uid}`);
    } catch {
      setMessage("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f6f8",
      }}
    >
      <div
        style={{
          width: 420,
          background: "#fff",
          padding: 30,
          borderRadius: 10,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: 20,
            color: "#0a66c2",
          }}
        >
          Vendor Login
        </h2>

        {message && (
          <p style={{ color: "red", marginBottom: 10, textAlign: "center" }}>
            {message}
          </p>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: 12,
              borderRadius: 6,
              border: "1px solid #ccc",
              fontSize: 14,
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: 16,
              borderRadius: 6,
              border: "1px solid #ccc",
              fontSize: 14,
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: "#0a66c2",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={{ marginTop: 15, textAlign: "center" }}>
          <a
            href="#/vendor/reset-password"
            style={{ color: "#0a66c2", textDecoration: "none" }}
          >
            Forgot your password?
          </a>
        </div>

        <div style={{ marginTop: 10, textAlign: "center" }}>
          Don’t have a vendor account?{" "}
          <a
            href="#/vendor/register"
            style={{ color: "#0a66c2", textDecoration: "none", fontWeight: 600 }}
          >
            Register your shop
          </a>
        </div>
      </div>
    </div>
  );
}
