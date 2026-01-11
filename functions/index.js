const { setGlobalOptions } = require("firebase-functions");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

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

      /* =========================
         1️⃣ CALCULATE ORDER TOTAL
         ========================= */

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

      /* =========================
         2️⃣ UPDATE SHOP REVENUE
         ========================= */

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

      /* =========================
         3️⃣ SEND FCM NOTIFICATION
         ========================= */

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

// DRY-RUN payout engine (NO MONEY MOVEMENT)
const { runDryRunPayout } = require("./payouts/dryRunPayout");

exports.notifyVendorOnPaymentPaid = onDocumentUpdated(
  "shops/{shopId}/orders/{orderId}",
  async (event) => {
    try {
      const before = event.data.before.data();
      const after = event.data.after.data();

      // Trigger ONLY when paymentStatus changes to Paid
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

      /* =========================
         4️⃣ DRY-RUN PAYOUT (LOG ONLY)
         ========================= */

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

const crypto = require("crypto");

exports.razorpayCallback = onRequest(async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("❌ Missing Razorpay callback fields");
      return res.status(400).send("Invalid callback payload");
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Razorpay signature mismatch");
      return res.status(400).send("Signature verification failed");
    }

    // Find order by razorpay_order_id
    const orderSnap = await db
      .collectionGroup("orders")
      .where("razorpayOrderId", "==", razorpay_order_id)
      .limit(1)
      .get();

    if (orderSnap.empty) {
      console.error("❌ Order not found for Razorpay order ID");
      return res.status(404).send("Order not found");
    }

    const orderDoc = orderSnap.docs[0];
    const orderRef = orderDoc.ref;

    await orderRef.set(
      {
        paymentStatus: "Paid",
        razorpayPaymentId: razorpay_payment_id,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const { shopId, orderId } = orderRef.path.match(/shops\/(.*?)\/orders\/(.*)/).groups || {};

    console.log("✅ Payment verified & order marked Paid:", razorpay_order_id);

    // Redirect user to success page
    return res.redirect(
      `https://skybridge-booking.onrender.com/#/order-success/${shopId}/${orderRef.id}`
    );
  } catch (error) {
    console.error("❌ Razorpay callback error:", error);
    return res.status(500).send("Server error");
  }

});
