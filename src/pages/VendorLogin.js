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

      // 🔒 BLOCK IF EMAIL NOT VERIFIED
      if (!res.user.emailVerified) {
        setMessage("Please verify your email before logging in.");
        return;
      }

      // 🔍 FIND SHOP (CORRECT COLLECTION)
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
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
      <h2>Vendor Login</h2>

      {message && <p>{message}</p>}

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 10 }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p style={{ marginTop: 10 }}>
        <a href="#/vendor/reset-password">Forgot your password?</a>
      </p>

      <p>
        Don’t have a vendor account?{" "}
        <a href="#/vendor/register">Register your shop</a>
      </p>
    </div>
  );
}
