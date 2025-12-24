import { db } from "../utils/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function saveOrderToFirestore(shopId, orderData) {
  try {
    // ✅ CORRECT: orders saved under the shop
    const docRef = await addDoc(
      collection(db, "shops", shopId, "orders"),
      {
        ...orderData,
        shopId: shopId, // still useful for queries/debugging
        status: "paid",
        createdAt: serverTimestamp(),
      }
    );

    return docRef.id;
  } catch (err) {
    console.error("saveOrderToFirestore error:", err);
    throw err;
  }
}
