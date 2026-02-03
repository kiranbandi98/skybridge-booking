const functions = require("firebase-functions");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");

/*
 🔧 GEN-2 SAFETY PATCH (DO NOT REMOVE ORIGINAL CODE)
 We override functions.config() to read from environment variables.
 This keeps ALL existing lines working without deletion.
 NOTE: In GEN-2, secrets are read from process.env
*/
 

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Safety
setGlobalOptions({ maxInstances: 10 });

/* =========================================================
   🛒 NEW ORDER CREATED → UPDATE REVENUE + NOTIFY VENDOR
   ========================================================= */

exports.notifyVendorOnNewOrder = onDocumentCreated(
  "shops/{shopId}/orders/{orderId}",
  async (event) => {
    try {
      const orderData = event.data.data();
      const { shopId, orderId } = event.params;

      console.log("🛒 New order detected for shop:", shopId);

      let amount = 0;

      if (orderData.totalAmount) {
        amount = Number(orderData.totalAmount);
      } else if (Array.isArray(orderData.items)) {
        amount = orderData.items.reduce(
          (sum, item) =>
            sum + Number(item.price || 0) * Number(item.qty || 1),
          0
        );
      }

      console.log("💰 Calculated order amount:", amount);

      if (amount > 0 && orderData.paymentStatus === "Paid") {
        await db.collection("shops").doc(shopId).set(
          {
            revenue: admin.firestore.FieldValue.increment(amount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        console.log("✅ Revenue updated:", amount);
      } else {
        console.log("⚠️ Revenue NOT updated (unpaid or zero amount)");
      }

      const devicesSnap = await db
        .collection("shops")
        .doc(shopId)
        .collection("vendorDevices")
        .get();

      if (devicesSnap.empty) {
        console.log("⚠️ No active vendor devices found");
        return;
      }

      const tokens = devicesSnap.docs.map((d) => d.id);

      const payload = {
        notification: {
          title: "🛒 New Order Received",
          body: `₹${amount} order received`,
        },
        data: {
          shopId,
          orderId,
          type: "NEW_ORDER",
        },
      };

      const response = await messaging.sendEachForMulticast({
        tokens,
        ...payload,
      });

      console.log(
        "✅ Notifications sent:",
        response.successCount,
        "❌ Failed:",
        response.failureCount
      );
    } catch (error) {
      console.error("❌ Function error:", error);
    }
  }
);

/* =========================================================
   🔊 PAYMENT SUCCESS → VENDOR VOICE + DRY-RUN PAYOUT LOG
   ========================================================= */

const { runDryRunPayout } = require("./payouts/dryRunPayout");

exports.notifyVendorOnPaymentPaid = onDocumentUpdated(
  "shops/{shopId}/orders/{orderId}",
  async (event) => {
    try {
      const before = event.data.before.data();
      const after = event.data.after.data();

      if (
        before.paymentStatus === after.paymentStatus ||
        after.paymentStatus !== "Paid"
      ) {
        return;
      }

      const { shopId, orderId } = event.params;

      let amount = 0;

      if (after.totalAmount) {
        amount = Number(after.totalAmount);
      } else if (Array.isArray(after.items)) {
        amount = after.items.reduce(
          (sum, item) =>
            sum + Number(item.price || 0) * Number(item.qty || 1),
          0
        );
      }

      const itemsText = Array.isArray(after.items)
        ? after.items.map((i) => `${i.qty || 1} ${i.name}`).join(", ")
        : "";

      const devicesSnap = await db
        .collection("shops")
        .doc(shopId)
        .collection("vendorDevices")
        .get();

      if (devicesSnap.empty) {
        console.log("⚠️ No vendor devices found for payment voice");
        return;
      }

      const tokens = devicesSnap.docs.map((d) => d.id);

      const payload = {
        data: {
          type: "PAYMENT_PAID",
          shopId,
          orderId,
          amount: String(amount),
          itemsText,
        },
      };

      const response = await messaging.sendEachForMulticast({
        tokens,
        ...payload,
      });

      console.log(
        "🔊 Payment voice FCM sent:",
        response.successCount,
        "success",
        response.failureCount,
        "failed"
      );

      await runDryRunPayout({
        shopId,
        orderId,
        amount,
      });

    } catch (error) {
      console.error("❌ Payment voice function error:", error);
    }
  }
);

/* =========================================================
   💳 RAZORPAY CALLBACK (LIVE MODE)
   ========================================================= */
exports.razorpayCallbackV2 = onRequest(
  { cors: true, secrets: ["RAZORPAY_KEY_SECRET"] },
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        console.error("❌ Missing Razorpay callback fields");
        return res.status(400).json({ success: false, error: "INVALID_CALLBACK_PAYLOAD" });
      }

      const secret = process.env.RAZORPAY_KEY_SECRET;

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        console.error("❌ Razorpay signature mismatch");
        return res.status(400).json({ success: false, error: "SIGNATURE_VERIFICATION_FAILED" });
      }

      // ✅ READ ORDER MAPPING (NO QUERY, NO COLLECTION GROUP)
      const mapRef = db.collection("razorpayOrders").doc(razorpay_order_id);
      const mapSnap = await mapRef.get();

      if (!mapSnap.exists) {
        console.error("❌ Order mapping not found");
        return res.status(404).json({ success: false, error: "ORDER_MAPPING_MISSING" });
      }

      const { shopId, orderId } = mapSnap.data();

      const orderRef = db
        .collection("shops")
        .doc(shopId)
        .collection("orders")
        .doc(orderId);

      await orderRef.set(
        {
          paymentStatus: "Paid",
          razorpayPaymentId: razorpay_payment_id,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log("✅ Payment verified & order marked Paid");

      return res.status(200).json({
        success: true,
        redirectUrl: `https://skybridge-booking.onrender.com/#/order-success/${shopId}/${orderId}`
      });
    } catch (error) {
      console.error("❌ Razorpay callback error:", error);
      return res.status(500).json({ success: false, error: "SERVER_ERROR" });
    }
  }
);

 
// ===============================
// CREATE RAZORPAY ORDER (REQUIRED)
// ===============================
const Razorpay = require("razorpay");

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay secrets not available");
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

exports.createRazorpayOrderV2 = onRequest(
  { cors: true, secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const { amount } = req.body;

      if (!amount || isNaN(amount)) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const order = await getRazorpay().orders.create({
        amount: Number(amount),
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        payment_capture: 1,
      });

      await db.collection("razorpayOrders").doc(order.id).set({
        shopId: req.body.shopId || null,
        orderId: req.body.orderId || order.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      });
    } catch (err) {
      console.error("❌ Razorpay order creation failed", err);
      return res.status(500).json({ error: "Order creation failed" });
    }
  }
);
