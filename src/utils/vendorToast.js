// src/utils/vendorToast.js

export function showVendorToast(message) {
  const toast = document.createElement("div");
  toast.innerText = message;

  Object.assign(toast.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: "#0f172a",
    color: "#ffffff",
    padding: "14px 18px",
    borderRadius: "8px",
    fontSize: "14px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
    zIndex: 9999,
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}
