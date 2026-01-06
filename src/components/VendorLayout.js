import React, { useEffect, useRef, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../utils/firebase";
import { registerVendorFCM } from "../utils/fcm";

export default function VendorLayout() {
  const { shopId } = useParams();

  /* ===============================
     🔑 Detect Firebase email action
  =============================== */
  const hash = window.location.hash || "";
  const isEmailAction =
    hash.includes("mode=verifyEmail") ||
    hash.includes("mode=resetPassword");

  /* ===============================
     STATE & REFS (ALWAYS RUN)
  =============================== */
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  const audioRef = useRef(null);
  const prevOrderIdsRef = useRef(new Set());
  const firstSnapshotRef = useRef(true);

  /* ===============================
     🔔 STEP 1: Register vendor FCM
  =============================== */
  useEffect(() => {
    if (isEmailAction) return; // ⛔ block during email flows
    if (!shopId) return;

    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      registerVendorFCM(shopId);
    });

    return () => unsubscribe();
  }, [shopId, isEmailAction]);

  /* ===============================
     🔊 STEP 2: Init alarm audio
  =============================== */
  useEffect(() => {
    if (isEmailAction) return;

    audioRef.current = new Audio("/sounds/new-order.mp3");
    audioRef.current.loop = true;
  }, [isEmailAction]);

  /* ===============================
     🔓 STEP 3: Unlock audio
  =============================== */
  useEffect(() => {
    if (isEmailAction) return;

    const unlockAudio = () => {
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

      document.removeEventListener("click", unlockAudio);
    };

    document.addEventListener("click", unlockAudio, { once: true });
    return () => document.removeEventListener("click", unlockAudio);
  }, [isEmailAction]);

  /* ===============================
     🔔 STEP 4: Listen for new orders
  =============================== */
  useEffect(() => {
    if (isEmailAction) return;
    if (!shopId) return;

    const ordersRef = collection(db, "shops", shopId, "orders");

    const unsub = onSnapshot(ordersRef, (snapshot) => {
      const currentIds = new Set(snapshot.docs.map((d) => d.id));

      if (firstSnapshotRef.current) {
        prevOrderIdsRef.current = currentIds;
        firstSnapshotRef.current = false;
        return;
      }

      const prevIds = prevOrderIdsRef.current;

      currentIds.forEach((id) => {
        if (!prevIds.has(id)) {
          if (audioUnlocked && audioRef.current && !isRinging) {
            audioRef.current.play().catch(() => {});
            setIsRinging(true);
          }
        }
      });

      prevOrderIdsRef.current = currentIds;
    });

    return () => unsub();
  }, [shopId, audioUnlocked, isRinging, isEmailAction]);

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsRinging(false);
  };

  /* ===============================
     🚫 FINAL RENDER BLOCK
  =============================== */
  if (isEmailAction) {
    return null;
  }

  return (
    <div>
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
    </div>
  );
}
