import React from "react";
import { useCart } from "../context/CartContext";
import { useNavigate, useParams } from "react-router-dom";

export default function CartPage() {
  const { cart, updateQty, removeItem, cartTotal } = useCart();
  const hasOutOfStockInCart = cart.some(item => item.inStock === false);
  const navigate = useNavigate();
  const { shopId } = useParams(); // ✅ REQUIRED

  // Safety check (optional but recommended)
  if (!shopId) {
    return <p>Shop not found. Please go back and scan QR again.</p>;
  }

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
                  style={qtyBtn}
                  disabled={item.qty <= 1}
                >
                  -
                </button>

                <span style={{ fontWeight: 700 }}>{item.qty}</span>

                <button
                  onClick={() => updateQty(item.id, item.qty + 1)}
                  style={qtyBtn}
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
          <button
            onClick={() => navigate(`/checkout/${shopId}`)} // ✅ FIXED
            disabled={hasOutOfStockInCart}
            style={{
              background: hasOutOfStockInCart ? "#6c757d" : "#0366d6",
              color: "white",
              padding: "12px 20px",
              borderRadius: 8,
              border: "none",
              cursor: hasOutOfStockInCart ? "not-allowed" : "pointer",
              width: "100%",
              fontSize: 18,
              marginTop: 10,
            }}
          >
            {hasOutOfStockInCart
              ? "Some items are unavailable"
              : "Proceed to Checkout →"}
          </button>

          {hasOutOfStockInCart && (
            <p style={{ color: "#dc3545", marginTop: 10, fontWeight: 600 }}>
              Some items in your cart are no longer available. Please remove them to continue.
            </p>
          )}
        </>
      )}
    </div>
  );
}

const qtyBtn = {
  padding: "4px 10px",
  fontWeight: 700,
  borderRadius: 6,
  border: "1px solid #ccc",
  cursor: "pointer",
};
