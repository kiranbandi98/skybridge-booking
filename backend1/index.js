const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");

// Load .env from backend1 folder
require("dotenv").config({ path: "./backend1/.env" });

const app = express();
app.use(cors());
app.use(express.json());

// Confirm env is loaded
console.log("Loaded Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, error: "Amount is required" });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error("Razorpay Error:", err);
    res.status(500).json({ success: false, error: "Could not create order" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
