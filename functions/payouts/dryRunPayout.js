/**
 * DRY-RUN payout engine (NO MONEY MOVEMENT)
 * Logs payout intent only.
 */
const admin = require("firebase-admin");

module.exports.runDryRunPayout = async ({ shopId, orderId, amount }) => {
  console.log("[DRY-RUN PAYOUT]");
  console.log({
    shopId,
    orderId,
    amount,
    mode: "INSTANT_DINEIN",
    timestamp: new Date().toISOString(),
  });

  // Explicitly do nothing else
  return { ok: true };
};
