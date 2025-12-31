import { Outlet, NavLink } from "react-router-dom";
import ProtectedAdminRoute from "./ProtectedAdminRoute";

export default function AdminLayout() {
  return (
    <ProtectedAdminRoute>
      <div style={{ padding: 20 }}>
        <h2>Admin Panel</h2>

        {/* Admin Navigation */}
        <nav style={{ marginBottom: 20 }}>
          <NavLink
            to="/admin/vendors"
            style={{ marginRight: 12 }}
          >
            Vendors
          </NavLink>

          <NavLink
            to="/admin/orders"
            style={{ marginRight: 12 }}
          >
            Orders
          </NavLink>

          <NavLink
            to="/admin/revenue"
          >
            Revenue
          </NavLink>
        </nav>

        {/* Admin Pages */}
        <Outlet />
      </div>
    </ProtectedAdminRoute>
  );
}
