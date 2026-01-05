import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../utils/firebase";
import { applyActionCode } from "firebase/auth";

export default function VendorAction() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

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
          setTimeout(() => navigate("/vendor/login"), 2500);
        })
        .catch(() => {
          setError("Email verification failed or expired.");
          setStatus("error");
        });
      return;
    }

    // ✅ PASSWORD RESET (ONLY REDIRECT)
    if (mode === "resetPassword") {
      navigate(`/vendor/reset-password?oobCode=${oobCode}`);
      return;
    }

    // ✅ EMAIL CHANGE
    if (mode === "verifyAndChangeEmail") {
      applyActionCode(auth, oobCode)
        .then(() => {
          setStatus("emailChanged");
          setTimeout(() => navigate("/vendor/login"), 2500);
        })
        .catch(() => {
          setError("Email change verification failed.");
          setStatus("error");
        });
      return;
    }

    setError("Unsupported action.");
    setStatus("error");
  }, [navigate]);

  if (status === "loading") return <h2>Processing…</h2>;
  if (status === "verified") return <h2>Email verified successfully.</h2>;
  if (status === "emailChanged") return <h2>Email updated successfully.</h2>;
  if (status === "error") return <h2>{error}</h2>;

  return null;
}
