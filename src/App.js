// App.js — Version A (Exact UI + Behavior)
// Fully corrected, UPI-fixed, desktop-friendly, QR working.

import React, { useMemo, useState, useEffect } from "react";

// ---------------- CONFIG ----------------
const SHEET_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbx9CRi6Rr57yUbGRxjDlIMaXEFWaQbn8-tquKMtU7cW2YXA06pfvGiRdNrA09feU2XL/exec";

const PROXY_PREFIX =
  "https://google-proxy-0t98.onrender.com/proxy?url=";

const UPI_ID = "kirankumarreddy172003@oksbi";
const DEFAULT_BOOKING_FEE = 50;
const TABLE_COUNT = 15;
const TABLE_CAPACITY = 4;
const DEMO_MODE = false;
// ----------------------------------------

const menuItems = [
  { id: "biriyani", name: "Basha bhai Chicken Biryani", price: 150, img: "/images/biryani_feast2.jpg.png" },
  { id: "lollipop", name: "Chicken Lollipop", price: 150, img: "/images/cl.jpg" },
  { id: "ragi", name: "Ragi mudde", price: 100, img: "/images/ragimudde.jpg.jpg" },
  { id: "vegfr", name: "Veg Fried Rice", price: 80, img: "/images/veggfriedrice.jpg" },
  { id: "chickfr", name: "Chicken Fried Rice", price: 100, img: "/images/chickenfriedrice.jpeg" },
  { id: "noodles", name: "Chicken Noodles", price: 100, img: "/images/cn.png" },
  { id: "tea", name: "Tea", price: 30, img: "/images/tea.png" },
  { id: "ice", name: "Ice Cream", price: 120, img: "/images/icecream.jpg" }, // fixed
  { id: "cake", name: "Cake Items", price: 120, img: "/images/cake.png" },
  { id: "bulking", name: "Bulking juice", price: 120, img: "/images/bulkingjuice.png" },
  { id: "dosa", name: "Dosa with chicken curry", price: 100, img: "/images/dosa.png" },
];

// ---------------- Helpers ----------------

function generateTimeSlots() {
  const slots = [];
  for (let hour = 16; hour <= 23; hour++) {
    for (let min of [0, 30]) {
      slots.push(`${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
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
  const [page, setPage] = useState("menu");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    slot: "",
    table: "",
    guests: 1,
    items: [],
  });
  const [errors, setErrors] = useState({ name: "", phone: "" });
  const [cart, setCart] = useState({});
  const [sending, setSending] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [availabilityMsg, setAvailabilityMsg] = useState("");
  const [tableStatus, setTableStatus] = useState(null);
  const [demoBanner, setDemoBanner] = useState(DEMO_MODE);
  const [totalBump, setTotalBump] = useState(0);

  const slots = useMemo(() => generateTimeSlots(), []);

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
      const item = menuItems.find((m) => m.id === id);
      return acc + item.price * (cart[id] || 0);
    }, 0);
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
        const item = menuItems.find((m) => m.id === key);
        return `${item.name} x ${updated[key]}`;
      });

      setForm((p) => ({ ...p, items: itemsList }));
      return updated;
    });
  }

  // fetch table availability
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

  // mark payment as paid locally
  function markBookingPaidLocal() {
    if (!bookingData) return;
    setBookingData({ ...bookingData, payment_status: "Paid" });
    setAvailabilityMsg("Marked as Paid locally.");
  }

  // handle booking
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

    if (!form.date || !form.slot || !form.table) {
      setAvailabilityMsg("Please fill all required fields.");
      return;
    }

    setSending(true);

    const payload = {
      action: "book",
      ...form,
      amount: total,
      payment_status: "Pending",
      cart,
    };

    try {
      let result;

      if (DEMO_MODE) {
        await new Promise((r) => setTimeout(r, 800));
        result = { result: "success", data: payload };
      } else {
        const response = await proxyFetch(SHEET_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`Status ${response.status}`);

        result = await response.json();
      }

      if (result.result === "success") {
        const data = result.data || payload;
        setBookingData(data);

        // mobile only → open UPI app
        if (/Android|iPhone/i.test(navigator.userAgent)) {
          const upiLink =
            `upi://pay?pa=${encodeURIComponent(UPI_ID)}` +
            `&pn=${encodeURIComponent("Open SkyBridge")}` +
            `&am=${encodeURIComponent(total)}` +
            `&cu=INR` +
            `&tn=${encodeURIComponent("Table Booking")}`;
          window.location.href = upiLink;
        }

        setPage("confirmation");
      } else {
        setAvailabilityMsg(result.message || "Server error.");
      }
    } catch (err) {
      console.error(err);
      setAvailabilityMsg("Internal connection error.");
    }

    setSending(false);
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
              {status === "full" && `🚫 Full`}
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
          <button onClick={() => setPage("booking")} className="tabBtn">
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
            onClick={() => setPage("booking")}
            style={{
              background: "#ffb400",
              padding: "10px 16px",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
            }}
          >
            Book a Table
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
            {menuItems.map((m) => (
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
                      <div style={{ marginTop: 6, opacity: 0.9 }}>
                        ₹{m.price}
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

      {/* BOOKING PAGE */}
      {page === "booking" && (
        <div style={{ padding: "30px 16px", maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", color: "#0366a6" }}>
            Book Your Table
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

            {/* DATE + SLOT */}
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <label>📅 Select Date</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => {
                    setForm({ ...form, date: e.target.value });
                    setTableStatus(null);
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

              <div style={{ flex: 1 }}>
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
            </div>

            {/* Guests */}
            <label>👥 Number of Guests (Max {TABLE_CAPACITY})</label>
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

            {/* Pre-Ordered Items */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700 }}>Pre-ordered Items</div>
              <div style={{ marginTop: 8 }}>
                {Object.keys(cart).length === 0 && (
                  <div style={{ color: "#555" }}>
                    No pre-orders selected. Total: ₹
                    {DEFAULT_BOOKING_FEE}
                  </div>
                )}
                {Object.keys(cart).map((id) => {
                  const item = menuItems.find((m) => m.id === id);
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
                <div style={{ color: "#666" }}>
                  Total Amount to Pay Now
                </div>
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
                {sending ? "Processing..." : "Confirm & Pay"}
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
                bookingData.payment_status === "Paid"
                  ? "#28a745"
                  : "#0366a6",
            }}
          >
            🎉 Booking Saved
          </h2>

          <p style={{ marginTop: 10, fontSize: 18 }}>
            Your reservation has been recorded.
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
              <b>Date & Time:</b> {bookingData.date} at{" "}
              {bookingData.slot}
            </p>
            <p>
              <b>Table:</b> {bookingData.table}
            </p>
            <p>
              <b>Guests:</b> {bookingData.guests}
            </p>

            <p>
              <b>Pre-ordered Items:</b>
            </p>
            <ul>
              {bookingData.items && bookingData.items.length > 0 ? (
                bookingData.items.map((it, idx) => (
                  <li key={idx}>{it}</li>
                ))
              ) : (
                <li>
                  (No food — only ₹{DEFAULT_BOOKING_FEE} booking fee)
                </li>
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
              Total Payment Due: ₹{bookingData.amount}
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
            <h3>💳 UPI Payment</h3>
            <p style={{ marginTop: 10, fontSize: 18 }}>
              Pay to UPI ID: <b>{UPI_ID}</b>
            </p>
            <p style={{ marginTop: 5 }}>Scan the QR to Pay</p>

            <img
              src="/images/upi_qr.png"
              alt="UPI QR"
              style={{
                width: 220,
                margin: "15px auto",
                display: "block",
              }}
            />

            <p style={{ fontSize: 20, marginTop: 10 }}>
              Amount: <b>₹{bookingData.amount}</b>
            </p>

            {/* Pay Now (mobile only) */}
            <a
              href={`upi://pay?pa=${encodeURIComponent(
                UPI_ID
              )}&pn=${encodeURIComponent(
                "Open SkyBridge"
              )}&tn=${encodeURIComponent(
                "Table Booking"
              )}&am=${bookingData.amount}&cu=INR`}
              style={{
                display: "inline-block",
                marginTop: 15,
                background: "#007bff",
                padding: "12px 25px",
                borderRadius: 8,
                color: "white",
                textDecoration: "none",
                fontSize: 18,
              }}
            >
              Pay Now
            </a>

            <div style={{ marginTop: 12 }}>
              {bookingData.payment_status === "Paid" ? (
                <p style={{ color: "#28a745", fontWeight: 700 }}>
                  ✔ Payment received — booking is confirmed!
                </p>
              ) : (
                <>
                  <p style={{ color: "#b00020", fontWeight: 700 }}>
                    ⚠ Please complete your UPI payment.
                  </p>
                  <button
                    onClick={markBookingPaidLocal}
                    style={{
                      marginTop: 10,
                      background: "#28a745",
                      color: "#fff",
                      border: "none",
                      padding: "10px 16px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    I Paid — Mark as Paid
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
          onClick={() => setPage("booking")}
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

