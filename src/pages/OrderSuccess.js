 import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  // ⭐ STEP 7A — Real-time listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "orders", orderId), (snap) => {
      if (snap.exists()) {
        setOrder(snap.data());
      }
    });

    return () => unsub();
  }, [orderId]);

  if (!order) return <h2 style={{ padding: 20 }}>Loading...</h2>;

  // ⭐ STEP 7C — Dynamic status colors
  const statusColors = {
    Preparing: "#ff9800",
    Ready: "#4caf50",
    Completed: "#1e88e5",
    Paid: "#673ab7",
  };

  const statusColor = statusColors[order.paymentStatus] || "#0366a6";

  return (
    <div style={{ padding: 30, maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ color: "#28a745" }}>🎉 Payment Successful</h1>

      <h3>Order ID: {orderId}</h3>
      <p>
        <b>Total Paid:</b> ₹{order.totalAmount}
      </p>

      {/* ⭐ STEP 7B — Live Status Block */}
      <div style={{ marginTop: 25 }}>
        <h3>Order Status</h3>

        <div
          style={{
            padding: 12,
            borderRadius: 10,
            border: `2px solid ${statusColor}`,
            background: "#ffffff",
            fontSize: 20,
            fontWeight: 700,
            color: statusColor,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          {order.paymentStatus}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Items</h3>
        <ul>
          {order.items && order.items.length > 0 ? (
            order.items.map((i, idx) => <li key={idx}>{i}</li>)
          ) : (
            <li>No items found</li>
          )}
        </ul>
      </div>

      <div style={{ marginTop: 20 }}>
        <b>Order Type:</b> {order.orderType}
      </div>

      {order.address && <div><b>Delivery Address:</b> {order.address}</div>}

      {order.slot && (
        <div>
          <b>Table Slot:</b> {order.date} at {order.slot}
        </div>
      )}

      <button
        onClick={() => (window.location.href = "/")}
        style={{
          marginTop: 30,
          padding: "12px 25px",
          borderRadius: 8,
          background: "#0366a6",
          color: "white",
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        Back to Home
      </button>
    </div>
  );
}
