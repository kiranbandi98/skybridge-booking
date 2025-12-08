// src/App.js// src/App.js
import React, { useMemo, useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

// ⭐ IMPORTANT — you forgot this import
import useFirestoreMenu from "./pages/MenuCloud";
import { saveOrderToFirestore } from "./utils/saveOrder";

 

// Add New Order to Firebase
const addOrder = async (shopId, order) => {
  try {
    await addDoc(collection(db, `shops/${shopId}/orders`), {
      ...order,
      timestamp: new Date(),
    });
    console.log("Order added successfully to Firestore!");
  } catch (error) {
    console.error("Error adding order to Firestore: ", error);
  }
};

// ---------------- CONFIG ----------------
const SHEET_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxZZOLhPk4Fl3Rv9r3PcimklRkz23csWWjWdBKb0tztA71HuwOe_TJSnPi2h1CUiFPZ/exec";

const PROXY_PREFIX = "https://google-proxy-0t98.onrender.com/proxy?url=";

const UPI_ID = "kirankumarreddy172003@oksbi";
const RAZORPAY_KEY_ID = "rzp_test_RiSAkhDLSdTwb4"; // ⬅️ REPLACE with your REAL Razorpay Test Key ID

const DEFAULT_BOOKING_FEE = 1;
const TABLE_COUNT = 15;
const TABLE_CAPACITY = 4;
const DEMO_MODE = false;

// New: configurable default shop ID for saving vendor orders (env override)
const DEFAULT_SHOP_ID =
  process.env.REACT_APP_VENDOR_SHOP_ID || "DLwTpzoVBe8l4qTjE4ys";
// ----------------------------------------

// ---------------- MENU ITEMS ----------------
const menuItems = [
  {
    id: "biriyani",
    name: "Basha bhai Chicken Biryani",
    price: 150,
    img: "/images/biryani_feast2.jpg.png",
    video: "https://youtu.be/v6QtjD2udYM?si=Uz0ZjAMJBd_rFuaJ",
  },
  {
    id: "lollipop",
    name: "Chicken Lollipop",
    price: 150,
    img: "/images/cl.jpg",
    video: "https://youtube.com/shorts/3Av-gsdQrxQ?si=pAQXt38IOJeAxFb9",
  },
  {
    id: "ragi",
    name: "Ragi mudde",
    price: 1,
    img: "/images/ragimudde.jpg.jpg",
    video: "https://youtube.com/shorts/6xij1aIVLp0?si=YfoDIpXdPswDfPCS",
  },
  {
    id: "vegfr",
    name: "Veg Fried Rice",
    price: 80,
    img: "/images/veggfriedrice.jpg",
    video: "https://youtube.com/shorts/UwyVWj4Zzcs?si=vQO8yT7U9G2ojAUH",
  },
  {
    id: "chickfr",
    name: "Chicken Fried Rice",
    price: 100,
    img: "/images/chickenfriedrice.jpeg",
    video: "https://youtube.com/shorts/tZqMd5QC-Js?si=liaz-N3yvWRRq8N_",
  },
  {
    id: "noodles",
    name: "Chicken Noodles",
    price: 100,
    img: "/images/cn.png",
    video: "https://youtube.com/shorts/pm_171rJKXo?si=tM434U_0XXkif6Pr",
  },
  {
    id: "tea",
    name: "Tea",
    price: 30,
    img: "/images/tea.png",
    video: "https://youtube.com/shorts/Zpi8HkTNBEo?si=fI0R5FwqGjqiosvp",
  },
  {
    id: "ice",
    name: "Ice Cream",
    price: 120,
    img: "/images/icecream.jpg",
    video: "https://youtube.com/shorts/8dO1u5uOI7c?si=G-IUUg88Qu7X2A2Z",
  },
  {
    id: "cake",
    name: "Cake Items",
    price: 120,
    img: "/images/cake.png",
    video: "https://youtube.com/shorts/CX0MG7_n20g?si=kbPiVjgLGmSTtiOg",
  },
  {
    id: "bulking",
    name: "Bulking juice",
    price: 120,
    img: "/images/bulkingjuice.png",
    video: "https://youtube.com/shorts/hr8KOIplFGA?si=fAlAYh07TOk9Lls0",
  },
  {
    id: "dosa",
    name: "Dosa with chicken curry",
    price: 100,
    img: "/images/dosa.png",
    video: "https://youtube.com/shorts/riMcM2xY02E?si=ossIjbPo4st-0fLo",
  },
];

// ---------------- Helpers ----------------

// Existing slots (for TABLE bookings – 4pm to 11:30pm)
function generateTimeSlots() {
  const slots = [];
  for (let hour = 16; hour <= 23; hour++) {
    for (let min of [0, 30]) {
      slots.push(
        `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`
      );
    }
  }
  return slots;
}

const imgFallback = (src) => {
  if (!src || !src.startsWith("/images/")) return src;
  const map = {
    "/images/logo.png":
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&q=80&auto=format&fit=crop",
  };
  return map[src] || src;
};

async function proxyFetch(url, options = {}) {
  const final = `${PROXY_PREFIX}${encodeURIComponent(url)}`;
  return fetch(final, options);
}

// ============================================================
//                      MAIN COMPONENT
// ============================================================

export default function App() {
  const [page, setPage] = useState("menu"); // home | menu | orderType | booking | contact | confirmation

  const [form, setForm] = useState({
    orderType: "table", // "pickup" | "delivery" | "table"
    name: "",
    phone: "",
    date: "",
    slot: "",
    table: "",
    guests: 1,
    items: [],
    address: "",
    location: "", // manual or GPS
  });

  const [errors, setErrors] = useState({ name: "", phone: "" });
  const [cart, setCart] = useState({});
  const [sending, setSending] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [availabilityMsg, setAvailabilityMsg] = useState("");
  const [tableStatus, setTableStatus] = useState(null);
  const [demoBanner, setDemoBanner] = useState(DEMO_MODE);
  const [totalBump, setTotalBump] = useState(0);
  const [paying, setPaying] = useState(false);

  const slots = useMemo(() => generateTimeSlots(), []);

  const isPickup = form.orderType === "pickup";
  const isDelivery = form.orderType === "delivery";
  const isTable = form.orderType === "table";

  // ---------------- Firestore hybrid menu (Option B) ----------------
  // Always call hook (hooks must not be conditional). We will only use items when enabled.
  const fsHook = useFirestoreMenu(); // returns { loading, items, error }
  const useFirestore = (process.env.REACT_APP_USE_FIRESTORE_MENU || "").toLowerCase() === "true";

  // menuToRender prefers Firestore items when enabled and available; falls back to local menuItems
  let menuToRender = typeof menuItems !== "undefined" ? menuItems : [];
  if (useFirestore && !fsHook.loading && Array.isArray(fsHook.items) && fsHook.items.length > 0) {
    menuToRender = fsHook.items;
  }
  // ------------------------------------------------------------------


  // auto hide demo banner
  useEffect(() => {
    if (demoBanner) {
      const t = setTimeout(() => setDemoBanner(false), 6000);
      return () => clearTimeout(t);
    }
  }, [demoBanner]);

  // total calculation
  function getCartTotal() {
    const total = Object.keys(cart).reduce((acc, id) => {
      const item = menuToRender.find((m) => m.id === id) || { price: 0 };
      return acc + item.price * (cart[id] || 0);
    }, 0);
    // always at least booking fee if nothing in cart
    return total || DEFAULT_BOOKING_FEE;
  }
  const total = getCartTotal();

  useEffect(() => setTotalBump((x) => x + 1), [total]);

  // add/remove items
  function addToBooking(id, delta = 1) {
    setCart((prev) => {
      const updated = { ...prev };
      updated[id] = Math.max(0, (updated[id] || 0) + delta);
      if (updated[id] === 0) delete updated[id];

      const itemsList = Object.keys(updated).map((key) => {
        const item = menuToRender.find((m) => m.id === key);
        return `${item.name} x ${updated[key]}`;
      });

      setForm((p) => ({ ...p, items: itemsList }));
      return updated;
    });
  }

  // fetch table availability (only for table bookings)
  async function fetchAvailability(date, slot) {
    if (!date || !slot) return;

    try {
      if (DEMO_MODE) {
        setTableStatus({ "4": 4, "7": 2, "1": 0 });
        return;
      }

      const res = await proxyFetch(
        `${SHEET_ENDPOINT}?action=availability&date=${encodeURIComponent(
          date
        )}&slot=${encodeURIComponent(slot)}`
      );

      if (!res.ok) throw new Error("Proxy failed");

      const parsed = await res.json();
      const tables = parsed?.data?.tables || parsed?.tables || {};
      setTableStatus(tables);
      setAvailabilityMsg("");
    } catch (err) {
      console.error(err);
      setTableStatus(null);
      setAvailabilityMsg("Internal error. Try again.");
    }
  }

  // validations
  const validateName = (v) => /^[A-Za-z ]+$/.test(v);
  const validatePhone = (v) => /^\d{10}$/.test(v);

  // mark payment as paid locally (manual fallback)
  function markBookingPaidLocal() {
    if (!bookingData) return;
    setBookingData({ ...bookingData, payment_status: "Paid" });
    setAvailabilityMsg("✔ Thank you! Payment received.");
  }

  // ------------- ORDER TYPE SELECTION HANDLERS -------------

  function selectPickup() {
    setTableStatus(null);
    setForm((p) => ({
      ...p,
      orderType: "pickup",
      date: "",
      slot: "",
      table: "",
      guests: 1,
      address: "",
      location: "",
    }));
    setPage("booking");
  }

  function selectDelivery() {
    setTableStatus(null);
    setForm((p) => ({
      ...p,
      orderType: "delivery",
      date: "",
      slot: "",
      table: "",
      guests: 1,
      address: "",
      location: "",
    }));
    setPage("booking");
  }

  function selectTableBooking() {
    setForm((p) => ({
      ...p,
      orderType: "table",
      address: "",
      location: "",
    }));
    setPage("booking");
  }

  // ----------- Date formatter (yyyy-mm-dd) -------------
  function formatDate(d) {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts; // input already yyyy-mm-dd
      return `${yyyy}-${mm}-${dd}`;
    }
    return d;
  }

  // ----------- Hybrid GPS: auto-fill current location -----
  function handleUseMyLocation(e) {
    e.preventDefault();
    if (!navigator.geolocation) {
      alert("Location not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const loc = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        setForm((p) => ({ ...p, location: loc }));
      },
      (err) => {
        console.error(err);
        alert("Unable to fetch location. Please type manually.");
      }
    );
  }

  // handle booking submit – now ONLY prepares bookingData, payment done via Razorpay
  async function handleBookingSubmit(e) {
    e.preventDefault();
    setAvailabilityMsg("");

    const nameOk = validateName(form.name);
    const phoneOk = validatePhone(form.phone);

    setErrors({
      name: !nameOk ? "Invalid name" : "",
      phone: !phoneOk ? "Invalid phone" : "",
    });

    if (!nameOk || !phoneOk) return;

    // specific required fields based on orderType
    if (isTable) {
      if (!form.date || !form.slot || !form.table) {
        setAvailabilityMsg("Please fill all required fields.");
        return;
      }
    } else if (isPickup) {
      if (!form.date) {
        setAvailabilityMsg("Please select date for pickup.");
        return;
      }
    } else if (isDelivery) {
      if (!form.address || !form.location) {
        setAvailabilityMsg(
          "Please enter full delivery address and your current location."
        );
        return;
      }
    }

    // Prepare booking data (not yet saved to sheet)
    const prepared = {
      orderType: form.orderType,
      name: form.name,
      phone: form.phone,
      date: isPickup || isTable ? formatDate(form.date) : "",
      slot: isTable ? form.slot : "",
      table: isTable ? form.table : "",
      guests: isTable ? form.guests : "",
      address: isDelivery ? form.address : "",
      location: isDelivery ? form.location : "",
      items: form.items || [],
      amount: total,
      payment_status: "Pending",
    };

    setBookingData(prepared);
    setPage("confirmation");
  }

  // ----------- Razorpay payment + save to Google Sheet & Firestore ----------
  async function startOnlinePayment() {
    if (!bookingData) return;

    if (!window.Razorpay) {
      alert("Payment system not loaded. Please refresh the page or try again.");
      return;
    }

    setPaying(true);

    
const options = {
      key: RAZORPAY_KEY_ID,
      amount: bookingData.amount * 100, // in paise
      currency: "INR",
      name: "Open SkyBridge",
      description: getOrderTypeLabel(bookingData.orderType),
      prefill: {
        name: bookingData.name,
        contact: bookingData.phone,
      },
      handler: async function (response) {
        // Freeze bookingData (in case state changes)
        const bd = { ...bookingData };
        if (!bd || !bd.name) {
          console.error("bookingData missing at payment handler");
          alert("Payment received, but booking data was lost. Please contact support.");
          setPaying(false);
          return;
        }
        try {
          // Build order payload
          const orderData = {
            shopId: DEFAULT_SHOP_ID,
            customerName: bd.name,
            phone: bd.phone,
            orderType: bd.orderType,
            date: bd.date || "",
            slot: bd.slot || "",
            table: bd.table || "",
            guests: bd.guests || "",
            address: bd.address || "",
            location: bd.location || "",
            items: bd.items || [],
            totalAmount: bd.amount,
            paymentStatus: "Paid",
            paymentId: response.razorpay_payment_id || "",
            razorpayOrderId: response.razorpay_order_id || "",
            paymentResponse: response,
          };

          // Save to global orders collection
          const savedOrderId = await saveOrderToFirestore(orderData);
          console.log("Order saved with ID:", savedOrderId);

          // Update UI state and clear cart
          setBookingData((prev) => (prev ? { ...prev, payment_status: "Paid" } : prev));
          try { setCart({}); } catch (e) { /* ignore if not available */ }

          // Redirect to Order Success page
          if (savedOrderId) {
            window.location.href = `/order-success/${savedOrderId}`;
          } else {
            alert("Payment successful but order ID not returned. Check console.");
          }
        } catch (err) {
          console.error("Error saving order after payment:", err);
          alert("Payment completed but saving order failed. Please contact support.");
        } finally {
          setPaying(false);
        }
      },
      modal: {
        ondismiss: function () {
          setPaying(false);
        },
      },
      theme: {
        color: "#ffb400",
      },
    };
const rzp = new window.Razorpay(options);
    rzp.open();
  }

  // ---------------- Render Table Grid ----------------
  function renderTableGrid() {
    if (!tableStatus)
      return (
        <div style={{ textAlign: "center", color: "#666" }}>
          Select a date and slot to see table availability.
        </div>
      );

    const tiles = [];

    for (let i = 1; i <= TABLE_COUNT; i++) {
      const booked = Number(tableStatus[i] || 0);
      const remaining = Math.max(0, TABLE_CAPACITY - booked);
      const full = remaining === 0;

      const status = full
        ? "full"
        : remaining < TABLE_CAPACITY
        ? "partial"
        : "available";

      tiles.push(
        <div
          key={i}
          onClick={() =>
            !full && setForm((p) => ({ ...p, table: String(i) }))
          }
          style={{
            width: 100,
            height: 80,
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: full ? "not-allowed" : "pointer",
            background:
              status === "available"
                ? "#e6fffa"
                : status === "partial"
                ? "#fff7e6"
                : "#ffdede",
            border:
              form.table === String(i)
                ? "3px solid #0366a6"
                : "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            opacity: full ? 0.6 : 1,
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700 }}>Table {i}</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>
              {status === "available" && `✅ ${remaining} seats`}
              {status === "partial" && `⚠️ ${remaining} seats`}
              {status === "full" && "🚫 Full"}
            </div>
            {form.table === String(i) && (
              <div
                style={{
                  fontSize: 10,
                  marginTop: 3,
                  fontWeight: 600,
                  color: "#0366a6",
                }}
              >
                Selected
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
          gap: 12,
          justifyItems: "center",
          marginTop: 15,
          padding: 10,
          border: "1px solid #eee",
          borderRadius: 8,
          background: "#fafafa",
        }}
      >
        {tiles}
      </div>
    );
  }

  // Helper to show order type text on confirmation
  function getOrderTypeLabel(type) {
    if (type === "pickup") return "Ready to Eat in Front of Hotel";
    if (type === "delivery") return "Home Delivery";
    return "Book your Table";
  }

  // ============================================================
  //                        UI RENDER
  // ============================================================

  return (
    <div
      style={{
        fontFamily: "Poppins, system-ui, sans-serif",
        minHeight: "100vh",
        background: "linear-gradient(#eaf6ff, #ffffff)",
      }}
    >
      {/* Banner */}
      {demoBanner && (
        <div
          style={{
            background: "#fff7e6",
            color: "#663c00",
            padding: "10px 16px",
            textAlign: "center",
            fontWeight: 600,
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          Demo mode active.
        </div>
      )}

      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 16,
          background: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
          position: "sticky",
          top: demoBanner ? 40 : 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={imgFallback("/images/logo.png")}
            alt="Open SkyBridge"
            style={{ height: 54, borderRadius: 8 }}
          />
          <div style={{ fontSize: 20, color: "#0366a6", fontWeight: 700 }}>
            Open SkyBridge
          </div>
        </div>

        <nav style={{ display: "flex", gap: 18 }}>
          <button onClick={() => setPage("home")} className="tabBtn">
            Home
          </button>
          <button onClick={() => setPage("menu")} className="tabBtn">
            Menu
          </button>
          <button onClick={selectTableBooking} className="tabBtn">
            Book Table
          </button>
          <button onClick={() => setPage("contact")} className="tabBtn">
            Contact
          </button>
        </nav>
      </header>

      {/* HOME PAGE */}
      {page === "home" && (
        <div style={{ padding: "40px 16px", textAlign: "center" }}>
          <h2 style={{ color: "#0366a6" }}>Welcome to Open SkyBridge</h2>
          <p
            style={{
              color: "#444",
              maxWidth: 720,
              margin: "10px auto",
            }}
          >
            Reserve your table, pre-order your favourites.
          </p>
          <button
            onClick={selectTableBooking}
            style={{
              background: "#ffb400",
              padding: "10px 16px",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
            }}
          >
            Book your Table
          </button>
        </div>
      )}

      {/* MENU PAGE */}
      {page === "menu" && (
        <div style={{ padding: "30px 16px", maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", color: "#0366a6" }}>Our Menu</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 18,
              marginTop: 20,
            }}
          >
            {menuToRender.map((m) => (
              <div
                key={m.id}
                style={{
                  position: "relative",
                  borderRadius: 12,
                  overflow: "hidden",
                  minHeight: 220,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                }}
              >
                <img
                  src={imgFallback(m.img)}
                  alt={m.name}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.15))",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    bottom: 16,
                    right: 16,
                    color: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>
                        {m.name}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          opacity: 0.9,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span>₹{m.price}</span>
                        {m.video && (
                          <a
                            href={m.video}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: "#ffb400",
                              padding: "4px 8px",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#000",
                              textDecoration: "none",
                              boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
                            }}
                          >
                            ▶ Watch Video
                          </a>
                        )}
                      </div>
                    </div>

                    {cart[m.id] ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <button
                          onClick={() => addToBooking(m.id, -1)}
                          className="qtyBtn"
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 700 }}>{cart[m.id]}</span>
                        <button
                          onClick={() => addToBooking(m.id, 1)}
                          className="qtyBtn"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToBooking(m.id, 1)}
                        style={{
                          background: "#ffb400",
                          padding: "10px 16px",
                          borderRadius: 10,
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ORDER TYPE PAGE */}
      {page === "orderType" && (
        <div
          style={{
            padding: "40px 16px",
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          <h2 style={{ textAlign: "center", color: "#0366a6" }}>
            How would you like your order?
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
              marginTop: 30,
            }}
          >
            {/* OPTION 1: Ready to Eat in Front of Hotel */}
            <div
              onClick={selectPickup}
              style={{
                cursor: "pointer",
                background: "#fff",
                borderRadius: 12,
                padding: 20,
                boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
                border: "2px solid #ffb400",
              }}
            >
              <h3 style={{ margin: 0, color: "#ff9800" }}>
                Ready to Eat in Front of Hotel
              </h3>
              <p style={{ marginTop: 10, color: "#555" }}>
                Order food and enjoy it sitting or standing in front of the
                hotel. No table reservation needed.
              </p>
            </div>

            {/* OPTION 2: Home Delivery */}
            <div
              onClick={selectDelivery}
              style={{
                cursor: "pointer",
                background: "#fff",
                borderRadius: 12,
                padding: 20,
                boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
              }}
            >
              <h3 style={{ margin: 0, color: "#2196f3" }}>Home Delivery</h3>
              <p style={{ marginTop: 10, color: "#555", lineHeight: 1.6 }}>
                If your order value is below ₹100, a delivery charge of ₹20–₹35
                will apply.
                <br />
                If your order value is ₹100 or above, a delivery charge of ₹1–₹10
                will apply.
                <br />
                These charges apply for deliveries within 0–1 km from 2nd Main
                Road, Aswath Nagar, Marathahalli.
              </p>
            </div>

            {/* OPTION 3: Book your Table */}
            <div
              onClick={selectTableBooking}
              style={{
                cursor: "pointer",
                background: "#fff",
                borderRadius: 12,
                padding: 20,
                boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
              }}
            >
              <h3 style={{ margin: 0, color: "#4caf50" }}>Book your Table</h3>
              <p style={{ marginTop: 10, color: "#555" }}>
                Reserve a table inside the restaurant, choose time slot and
                pre-order your favourites.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING PAGE (3 MODES INSIDE) */}
      {page === "booking" && (
        <div style={{ padding: "30px 16px", maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", color: "#0366a6" }}>
            {isPickup && "Ready to Eat in Front of Hotel"}
            {isDelivery && "Home Delivery"}
            {isTable && "Book Your Table"}
          </h2>

          {/* FORM */}
          <form
            onSubmit={handleBookingSubmit}
            style={{
              marginTop: 18,
              background: "#fff",
              padding: 18,
              borderRadius: 10,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
          >
            {/* NAME */}
            <label>👤 Full Name</label>
            <input
              required
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) => {
                const v = e.target.value;
                setForm({ ...form, name: v });
                setErrors((p) => ({
                  ...p,
                  name: v && !validateName(v) ? "Invalid name" : "",
                }));
              }}
              className="input"
              style={{
                width: "100%",
                padding: 10,
                marginTop: 6,
                borderRadius: 8,
                border: errors.name
                  ? "1px solid #e53935"
                  : "1px solid #e6e6e6",
              }}
            />
            {errors.name && (
              <div style={{ color: "#e53935", fontSize: 12 }}>
                {errors.name}
              </div>
            )}

            {/* PHONE */}
            <label>📞 Phone Number</label>
            <input
              required
              placeholder="Enter 10-digit phone"
              value={form.phone}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                setForm({ ...form, phone: v });
                setErrors((p) => ({
                  ...p,
                  phone: v && !validatePhone(v) ? "Invalid phone" : "",
                }));
              }}
              maxLength={10}
              className="input"
              style={{
                width: "100%",
                padding: 10,
                marginTop: 6,
                borderRadius: 8,
                border: errors.phone
                  ? "1px solid #e53935"
                  : "1px solid #e6e6e6",
              }}
            />
            {errors.phone && (
              <div style={{ color: "#e53935", fontSize: 12 }}>
                {errors.phone}
              </div>
            )}

            {/* DATE (Pickup + Table) */}
            {(isPickup || isTable) && (
              <div style={{ marginTop: 10 }}>
                <label>📅 Select Date</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => {
                    setForm({ ...form, date: e.target.value });
                    if (isTable) setTableStatus(null);
                  }}
                  className="input"
                  style={{
                    width: "100%",
                    padding: 10,
                    marginTop: 6,
                    borderRadius: 8,
                    border: "1px solid #e6e6e6",
                  }}
                />
              </div>
            )}

            {/* TABLE BOOKING ONLY FIELDS */}
            {isTable && (
              <>
                <div style={{ marginTop: 10 }}>
                  <label>⏰ Select Time Slot</label>
                  <select
                    required
                    value={form.slot}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setForm((p) => ({ ...p, slot: val, table: "" }));
                      setTableStatus(null);
                      await fetchAvailability(form.date, val);
                    }}
                    className="input"
                    style={{
                      width: "100%",
                      padding: 10,
                      marginTop: 6,
                      borderRadius: 8,
                      border: "1px solid #e6e6e6",
                    }}
                  >
                    <option value="">Select Slot</option>
                    {slots.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Guests */}
                <label style={{ marginTop: 10 }}>
                  👥 Number of Guests (Max {TABLE_CAPACITY})
                </label>
                <input
                  required
                  type="number"
                  min={1}
                  max={TABLE_CAPACITY}
                  value={form.guests}
                  onChange={(e) =>
                    setForm({ ...form, guests: Number(e.target.value) })
                  }
                  className="input"
                  style={{
                    width: "100%",
                    padding: 10,
                    marginTop: 6,
                    borderRadius: 8,
                    border: "1px solid #e6e6e6",
                  }}
                />

                {/* Table Selection */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>
                    🪑 Select Table
                  </div>
                  {renderTableGrid()}
                </div>

                {/* Confirm Table */}
                <label>🪑 Confirm Table Number</label>
                <select
                  required
                  value={form.table}
                  onChange={(e) =>
                    setForm({ ...form, table: e.target.value })
                  }
                  className="input"
                  style={{
                    width: "100%",
                    padding: 10,
                    marginTop: 6,
                    borderRadius: 8,
                    border: "1px solid #e6e6e6",
                  }}
                >
                  <option value="">Select Table</option>
                  {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map(
                    (n) => {
                      const booked = tableStatus
                        ? Number(tableStatus[n] || 0)
                        : 0;
                      const remaining = Math.max(
                        0,
                        TABLE_CAPACITY - booked
                      );
                      if (booked >= TABLE_CAPACITY) return null;
                      return (
                        <option key={n} value={n}>
                          Table {n} — {remaining} seats left
                        </option>
                      );
                    }
                  )}
                </select>
              </>
            )}

            {/* DELIVERY ONLY FIELDS */}
            {isDelivery && (
              <>
                <div style={{ marginTop: 10 }}>
                  <label>🏠 Full Delivery Address</label>
                  <textarea
                    required
                    placeholder="Flat / House No., Street, Area, City, Pincode"
                    value={form.address}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, address: e.target.value }))
                    }
                    rows={3}
                    style={{
                      width: "100%",
                      padding: 10,
                      marginTop: 6,
                      borderRadius: 8,
                      border: "1px solid #e6e6e6",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ marginTop: 10 }}>
                  <label>📍 Your Current Location</label>
                  <input
                    required
                    placeholder="Nearby location / landmark or GPS lat,long"
                    value={form.location}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, location: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: 10,
                      marginTop: 6,
                      borderRadius: 8,
                      border: "1px solid #e6e6e6",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    style={{
                      marginTop: 8,
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "none",
                      background: "#1976d2",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    📍 Auto-Fill GPS Location
                  </button>
                </div>
              </>
            )}

            {/* Pre-Ordered Items */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700 }}>Pre-ordered Items</div>
              <div style={{ marginTop: 8 }}>
                {Object.keys(cart).length === 0 && (
                  <div style={{ color: "#555" }}>
                    No pre-orders selected. Total: ₹{DEFAULT_BOOKING_FEE}
                  </div>
                )}
                {Object.keys(cart).map((id) => {
                  const item = menuToRender.find((m) => m.id === id) || { price: 0 };
                  return (
                    <div
                      key={id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                        padding: 6,
                        borderBottom: "1px dashed #eee",
                      }}
                    >
                      <span>
                        {cart[id]} x {item.name}{" "}
                        <span style={{ opacity: 0.7 }}>
                          (₹{item.price * cart[id]})
                        </span>
                      </span>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => addToBooking(id, -1)}
                          className="qtyBtn"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => addToBooking(id, 1)}
                          className="qtyBtn"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* messages */}
            {availabilityMsg && (
              <div
                style={{
                  color: "#b00020",
                  marginTop: 10,
                }}
              >
                {availabilityMsg}
              </div>
            )}

            {/* Submit Button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 18,
                paddingTop: 10,
                borderTop: "1px solid #eee",
              }}
            >
              <div>
                <div style={{ color: "#666" }}>Total Amount to Pay</div>
                <div
                  key={totalBump}
                  style={{
                    fontWeight: 800,
                    fontSize: 22,
                    animation: "bump 350ms ease",
                  }}
                >
                  ₹{total}
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                style={{
                  background: "#ffb400",
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {sending ? "Processing..." : "Proceed to Pay"}
              </button>
            </div>

            <style>{`
              @keyframes bump {
                0% { transform: scale(1); }
                30% { transform: scale(1.15); }
                100% { transform: scale(1); }
              }
            `}</style>
          </form>
        </div>
      )}

      {/* CONTACT PAGE */}
      {page === "contact" && (
        <div
          style={{
            padding: "40px 16px",
            maxWidth: 600,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#0366a6" }}>Contact Us</h2>
          <p style={{ color: "#444" }}>📍 Open SkyBridge</p>
          <p style={{ color: "#444" }}>📞 987878787</p>
        </div>
      )}

      {/* CONFIRMATION PAGE */}
      {page === "confirmation" && bookingData && (
        <div
          style={{
            padding: "40px 16px",
            maxWidth: 700,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: 28,
              color:
                bookingData.payment_status === "Paid" ? "#28a745" : "#0366a6",
            }}
          >
            🎉 Booking Saved
          </h2>

          <p style={{ marginTop: 6, fontSize: 18 }}>
            {getOrderTypeLabel(bookingData.orderType)}
          </p>

          <p style={{ marginTop: 4, fontSize: 16 }}>
            Your reservation / order has been recorded.
          </p>

          {/* Booking card */}
          <div
            style={{
              marginTop: 25,
              padding: 25,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 0 12px rgba(0,0,0,0.1)",
              textAlign: "left",
            }}
          >
            <p>
              <b>Name:</b> {bookingData.name}
            </p>
            <p>
              <b>Phone:</b> {bookingData.phone}
            </p>
            <p>
              <b>Order Type:</b> {getOrderTypeLabel(bookingData.orderType)}
            </p>

            {bookingData.orderType === "table" && (
              <>
                <p>
                  <b>Date & Time:</b> {bookingData.date} at {bookingData.slot}
                </p>
                <p>
                  <b>Table:</b> {bookingData.table}
                </p>
                <p>
                  <b>Guests:</b> {bookingData.guests}
                </p>
              </>
            )}

            {bookingData.orderType === "pickup" && (
              <p>
                <b>Pickup Date:</b> {bookingData.date}
              </p>
            )}

            {bookingData.orderType === "delivery" && (
              <>
                <p>
                  <b>Delivery Address:</b> {bookingData.address}
                </p>
                <p>
                  <b>Your Current Location:</b> {bookingData.location}
                </p>
              </>
            )}

            <p>
              <b>Pre-ordered Items:</b>
            </p>
            <ul>
              {bookingData.items && bookingData.items.length > 0 ? (
                bookingData.items.map((it, idx) => <li key={idx}>{it}</li>)
              ) : (
                <li>(No food — only ₹{DEFAULT_BOOKING_FEE} booking fee)</li>
              )}
            </ul>

            <p
              style={{
                fontWeight: 700,
                marginTop: 15,
                borderTop: "1px dashed #ccc",
                paddingTop: 10,
              }}
            >
              Total Payment: ₹{bookingData.amount}
            </p>
          </div>

          {/* PAYMENT SECTION */}
          <div
            style={{
              marginTop: 30,
              padding: 20,
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            }}
          >
            <h3>💳 Online Payment (Razorpay)</h3>

            <p style={{ marginTop: 10, fontSize: 18 }}>
              Pay securely using UPI, Card, NetBanking or Wallet.
            </p>

            <button
              type="button"
              onClick={startOnlinePayment}
              disabled={paying || bookingData.payment_status === "Paid"}
              style={{
                display: "inline-block",
                marginTop: 15,
                background:
                  bookingData.payment_status === "Paid" ? "#4caf50" : "#007bff",
                padding: "12px 25px",
                borderRadius: 8,
                color: "white",
                border: "none",
                cursor:
                  paying || bookingData.payment_status === "Paid"
                    ? "default"
                    : "pointer",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {bookingData.payment_status === "Paid"
                ? "✔ Payment Completed"
                : paying
                ? "Processing..."
                : "Pay Now"}
            </button>

            {/* Optional: show QR for manual UPI as backup */}
            <div style={{ marginTop: 20 }}>
              <p style={{ marginBottom: 8, fontSize: 14, color: "#666" }}>
                Or scan this UPI QR and pay manually:
              </p>
              <img
                src="/images/upi_qr.png"
                alt="UPI QR"
                style={{
                  width: 220,
                  margin: "10px auto",
                  display: "block",
                }}
              />
              <p style={{ fontSize: 14 }}>
                UPI ID: <b>{UPI_ID}</b>
              </p>
            </div>

            <div style={{ marginTop: 12 }}>
              {bookingData.payment_status === "Paid" ? (
                <p style={{ color: "#28a745", fontWeight: 700 }}>
                  ✔ Thank you! Payment received.
                </p>
              ) : (
                <>
                  <p style={{ color: "#b00020", fontWeight: 700 }}>
                    ⚠ Please complete your online payment to confirm the order.
                  </p>
                  <button
                    type="button"
                    onClick={markBookingPaidLocal}
                    style={{
                      marginTop: 10,
                      background: "#28a745",
                      color: "#fff",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    I Paid by UPI — Mark as Paid
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Return */}
          <button
            onClick={() => {
              setPage("menu");
              setBookingData(null);
            }}
            style={{
              marginTop: 25,
              padding: "12px 25px",
              borderRadius: 8,
              background: "#0056b3",
              color: "white",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Return to Menu
          </button>
        </div>
      )}

      {/* Floating Cart */}
      {Object.keys(cart).length > 0 && page === "menu" && (
        <button
          onClick={() => setPage("orderType")}
          style={{
            position: "fixed",
            left: "50%",
            bottom: 20,
            transform: "translateX(-50%)",
            background: "#ffb400",
            padding: "14px 22px",
            borderRadius: 999,
            fontWeight: 700,
            cursor: "pointer",
            border: "none",
            boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
            zIndex: 1000,
          }}
        >
          🛒 View Order Summary — ₹{total}
        </button>
      )}
    </div>
  );
}

// small CSS helpers
const style = document.createElement("style");
style.innerHTML = `
.tabBtn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #333;
}
.qtyBtn {
  background: #fff;
  border: 1px solid #ccc;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
}
`;
document.head.appendChild(style);
