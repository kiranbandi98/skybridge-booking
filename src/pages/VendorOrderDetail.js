// src/pages/VendorOrderDetail.js
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../utils/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";

/* -----------------------------------------
   NAVBAR (Safe Insert)
----------------------------------------- */
const SHOP_ID = "XLxGpZl5ByxqIUUIYS2Dn";

const Navbar = () => (
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
    <div style={{ fontWeight: 700, fontSize: 18 }}>Vendor Panel</div>

    <div style={{ display: "flex", gap: 12 }}>
      <a
        href={`/vendor/${SHOP_ID}`}
        style={{
          textDecoration: "none",
          background: "#0366d6",
          color: "white",
          padding: "8px 14px",
          borderRadius: 8,
          fontWeight: 700,
        }}
      >
        Dashboard
      </a>

      <a
        href="/vendor/orders"
        style={{
          textDecoration: "none",
          background: "#0366d6",
          color: "white",
          padding: "8px 14px",
          borderRadius: 8,
          fontWeight: 700,
        }}
      >
        Orders
      </a>

      <a
        href={`/vendor/${SHOP_ID}/menu`}
        style={{
          textDecoration: "none",
          background: "#0366d6",
          color: "white",
          padding: "8px 14px",
          borderRadius: 8,
          fontWeight: 700,
        }}
      >
        Menu
      </a>

      {/* LOGOUT */}
      <button
        onClick={() => {
          const auth = getAuth();
          signOut(auth)
            .then(() => (window.location.href = "/vendor/login"))
            .catch((e) => console.error("Logout failed:", e));
        }}
        style={{
          background: "#d32f2f",
          color: "white",
          padding: "8px 14px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Logout
      </button>
    </div>
  </div>
);

/* -----------------------------------------
   ORIGINAL PAGE STARTS HERE
----------------------------------------- */

export default function VendorOrderDetail() {
  const { shopId, orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // ------------------------------------
  // 🔥 Load Single Order
  // ------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "shops", shopId, "orders", orderId));
        if (snap.exists()) setOrder(snap.data());
      } catch (err) {
        console.error("Failed to load order:", err);
      }
      setLoading(false);
    }
    load();
  }, [orderId]);

  // ------------------------------------
  // 🔧 Update Order Workflow Status
  // ------------------------------------
  async function updateStatus(newStatus) {
    try {
      await updateDoc(doc(db, "shops", shopId, "orders", orderId), {
        orderStatus: newStatus, // ⭐ new workflow field
      });

      setOrder((prev) => ({ ...prev, orderStatus: newStatus }));
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  if (loading) return <h2 style={{ padding: 20 }}>Loading order...</h2>;
  if (!order) return <h2 style={{ padding: 20 }}>Order not found.</h2>;

  // ------------------------------------
  // 📅 Fix timestamp display
  // ------------------------------------
  let orderDate = "";
  if (order.createdAt instanceof Date) {
    orderDate = order.createdAt.toLocaleString();
  } else if (order.createdAt?.toDate) {
    orderDate = order.createdAt.toDate().toLocaleString();
  }

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
      
      {/* ✅ NEW NAVBAR */}
      <Navbar />

      <h2>Order #{orderId}</h2>

      <Link to="/vendor/orders">
        <button
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: "#0366d6",
            color: "white",
            border: "none",
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          ← Back to Orders
        </button>
      </Link>

      {/* Summary Card */}
      <div
        style={{
          padding: 20,
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          marginBottom: 20,
        }}
      >
        <p><b>Name:</b> {order.customerName}</p>

        <p>
          <b>Phone:</b>{" "}
          <a
            href={`tel:${order.phone}`}
            style={{ color: "#007bff", textDecoration: "none" }}
          >
            {order.phone}
          </a>
        </p>

        <p><b>Order Type:</b> {order.orderType}</p>

        {order.address && <p><b>Address:</b> {order.address}</p>}

        {order.location && (
          <p>
            <b>Location:</b>{" "}
            <a
              href={`https://www.google.com/maps?q=${order.location}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              📍 Open in Maps
            </a>
          </p>
        )}

        {order.slot && (
          <p>
            <b>Table Slot:</b> {order.date} at {order.slot}
          </p>
        )}

        <p><b>Total Amount:</b> ₹{order.totalAmount}</p>

        <p><b>Payment:</b> {order.paymentStatus}</p>

        <p>
          <b>Order Status:</b>{" "}
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              background:
                order.orderStatus === "Completed"
                  ? "#1e88e5"
                  : order.orderStatus === "Ready"
                  ? "#4caf50"
                  : order.orderStatus === "Preparing"
                  ? "#ff9800"
                  : "#6c757d",
              color: "white",
            }}
          >
            {order.orderStatus || "Pending"}
          </span>
        </p>

        <p><b>Order Time:</b> {orderDate}</p>
      </div>

      {/* Items */}
      <div
        style={{
          padding: 20,
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          marginBottom: 20,
        }}
      >
        <h3>Items</h3>
        <ul>
          {order.items?.length > 0 ? (
            order.items.map((item, idx) => (
              <li key={idx}>
                {item.name} × {item.qty || 1} — ₹{(item.price || 0) * (item.qty || 1)}
              </li>
            ))
          ) : (
            <li>No items listed.</li>
          )}
        </ul>
      </div>

      {/* Status Update */}
      <div
        style={{
          padding: 20,
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}
      >
        <h3>Update Order Status</h3>

        <button
          onClick={() => updateStatus("Preparing")}
          style={{
            background: "#ff9800",
            color: "white",
            padding: "10px 20px",
            marginRight: 10,
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          Preparing
        </button>

        <button
          onClick={() => updateStatus("Ready")}
          style={{
            background: "#4caf50",
            color: "white",
            padding: "10px 20px",
            marginRight: 10,
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          Ready
        </button>

        <button
          onClick={() => updateStatus("Completed")}
          style={{
            background: "#1e88e5",
            color: "white",
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          Completed
        </button>
      </div>
    </div>
  );
}
