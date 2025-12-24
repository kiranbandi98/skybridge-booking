import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getAuth } from "firebase/auth";

import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";

// 🔔 GLOBAL VENDOR ALARM LOGIC
function useVendorOrderAlarm() {
  const { shopId } = useParams();
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  const newOrderAudio = useRef(new Audio("/sounds/new-order.mp3"));
  const previousOrdersRef = useRef(new Set());

  // Auto-unlock audio on first interaction
  useEffect(() => {
    const unlock = () => {
      try {
        newOrderAudio.current.muted = true;
        newOrderAudio.current.play().then(() => {
          newOrderAudio.current.pause();
          newOrderAudio.current.muted = false;
          setAudioUnlocked(true);
        }).catch(() => {});
      } catch {}
      document.removeEventListener("click", unlock);
    };
    document.addEventListener("click", unlock, { once: true });
    return () => document.removeEventListener("click", unlock);
  }, []);

  // Firestore listener for new orders
  useEffect(() => {
    if (!shopId) return;

    const colRef = collection(db, "shops", shopId, "orders");
    const unsub = onSnapshot(colRef, (snapshot) => {
      const currentIds = new Set(snapshot.docs.map(d => d.id));
      const prevIds = previousOrdersRef.current;

      snapshot.docs.forEach(doc => {
        if (!prevIds.has(doc.id) && audioUnlocked && !isRinging) {
          newOrderAudio.current.loop = true;
          newOrderAudio.current.play().catch(() => {});
          setIsRinging(true);
        }
      });

      previousOrdersRef.current = currentIds;
    });

    return () => unsub();
  }, [shopId, audioUnlocked, isRinging]);

  // Stop alarm API (future use)
  return { isRinging, stop: () => {
    newOrderAudio.current.pause();
    newOrderAudio.current.currentTime = 0;
    setIsRinging(false);
  }};
}


export default function ProtectedVendorRoute() {
  const auth = getAuth();
  const user = auth.currentUser;
  window.__GLOBAL_VENDOR_ALARM__ = true;
  useVendorOrderAlarm();

  if (!user) {
    return <Navigate to="/vendor/login" replace />;
  }

  // ✅ REQUIRED for nested routes
  return <Outlet />;
}
