import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../utils/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { query, where } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth"; // ⭐ Added for logout

/* ---------------- NAVBAR (Safe Insert) ---------------- */
 


const Navbar = ({ shopId }) => {
  if (!shopId) return null;

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
    <div style={{ fontWeight: 700, fontSize: 18 }}>Vendor Orders</div>

    <div style={{ display: "flex", gap: 12 }}>
      <a
        href={`/#/vendor/shop/${shopId}`}
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
        href={`/#/vendor/shop/${shopId}/orders`}

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
        href={`/#/vendor/shop/${shopId}/menu`}

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
            .then(() => (window.location.hash = "#/vendor/login"))

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
};

/* ---------------- Timestamp Helpers ---------------- */
function toDateSafe(order) {
  try {
    const t = order.timestamp || order.createdAt;
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
    const pa = priority(a.orderStatus || a.paymentStatus);
    const pb = priority(b.orderStatus || b.paymentStatus);

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



// 🔊 Text-to-Speech helpers (ADDED)
const spokenPaidOrderIdsRef = { current: new Set() };

function buildVoiceText(order) {
  const amount = order.totalAmount || 0;
  const mode = localStorage.getItem("voiceAnnounceMode") || "AMOUNT_ONLY";

  if (mode === "AMOUNT_ONLY") {
    return `${amount} rupees received.`;
  }

  const items = order.items || [];
  if (items.length === 0) return `${amount} rupees received.`;

  const itemText = items
    .map(i => {
      const qty = i.qty || 1;
      const unit = qty > 1 ? "plates" : "plate";
      return `${qty} ${unit} ${i.name}`;
    })
    .join(", ");

  return `${amount} rupees received. ${itemText}.`;
}

function speakNow(text) {
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    utter.volume = 1;
    utter.rate = 1;
    window.speechSynthesis.speak(utter);
  } catch (e) {
    console.warn("TTS failed", e);
  }
}
 // ================= COMPONENT: COMPLETED ORDER ROW =================
const CompletedOrderRow = React.memo(function CompletedOrderRow({ o }) {
  const d = toDateSafe(o);
  
  const dateText = d
    ? d.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const timeText = d
    ? d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      style={{
        padding: "12px 16px",
        marginBottom: 8,
        background: "#f8fafc",
        borderRadius: 8,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: "1px solid #e5e7eb",
      }}
    >
      <div>
        <div style={{ fontWeight: 700 }}>
          #{o.id.slice(0, 6)} — {o.customerName}
        </div>
        <div style={{ fontSize: 13, color: "#666" }}>
          ₹{o.totalAmount} • {dateText} • {timeText}
        </div>
      </div>

      <div
        style={{
          padding: "6px 12px",
          borderRadius: 20,
          fontWeight: 700,
          fontSize: 12,
          background: "#1e88e5",
          color: "white",
        }}
      >
        Completed
      </div>
         </div>
  );
});

// ================= COMPONENT: ACTIVE ORDER CARD =================
const ActiveOrderCard = React.memo(function ActiveOrderCard({ o, updateStatus }) {
  const d = toDateSafe(o);
  // 🔥 URGENCY CALCULATION START
  const now = new Date();
  let minutes = 0;

  if (d) {
    minutes = Math.floor((now - d) / 60000);
  }

  let urgencyLabel = null;
  let urgencyStyle = {};

  if (minutes >= 0 && minutes < 10) {
    urgencyLabel = "On Time";
    urgencyStyle = { color: "#16a34a", fontWeight: 700 };
  } else if (minutes >= 10 && minutes < 60) {
    urgencyLabel = "Late";
    urgencyStyle = { color: "#dc2626", fontWeight: 700 };
  } else {
    urgencyLabel = null;
  }
  // 🔥 URGENCY CALCULATION END
  const dateText = d
    ? d.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const timeText = d
    ? d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      style={{
        padding: 16,
        marginBottom: 14,
        background: "white",
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        borderLeft:
          o.orderType === "dinein"
            ? "6px solid #0366d6"
            : o.orderType === "delivery"
            ? "6px solid #16a34a"
            : o.orderType === "pickup"
            ? "6px solid #6b7280"
            : "6px solid transparent",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>Order #{o.id}</h3>
         {(() => {
  const displayStatus =
    o.orderStatus && o.orderStatus !== ""
      ? o.orderStatus
      : o.paymentStatus;

  return (
    <span
      style={{
        padding: "6px 12px",
        borderRadius: 8,
        fontWeight: 700,
        ...getStatusStyle(displayStatus),
      }}
    >
      {displayStatus}
    </span>
  );
})()}
      </div>

      <p><b>Name:</b> {o.customerName}</p>
      <p><b>Phone:</b> {o.phone}</p>
      <p><b>Total:</b> ₹{o.totalAmount}</p>
      <p style={{ fontSize: 13, color: "#666" }}>
        📅 {dateText} • 🕒 {timeText}
      </p>
      {urgencyLabel && (
  <div style={{ marginTop: 4, ...urgencyStyle }}>
    {urgencyLabel}
  </div>
)}

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        {["Pending", "Preparing", "Ready", "Completed"].map((status) => {
          const current = (o.orderStatus || "pending").toLowerCase();
          const s = status.toLowerCase();
 
        return (
  <button
    key={status}
    onClick={() => updateStatus(o.id, status)}
    style={{
      padding: "6px 14px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontWeight: 700,
      background:
        s === "pending"
          ? "#9e9e9e"
          : s === "preparing"
          ? "#ff9800"
          : s === "ready"
          ? "#4caf50"
          : "#1e88e5",
      color: "white",
      opacity: 1,
    }}
  >
    {status}
  </button>
);
        })}
      </div>
        </div>
  );
});

export default function VendorOrders() {
  const { shopId } = useParams();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All");
  const [todayOnly, setTodayOnly] = useState(false);
  const [viewMode, setViewMode] = useState("ACTIVE"); 
// ACTIVE or COMPLETED
  const [isRinging, setIsRinging] = useState(false);

  
  const [showUnlockPopup, setShowUnlockPopup] = useState(false);
// Toast state for NEW ORDER (top-right)
  const [toast, setToast] = useState(null); // { id, name, total, visible }
  const toastTimerRef = useRef(null);

  // Status toast (bottom-left) for status changes (keeps small)
  const [statusToast, setStatusToast] = useState(null);
  const statusToastTimerRef = useRef(null);

  const initialLoadRef = useRef(true);
  const lastOrderIdRef = useRef(null);

  const alarmedOrderIdsRef = useRef(new Set());

  const newOrderAudio = useRef(null);
  const statusBeep = useRef(null);

  // whether audio playback was unlocked by a user gesture
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioUnlockTriedRef = useRef(false);

  const navigate = useNavigate();

  // Initialize audio elements
  useEffect(() => {
    newOrderAudio.current = new Audio("/order-alert.mp3");
        try { newOrderAudio.current.loop = true; newOrderAudio.current.volume = 1.0; } catch(e){} 
statusBeep.current = new Audio("/ready-alert.mp3");

    // new order alert is looped for persistent alarm (stops via STOP ALARM)
    newOrderAudio.current.loop = true;
    newOrderAudio.current.volume = 1.0;
    statusBeep.current.volume = 1.0;

    // Attach one-time document-level listener to unlock audio on first user interaction
    function onFirstUserInteraction() {
      // call unlockAudio only once
      tryUnlockAudio();
      // remove listener automatically by using once:true below
    }

    // use capture + once to get earliest event
    document.addEventListener("click", onFirstUserInteraction, { once: true, capture: true });

    return () => {
      document.removeEventListener("click", onFirstUserInteraction, { capture: true });
      try {
        if (newOrderAudio.current) {
          newOrderAudio.current.pause();
          newOrderAudio.current = null;
        }
        if (statusBeep.current) {
          statusBeep.current.pause();
          statusBeep.current = null;
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  
const tryPlayNewOrderSound = () => {
  try {
    if (!newOrderAudio.current) return;
    newOrderAudio.current.play().then(()=> {
      // played
    }).catch((e)=> {
      // Play blocked — show unlock popup so vendor can enable sound
      console.warn("newOrderAudio play blocked, showing unlock popup");
      setShowUnlockPopup(true);
    });
  } catch (e) {
    console.warn("tryPlayNewOrderSound error", e);
    setShowUnlockPopup(true);
  }
};


  // Try unlocking audio by playing and immediately pausing (user gesture required)
  async function tryUnlockAudio() {
    if (audioUnlockTriedRef.current) return;
    audioUnlockTriedRef.current = true;

    if (!newOrderAudio.current || !statusBeep.current) {
      setAudioUnlocked(false);
      return;
    }

    try {
      // Attempt to play & pause each audio; success means the browser accepted a user gesture
      await Promise.all([
        newOrderAudio.current.play().then(() => {
          newOrderAudio.current.pause();
          newOrderAudio.current.currentTime = 0;
        }).catch(() => {}),
        statusBeep.current.play().then(() => {
          statusBeep.current.pause();
          statusBeep.current.currentTime = 0;
        }).catch(() => {}),
      ]);
      setAudioUnlocked(true);
    const today = new Date().toISOString().slice(0,10);
    localStorage.setItem("audioUnlockedDate", today);
    } catch (err) {
      // If it fails, we'll keep audioUnlocked false (user must click button)
      setAudioUnlocked(false);
    }
  }

  // Call this from an explicit button click to unlock audio (guaranteed user gesture)
  const handleEnableSoundsClick = async () => {
    await tryUnlockAudio();
    // after attempting, if unlocked, good; otherwise warn in console
    if (!audioUnlocked) {
      // tryUnlockAudio sets audioUnlocked state; but we also re-check
      setTimeout(() => {
        if (!audioUnlocked) {
          console.warn("Audio still locked. You may need to interact (click) in the page to enable sounds.");
        }
      }, 200);
    }
  };

  const stopAlarm = () => {
    try {
      newOrderAudio.current.pause();
      newOrderAudio.current.currentTime = 0;
    } catch {}
    setIsRinging(false);
  };

  const updateStatus = React.useCallback(async (orderId, newStatus) => {
  try {
    await updateDoc(doc(db, "shops", shopId, "orders", orderId), {
      orderStatus: newStatus,
    });
  } catch (err) {
    console.error("Update status failed", err);
  }
}, [shopId]);
  /* ------------------ Toast helpers ------------------ */

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

  function showStatusToast(title, message) {
    if (statusToastTimerRef.current) {
      clearTimeout(statusToastTimerRef.current);
      statusToastTimerRef.current = null;
    }
    setStatusToast({
      title,
      message,
      visible: true,
    });

    statusToastTimerRef.current = setTimeout(() => {
      setStatusToast((t) => (t ? { ...t, visible: false } : t));
      statusToastTimerRef.current = null;
    }, 4000);
  }

  function onToastClick(orderId) {
    setToast(null);
    stopAlarm();
    // navigation removed: dashboard already shows order details
}

  /* ------------------ Firestore real-time listener ------------------ */
  useEffect(() => {
     const colRef = collection(db, "shops", shopId, "orders");

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      let mapped = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      snapshot.docChanges().forEach((change) => {
          

        const order = change.doc.data();
        const orderId = change.doc.id;

        // 🔊 Payment voice trigger (Paid only, once)
        if (
          change.type === "modified" &&
          (order.paymentStatus || "").toLowerCase() === "paid" &&
          !spokenPaidOrderIdsRef.current.has(orderId)
        ) {
          spokenPaidOrderIdsRef.current.add(orderId);
          if (audioUnlocked && localStorage.getItem("paymentVoiceEnabled") === "true") {
            const text = buildVoiceText(order);
            speakNow(text);
          }
        }

        if (change.type === "added") {
          if (initialLoadRef.current) {
            // during first load, set lastOrderIdRef to the most recent doc so next adds are real new
            lastOrderIdRef.current = snapshot.docs[0]?.id || orderId;
          } else {
            // If it's a newly added doc after initial load -> new order
            if (orderId !== lastOrderIdRef.current && !alarmedOrderIdsRef.current.has(orderId)) {
              alarmedOrderIdsRef.current.add(orderId);
              // Try play the alarm, but handle promise rejection safely
              if (audioUnlocked && localStorage.getItem("paymentVoiceEnabled") === "true") {
                newOrderAudio.current
                  .play()
                  .then(() => {
                    setIsRinging(true);
                  })
                  .catch((e) => {
                    // audio play blocked even after unlock attempt
                    console.warn("Audio play blocked (even after unlocking).", e);
                    setIsRinging(false);
                  });
              } else {
                // not unlocked yet: leave isRinging false, but show toast so vendor sees it
                console.warn("New order arrived but sounds not unlocked.");
              }

              showNewOrderToast({ id: orderId, ...order });
              lastOrderIdRef.current = orderId;
            }
          }
        }

        if (change.type === "modified") {
          const s = ((order.orderStatus || order.paymentStatus) || "").toLowerCase();
          if (s === "ready" || s === "completed") {
            // play a short status beep (non-loop)
            if (audioUnlocked && localStorage.getItem("paymentVoiceEnabled") === "true") {
              try {
                statusBeep.current.currentTime = 0;
                statusBeep.current
                  .play()
                  .then(() => {
                    // success
                  })
                  .catch((e) => {
                    console.warn("Status beep blocked.", e);
                  });
              } catch (e) {
                console.warn("Status beep play error.", e);
              }
            } else {
              console.warn("Status change but audio locked.");
            }

            // show small status toast bottom-left
            showStatusToast(
              `Order ${orderId.slice(0, 6)}`,
              s === "ready" ? "is Ready" : "is Completed"
            );
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
      if (statusToastTimerRef.current) clearTimeout(statusToastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [shopId, audioUnlocked]);


  // 🔁 After audio unlock, announce any already-paid order not spoken yet
  useEffect(() => {
    if (!audioUnlocked || localStorage.getItem("paymentVoiceEnabled") !== "true") return;
    if (!orders || orders.length === 0) return;

    // find latest paid order not yet spoken
    const pendingPaid = orders
      .filter(o => (o.paymentStatus || "").toLowerCase() === "paid" && !spokenPaidOrderIdsRef.current.has(o.id))
      .sort((a, b) => {
        const ta = toDateSafe(a);
        const tb = toDateSafe(b);
        if (ta && tb) return tb - ta;
        return 0;
      });

    if (pendingPaid.length > 0) {
      const order = pendingPaid[0];
      spokenPaidOrderIdsRef.current.add(order.id);
      const text = buildVoiceText(order);
      speakNow(text);
    }
  }, [audioUnlocked, orders]);
  /* ------------------ Operational Metrics ------------------ */

 const activeOrders = orders.filter((o) => {
  const status = (o.orderStatus || o.paymentStatus || "pending").toLowerCase();
  return status !== "completed";
});

const preparingCount = activeOrders.filter((o) =>
  (o.orderStatus || "").toLowerCase().includes("prepar")
).length;

const readyCount = activeOrders.filter((o) =>
  (o.orderStatus || "").toLowerCase().includes("ready")
).length;

const pendingCount = activeOrders.filter((o) =>
  (o.orderStatus || "").toLowerCase().includes("pending")
).length;

const lateCount = activeOrders.filter((o) => {
  const d = toDateSafe(o);
  if (!d) return false;
  const minutes = Math.floor((new Date() - d) / 60000);
  return minutes >= 10;
}).length;

const todayRevenue = orders
  .filter((o) => isToday(o))
  .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  /* ------------------ Filtering ------------------ */
 const filteredOrders = React.useMemo(() => {
  return orders
    .filter((o) => {
       const status = (o.orderStatus || o.paymentStatus || "pending").toLowerCase();

      // View mode separation
      if (viewMode === "ACTIVE" && status === "completed") return false;
      if (viewMode === "COMPLETED" && status !== "completed") return false;

      // Today filter
      if (todayOnly && !isToday(o)) return false;

      // Status filter buttons
      if (filter !== "All") {
        const statusMatch = status.includes(filter.toLowerCase());
        if (!statusMatch) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const da = toDateSafe(a);
      const db = toDateSafe(b);
      if (da && db) return db - da;
      return 0;
    });
}, [orders, viewMode, todayOnly, filter]);


  


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

  const statusToastBase = {
    position: "fixed",
    left: 18,
    bottom: 18,
    zIndex: 9999,
    minWidth: 220,
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    borderRadius: 10,
    overflow: "hidden",
    transition: "transform 260ms ease, opacity 260ms ease",
  };

  return (
    <div style={{ padding: 20 }}>
       <style>
      {`
        @keyframes pulseAlert {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}
    </style>
      {/* ⭐ INSERTED NAVBAR HERE */}
      <Navbar shopId={shopId} />

      <h2>Vendor Orders Dashboard</h2>
       <div
  style={{
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 20,
    padding: 16,
    background:
      lateCount > 0
        ? "#ffe5e5"
        : preparingCount > 5
        ? "#fff4e5"
        : "#f8fafc",
    borderRadius: 10,
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    fontWeight: 700,
    transition: "all 0.3s ease",
  }}
>
  <div
    onClick={() => {
      setViewMode("ACTIVE");
      setFilter("All");
    }}
    style={{ cursor: "pointer" }}
  >
    📦 Active: {activeOrders.length}
  </div>

  <div
    onClick={() => {
      setViewMode("ACTIVE");
      setFilter("prepar");
    }}
    style={{
      cursor: "pointer",
      color: preparingCount > 5 ? "#d97706" : "inherit",
    }}
  >
    ⏳ Preparing: {preparingCount}
  </div>

  <div
    onClick={() => {
      setViewMode("ACTIVE");
      setFilter("ready");
    }}
    style={{ cursor: "pointer" }}
  >
    ✅ Ready: {readyCount}
  </div>

  <div
    onClick={() => {
      setViewMode("ACTIVE");
      setFilter("All");
      setTodayOnly(false);
    }}
    style={{
      cursor: "pointer",
      color: lateCount > 0 ? "#dc2626" : "inherit",
      fontWeight: lateCount > 0 ? 800 : 700,
      animation: lateCount > 0 ? "pulseAlert 1.2s infinite" : "none",
    }}
  >
    ⚠️ Late: {lateCount}
  </div>

  <div
    onClick={() => {
      setTodayOnly(true);
    }}
    style={{ cursor: "pointer" }}
  >
    💰 Today Revenue: ₹{todayRevenue}
  </div>
</div>

      {/* Enable sounds button (visible until unlocked) */}
      {!audioUnlocked && (
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={handleEnableSoundsClick}
            style={{
              background: "#007bff",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 15,
              border: "none",
              marginRight: 12,
            }}
          >
            ▶ Enable Sounds
          </button>
          <span style={{ color: "#666", fontSize: 14 }}>
            Click anywhere on the page also enables sounds (browser requirement).
          </span>
        </div>
      )}

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
              border: "2px solid rgba(0,0,0,0.08)",
            }}
          >
            🔴 STOP ALARM
          </button>
        </div>
      )}
      <div style={{ marginBottom: 14 }}>
  <button
    onClick={() => setViewMode("ACTIVE")}
    style={{
      padding: "8px 16px",
      borderRadius: 8,
      border: "none",
      marginRight: 8,
      fontWeight: 700,
      cursor: "pointer",
      background: viewMode === "ACTIVE" ? "#111" : "#e3e3e3",
      color: viewMode === "ACTIVE" ? "white" : "#333",
    }}
  >
    Active Orders
  </button>

  <button
    onClick={() => setViewMode("COMPLETED")}
    style={{
      padding: "8px 16px",
      borderRadius: 8,
      border: "none",
      fontWeight: 700,
      cursor: "pointer",
      background: viewMode === "COMPLETED" ? "#111" : "#e3e3e3",
      color: viewMode === "COMPLETED" ? "white" : "#333",
    }}
  >
    Completed Orders
  </button>
</div>
       <div style={{ marginBottom: 10 }}>

  {viewMode === "ACTIVE" && (
    <>
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
    </>
  )}

  {viewMode === "COMPLETED" && (
    <button style={filterBtn("complete")} onClick={() => setFilter("complete")}>
      Completed
    </button>
  )}

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
       
       {filteredOrders.map((o) => {
   const isCompleted =
  (o.orderStatus || o.paymentStatus || "").toLowerCase() === "completed";

  return isCompleted ? (
    <CompletedOrderRow key={o.id} o={o} />
  ) : (
    <ActiveOrderCard
      key={o.id}
      o={o}
      updateStatus={updateStatus}
    />
  );
})}
      {/* New Order Toast (top-right) */}
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
                ₹{toast.total} • {toast.items && toast.items.length > 0 ? toast.items
                      .slice(0, 3)
                      .map((i) => `${i.name}×${i.qty}`)
                      .join(", ") + (toast.items.length > 3 ? "..." : "") : "No items"}
              </div>
            </div>

            <div style={{ marginLeft: 8 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  stopAlarm();
                  // navigation removed
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

      {/* Status toast (bottom-left) */}
      {statusToast && (
        <div
          style={{
            ...statusToastBase,
            background: "#fff",
            opacity: statusToast.visible ? 1 : 0,
            transform: statusToast.visible ? "translateY(0)" : "translateY(18px)",
            pointerEvents: statusToast.visible ? "auto" : "none",
            padding: 12,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 46, height: 46, borderRadius: 8, background: "#e6f4ea", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
              ✅
            </div>
            <div>
              <div style={{ fontWeight: 800 }}>{statusToast.title}</div>
              <div style={{ color: "#666", fontSize: 14 }}>{statusToast.message}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}