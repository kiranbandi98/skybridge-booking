// src/pages/OrderSuccess.js
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../utils/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";

export default function OrderSuccess() {
  // ✅ MULTI-VENDOR PARAMS
  const { shopId, orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [now, setNow] = useState(new Date());


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
  // ⏱ Auto update timer every 60 seconds
useEffect(() => {
  const interval = setInterval(() => {
    setNow(new Date());
  }, 60000);

  return () => clearInterval(interval);
}, []);
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

{/* 🕒 Order Time Display */}
{order?.createdAt && (() => {
  const d = order.createdAt?.toDate
    ? order.createdAt.toDate()
    : new Date(order.createdAt);

 const currentTime = now;
 const minutes = Math.floor((currentTime - d) / 60000);


  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 14, color: "#555" }}>
        🕒 {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>

      <div
        style={{
          marginTop: 6,
          padding: "6px 12px",
          borderRadius: 8,
          background: "#e8f5e9",
          color: "#2e7d32",
          fontWeight: 600,
          display: "inline-block",
          fontSize: 13,
        }}
      >
        ⏱ {minutes} mins ago
      </div>
    </div>
  );
})()}

<p>
  <b>Total Paid:</b> ₹{order.totalAmount}
</p>

        {/* 🕒 Order Time */}
{order.timestamp?.seconds && (
  <p
    style={{
      marginTop: 10,
      fontWeight: 600,
      color: "#555",
      display: "flex",
      alignItems: "center",
      gap: 6,
    }}
  >
    🕒 Ordered At:{" "}
    {new Date(order.timestamp.seconds * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}
  </p>
)}
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

      {/* ✅ BACK TO MENU (HASHROUTER SAFE) */}
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

      {/* =====================================================
         🚀 VENDOR PROMOTION SECTION (NEW - BOTTOM ONLY)
      ===================================================== */}
      <div
        style={{
          marginTop: 50,
          padding: 25,
          borderRadius: 14,
          background: "linear-gradient(135deg, #f8f9fa, #ffffff)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <h2>🚀 Start Free Today</h2>
        <p style={{ fontSize: 16, fontWeight: 500 }}>
          📲 Scan the QR code below <br />
          Register your shop & start accepting QR orders instantly.
        </p>

        <div style={{ margin: "20px 0" }}>
          <QRCodeCanvas
            value="https://skybridge-booking.onrender.com/#/vendor/register"
            size={180}
          />
        </div>

        <h3>💡 Own a Shop / Hotel / Restaurant?</h3>
        <p>Run your business smarter with <b>SkyBridge</b></p>

        <div style={{ textAlign: "left", maxWidth: 450, margin: "0 auto" }}>
          <p>🔔 <b>Instant payment voice alert</b><br />Know immediately when money is received.</p>
          <p>📱 <b>Simple QR ordering</b><br />Customers scan and place orders easily.</p>
          <p>📊 <b>Live dashboard</b><br />See today’s revenue and orders in real time.</p>
          <p>📦 <b>Clear orders</b><br />Every order is visible and tracked on your screen.</p>
          <p>👷 <b>Easy for staff</b><br />No confusion, no stress during busy hours.</p>
        </div>

        <div style={{ marginTop: 20, textAlign: "left", maxWidth: 450, marginInline: "auto" }}>
          <h4>✨ Why shop owners choose SkyBridge</h4>
          <ul>
            <li>Built for real rush hours, not demos</li>
            <li>Works even when staff is busy and phones are ignored</li>
            <li>Orders start only after payment is successful</li>
            <li>No fake payments</li>
            <li>Clear payments, clear orders, zero confusion</li>
            <li>Reliable every day, not just when it’s quiet</li>
          </ul>
        </div>

        <p style={{ marginTop: 20, fontWeight: 600 }}>🌟 SkyBridge</p>
        <p style={{ fontStyle: "italic" }}>Scan. Order. Pay. Done.</p>
      </div>
    </div>
  );
}
