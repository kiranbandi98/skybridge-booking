import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BookingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Booking data passed from booking form
  const booking = location.state?.booking;

  if (!booking) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>No booking data found.</h2>
        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            fontSize: "16px",
            borderRadius: "8px",
          }}
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "700px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "28px", color: "green" }}>🎉 Booking Confirmed!</h2>

      <p style={{ marginTop: "10px", fontSize: "18px" }}>
        Your table reservation details have been recorded.
      </p>

      {/* Booking Details Box */}
      <div
        style={{
          marginTop: "25px",
          padding: "25px",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 0 12px rgba(0,0,0,0.1)",
          textAlign: "left",
        }}
      >
        <p>
          <b>Name:</b> {booking.name}
        </p>
        <p>
          <b>Date & Time:</b> {booking.date} at {booking.slot}
        </p>
        <p>
          <b>Table:</b> {booking.table}
        </p>
        <p>
          <b>Guests:</b> {booking.guests}
        </p>

        <p>
          <b>Pre-order Items:</b>
        </p>
        <ul>
          {booking.items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>

        <p>
          <b>Total Payment Due:</b> ₹{booking.amount}
        </p>
      </div>

      {/* ------------------ PAYMENT SECTION ------------------ */}
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          background: "#fff",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <h3>💳 UPI Payment</h3>

        <p style={{ fontSize: "18px", marginTop: "10px" }}>
          Pay to UPI ID: <b>kirankumarreddy172003@oksbi</b>
        </p>

        <p style={{ marginTop: "5px" }}>Scan the QR to Pay</p>

        {/* QR Image */}
        <img
          src="/images/upi_qr.png"
          alt="UPI QR"
          style={{ width: "220px", margin: "15px auto" }}
        />

        <p style={{ fontSize: "20px", marginTop: "10px" }}>
          Amount: <b>₹{booking.amount}</b>
        </p>

        {/* PAY NOW BUTTON */}
        <a
          href={`upi://pay?pa=kirankumarreddy172003@oksbi&pn=OpenSkyBridge&tn=Table%20Booking&am=${booking.amount}&cu=INR`}
          style={{
            display: "inline-block",
            marginTop: "15px",
            background: "#007bff",
            padding: "12px 25px",
            borderRadius: "8px",
            color: "white",
            textDecoration: "none",
            fontSize: "18px",
          }}
        >
          Pay Now
        </a>

        <p style={{ marginTop: "10px", color: "red" }}>
          *Please complete your UPI payment to finalize the booking.*
        </p>
      </div>

      {/* Return Button */}
      <button
        onClick={() => navigate("/menu")}
        style={{
          marginTop: "25px",
          padding: "12px 25px",
          fontSize: "16px",
          borderRadius: "8px",
          background: "#0056b3",
          color: "white",
          cursor: "pointer",
        }}
      >
        Return to Menu
      </button>
    </div>
  );
};


