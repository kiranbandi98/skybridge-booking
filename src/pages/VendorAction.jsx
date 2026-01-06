import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../utils/firebase";
import {
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";

export default function VendorAction() {
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");

  // ✅ REQUIRED for HashRouter
  // Example:
  // #/vendor/action?mode=verifyEmail&oobCode=XXXX
  const hash = window.location.hash || "";
  const queryString = hash.includes("?") ? hash.split("?")[1] : "";
  const params = new URLSearchParams(queryString);

  const mode = params.get("mode");
  const oobCode = params.get("oobCode");

  useEffect(() => {
    // ⛔ invalid / broken link
    if (!mode || !oobCode) {
      setError("Invalid or expired link.");
      setStatus("error");
      return;
    }

    // ✅ EMAIL VERIFICATION
    if (mode === "verifyEmail") {
      applyActionCode(auth, oobCode)
        .then(() => {
          setStatus("verified");
        })
        .catch(() => {
          setError("Email verification failed or expired.");
          setStatus("error");
        });
    }

    // ✅ PASSWORD RESET
    if (mode === "resetPassword") {
      verifyPasswordResetCode(auth, oobCode)
        .then(() => {
          setStatus("reset");
        })
        .catch(() => {
          setError("Invalid or expired reset link.");
          setStatus("error");
        });
    }
  }, [mode, oobCode]);

  const handleResetPassword = async () => {
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("done");
    } catch {
      setError("Failed to reset password.");
    }
  };

  // ================= UI =================

  if (status === "loading") {
    return <p>Processing…</p>;
  }

  if (status === "verified") {
    return (
      <div>
        <h2>Email verified successfully ✅</h2>
        <p>Please login manually.</p>
        <button onClick={() => navigate("/vendor/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  if (status === "reset") {
    return (
      <div>
        <h2>Reset your password</h2>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleResetPassword}>
          Reset Password
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  }

  if (status === "done") {
    return (
      <div>
        <h2>Password reset successful ✅</h2>
        <button onClick={() => navigate("/vendor/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  return <p style={{ color: "red" }}>{error}</p>;
}
