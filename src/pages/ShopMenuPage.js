import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../utils/firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useCart } from "../context/CartContext";

export default function ShopMenuPage() {
  const { shopId } = useParams();
  const { addToCart, cart } = useCart();

  const [menu, setMenu] = useState([]);
  const [shopActive, setShopActive] = useState(true);
  const [addedId, setAddedId] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ FIX 1

  /* =====================================================
     🚫 SHOP ACTIVE CHECK (ADMIN CONTROL)
  ===================================================== */
  useEffect(() => {
    if (!shopId) return;

    const checkShop = async () => {
      try {
        const ref = doc(db, "shops", shopId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setShopActive(false);
        } else {
          setShopActive(snap.data().active !== false);
        }
      } catch (e) {
        console.error("Shop active check failed:", e);
        setShopActive(false);
      } finally {
        setLoading(false); // ✅ FIX 2
      }
    };

    checkShop();
  }, [shopId]);

  /* =====================================================
     🍽️ LIVE MENU LISTENER
  ===================================================== */
  useEffect(() => {
    if (!shopId) return;

    const colRef = collection(db, "shops", shopId, "menu");

    const unsubscribe = onSnapshot(colRef, (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        price: Number(d.data().price),
      }));
      setMenu(items);
    });

    return () => unsubscribe();
  }, [shopId]);

  // ✅ FIX 3 — WAIT FOR FIRESTORE (CRITICAL FOR MOBILE)
  if (loading) {
    return <p style={{ padding: 20 }}>Loading shop…</p>;
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2>Menu</h2>

      {!shopActive && (
        <p style={{ color: "red", fontWeight: 600 }}>
          🚫 This shop is temporarily unavailable
        </p>
      )}

      <p>Select your items</p>

      <div style={{ marginBottom: 20 }}>
        <Link to={`/cart/${shopId}`}>
          <button
            disabled={!shopActive}
            style={{
              background: "#0d6efd",
              color: "white",
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              cursor: shopActive ? "pointer" : "not-allowed",
              fontWeight: 600,
            }}
          >
            {shopActive
              ? `🛒 View Cart (${cart.length})`
              : "Shop Unavailable"}
          </button>
        </Link>
      </div>

      {menu.length === 0 && <p>No menu items added yet.</p>}

      {menu.map((item) => (
        <div
          key={item.id}
          style={{
            padding: 15,
            marginBottom: 12,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            display: "flex",
            gap: 20,
            alignItems: "center",
          }}
        >
          <img
            src={item.img || "https://via.placeholder.com/80"}
            alt={item.name}
            style={{
              width: 80,
              height: 80,
              borderRadius: 10,
              objectFit: "cover",
            }}
          />

          <div style={{ flex: 1 }}>
            <h4>{item.name}</h4>
            <p>₹{item.price}</p>

            <button
              onClick={() => handleAdd(item)}
              disabled={!shopActive}
              style={{
                background:
                  addedId === item.id ? "#2ecc71" : "#28a745",
                color: "white",
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                cursor: shopActive ? "pointer" : "not-allowed",
                fontWeight: 600,
              }}
            >
              {addedId === item.id ? "Added ✓" : "Add to Cart"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  function handleAdd(item) {
    addToCart(item);
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 800);
  }
}
