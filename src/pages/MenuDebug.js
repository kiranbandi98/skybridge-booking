// src/pages/MenuDebug.js  (FINAL FIXED VERSION)
// Paste this file and reload:  http://localhost:3000/menu

import React, { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useCart } from "../CartContext";

// ⭐ FIXED SHOP ID — EXACTLY AS IN FIRESTORE
const SHOP_ID = "tTR9TKIpq1Vxj9jkcb05";   // <-- 100% CORRECT ID

export default function MenuDebug() {
  const [menu, setMenu] = useState(null); // null = loading, [] = empty, >0 = items
  const [err, setErr] = useState(null);
  const { cart, addToCart } = useCart();

  useEffect(() => {
    async function loadMenu() {
      setErr(null);

      try {
        console.log("[MenuDebug] loading menu from shops/", SHOP_ID, "/menu");

        // Correct Firestore collection path
        const ref = collection(db, `shops/${SHOP_ID}/menu`);
        const snap = await getDocs(ref);

        console.log("[MenuDebug] getDocs snapshot:", snap);

        const items = snap.docs.map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            name: data.name || "(no name)",
            price: Number(data.price || 0),
            imageURL: data.imageUrl || data.imageURL || "",
            description: data.description || "",
            active: data.active ?? true,
            raw: data,
          };
        });

        console.log("[MenuDebug] parsed items:", items);
        setMenu(items);
      } catch (e) {
        console.error("[MenuDebug] error loading menu:", e);
        setErr(e?.message || String(e));
        setMenu([]); // stop loading state
      }
    }

    loadMenu();
  }, []);

  // -------------------------------------------------------
  // DEBUG PANEL
  // -------------------------------------------------------
  function DebugPanel() {
    return (
      <div
        style={{
          padding: 12,
          background: "#fff7e6",
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>DEBUG PANEL</div>
        <div>
          <b>Shop ID:</b> {SHOP_ID}
        </div>
        <div>
          <b>Menu state:</b>{" "}
          {menu === null ? "loading" : JSON.stringify(menu.length)}
        </div>

        {err && (
          <div style={{ color: "#b00020" }}>
            <b>Error:</b> {err}
          </div>
        )}

        <div style={{ marginTop: 8, fontSize: 13, color: "#444" }}>
          Check console for more details (DevTools → Console).
          Also check Network tab for requests to firestore.googleapis.com.
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // FALLBACK SAMPLE ITEM
  // -------------------------------------------------------
  const sample = {
    id: "sample",
    name: "Sample Biryani",
    price: 99,
    imageURL: "/images/logo.png",
    description: "Fallback sample item for testing.",
  };

  // -------------------------------------------------------
  // PAGE UI
  // -------------------------------------------------------
  return (
    <div
      style={{
        padding: 28,
        fontFamily: "Poppins, sans-serif",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#0366a6" }}>Our Menu</h2>

      <DebugPanel />

      {/* Loading */}
      {menu === null ? (
        <div style={{ textAlign: "center", color: "#666", marginTop: 30 }}>
          Loading menu (check console)...
        </div>
      ) : menu.length === 0 ? (
        <>
          {/* No Firestore Items */}
          <div style={{ textAlign: "center", color: "#666", marginTop: 20 }}>
            No items found in Firestore for this shop.
          </div>

          {/* Fallback Item */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              Fallback sample item
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                background: "#fff",
                padding: 12,
                borderRadius: 8,
              }}
            >
              <img
                src={sample.imageURL}
                alt=""
                style={{
                  width: 100,
                  height: 80,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{sample.name}</div>
                <div style={{ color: "#666" }}>{sample.description}</div>

                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>₹{sample.price}</div>
                  <button
                    onClick={() => addToCart(sample.id, 1)}
                    style={{
                      background: "#ffb400",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Debug Instructions */}
          <div style={{ marginTop: 12, color: "#333" }}>
            If Firestore has items, double-check:
            <ol>
              <li>Firestore project matches src/firebase.js</li>
              <li>Collection path: shops / {SHOP_ID} / menu</li>
              <li>Firestore rules allow reads</li>
            </ol>
          </div>
        </>
      ) : (
        // -------------------------------------------------------
        // FIRESTORE ITEMS SHOWN HERE
        // -------------------------------------------------------
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 16,
            marginTop: 18,
          }}
        >
          {menu.map((it) => (
            <div
              key={it.id}
              style={{
                background: "#fff",
                padding: 12,
                borderRadius: 10,
              }}
            >
              <img
                src={it.imageURL || "/images/logo.png"}
                alt={it.name}
                style={{
                  width: "100%",
                  height: 160,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />

              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 800 }}>{it.name}</div>
                <div style={{ color: "#666" }}>{it.description}</div>

                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>₹{it.price}</div>

                  {/* Add to cart button */}
                  {cart[it.id] ? (
                    <span style={{ fontWeight: 800 }}>{cart[it.id]}</span>
                  ) : (
                    <button
                      onClick={() => addToCart(it.id, 1)}
                      style={{
                        background: "#ffb400",
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "none",
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
      )}
    </div>
  );
}

