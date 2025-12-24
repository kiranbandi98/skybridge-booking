// src/pages/TrackOrder.js
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../utils/firebase";
import { doc, onSnapshot } from "firebase/firestore";

/* -----------------------------------------
   Customer Navbar
----------------------------------------- */
function Navbar({ shopId }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#fff",
        padding: "12px 16px",
        borderRadius: 10,
        marginBottom: 20,
        boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 18 }}>Track Order</div>

      <div style={{ display: "flex", gap: 12 }}>
        <Link to={`/shop/${shopId}`} style={navBtn}>
          Menu
        </Link>
      </div>
    </div>
  );
}

const navBtn = {
  textDecoration: "none",
  background: "#0366d6",
  color: "white",
  padding: "8px 14px",
  borderRadius: 8,
  fontWeight: 700,
};

/* -----------------------------------------
   Track Order Page
----------------------------------------- */
export default function TrackOrder() {
  const { shopId, orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------- REALTIME LISTENER (HOOK MUST COME FIRST) ---------- */
  useEffect(() => {
    if (!shopId || !orderId) return;

    const orderRef = doc(db, "shops", shopId, "orders", orderId);

    const unsubscribe = onSnapshot(orderRef, (snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() });
      } else {
        setOrder(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shopId, orderId]);

  /* ---------- SAFETY RETURN (AFTER HOOKS) ---------- */
  if (!shopId || !orderId) {
    return (
      <p style={{ padding: 20 }}>
        Invalid order link. Please open from order confirmation page.
      </p>
    );
  }

  if (loading) {
    return <p style={{ padding: 20 }}>Loading order…</p>;
  }

  if (!order) {
    return <p style={{ padding: 20 }}>Order not found.</p>;
  }

  /* ---------- FORMAT DATE ---------- */
  function formatDate(ts) {
    try {
      return ts?.toDate().toLocaleString();
    } catch {
      return "";
    }
  }

  /* ---------- ORDER STATUS ---------- */
  const steps = ["Order Placed", "Preparing", "Ready", "Completed"];
  const status = (order.paymentStatus || "placed").toLowerCase();

  const getActiveIndex = () => {
    if (status.includes("placed")) return 0;
    if (status.includes("prepar")) return 1;
    if (status.includes("ready")) return 2;
    if (status.includes("complete")) return 3;
    return 0;
  };

  const activeIndex = getActiveIndex();

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
      <Navbar shopId={shopId} />

      <h2>Track My Order</h2>

      <p><b>Order ID:</b> {orderId}</p>
      <p><b>Total Paid:</b> ₹{order.totalAmount}</p>
      <p><b>Name:</b> {order.customerName}</p>
      <p><b>Phone:</b> {order.phone}</p>
      <p><b>Address:</b> {order.address}</p>
      <p><b>Ordered At:</b> {formatDate(order.createdAt)}</p>

      {/* ---------- STATUS TIMELINE ---------- */}
      <div style={{ marginTop: 30 }}>
        {steps.map((step, index) => {
          const done = index <= activeIndex;
          return (
            <div
              key={step}
              style={{
                padding: 12,
                marginBottom: 10,
                borderRadius: 8,
                background: done ? "#4caf50" : "#ddd",
                color: done ? "white" : "#555",
                fontWeight: "bold",
              }}
            >
              {done ? "✔ " : "• "} {step}
            </div>
          );
        })}
      </div>

      {/* ---------- ITEMS ---------- */}
      <div style={{ marginTop: 30 }}>
        <h3>Items</h3>
        <ul>
          {order.items?.map((item, idx) => (
            <li key={idx}>
              {item.name} × {item.qty || 1} — ₹
              {(item.price || 0) * (item.qty || 1)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
