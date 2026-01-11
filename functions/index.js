const { setGlobalOptions } = require("firebase-functions");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
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
