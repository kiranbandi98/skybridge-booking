import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

/**
 * VendorDashboard (POS / Dashboard style)
 *
 * - Live listens to `orders` collection
 * - Computes totals, daily revenue, status counts
 * - Shows recent orders and a "New Orders" badge when new orders arrive
 *
 * Works with documents that may or may not have `timestamp`.
 * If timestamp is a Firestore Timestamp, it tries to convert using .toDate()
 */

function toDateSafe(order) {
  // Try: order.timestamp.toDate(), then Date constructor, else fallback using order.date string
  try {
    const t = order.timestamp;
    if (!t) return order.date ? new Date(order.date) : null;
    if (typeof t.toDate === "function") return t.toDate();
    return new Date(t);
  } catch {
    return order.date ? new Date(order.date) : null;
  }
}

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export default function VendorDashboard() {
  const [orders, setOrders] = useState([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const initialLoaded = useRef(false);
  const previousIds = useRef(new Set());

  useEffect(() => {
    const colRef = collection(db, "orders");

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(docs);

      // New orders detection (only after first load)
      const currentIds = new Set(snapshot.docs.map((d) => d.id));
      if (!initialLoaded.current) {
        // first load: initialize
        previousIds.current = currentIds;
        initialLoaded.current = true;
        setNewOrdersCount(0);
      } else {
        // find ids present in currentIds but not in previousIds
        let added = 0;
        currentIds.forEach((id) => {
          if (!previousIds.current.has(id)) added += 1;
        });
        if (added > 0) setNewOrdersCount((n) => n + added);
        previousIds.current = currentIds;
      }
    });

    return () => unsubscribe();
  }, []);

  // Derived metrics
  const stats = useMemo(() => {
    const now = new Date();
    let totalOrders = 0;
    let ordersToday = 0;
    let revenueToday = 0;
    let preparing = 0;
    let ready = 0;
    let completed = 0;

    for (const o of orders) {
      totalOrders += 1;
      const created = toDateSafe(o);
      if (created && isSameDay(created, now)) {
        ordersToday += 1;
        revenueToday += Number(o.totalAmount || 0);
      } else if (!created && o.date) {
        // fallback: if order.date equals today's yyyy-mm-dd string
        try {
          const todayStr = now.toISOString().slice(0, 10);
          if (o.date === todayStr) {
            ordersToday += 1;
            revenueToday += Number(o.totalAmount || 0);
          }
        } catch {}
      }

      const st = (o.paymentStatus || "").toString();
      if (/prepar/i.test(st)) preparing += 1;
      else if (/ready/i.test(st)) ready += 1;
      else if (/complete/i.test(st)) completed += 1;
    }

    return {
      totalOrders,
      ordersToday,
      revenueToday,
      preparing,
      ready,
      completed,
    };
  }, [orders]);

  // Quick recent orders (last 6)
  const recent = useMemo(() => {
    // Sort by timestamp if available, else keep order from snapshot
    const copy = [...orders];
    copy.sort((a, b) => {
      const da = toDateSafe(a);
      const db = toDateSafe(b);
      if (da && db) return db - da;
      if (da && !db) return -1;
      if (!da && db) return 1;
      return 0;
    });
    return copy.slice(0, 6);
  }, [orders]);

  // Reset new orders count (when vendor views dashboard or clicks)
  function clearNewOrders() {
    setNewOrdersCount(0);
  }

  return (
    <div style={{ padding: 20, fontFamily: "Poppins, system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Vendor POS Dashboard</h1>
          <div style={{ color: "#666", marginTop: 6 }}>Live orders & quick actions</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link to="/vendor/orders" onClick={clearNewOrders} style={linkBtn}>
            Orders
            {newOrdersCount > 0 && (
              <span style={{ marginLeft: 8, background: "#e53935", color: "#fff", padding: "2px 8px", borderRadius: 999 }}>
                {newOrdersCount}
              </span>
            )}
          </Link>

          <Link to="/vendor/:shopId/menu" style={linkBtn}>
            Menu Editor
          </Link>
        </div>
      </header>

      {/* KPI Cards */}
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ color: "#666" }}>Total Orders</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{stats.totalOrders}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#666" }}>Orders Today</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{stats.ordersToday}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#666" }}>Revenue Today</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>₹{stats.revenueToday}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#666" }}>Preparing</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{stats.preparing}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#666" }}>Ready</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{stats.ready}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#666" }}>Completed</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{stats.completed}</div>
        </div>
      </div>

      {/* Main area */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginTop: 26 }}>
        {/* Left: Live Orders Snapshot */}
        <div>
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0 }}>Live Orders</h2>
            <div style={{ color: "#666" }}>{orders.length} total</div>
          </div>

          <div>
            {orders.length === 0 && <div style={{ padding: 16, background: "#fff", borderRadius: 8 }}>No orders yet.</div>}
            {orders.map((o) => (
              <div
                key={o.id}
                onClick={() => (window.location.href = `/vendor/orders/${o.id}`)}
                style={{
                  background: "#fff",
                  padding: 14,
                  borderRadius: 10,
                  marginBottom: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Order #{o.id}</div>
                    <div style={{ color: "#444", marginTop: 6 }}>{o.customerName || "—"}</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800 }}>₹{o.totalAmount || 0}</div>
                    <div style={{ color: "#666", marginTop: 6 }}>{o.paymentStatus || "Pending"}</div>
                  </div>
                </div>

                <div style={{ marginTop: 10, color: "#444" }}>
                  {o.items && o.items.length > 0 ? (
                    <div style={{ fontSize: 14 }}>
                      {o.items.slice(0, 3).join(", ")}
                      {o.items.length > 3 ? "..." : ""}
                    </div>
                  ) : (
                    <div style={{ fontSize: 14, color: "#888" }}>No items</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent orders & quick actions */}
        <aside>
          <div style={{ background: "#fff", padding: 16, borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
            <h3 style={{ marginTop: 0 }}>Recent Orders</h3>

            {recent.length === 0 && <div style={{ color: "#666" }}>No recent orders</div>}

            <ul style={{ paddingLeft: 18 }}>
              {recent.map((r) => (
                <li key={r.id} style={{ marginBottom: 8 }}>
                  <a href={`/vendor/orders/${r.id}`} style={{ color: "#0366a6", fontWeight: 700, textDecoration: "none" }}>
                    #{r.id}
                  </a>
                  <div style={{ color: "#666" }}>{r.customerName || "—"} • ₹{r.totalAmount || 0}</div>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <a href="/vendor/orders" style={smallButton}>Open Orders</a>
              <a href="/vendor/:shopId/menu" style={smallButton}>Edit Menu</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* styles */
const cardStyle = {
  background: "#fff",
  padding: 18,
  borderRadius: 10,
  boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
};

const linkBtn = {
  background: "#0366a6",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: 8,
  textDecoration: "none",
  fontWeight: 700,
};

const smallButton = {
  background: "#ffb400",
  color: "#000",
  padding: "8px 10px",
  borderRadius: 8,
  textDecoration: "none",
  fontWeight: 700,
};
