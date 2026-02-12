import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate, useParams } from "react-router-dom";

// Phone validation helper
const isValidPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 13;
};

export default function CartPage() {
  const { cart, updateQty, removeItem, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { shopId } = useParams();

  const hasOutOfStockInCart = cart.some(item => item.inStock === false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    orderType: "delivery",
    address: "",
    table: "",
  });

  const [loading, setLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);

  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    script.onerror = () => console.error("Razorpay SDK failed to load");
    document.body.appendChild(script);
  }, []);

  if (!shopId) {
    return <p>Shop not found. Please scan QR again.</p>;
  }

  const handlePlaceOrder = async () => {
    try {
      if (!razorpayReady) {
        alert("Payment system not ready. Please wait.");
        return;
      }

      if (!form.name || !form.phone) {
        alert("Please enter name and phone");
        return;
      }

      if (!isValidPhone(form.phone)) {
        alert("Please enter valid phone number");
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
      const internalOrderId = `ord_${Date.now()}`;

      const res = await fetch(
        "https://createrazorpayorderv2-lfjp2mpsfq-uc.a.run.app",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountInPaise,
            shopId,
            orderId: internalOrderId,
            totalAmount: cartTotal,
            items: cart,
            orderType: form.orderType,
            customer: {
              name: form.name,
              phone: form.phone,
              address: form.address || "",
              table: form.table || "",
            },
          }),
        }
      );

      const data = await res.json();
      const razorpayOrderId = data.orderId || data.order_id;

      if (!razorpayOrderId) {
        alert("Failed to create payment order");
        setLoading(false);
        return;
      }

      const options = {
        key: "rzp_live_RxcI5fmze5rBwM",
        amount: amountInPaise,
        currency: "INR",
        order_id: razorpayOrderId,
        name: "SkyBridge",
        handler: async function (response) {
          try {
            const verifyRes = await fetch(
              "https://asia-south1-skybridge-vendor.cloudfunctions.net/razorpayCallbackV2",
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
            console.error("Verification failed", e);
            alert("Payment verification failed");
          }
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      setLoading(false);
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed");
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h2>Your Cart</h2>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        cart.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              background: "#fff",
              padding: 12,
              borderRadius: 10,
              marginBottom: 14,
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <div>
              <h4 style={{ margin: 0 }}>{item.name}</h4>
              <p style={{ margin: 0 }}>₹{item.price}</p>

              <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
                <button
                  onClick={() => updateQty(item.id, item.qty - 1)}
                  disabled={item.qty <= 1}
                >
                  -
                </button>

                <span style={{ fontWeight: 700 }}>{item.qty}</span>

                <button
                  onClick={() => updateQty(item.id, item.qty + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <b>₹{item.price * item.qty}</b>
              <br />
              <button
                onClick={() => removeItem(item.id)}
                style={{
                  marginTop: 8,
                  background: "red",
                  color: "white",
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))
      )}

      <hr />
      <h3>Total: ₹{cartTotal}</h3>

      {cart.length > 0 && (
        <>
          <div style={{ marginTop: 20, padding: 20, border: "1px solid #ddd", borderRadius: 8 }}>
            <h3>Customer Details</h3>

            <input
              type="text"
              placeholder="Your Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: "100%", padding: 8, marginBottom: 10 }}
            />

            <input
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={{ width: "100%", padding: 8, marginBottom: 10 }}
            />

            <select
              value={form.orderType}
              onChange={(e) =>
                setForm({ ...form, orderType: e.target.value })
              }
              style={{ width: "100%", padding: 8, marginBottom: 10 }}
            >
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
              <option value="dinein">Dine-in</option>
            </select>

            {form.orderType === "delivery" && (
              <input
                type="text"
                placeholder="Delivery Address"
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
                style={{ width: "100%", padding: 8, marginBottom: 10 }}
              />
            )}

            {form.orderType === "dinein" && (
              <input
                type="text"
                placeholder="Table Number"
                value={form.table}
                onChange={(e) =>
                  setForm({ ...form, table: e.target.value })
                }
                style={{ width: "100%", padding: 8, marginBottom: 10 }}
              />
            )}
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loading || hasOutOfStockInCart}
            style={{
              background: "#0366d6",
              color: "white",
              padding: 12,
              borderRadius: 8,
              border: "none",
              width: "100%",
              fontWeight: 700,
              marginTop: 15,
            }}
          >
            {loading ? "Processing..." : "Pay & Place Order"}
          </button>
        </>
      )}
    </div>
  );
}
