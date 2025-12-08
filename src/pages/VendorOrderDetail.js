import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function VendorOrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // ------------------------------------
  // 🔥 Load Order Data
  // ------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "orders", orderId));
        if (snap.exists()) {
          setOrder(snap.data());
        }
      } catch (err) {
        console.error("Failed to load order:", err);
      }
      setLoading(false);
    }

    load();
  }, [orderId]);

  // ------------------------------------
  // 🔧 Update Order Status
  // ------------------------------------
  async function updateStatus(newStatus) {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        paymentStatus: newStatus,
      });
      setOrder((prev) => ({ ...prev, paymentStatus: newStatus }));
      alert(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  if (loading) return <h2 style={{ padding: 20 }}>Loading order...</h2>;
  if (!order) return <h2 style={{ padding: 20 }}>Order not found.</h2>;

  // Convert timestamp to readable format
  let orderDate = "";
  if (order.timestamp && order.timestamp.toDate) {
    orderDate = order.timestamp.toDate().toLocaleString();
  }

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
      <h2>Order #{orderId}</h2>

      {/* Back Button */}
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
        <p>
          <b>Name:</b> {order.customerName}
        </p>
        <p>
          <b>Phone:</b>{" "}
          <a
            href={`tel:${order.phone}`}
            style={{ color: "#007bff", textDecoration: "none" }}
          >
            {order.phone}
          </a>
        </p>

        <p>
          <b>Order Type:</b> {order.orderType}
        </p>

        {order.address && (
          <p>
            <b>Address:</b> {order.address}
          </p>
        )}

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

        <p>
          <b>Total Amount:</b> ₹{order.totalAmount}
        </p>

        <p>
          <b>Payment Status:</b>{" "}
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              background:
                order.paymentStatus === "Completed"
                  ? "#1e88e5"
                  : order.paymentStatus === "Ready"
                  ? "#4caf50"
                  : order.paymentStatus === "Preparing"
                  ? "#ff9800"
                  : "#6c757d",
              color: "white",
            }}
          >
            {order.paymentStatus}
          </span>
        </p>

        <p>
          <b>Order Time:</b> {orderDate}
        </p>
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
          {order.items && order.items.length > 0 ? (
            order.items.map((item, idx) => <li key={idx}>{item}</li>)
          ) : (
            <li>No items listed.</li>
          )}
        </ul>
      </div>

      {/* Status Update Buttons */}
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
