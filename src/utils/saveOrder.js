import { db } from "../utils/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// FIX: accept a single object, not positional args
export async function saveOrderToFirestore({
  shopId,
  ...orderData
}) {
  try {
    if (!shopId || typeof shopId !== "string") {
      throw new Error("Invalid shopId passed to saveOrderToFirestore");
    }

    const docRef = await addDoc(
      collection(db, "shops", shopId, "orders"),
      {
        ...orderData,
        shopId,
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
