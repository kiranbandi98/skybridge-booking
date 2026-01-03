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
import VendorSetPassword from "./pages/VendorSetPassword";
import VendorForgotPassword from "./pages/VendorResetPassword_TEMP";
import VendorResetPassword from "./pages/VendorResetPassword";
import VendorCheckEmail from "./pages/VendorCheckEmail"; // ✅ NEW
import VendorDashboard from "./pages/VendorDashboard";
import VendorMenuEditor from "./pages/VendorMenuEditor";
import VendorOrders from "./pages/VendorOrders";
import VendorOrderDetail from "./pages/VendorOrderDetail";

/* =======================
   ADMIN PAGES (✅ ADDED)
======================= */
import AdminLogin from "./admin/AdminLogin";
import AdminLayout from "./admin/AdminLayout";
import AdminVendors from "./admin/AdminVendors";
import AdminOrders from "./admin/AdminOrders";
import AdminRevenue from "./admin/AdminRevenue";
import ProtectedAdminRoute from "./admin/ProtectedAdminRoute";

/* =======================
   LAYOUTS
======================= */
import ProtectedVendorRoute from "./components/ProtectedVendorRoute";
import VendorLayout from "./components/VendorLayout";

/* =======================
   SERVICE WORKER
======================= */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/firebase-messaging-sw.js");
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <CartProvider>
      <HashRouter>
        <Routes>

          {/* =====================
              DEFAULT (KEEP VENDOR)
          ===================== */}
          <Route path="/" element={<Navigate to="/vendor/login" replace />} />

          {/* =====================
              CUSTOMER ROUTES
          ===================== */}
          <Route path="/shop/:shopId" element={<ShopMenuPage />} />
          <Route path="/cart/:shopId" element={<CartPage />} />
          <Route path="/checkout/:shopId" element={<CheckoutPage />} />
          <Route path="/order-success/:shopId/:orderId" element={<OrderSuccess />} />
          <Route path="/track/:shopId/:orderId" element={<TrackOrder />} />

          {/* =====================
              VENDOR AUTH
          ===================== */}
          <Route path="/vendor/register" element={<VendorRegister />} />
          <Route path="/vendor/check-email" element={<VendorCheckEmail />} /> {/* ✅ NEW */}
          <Route path="/vendor/login" element={<VendorLogin />} />
          
          <Route path="/vendor/set-password" element={<VendorSetPassword />} />
          <Route path="/vendor/forgot-password" element={<VendorForgotPassword />} />
          <Route path="/vendor/reset-password" element={<VendorResetPassword />} />



          {/* =====================
              VENDOR PROTECTED
          ===================== */}
          <Route path="/vendor/:shopId" element={<ProtectedVendorRoute />}>
            <Route element={<VendorLayout />}>
              <Route index element={<VendorDashboard />} />
              <Route path="orders" element={<VendorOrders />} />
              <Route path="orders/:orderId" element={<VendorOrderDetail />} />
              <Route path="menu" element={<VendorMenuEditor />} />
            </Route>
          </Route>

          {/* =====================
              ADMIN AUTH (✅ FIXED)
          ===================== */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* =====================
              ADMIN PROTECTED
          ===================== */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<Navigate to="vendors" replace />} />
            <Route path="vendors" element={<AdminVendors />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="revenue" element={<AdminRevenue />} />
          </Route>

        </Routes>
      </HashRouter>
    </CartProvider>
  </React.StrictMode>
);
