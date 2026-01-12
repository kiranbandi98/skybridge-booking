
import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate, useParams } from "react-router-dom";
import { saveOrderToFirestore } from "../utils/saveOrder";
import { getFirestore } from "firebase/firestore";


// ✅ Phone validation helper (REQUIRED)
const isValidPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 13;
};
export default function CheckoutPage() {
  const db = getFirestore();
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { shopId } = useParams();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    orderType: "delivery",
    address: "",
    table: "",
  });

  const [loading, setLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);

  // Load Razorpay SDK once
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      console.log("✅ Razorpay SDK loaded");
      setRazorpayReady(true);
    };

    script.onerror = () => {
      console.error("❌ Razorpay SDK failed to load");
    };

    document.body.appendChild(script);
  }, []);

  const handlePlaceOrder = async () => {
    try {
      if (!razorpayReady || !window.Razorpay) {
        alert("Payment system not ready. Please wait and try again.");
        return;
      }

      if (!form.name || !form.phone) {
        alert("Please enter name and phone");
        return;
      }

      if (cart.length === 0) {
        alert("Cart is empty");
        return;
      }

      if (form.orderType === "delivery" && !form.address) {
        alert("Please enter delivery address");
        return;
      }

      setLoading(true);

      const amountInPaise = cartTotal * 100;
      console.log("🧪 Creating Razorpay order:", amountInPaise);

      // Create Razorpay order from backend
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/create-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amountInPaise }),
        }
      );

      const data = await res.json();
      const razorpayOrderId = data.orderId || data.order_id;

      if (!razorpayOrderId) {
        alert("Failed to create payment order");
        setLoading(false);
        return;
      }

      console.log("✅ Razorpay order created:", razorpayOrderId);

      const safeContact = String(form.phone || "")
        .replace(/\D/g, "")
        .slice(-10);

      
    if (!isValidPhone(form.phone)) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    const options = {

        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: amountInPaise,   // ✅ REQUIRED
        currency: "INR",         // ✅ REQUIRED

        order_id: razorpayOrderId,
        name: "SkyBridge",
        description: "Food Order",
        handler: async function (response) {
          try {
            await fetch(
              "https://us-central1-skybridge-vendor.cloudfunctions.net/razorpayCallback",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              }
            );

            await saveOrderToFirestore({
              db,
              shopId,
              cart,
              total: cartTotal,
              customer: form,
              paymentMode: "razorpay",
              paymentStatus: "Paid",
              razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
            });

            clearCart();
            navigate(`/order-success/${shopId}/${razorpayOrderId}`);
          } catch (e) {
            console.error("❌ Verification failed", e);
            alert("Payment verification failed");
          }
        },
        theme: { color: "#0A64F9" },
      };
      console.log("RZP OPTIONS BEFORE OPEN", options);

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      setLoading(false);
    } catch (err) {
      console.error("❌ Payment error:", err);
      alert("Payment failed");
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h2>Checkout</h2>

      <div style={box}>
        <label>Name</label>
        <input
          style={input}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <label>Phone</label>
        <input
          style={input}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <label>Order Type</label>
        <select
          style={input}
          value={form.orderType}
          onChange={(e) =>
            setForm({ ...form, orderType: e.target.value })
          }
        >
          <option value="delivery">Delivery</option>
          <option value="pickup">Pickup</option>
          <option value="dinein">Dine-in</option>
        </select>

        {form.orderType === "delivery" && (
          <>
            <label>Address</label>
            <input
              style={input}
              value={form.address}
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
            />
          </>
        )}

        {form.orderType === "dinein" && (
          <>
            <label>Table Number</label>
            <input
              style={input}
              value={form.table}
              onChange={(e) =>
                setForm({ ...form, table: e.target.value })
              }
            />
          </>
        )}
      </div>

      <div style={box}>
        <h3>Order Summary</h3>
        {cart.map((item, i) => (
          <p key={i}>
            {item.name} × {item.qty} — ₹{item.price * item.qty}
          </p>
        ))}
        <h3>Total: ₹{cartTotal}</h3>
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={loading}
        style={{
          width: "100%",
          background: "#0366d6",
          color: "white",
          padding: 12,
          borderRadius: 8,
          border: "none",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {loading ? "Processing..." : "Pay & Place Order"}
      </button>
    </div>
  );
}

const box = {
  background: "white",
  padding: 20,
  borderRadius: 10,
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  marginBottom: 20,
};

const input = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  marginBottom: 12,
};