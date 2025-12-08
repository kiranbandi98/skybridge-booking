// backend1/index.js

require("dotenv").config(); // auto-load .env in backend1 folder

const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Check keys loaded
console.log("🔑 Loaded Razorpay Key:", process.env.RAZORPAY_KEY_ID);

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order API
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        error: "Amount is required",
      });
    }

    const order = await razorpay.orders.create({
      amount: amount, // amount already in paise (frontend will send paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return res.json({
      success: true,
      orderId: order.id,
      order,
    });
  } catch (err) {
    console.error("❌ Razorpay Error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to create order",
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
