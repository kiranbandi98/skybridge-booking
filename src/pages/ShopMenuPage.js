import StickyBar from "../components/StickyBar";
import FloatingCart from "../components/FloatingCart";
import MenuCard from "../components/MenuCard";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../utils/firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useCart } from "../context/CartContext";


export default function ShopMenuPage() {
  const { shopId } = useParams();
   const { addToCart, cart } = useCart();

const cartTotal = cart.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);

  const [menu, setMenu] = useState([]);
   const availableCategories = useMemo(() => ({
  veg: menu.some(item => (item.category || "veg") === "veg"),
  nonveg: menu.some(item => item.category === "nonveg"),
  drinks: menu.some(item => item.category === "drinks"),
}), [menu]);
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

const scrollToCategory = (cat) => {
    const ref = categoryRefs[cat];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
  const filteredMenu = useMemo(() => {
  return menu.filter((item) => {
    const categoryMatch =
      selectedCategory === "all" ||
      (item.category || "veg") === selectedCategory;

    const searchMatch =
      searchQuery.trim() === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || "veg")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    return categoryMatch && searchMatch;
  });
}, [menu, selectedCategory, searchQuery]);
  
  // ✅ NEW: Group menu items by category (customer view)
  const groupedMenu = useMemo(() => {
  return filteredMenu.reduce((acc, item) => {
    const cat = item.category || "veg";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
}, [filteredMenu]);

  
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


 
  
  // ✅ ADD TO CART HANDLER (FIXED SCOPE)
  function handleAdd(item) {
    addToCart(item);
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 800);
  }
    
   

  // ✅ NEW: CHECK IF ANY ITEM IS IN STOCK
  const hasAnyInStock = menu.some((item) => item.inStock !== false);
  const hash = window.location.hash;
  const search = hash.includes("?") ? "?" + hash.split("?")[1] : "";
  const totalItems = cart.reduce(
  (sum, item) => sum + item.quantity,
  0
  );
  return (
     <div style={{ padding: "20px 20px 140px", maxWidth: 900, margin: "0 auto" }}>
      <h2>Menu</h2>
      {loading && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
      marginTop: 20,
    }}
  >
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        style={{
          height: 240,
          borderRadius: 16,
          background: "linear-gradient(90deg, #eee 25%, #ddd 37%, #eee 63%)",
          backgroundSize: "400% 100%",
          animation: "shimmer 1.2s ease-in-out infinite",
        }}
      />
    ))}
  </div>
)}
    
       {!loading && (
  <>
    {!shopActive && (
      <p style={{ color: "red", fontWeight: 600 }}>
        🚫 This shop is temporarily unavailable
      </p>
    )}

    <p>Select your items</p>
  

      
       <StickyBar
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  selectedCategory={selectedCategory}
  setSelectedCategory={setSelectedCategory}
  availableCategories={availableCategories}
  scrollToCategory={scrollToCategory}
          />
        {menu.length === 0 && <p>No menu items added yet.</p>}

      {menu.length > 0 && filteredMenu.length === 0 && (
        <p style={{ marginTop: 20, fontWeight: 600 }}>
          🔍 No items found
        </p>
      )}
      {Object.entries(groupedMenu).map(([category, items]) => (
  <div key={category} ref={categoryRefs[category]}>
    <h3 style={{ marginTop: 20 }}>
      {category === "veg"
        ? "🥦 Veg"
        : category === "nonveg"
        ? "🍗 Non-Veg"
        : category === "drinks"
        ? "🥤 Drinks"
        : category}
    </h3>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        marginTop: 10,
      }}
    >
      {items.map((item) => (
  <MenuCard
    key={item.id}
    item={item}
    shopActive={shopActive}
    addedId={addedId}
    handleAdd={handleAdd}
  />
))}
    </div>
  </div>
))}
  </>
)}
 <FloatingCart
  totalItems={totalItems}
  cartTotal={cartTotal}
  shopId={shopId}
  search={search}
/>
</div>
);
}