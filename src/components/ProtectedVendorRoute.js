import React, { useEffect, useState, useRef } from "react";
import {
  Navigate,
  Outlet,
  useLocation,
  useParams,
} from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";

/* =========================
   🔔 GLOBAL VENDOR ALARM
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
      newOrderAudio.current.muted = true;
      newOrderAudio.current
        .play()
        .then(() => {
          newOrderAudio.current.pause();
          newOrderAudio.current.muted = false;
          setAudioUnlocked(true);
        })
        .catch(() => {});
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

      snapshot.docs.forEach((doc) => {
        if (!previousOrdersRef.current.has(doc.id) && !isRinging) {
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
   🛡️ PROTECTED VENDOR ROUTE
========================= */
export default function ProtectedVendorRoute() {
  const auth = getAuth();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // 🔑 Proper Firebase auth restore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, [auth]);

  // 🔓 Public vendor routes (ONLY auth-related)
  const publicPaths = [
    "/vendor/login",
    "/vendor/register",
    "/vendor/check-email",
    "/vendor/forgot-password",
    "/vendor/reset-password",
  ];

  const isPublicRoute = publicPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  // 🔔 Alarm should run only for authenticated vendor pages
  useVendorOrderAlarm(!isPublicRoute);

  // ⏳ Wait for Firebase to finish restoring auth
  if (!authReady) {
    return null; // or spinner
  }

  // 🔓 Allow public routes
  if (isPublicRoute) {
    return <Outlet />;
  }

  // 🔒 Block protected routes if not logged in
  if (!user) {
    return (
      <Navigate
        to="/vendor/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}
