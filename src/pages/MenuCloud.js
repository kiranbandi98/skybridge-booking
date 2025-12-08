// src/pages/MenuCloud.js
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function useFirestoreMenu() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  // FIXED: Always use Vendor Shop ID
  const SHOP_ID = process.env.REACT_APP_VENDOR_SHOP_ID;

  useEffect(() => {
    let mounted = true;

    async function loadMenu() {
      setError(null);
      try {
        console.log("[useFirestoreMenu] loading menu from shops/", SHOP_ID, "/menu");

        const ref = collection(db, `shops/${SHOP_ID}/menu`);
        const snap = await getDocs(ref);

        const parsed = snap.docs.map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            name: data.name || "(no name)",
            price: Number(data.price || 0),
            imageURL: data.imageUrl || data.imageURL || data.img || "",
            description: data.description || "",
            active: data.active === undefined ? true : !!data.active,
            raw: data,
          };
        });

        if (!mounted) return;
        setItems(parsed);
      } catch (e) {
        console.error("[useFirestoreMenu] error:", e);
        if (!mounted) return;
        setError(e?.message || String(e));
        setItems([]);
      }
    }

    loadMenu();
    return () => (mounted = false);
  }, []);

  return { loading: items === null, items: items || [], error };
}
