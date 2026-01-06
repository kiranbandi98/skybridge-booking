import React from "react";
import {
  Navigate,
  Outlet,
  useLocation,
  useParams,
} from "react-router-dom";
import { getAuth } from "firebase/auth";

import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";

/* =========================
   🔔 GLOBAL VENDOR ALARM LOGIC
========================= */
function useVendorOrderAlarm(enabled) {
  const { shopId } = useParams();

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  const newOrderAudio = useRef(new Audio("/sounds/new-order.mp3"));
  const previousOrdersRef = useRef(new Set());

  useEffect(() => {
    if (!enabled) return;

    const unlock = () => {
      try {
        newOrderAudio.current.muted = true;
        newOrderAudio.current
          .play()
          .then(() => {
            newOrderAudio.current.pause();
            newOrderAudio.current.muted = false;
            setAudioUnlocked(true);
          })
          .catch(() => {});
      } catch {}
      document.removeEventListener("click", unlock);
    };

    document.addEventListener("click", unlock, { once: true });
    return () => document.removeEventListener("click", unlock);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !shopId || !audioUnlocked) return;

    const colRef = collection(db, "shops", shopId, "orders");
    const unsub = onSnapshot(colRef, (snapshot) => {
      const currentIds = new Set(snapshot.docs.map((d) => d.id));
      const prevIds = previousOrdersRef.current;

      snapshot.docs.forEach((doc) => {
        if (!prevIds.has(doc.id) && !isRinging) {
          newOrderAudio.current.loop = true;
          newOrderAudio.current.play().catch(() => {});
          setIsRinging(true);
        }
      });

      previousOrdersRef.current = currentIds;
    });

    return () => unsub();
  }, [enabled, shopId, audioUnlocked, isRinging]);

  return {
    isRinging,
    stop: () => {
      newOrderAudio.current.pause();
      newOrderAudio.current.currentTime = 0;
      setIsRinging(false);
    },
  };
}

/* =========================
   🛡️ PROTECTED ROUTE (FIXED)
========================= */
export default function ProtectedVendorRoute() {
  const auth = getAuth();
  const user = auth.currentUser;
  const location = useLocation();

  /* =========================
     🔑 DETECT FIREBASE EMAIL ACTIONS
  ========================= */
  const hash = location.hash || "";
  const isEmailAction =
    hash.includes("mode=verifyEmail") ||
    hash.includes("mode=resetPassword");

  /* =========================
     🔓 PUBLIC ROUTES
  ========================= */
  const isPublicRoute =
    isEmailAction ||
    location.pathname.startsWith("/vendor/action") ||
    location.pathname.startsWith("/vendor/reset-password") ||
    location.pathname.startsWith("/vendor/forgot-password") ||
    location.pathname.startsWith("/vendor/login");

  // ✅ Hooks ALWAYS run (React-safe)
  useVendorOrderAlarm(!isPublicRoute);

  // 🔓 Allow public + Firebase action routes
  if (isPublicRoute) {
    return <Outlet />;
  }

  // 🔒 Protect vendor routes
  if (!user) {
    return <Navigate to="/vendor/login" replace />;
  }

  return <Outlet />;
}
