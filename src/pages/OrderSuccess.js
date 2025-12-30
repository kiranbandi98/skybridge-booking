// src/pages/OrderSuccess.js
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../utils/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function OrderSuccess() {
  // ✅ MULTI-VENDOR PARAMS
  const { shopId, orderId } = useParams();
  const [order, setOrder] = useState(null);

  // 🔥 Listen to order inside correct shop
  useEffect(() => {
    if (!shopId || !orderId) return;

    const unsub = onSnapshot(
      doc(db, "shops", shopId, "orders", orderId),
      (snap) => {
        if (snap.exists()) {
          setOrder(snap.data());
        }
      }
    );

    return () => unsub();
  }, [shopId, orderId]);

  if (!order) return <h2 style={{ padding: 20 }}>Loading...</h2>;

  // 🎨 Status colors
  const statusColors = {
    Placed: "#ff9800",
    Preparing: "#ff9800",
    Ready: "#4caf50",
    Completed: "#1e88e5",
    Paid: "#673ab7",
  };

  const statusColor = statusColors[order.orderStatus] || "#0366a6";

  return (
    <div style={{ padding: 30, maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ color: "#28a745" }}>🎉 Payment Successful</h1>

      <h3>Order ID: {orderId}</h3>

      <p>
        <b>Total Paid:</b> ₹{order.totalAmount}
      </p>

      {/* ✅ Order Status */}
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
          {order.orderStatus || "Placed"}
        </div>
      </div>

      {/* ✅ Items */}
      <div style={{ marginTop: 20 }}>
        <h3>Items</h3>

        {order.items && order.items.length > 0 ? (
          order.items.map((item, index) => (
            <div
              key={index}
              style={{
                padding: 10,
                borderBottom: "1px solid #ddd",
              }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>
                {item.name} × {item.qty || 1}
              </p>
              <p style={{ margin: 0 }}>
                ₹{item.price} each — ₹{(item.price || 0) * (item.qty || 1)}
              </p>
            </div>
          ))
        ) : (
          <p>No items found</p>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <b>Order Type:</b> {order.orderType}
      </div>

      {order.address && (
        <div style={{ marginTop: 10 }}>
          <b>Delivery Address:</b> {order.address}
        </div>
      )}

      {/* ✅ Track Order */}
      <div style={{ marginTop: 25 }}>
        <Link
          to={`/track/${shopId}/${orderId}`}
          style={{
            padding: "12px 25px",
            borderRadius: 8,
            background: "#ff9800",
            color: "white",
            cursor: "pointer",
            fontSize: 16,
            textDecoration: "none",
            marginRight: 10,
            display: "inline-block",
          }}
        >
          Track My Order
        </Link>
      </div>

      {/* ✅ BACK TO MENU (FIXED — HASHROUTER SAFE) */}
      <button
        onClick={() => (window.location.hash = `#/shop/${shopId}`)}
        style={{
          marginTop: 20,
          padding: "12px 25px",
          borderRadius: 8,
          background: "#0366a6",
          color: "white",
          cursor: "pointer",
          fontSize: 16,
          border: "none",
        }}
      >
        Back to Menu
      </button>
    </div>
  );
}
