import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import { CartProvider } from "./context/CartContext";

/* =======================
   CUSTOMER PAGES
======================= */
import ShopMenuPage from "./pages/ShopMenuPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccess from "./pages/OrderSuccess";
import TrackOrder from "./pages/TrackOrder";

/* =======================
   VENDOR PAGES
======================= */
import VendorRegister from "./pages/VendorRegister";
import VendorLogin from "./pages/VendorLogin";
import VendorDashboard from "./pages/VendorDashboard";
import VendorMenuEditor from "./pages/VendorMenuEditor";
import VendorOrders from "./pages/VendorOrders";
import VendorOrderDetail from "./pages/VendorOrderDetail";

/* =======================
   LAYOUT & PROTECTION
======================= */
import ProtectedVendorRoute from "./components/ProtectedVendorRoute";
import VendorLayout from "./components/VendorLayout";

/* =======================
   SERVICE WORKER (FCM)
======================= */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then((registration) => {
        console.log("✅ Service Worker registered:", registration);
      })
      .catch((error) => {
        console.error("❌ Service Worker registration failed:", error);
      });
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <CartProvider>
      <HashRouter>
        <Routes>

          {/* Default */}
          <Route path="/" element={<Navigate to="/vendor/login" replace />} />

          {/* CUSTOMER */}
          <Route path="/shop/:shopId" element={<ShopMenuPage />} />
          <Route path="/cart/:shopId" element={<CartPage />} />
          <Route path="/checkout/:shopId" element={<CheckoutPage />} />
          <Route
            path="/order-success/:shopId/:orderId"
            element={<OrderSuccess />}
          />
          <Route path="/track/:shopId/:orderId" element={<TrackOrder />} />

          {/* VENDOR AUTH */}
          <Route path="/vendor/register" element={<VendorRegister />} />
          <Route path="/vendor/login" element={<VendorLogin />} />

          {/* VENDOR PROTECTED */}
          <Route path="/vendor/:shopId" element={<ProtectedVendorRoute />}>
            <Route element={<VendorLayout />}>
              <Route index element={<VendorDashboard />} />
              <Route path="orders" element={<VendorOrders />} />
              <Route path="orders/:orderId" element={<VendorOrderDetail />} />
              <Route path="menu" element={<VendorMenuEditor />} />
            </Route>
          </Route>

        </Routes>
      </HashRouter>
    </CartProvider>
  </React.StrictMode>
);
