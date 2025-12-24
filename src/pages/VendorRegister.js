// src/pages/VendorRegister.js
import React, { useState } from "react";
import { db } from "../utils/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";

// Firebase Authentication
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

export default function VendorRegister() {
  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    email: "",
    password: "",
    upi: "",
  });

  const [loading, setLoading] = useState(false);
  const [createdShop, setCreatedShop] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1️⃣ Create Firebase Auth Vendor User
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const vendorUser = userCredential.user;

      // 2️⃣ Create Shop Document in Firestore
      const shopsCol = collection(db, "shops");

      const docRef = await addDoc(shopsCol, {
        name: form.shopName,
        ownerName: form.ownerName,
        phone: form.phone,
        email: form.email,

        vendorUid: vendorUser.uid, // existing field
        ownerUid: vendorUser.uid,  // ✅ ADDED (required for login redirect)

        settings: {
          upi: form.upi,
        },

        createdAt: serverTimestamp(),
        active: true,
        menu: {},
      });

      // Save shop info for success screen
      setCreatedShop({
        id: docRef.id,
        ...form,
      });

    } catch (err) {
      console.error("Vendor registration failed:", err);
      alert("Vendor registration failed. See console for details.");
    }

    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: "30px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center", color: "#0366a6" }}>
        Vendor Registration
      </h2>

      {!createdShop && (
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
            value={form.shopName}
            onChange={(e) =>
              setForm({ ...form, shopName: e.target.value })
            }
            style={inputStyle}
          />

          <label>Owner Name</label>
          <input
            required
            value={form.ownerName}
            onChange={(e) =>
              setForm({ ...form, ownerName: e.target.value })
            }
            style={inputStyle}
          />

          <label>Phone</label>
          <input
            required
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
            style={inputStyle}
          />

          <label>Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            style={inputStyle}
          />

          <label>Password</label>
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            style={inputStyle}
          />

          <label>UPI ID (optional)</label>
          <input
            value={form.upi}
            onChange={(e) => setForm({ ...form, upi: e.target.value })}
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
            {loading ? "Creating Shop..." : "Create Shop"}
          </button>
        </form>
      )}

      {createdShop && (
        <div
          style={{
            marginTop: 30,
            background: "#fff",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <h3>Shop Created Successfully 🎉</h3>

          <p>
            <b>Shop ID:</b> {createdShop.id}
          </p>

          <p>Share this QR code with customers:</p>

          <div
            style={{
              display: "inline-block",
              background: "#fff",
              padding: 10,
              borderRadius: 8,
            }}
          >
            <QRCodeCanvas
              value={`${window.location.origin}/menu/${createdShop.id}`}
              size={200}
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => navigate(`/vendor/${createdShop.id}`)}
              style={{
                background: "#28a745",
                padding: "10px 16px",
                color: "white",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Go to Vendor Dashboard
            </button>
          </div>
        </div>
      )}
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
