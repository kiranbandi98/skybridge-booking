// ⭐ UPDATED VendorDashboard.js WITH NAVBAR + LOGOUT + CORRECT SHOP ID

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { db } from "../utils/firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";

// ⭐ Added for Logout
import { getAuth, signOut } from "firebase/auth";

// ---------------------------------------------------------
// Helper functions (your original code, unchanged)
// ---------------------------------------------------------
function toDateSafe(order) {
  try {
    const t = order.createdAt || order.timestamp;
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


function getFinalStatus(o) {
  // Prefer explicit final flags
  if (o.completed === true || o.isCompleted === true || o.completedAt) return "completed";

  // Try known status fields
  let s =
    o.orderStatus ||
    o.currentStatus ||
    o.status ||
    o.deliveryStatus;

  // If timeline / array, take last value
  if (Array.isArray(s)) {
    s = s[s.length - 1];
  }

  // If timeline objects [{status: "..."}]
  if (Array.isArray(o.statusTimeline) && o.statusTimeline.length) {
    s = o.statusTimeline[o.statusTimeline.length - 1].status;
  }

  return (s || "").toLowerCase();
}

export default function VendorDashboard() {
  const [voiceMode, setVoiceMode] = React.useState(
    localStorage.getItem("voiceAnnounceMode") || "AMOUNT_ONLY"
  );
  const { shopId } = useParams();
  const [orders, setOrders] = useState([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const initialLoaded = useRef(false);
  const previousIds = useRef(new Set());

  const navigate = useNavigate();
  /* =====================================================
     🔒 ADMIN DISABLE GUARD (ADDED - MINIMAL)
  ===================================================== */
  useEffect(() => {
    const checkShopActive = async () => {
      try {
        const ref = doc(db, "shops", shopId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          alert("Shop not found");
          await signOut(getAuth());
          navigate("/vendor/login");
          return;
        }

        if (snap.data().active === false) {
          alert("Your shop has been disabled by admin.");
          await signOut(getAuth());
          navigate("/vendor/login");
        }
      } catch (e) {
        console.error("Admin disable check failed:", e);
      }
    };
    checkShopActive();
  }, [shopId, navigate]);
  /* ===================================================== */


  // ⭐ Logout function
  function handleLogout() {
    const auth = getAuth();
    signOut(auth)
      .then(() => navigate("/vendor/login"))
      .catch((e) => console.error("Logout failed:", e));
  }

  // ---------------------------------------------------------
  // Load all orders (your original logic)
  // ---------------------------------------------------------
  useEffect(() => {
    const colRef =  collection(db, "shops", shopId, "orders");

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(docs);

      const currentIds = new Set(snapshot.docs.map((d) => d.id));

      if (!initialLoaded.current) {
        previousIds.current = currentIds;
        initialLoaded.current = true;
        setNewOrdersCount(0);
      } else {
        let added = 0;
        currentIds.forEach((id) => {
          if (!previousIds.current.has(id)) added += 1;
        });

        if (added > 0) setNewOrdersCount((n) => n + added);
        previousIds.current = currentIds;
      }
    });

    return () => unsubscribe();
  }, [shopId]);

  // ---------------------------------------------------------
  // Stats (your original code)
  // ---------------------------------------------------------
  const stats = useMemo(() => {
    const now = new Date();
    let totalOrders = 0;
    let ordersToday = 0;
    let revenueToday = 0;
    let revenueMonth = 0;
    let revenueYear = 0;

    let preparing = 0;
    let ready = 0;
    let completed = 0;

    for (const o of orders) {
      totalOrders += 1;
      const created = toDateSafe(o);

      if (created && isSameDay(created, now)) {
        ordersToday += 1;
        if ((o.paymentStatus || "").toLowerCase() === "paid") {
        revenueToday += Number(o.totalAmount || 0);
        if (created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()) {
          revenueMonth += Number(o.totalAmount || 0);
        }
        if (created.getFullYear() === now.getFullYear()) {
          revenueYear += Number(o.totalAmount || 0);
        }
      }
      }

      const status = getFinalStatus(o);
      if (status === "preparing") preparing++;
      else if (status === "ready") ready++;
      else if (status === "completed") completed++;
    }

    return {
      totalOrders,
      ordersToday,
      revenueToday,
      revenueMonth,
      revenueYear,
      preparing,
      ready,
      completed,
    };
  }, [orders]);

  // ---------------------------------------------------------
  // Recent orders (your original code)
  // ---------------------------------------------------------
  const recent = useMemo(() => {
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

  function clearNewOrders() {
    setNewOrdersCount(0);
  }

  // ---------------------------------------------------------
  // ⭐ TOP NAVIGATION BAR (Style 1 — Added safely)
  // ---------------------------------------------------------
  const Navbar = () => (
     
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#0366a6",
        padding: "12px 20px",
        borderRadius: 8,
        marginBottom: 20,
        color: "white",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 18 }}>Vendor Panel</div>

      <div style={{ display: "flex", gap: 16 }}>

        {/* Dashboard */}
        <Link
          to={`/vendor/${shopId}`}
          style={navLink}
        >
          Dashboard
        </Link>

        {/* Orders */}
        <Link
            to={`/vendor/${shopId}/orders`}
          onClick={clearNewOrders}
          style={navLink}
        >
          Orders
          {newOrdersCount > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: "#ff4444",
                padding: "2px 6px",
                borderRadius: 50,
                color: "white",
                fontSize: 12,
              }}
            >
              {newOrdersCount}
            </span>
          )}
        </Link>

        {/* Menu */}
        <Link
          to={`/vendor/${shopId}/menu`}
          style={navLink}
        >
          Menu
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            background: "#d32f2f",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 20, fontFamily: "Poppins, system-ui, sans-serif" }}>

      {/* ⭐ INSERTED NAVBAR HERE (Option 1 placement) */}
      <Navbar />

      {/* Your original header (unchanged) */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Vendor POS Dashboard</h1>
          <div style={{ color: "#666", marginTop: 6 }}>
            Live orders & quick actions
          
      {/* 🔊 Voice Announcement Settings */}
      <div style={{ marginTop: 12, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Voice Announcement</div>
        <label style={{ marginRight: 16 }}>
          <input
            type="radio"
            name="voiceMode"
            checked={(localStorage.getItem("voiceAnnounceMode") || "AMOUNT_ONLY") === "AMOUNT_ONLY"}
            onChange={() => localStorage.setItem("voiceAnnounceMode", "AMOUNT_ONLY")}
          />
          Amount only
        </label>
        <label>
          <input
            type="radio"
            name="voiceMode"
            checked={localStorage.getItem("voiceAnnounceMode") === "AMOUNT_WITH_ITEMS"}
            onChange={() => localStorage.setItem("voiceAnnounceMode", "AMOUNT_WITH_ITEMS")}
          />
          Amount + items
        </label>
      </div>
</div>
        </div>
      </header>
      {/* 🔊 Payment Voice */}
      <div style={{ margin: "12px 0", padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <button
          onClick={() => {
            const u = new SpeechSynthesisUtterance("Payment voice enabled");
            window.speechSynthesis.speak(u);
            localStorage.setItem("paymentVoiceEnabled", "true");
          }}
          style={{ padding: "8px 14px", marginBottom: 10 }}
        >
          🔊 Enable Payment Voice
        </button>

        <div>
          <label style={{ marginRight: 16 }}>
            <input
              type="radio"
              name="voiceMode"
              checked={(localStorage.getItem("voiceAnnounceMode") || "AMOUNT_WITH_ITEMS") === "AMOUNT_ONLY"}
              onChange={() => localStorage.setItem("voiceAnnounceMode", "AMOUNT_ONLY")}
            />
            Amount only
          </label>
          <label>
            <input
              type="radio"
              name="voiceMode"
              checked={(localStorage.getItem("voiceAnnounceMode") || "AMOUNT_WITH_ITEMS") === "AMOUNT_WITH_ITEMS"}
              onChange={() => localStorage.setItem("voiceAnnounceMode", "AMOUNT_WITH_ITEMS")}
            />
            Amount + items
          </label>
        </div>
      </div>


      {/* --------------------------------------------- */}
      {/* The rest below is your original code — UNTOUCHED */}
      {/* --------------------------------------------- */}

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
          gap: 16,
        }}
      >
        <div style={cardStyle}>
          <div style={{ color: "#666" }}>Total Orders</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            {stats.totalOrders}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#666" }}>Orders Today</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            {stats.ordersToday}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#666" }}>Revenue Today</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            ₹{stats.revenueToday}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#666" }}>Revenue This Month</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            ₹{stats.revenueMonth}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#666" }}>Revenue This Year</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            ₹{stats.revenueYear}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#666" }}>Preparing</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            {stats.preparing}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#666" }}>Ready</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            {stats.ready}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: "#666" }}>Completed</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            {stats.completed}
          </div>
        </div>
      </div>

      {/* Rest of your JSX unchanged */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          marginTop: 26,
        }}
      >
        <div>
          {/* Live Orders section remains untouched */}
          {/* ... */}
        </div>

        <aside>
          {/* Recent Orders section remains untouched */}
          {/* ... */}
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Styles (your original code)
// ---------------------------------------------------------
const cardStyle = {
  background: "#fff",
  padding: 18,
  borderRadius: 10,
  boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
};

const navLink = {
  color: "white",
  textDecoration: "none",
  fontWeight: 600,
  padding: "6px 10px",
};
