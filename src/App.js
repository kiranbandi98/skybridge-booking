import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";

/* ---------------- CUSTOMER PAGES ---------------- */
import ShopMenuPage from "./pages/ShopMenuPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccess from "./pages/OrderSuccess";
import TrackOrder from "./pages/TrackOrder";

/* ---------------- VENDOR PAGES ---------------- */
import VendorRegister from "./pages/VendorRegister";
import VendorLogin from "./pages/VendorLogin";
import VendorDashboard from "./pages/VendorDashboard";
import VendorMenuEditor from "./pages/VendorMenuEditor";
import VendorOrders from "./pages/VendorOrders";
import VendorOrderDetail from "./pages/VendorOrderDetail";

/* ---------------- PROTECTED ROUTE ---------------- */
import ProtectedVendorRoute from "./components/ProtectedVendorRoute";

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>

          {/* ================= CUSTOMER ROUTES ================= */}
          <Route path="/shop/:shopId" element={<ShopMenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:orderId" element={<OrderSuccess />} />
          <Route path="/track/:orderId" element={<TrackOrder />} />

          {/* ================= VENDOR AUTH ================= */}
          <Route path="/vendor/login" element={<VendorLogin />} />
          <Route path="/vendor/register" element={<VendorRegister />} />

          {/* ================= VENDOR PROTECTED ================= */}
          <Route
            path="/vendor/:shopId"
            element={
              <ProtectedVendorRoute>
                <VendorDashboard />
              </ProtectedVendorRoute>
            }
          />

          <Route
            path="/vendor/:shopId/menu"
            element={
              <ProtectedVendorRoute>
                <VendorMenuEditor />
              </ProtectedVendorRoute>
            }
          />

          <Route
            path="/vendor/:shopId/orders"
            element={
              <ProtectedVendorRoute>
                <VendorOrders />
              </ProtectedVendorRoute>
            }
          />

          <Route
            path="/vendor/:shopId/orders/:orderId"
            element={
              <ProtectedVendorRoute>
                <VendorOrderDetail />
              </ProtectedVendorRoute>
            }
          />

          {/* ================= SPA FALLBACK ================= */}
          <Route path="*" element={<div />} />

        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
