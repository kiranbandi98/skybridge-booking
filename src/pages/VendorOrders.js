import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

/* ---------------- Timestamp Helpers ---------------- */
function toDateSafe(order) {
  try {
    const t = order.timestamp;
    if (!t) return order.date ? new Date(order.date) : null;
    if (typeof t.toDate === "function") return t.toDate();
    return new Date(t);
  } catch {
    return order.date ? new Date(order.date) : null;
  }
}

function isToday(order) {
  const d = toDateSafe(order);
  if (!d) return false;

  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/* ---------------- Status Badge Colors ---------------- */
function getStatusStyle(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("prepar")) return { background: "#ff9800", color: "#fff" };
  if (s.includes("ready")) return { background: "#4caf50", color: "#fff" };
  if (s.includes("complete")) return { background: "#1e88e5", color: "#fff" };
  return { background: "#9e9e9e", color: "#fff" };
}

/* ---------------- Smart Sorting ---------------- */
function priority(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("prepar")) return 1;
  if (s.includes("ready")) return 2;
  if (s.includes("pending")) return 3;
  if (s.includes("complete")) return 5;
  return 4;
}

function sortOrders(list) {
  return list.sort((a, b) => {
    const pa = priority(a.paymentStatus);
    const pb = priority(b.paymentStatus);

    if (pa !== pb) return pa - pb;

    const da = toDateSafe(a);
    const dbt = toDateSafe(b);

    if (da && dbt) return dbt - da;

    return 0;
  });
}

/* ===========================================================
                     MAIN COMPONENT
=========================================================== */

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All");
  const [todayOnly, setTodayOnly] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null); // { id, name, total, visible }
  const toastTimerRef = useRef(null);

  const initialLoadRef = useRef(true);
  const lastOrderIdRef = useRef(null);

  const newOrderAudio = useRef(null);
  const statusBeep = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    newOrderAudio.current = new Audio("/order-alert.mp3");
    statusBeep.current = new Audio("/ready-alert.mp3");

    newOrderAudio.current.loop = true;
    newOrderAudio.current.volume = 1.0;
    statusBeep.current.volume = 1.0;

    return () => {
      try {
        newOrderAudio.current && newOrderAudio.current.pause();
      } catch {}
    };
  }, []);

  const stopAlarm = () => {
    try {
      newOrderAudio.current.pause();
      newOrderAudio.current.currentTime = 0;
    } catch {}
    setIsRinging(false);
  };

  async function updateStatus(orderId, newStatus) {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        paymentStatus: newStatus,
      });
    } catch (err) {
      console.error("Update status failed", err);
    }
  }

  function showNewOrderToast(orderData) {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    setToast({
      id: orderData.id,
      name: orderData.customerName || "Customer",
      total: orderData.totalAmount || 0,
      items: orderData.items || [],
      visible: true,
    });

    toastTimerRef.current = setTimeout(() => {
      setToast((t) => (t ? { ...t, visible: false } : t));
      toastTimerRef.current = null;
    }, 5000);
  }

  function onToastClick(orderId) {
    setToast(null);
    stopAlarm();
    navigate(`/vendor/orders/${orderId}`);
  }

  useEffect(() => {
    const colRef = collection(db, "orders");

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      let mapped = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      snapshot.docChanges().forEach((change) => {
        const order = change.doc.data();
        const orderId = change.doc.id;

        if (change.type === "added") {
          if (initialLoadRef.current) {
            lastOrderIdRef.current = snapshot.docs[0]?.id || orderId;
          } else {
            if (orderId !== lastOrderIdRef.current) {
              try {
                newOrderAudio.current.play();
                setIsRinging(true);
              } catch (e) {
                console.warn("Audio play blocked (user gesture required)");
              }

              showNewOrderToast({ id: orderId, ...order });
              lastOrderIdRef.current = orderId;
            }
          }
        }

        if (change.type === "modified") {
          const s = (order.paymentStatus || "").toLowerCase();
          if (s === "ready" || s === "completed") {
            try {
              statusBeep.current.currentTime = 0;
              statusBeep.current.play();
            } catch (e) {
              console.warn("Status beep blocked.");
            }
          }
        }
      });

      if (initialLoadRef.current) initialLoadRef.current = false;

      mapped = sortOrders(mapped);
      setOrders(mapped);
    });

    return () => {
      unsubscribe();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (todayOnly && !isToday(o)) return false;
    if (filter === "All") return true;
    return (o.paymentStatus || "").toLowerCase().includes(filter.toLowerCase());
  });

  const filterBtn = (name) => ({
    padding: "8px 14px",
    marginRight: 8,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    background: filter === name ? "#0366d6" : "#e3e3e3",
    color: filter === name ? "white" : "#333",
  });

  const toastStyleBase = {
    position: "fixed",
    right: 20,
    top: 20,
    zIndex: 9999,
    minWidth: 260,
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    borderRadius: 10,
    overflow: "hidden",
    transition: "transform 280ms cubic-bezier(.2,.9,.2,1), opacity 280ms",
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Vendor Orders Dashboard</h2>

      {isRinging && (
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={stopAlarm}
            style={{
              background: "red",
              color: "white",
              padding: "10px 20px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            🔴 STOP ALARM
          </button>
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <button style={filterBtn("All")} onClick={() => setFilter("All")}>
          All
        </button>
        <button style={filterBtn("prepar")} onClick={() => setFilter("prepar")}>
          Preparing
        </button>
        <button style={filterBtn("ready")} onClick={() => setFilter("ready")}>
          Ready
        </button>
        <button style={filterBtn("pending")} onClick={() => setFilter("pending")}>
          Pending
        </button>
        <button style={filterBtn("complete")} onClick={() => setFilter("complete")}>
          Completed
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setTodayOnly(!todayOnly)}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            background: todayOnly ? "#2ecc71" : "#e3e3e3",
            color: todayOnly ? "white" : "#333",
          }}
        >
          {todayOnly ? "Showing: Today Only ✔" : "Show Today Only"}
        </button>
      </div>

      {filteredOrders.length === 0 && (
        <p style={{ color: "#777" }}>No orders in this category.</p>
      )}

      {filteredOrders.map((o) => (
        <div
          key={o.id}
          onClick={() => navigate(`/vendor/orders/${o.id}`)}
          style={{
            padding: 16,
            marginBottom: 14,
            background: "white",
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            cursor: "pointer",
            transition: "transform 120ms",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Order #{o.id}</h3>
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                fontWeight: 700,
                ...getStatusStyle(o.paymentStatus),
              }}
            >
              {o.paymentStatus}
            </span>
          </div>

          <p style={{ margin: "6px 0" }}><b>Name:</b> {o.customerName}</p>
          <p style={{ margin: "6px 0" }}><b>Phone:</b> {o.phone}</p>
          <p style={{ margin: "6px 0" }}><b>Total:</b> ₹{o.totalAmount}</p>

          <b>Items:</b>
          <ul>
            {o.items?.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>

          <div style={{ marginTop: 10 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateStatus(o.id, "Preparing");
              }}
              style={{
                background: "#ff9800",
                color: "white",
                padding: "6px 12px",
                borderRadius: 6,
                marginRight: 8,
                border: "none",
              }}
            >
              Preparing
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                updateStatus(o.id, "Ready");
              }}
              style={{
                background: "#4caf50",
                color: "white",
                padding: "6px 12px",
                borderRadius: 6,
                marginRight: 8,
                border: "none",
              }}
            >
              Ready
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                updateStatus(o.id, "Completed");
              }}
              style={{
                background: "#1e88e5",
                color: "white",
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
              }}
            >
              Completed
            </button>
          </div>
        </div>
      ))}

      {toast && (
        <div
          style={{
            ...toastStyleBase,
            background: "#fff",
            opacity: toast.visible ? 1 : 0,
            transform: toast.visible ? "translateY(0)" : "translateY(-10px)",
            pointerEvents: toast.visible ? "auto" : "none",
          }}
          onClick={() => toast && onToastClick(toast.id)}
        >
          <div style={{ display: "flex", gap: 12, padding: 12, alignItems: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 10, background: "#ffebc7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
              🔔
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>New Order — {toast.name}</div>
              <div style={{ color: "#666", fontSize: 14 }}>
                ₹{toast.total} • {toast.items && toast.items.length > 0 ? toast.items.slice(0, 3).join(", ") + (toast.items.length > 3 ? "..." : "") : "No items"}
              </div>
            </div>

            <div style={{ marginLeft: 8 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  stopAlarm();
                  navigate(`/vendor/orders/${toast.id}`);
                }}
                style={{
                  background: "#0366d6",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: 700,
                }}
              >
                Open
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}