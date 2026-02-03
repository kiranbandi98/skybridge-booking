
import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate, useParams } from "react-router-dom";


// ✅ Phone validation helper (REQUIRED)
const isValidPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 13;
};
export default function CheckoutPage() {
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
    if (window.Razorpay) {
      setRazorpayReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Razorpay SDK loaded');
      setRazorpayReady(true);
    };
    script.onerror = () => {
      console.error('❌ Razorpay SDK failed to load');
    };
    document.body.appendChild(script);
  }, []);

  const handlePlaceOrder = async () => {
    try {
      if (!razorpayReady) {
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

      if (!isValidPhone(form.phone)) {
        alert("Please enter a valid 10-digit phone number");
        setLoading(false);
        return;
      }

      const amountInPaise = cartTotal * 100;
      console.log("🧪 Creating Razorpay order:", amountInPaise);

      // Create Razorpay order from backend
      const res = await fetch(
         "https://createrazorpayorderv2-lfjp2mpsfq-uc.a.run.app", 
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

        key: "rzp_live_RxcI5fmze5rBwM",
        amount: amountInPaise,
        currency: "INR",         // ✅ REQUIRED

        order_id: razorpayOrderId,
        name: "SkyBridge",
        handler: async function (response) {
          try {
            const verifyRes = await fetch(
              "https://razorpaycallbackv2-lfjp2mpsfq-uc.a.run.app/razorpayCallbackV2",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              }
            );

            const verifyData = await verifyRes.json();

            if (verifyData.redirectUrl) {
              clearCart();
              window.location.href = verifyData.redirectUrl;
            } else {
              throw new Error("No redirect URL from server");
            }
          } catch (e) {
            console.error("❌ Verification failed", e);
            alert("Payment verification failed");
          }
        },
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