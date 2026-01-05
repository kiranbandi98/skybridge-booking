import { useEffect, useState } from "react";
import { applyActionCode } from "firebase/auth";
import { auth } from "../utils/firebase";
import { useNavigate } from "react-router-dom";

export default function VendorVerifyEmail() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

    if (mode !== "verifyEmail" || !oobCode) {
      setStatus("invalid");
      return;
    }

    applyActionCode(auth, oobCode)
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate("/vendor/login"), 3000);
      })
      .catch(() => setStatus("error"));
  }, [navigate]);

  if (status === "verifying") return <h2>Verifying email...</h2>;
  if (status === "success") return <h2>Email verified successfully</h2>;
  if (status === "error") return <h2>Invalid or expired link</h2>;
  return <h2>Invalid verification link</h2>;
}
