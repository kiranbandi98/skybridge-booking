import React, { useEffect, useRef, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";
import { registerVendorFCM } from "../utils/fcm";

/**
 * VendorLayout
 * Global layout for vendor pages
 */
export default function VendorLayout() {
  const { shopId } = useParams();

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  const audioRef = useRef(null);
  const prevOrderIdsRef = useRef(new Set());
  const firstSnapshotRef = useRef(true);

  /* =========================================================
     ✅ FIX 1: Force HashRouter-safe URL (PREVENT 404)
     ========================================================= */
  useEffect(() => {
    if (!shopId) return;

    const hasHash = window.location.hash.startsWith("#/");
    const isVendorPath = window.location.pathname.includes("/vendor/");

    if (!hasHash && isVendorPath) {
      const newUrl =
        window.location.origin +
        "/#"+ 
        window.location.pathname +
        window.location.search;

      window.location.replace(newUrl);
    }
  }, [shopId]);

  /* 🔔 Register vendor device */
  useEffect(() => {
    if (!shopId) return;
    registerVendorFCM(shopId);
  }, [shopId]);

  /* 🔊 Init alarm audio (from /public) */
  useEffect(() => {
    audioRef.current = new Audio("/order-alert.mp3");
    audioRef.current.loop = true;
  }, []);

  /* 🔓 Unlock audio on first click */
  useEffect(() => {
    const unlock = () => {
      if (!audioRef.current) return;
      audioRef.current.muted = true;
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause();
          audioRef.current.muted = false;
          setAudioUnlocked(true);
        })
        .catch(() => {});
    };

    document.addEventListener("click", unlock, { once: true });
    return () => document.removeEventListener("click", unlock);
  }, []);

  /* 🔔 Listen for new orders */
  useEffect(() => {
    if (!shopId || !audioUnlocked) return;

    const ref = collection(db, "shops", shopId, "orders");
    const unsub = onSnapshot(ref, (snap) => {
      const ids = new Set(snap.docs.map((d) => d.id));

      if (firstSnapshotRef.current) {
        prevOrderIdsRef.current = ids;
        firstSnapshotRef.current = false;
        return;
      }

      ids.forEach((id) => {
        if (
          !prevOrderIdsRef.current.has(id) &&
          audioRef.current &&
          !isRinging
        ) {
          audioRef.current.play().catch(() => {});
          setIsRinging(true);
        }
      });

      prevOrderIdsRef.current = ids;
    });

    return () => unsub();
  }, [shopId, audioUnlocked, isRinging]);

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsRinging(false);
  };

  return (
    <>
      {isRinging && (
        <button
          onClick={stopAlarm}
          style={{
            position: "fixed",
            top: 12,
            right: 12,
            zIndex: 9999,
            padding: "10px 16px",
            background: "#d32f2f",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          STOP ALARM
        </button>
      )}
      <Outlet />
    </>
  );
}
