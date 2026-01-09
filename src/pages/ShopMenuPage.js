import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../utils/firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useCart } from "../context/CartContext";

export default function ShopMenuPage() {
  const { shopId } = useParams();
  const { addToCart, cart } = useCart();

  const [menu, setMenu] = useState([]);
  // ✅ NEW: Detect which categories actually exist
  const availableCategories = {
    veg: menu.some(item => (item.category || 'veg') === 'veg'),
    nonveg: menu.some(item => item.category === 'nonveg'),
    drinks: menu.some(item => item.category === 'drinks'),
  };

  const [selectedCategory, setSelectedCategory] = useState('all'); // ✅ NEW
  const [shopActive, setShopActive] = useState(true);
  const [addedId, setAddedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ NEW: Category section refs (auto-scroll)
  const categoryRefs = {
    veg: useRef(null),
    nonveg: useRef(null),
    drinks: useRef(null),
  };


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
        setLoading(false);
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

    // ✅ NEW: Category + Search filter logic
  const filteredMenu = menu.filter((item) => {
    const categoryMatch =
      selectedCategory === "all" ||
      (item.category || "veg") === selectedCategory;

    const searchMatch =
      searchQuery.trim() === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || "veg").toLowerCase().includes(searchQuery.toLowerCase());

    return categoryMatch && searchMatch;
  });

  
  // ✅ NEW: Group menu items by category (customer view)
  const groupedMenu = filteredMenu.reduce((acc, item) => {
    const cat = item.category || "veg";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  
  /* =====================================================
     🎯 AUTO-SCROLL TO FIRST AVAILABLE CATEGORY
  ===================================================== */
  useEffect(() => {
    if (!menu.length || selectedCategory !== "all") return;

    const first = ["veg", "nonveg", "drinks"].find(
      (c) => groupedMenu[c] && groupedMenu[c].length > 0
    );

    if (first && categoryRefs[first]?.current) {
      categoryRefs[first].current.scrollIntoView({ behavior: "smooth" });
    }
  }, [menu, groupedMenu, selectedCategory]);


  // 🔍 NEW: Highlight matched search text
  function highlightText(text, query) {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <strong key={i}>{part}</strong>
      ) : (
        part
      )
    );
  }

  // ⏳ Wait for Firestore
  if (loading) {
    return <p style={{ padding: 20 }}>Loading shop…</p>;
  }

  // ✅ NEW: CHECK IF ANY ITEM IS IN STOCK
  const hasAnyInStock = menu.some((item) => item.inStock !== false);

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2>Menu</h2>

      {!shopActive && (
        <p style={{ color: "red", fontWeight: 600 }}>
          🚫 This shop is temporarily unavailable
        </p>
      )}

      <p>Select your items</p>

      {/* 🔍 SEARCH MENU ITEMS */}
      <input
        type="text"
        placeholder="Search menu items..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 14px",
          margin: "12px 0 20px",
          borderRadius: 8,
          border: "1px solid #ccc",
          fontSize: 14,
        }}
      />


      {/* ✅ NEW: Category Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["all", "veg", "nonveg", "drinks"]
        .filter(cat => cat === "all" || availableCategories[cat])
        .map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: "1px solid #ccc",
              background:
                selectedCategory === cat ? "#0d6efd" : "#f8f9fa",
              color:
                selectedCategory === cat ? "white" : "#333",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {cat === "all"
              ? "All"
              : cat === "veg"
              ? "Veg"
              : cat === "nonveg"
              ? "Non-Veg"
              : "Drinks"}
          </button>
        ))}
      </div>


      <div style={{ marginBottom: 20 }}>
        <Link to={`/cart/${shopId}`}>
          <button
            disabled={!shopActive || !hasAnyInStock}
            style={{
              background: "#0d6efd",
              color: "white",
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              cursor:
                shopActive && hasAnyInStock ? "pointer" : "not-allowed",
              fontWeight: 600,
            }}
          >
            {!shopActive
              ? "Shop Unavailable"
              : !hasAnyInStock
              ? "All Items Out of Stock"
              : `🛒 View Cart (${cart.length})`}
          </button>
        </Link>

        {!hasAnyInStock && (
          <p style={{ color: "#dc3545", marginTop: 10, fontWeight: 600 }}>
            All items are currently out of stock
          </p>
        )}
      </div>

      {menu.length === 0 && <p>No menu items added yet.</p>}

      {menu.length > 0 && filteredMenu.length === 0 && (
        <p style={{ marginTop: 20, fontWeight: 600 }}>
          🔍 No items found
        </p>
      )}


      {Object.entries(groupedMenu).map(([category, items]) => (
        <div key={category} ref={categoryRefs[category]}>
          <h3 style={{ marginTop: 20, textTransform: "capitalize" }}>
            {category === "veg"
              ? "🥦 Veg"
              : category === "nonveg"
              ? "🍗 Non-Veg"
              : category === "drinks"
              ? "🥤 Drinks"
              : category}
          </h3>

          {items.map((item) => (

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
            <h4>{highlightText(item.name, searchQuery)}</h4>
            <p>₹{item.price}</p>

            {item.inStock === false && (
              <span
                style={{
                  background: "#dc3545",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  marginRight: 10,
                }}
              >
                Out of Stock
              </span>
            )}

            <button
              onClick={() => handleAdd(item)}
              disabled={!shopActive || item.inStock === false}
              style={{
                background:
                  item.inStock === false
                    ? "#6c757d"
                    : addedId === item.id
                    ? "#2ecc71"
                    : "#28a745",
                color: "white",
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                cursor:
                  !shopActive || item.inStock === false
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 600,
              }}
            >
              {item.inStock === false
                ? "Unavailable"
                : addedId === item.id
                ? "Added ✓"
                : "Add to Cart"}
            </button>
          </div>
        </div>
          ))}
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
