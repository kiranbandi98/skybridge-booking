// src/pages/VendorMenuEditor.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useParams, Link } from "react-router-dom";

export default function VendorMenuEditor() {
  const { shopId } = useParams();
  const [menu, setMenu] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    img: "",
  });

  // -------------------------------
  // 🔥 Real-time Firestore Listener
  // -------------------------------
  useEffect(() => {
    const q = query(
      collection(db, `shops/${shopId}/menu`),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMenu(list);
    });

    return () => unsubscribe();
  }, [shopId]);

  // -------------------------------
  // ➕ Add New Menu Item
  // -------------------------------
  async function addMenuItem() {
    if (!newItem.name || !newItem.price) {
      alert("Name and Price are required");
      return;
    }

    try {
      await addDoc(collection(db, `shops/${shopId}/menu`), {
        name: newItem.name,
        price: Number(newItem.price),
        img: newItem.img || "",
        timestamp: new Date(),
      });

      setNewItem({ name: "", price: "", img: "" });
      alert("Menu item added!");
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item");
    }
  }

  // -------------------------------
  // ✏️ Update Menu Item
  // -------------------------------
  async function updateMenuItem(id, field, value) {
    try {
      await updateDoc(doc(db, `shops/${shopId}/menu`, id), {
        [field]: field === "price" ? Number(value) : value,
      });
    } catch (error) {
      console.error("Update error:", error);
    }
  }

  // -------------------------------
  // ❌ Delete Menu Item
  // -------------------------------
  async function deleteMenuItem(id) {
    if (!window.confirm("Delete this item?")) return;

    try {
      await deleteDoc(doc(db, `shops/${shopId}/menu`, id));
      alert("Item deleted");
    } catch (error) {
      console.error("Delete error:", error);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2>Menu Editor</h2>
      <p>Edit your shop menu in real-time.</p>

      {/* Back Button */}
      <Link to={`/vendor/${shopId}`}>
        <button
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: "#0366d6",
            color: "white",
            cursor: "pointer",
            marginBottom: 20,
            border: "none",
          }}
        >
          ← Back to Dashboard
        </button>
      </Link>

      {/* -------------------------------
          Add New Item Section
      ------------------------------- */}
      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 10,
          marginBottom: 30,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h3>Add New Item</h3>

        <input
          placeholder="Item Name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          style={inputBox}
        />

        <input
          placeholder="Price"
          type="number"
          value={newItem.price}
          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          style={inputBox}
        />

        <input
          placeholder="Image URL (optional)"
          value={newItem.img}
          onChange={(e) => setNewItem({ ...newItem, img: e.target.value })}
          style={inputBox}
        />

        <button onClick={addMenuItem} style={addButton}>
          ➕ Add Item
        </button>
      </div>

      {/* -------------------------------
          Menu List
      ------------------------------- */}
      <h3>Current Menu</h3>

      {menu.length === 0 ? (
        <p>No items yet.</p>
      ) : (
        menu.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              gap: 20,
              padding: 15,
              marginBottom: 15,
              background: "white",
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            {/* Image */}
            <img
              src={item.img || "https://via.placeholder.com/80"}
              style={{
                width: 80,
                height: 80,
                borderRadius: 10,
                objectFit: "cover",
              }}
              alt="menu"
            />

            <div style={{ flex: 1 }}>
              <input
                value={item.name}
                onChange={(e) => updateMenuItem(item.id, "name", e.target.value)}
                style={inputSmall}
              />

              <input
                type="number"
                value={item.price}
                onChange={(e) =>
                  updateMenuItem(item.id, "price", e.target.value)
                }
                style={inputSmall}
              />

              <input
                value={item.img}
                onChange={(e) => updateMenuItem(item.id, "img", e.target.value)}
                style={inputSmall}
              />
            </div>

            {/* Delete Button */}
            <button
              onClick={() => deleteMenuItem(item.id)}
              style={{
                background: "red",
                border: "none",
                color: "white",
                padding: "10px 15px",
                borderRadius: 8,
                cursor: "pointer",
                height: "fit-content",
              }}
            >
              🗑 Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

/* -------------------------------
   Reusable Styles
------------------------------- */
const inputBox = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  marginBottom: 10,
};

const inputSmall = {
  width: "100%",
  padding: 8,
  borderRadius: 6,
  border: "1px solid #ccc",
  marginBottom: 8,
};

const addButton = {
  padding: "10px 20px",
  background: "#4caf50",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};
