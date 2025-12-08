import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function saveOrderToFirestore(orderData) {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      status: "paid",
      createdAt: serverTimestamp(),
    });

    return docRef.id;  // return orderId so we can redirect
  } catch (err) {
    console.error("saveOrderToFirestore error:", err);
    throw err;
  }
}
