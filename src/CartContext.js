// src/CartContext.js
import React, { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState({});

  // Add or remove items
  function addToCart(id, delta = 1) {
    setCart((prev) => {
      const updated = { ...prev };
      updated[id] = Math.max(0, (updated[id] || 0) + delta);
      if (updated[id] === 0) delete updated[id];
      return updated;
    });
  }

  return (
    <CartContext.Provider value={{ cart, addToCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
