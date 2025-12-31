import { Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

const SUPER_ADMIN_EMAIL = "kiran12@gmail.com"; // 👈 your admin email

export default function ProtectedAdminRoute({ children }) {
  const auth = getAuth();
  const user = auth.currentUser;

  // Not logged in → go to admin login
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Logged in but NOT admin → block access
  if (user.email !== SUPER_ADMIN_EMAIL) {
    return <Navigate to="/" replace />;
  }

  // Admin allowed
  return children;
}
