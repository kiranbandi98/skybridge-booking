require("dotenv").config();

const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

/* -------------------- ENV CHECK -------------------- */
console.log("🔑 Razorpay Key Loaded:", !!process.env.RAZORPAY_KEY_ID);
console.log("🔐 Razorpay Secret Loaded:", !!process.env.RAZORPAY_KEY_SECRET);
console.log("🔥 Firebase Project:", process.env.FIREBASE_PROJECT_ID);

/* -------------------- FIREBASE ADMIN -------------------- */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

/* -------------------- RAZORPAY -------------------- */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ====================================================
   🔔 FCM HELPERS
==================================================== */

async function getVendorTokens(shopId) {
  const snap = await db
    .collection("shops")
    .doc(shopId)
    .collection("vendorDevices")
    .get();

  return snap.docs.map((d) => d.id);
}

async function sendVendorNotification(shopId, orderId) {
  if (!shopId) return;

  const tokens = await getVendorTokens(shopId);
  if (!tokens.length) return;

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: "New Order 🚀",
      body: "You have received a new order",
    },
    data: {
      shopId,
      orderId,
    },
  });

  console.log("🔔 Vendor notified");
}

/* -------------------- CREATE ORDER (FIXED) -------------------- */
app.post("/create-order", async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false });
    }

    const order = await razorpay.orders.create({
      amount, // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    });

    // ✅ IMPORTANT FIX: order_id (NOT orderId)
    res.json({
      success: true,
      order_id: order.id,
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

    const orderRef = await db.collection("orders").add({
      ...orderData,
      paymentStatus: "PAID",
      orderStatus: "PLACED",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await sendVendorNotification(orderData?.shopId, orderRef.id);

    res.json({
      success: true,
      orderId: orderRef.id,
    });
  } catch (err) {
    console.error("❌ Verify payment error:", err);
    res.status(500).json({ success: false });
  }
});

/* -------------------- HEALTH CHECK -------------------- */
app.get("/", (_, res) => {
  res.send("✅ SkyBridge Backend is LIVE");
});

/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
