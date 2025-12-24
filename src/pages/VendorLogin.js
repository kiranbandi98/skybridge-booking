// src/pages/VendorLogin.js
import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

// 🔥 ADD THESE IMPORTS
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

      // 1️⃣ Sign in vendor
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // 2️⃣ Find shop that belongs to this vendor
      const q = query(
        collection(db, "shops"),
        where("ownerUid", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("No shop found for this vendor.");
        setLoading(false);
        return;
      }

      // 3️⃣ Redirect to vendor dashboard (auto)
      const shopDoc = snapshot.docs[0];
      const shopId = shopDoc.id;

      navigate(`/vendor/${shopId}`);

    } catch (err) {
      console.error("Vendor login failed:", err);

      if (err.code === "auth/user-not-found") {
        setError("No vendor found with this email");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password");
      } else {
        setError("Invalid email or password");
      }
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center", color: "#0366a6" }}>
        Vendor Login
      </h2>

      <form
        onSubmit={handleLogin}
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 10,
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      >
        {error && (
          <div style={{ color: "#c62828", marginBottom: 12 }}>
            {error}
          </div>
        )}

        <label>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label>Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 12,
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

        <div style={{ marginTop: 12, textAlign: "center" }}>
          <small>
            Don’t have a shop?{" "}
            <Link to="/vendor/register">Register your shop</Link>
          </small>
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
