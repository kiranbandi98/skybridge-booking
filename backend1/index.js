require("dotenv").config();

const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

/* -------------------- RAZORPAY -------------------- */

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

console.log("🔑 Razorpay Key Loaded:", !!process.env.RAZORPAY_KEY_ID);
console.log("🔐 Razorpay Secret Loaded:", !!process.env.RAZORPAY_KEY_SECRET);

/* -------------------- FIREBASE (SAFE INIT) -------------------- */

let db = null;

if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

  db = admin.firestore();
  console.log("🔥 Firebase initialized");
} else {
  console.log("⚠️ Firebase env not found, skipping Firebase init");
}

/* -------------------- HELPERS -------------------- */

async function getVendorTokens(shopId) {
  if (!db) return [];

  const snap = await db
    .collection("vendorDevices")
    .doc(shopId)
    .collection("tokens")
    .get();

  return snap.docs.map((d) => d.id);
}

/* -------------------- CREATE ORDER -------------------- */

app.post("/create-order", async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const order = await razorpay.orders.create({
      amount, // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    });

    res.json({
      success: true,
      order_id: order.id, // IMPORTANT
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("❌ Create order error:", err);
    res.status(500).json({ success: false });
  }
});

/* -------------------- VERIFY PAYMENT (TEST MODE) -------------------- */

app.post("/verify-payment", async (req, res) => {
  try {
    const { orderData } = req.body;

    console.log("🧪 orderData received:", orderData);

    if (db) {
      await db.collection("orders").add({
        ...orderData,
        paymentStatus: "PAID",
        createdAt: new Date(),
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Verify payment error:", err);
    res.status(500).json({ success: false });
  }
});

/* -------------------- START SERVER -------------------- */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

