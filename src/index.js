import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App";

// Global Cart Provider
import { CartProvider } from "./context/CartContext";

// Vendor Pages
import VendorRegister from "./pages/VendorRegister";
import VendorDashboard from "./pages/VendorDashboard";
import VendorMenuEditor from "./pages/VendorMenuEditor";
import VendorOrders from "./pages/VendorOrders";
import VendorOrderDetail from "./pages/VendorOrderDetail";

// Correct Menu Component
import MenuDebug from "./pages/MenuDebug.js";

// Order success page (customer)
import OrderSuccess from "./pages/OrderSuccess";

import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* Main App */}
          <Route path="/" element={<App />} />
          <Route path="/menu" element={<MenuDebug />} />

          {/* Customer Order Success */}
          <Route path="/order-success/:orderId" element={<OrderSuccess />} />

          {/* Vendor Routes */}
          <Route path="/vendor/register" element={<VendorRegister />} />
          <Route path="/vendor/:shopId" element={<VendorDashboard />} />
          <Route path="/vendor/:shopId/menu" element={<VendorMenuEditor />} />

          {/* Vendor Orders list */}
          <Route path="/vendor/orders" element={<VendorOrders />} />

          {/* Vendor Order Detail page */}
          <Route path="/vendor/orders/:orderId" element={<VendorOrderDetail />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  </React.StrictMode>
);

reportWebVitals();
