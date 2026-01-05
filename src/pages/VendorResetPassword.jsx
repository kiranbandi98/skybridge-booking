import { useState } from "react";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "../utils/firebase";
import { useNavigate } from "react-router-dom";

export default function VendorResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("ready");

  const params = new URLSearchParams(window.location.search);
  const oobCode = params.get("oobCode");

  if (!oobCode) {
    return <h2>Invalid or expired reset link.</h2>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("success");
      setTimeout(() => navigate("/vendor/login"), 2500);
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return <h2>Password updated successfully. Redirecting to login…</h2>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: "80px auto" }}>
      <h2>Create New Password</h2>

      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Updating…" : "Update Password"}
      </button>

      {status === "error" && <p>Reset failed. Try again.</p>}
    </form>
  );
}
