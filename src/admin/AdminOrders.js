import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
} from "firebase/firestore";

export default function AdminOrders() {
  const db = getFirestore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const shopsSnapshot = await getDocs(collection(db, "shops"));
        let allOrders = [];

        for (const shopDoc of shopsSnapshot.docs) {
          const shopId = shopDoc.id;
          const ordersRef = collection(db, "shops", shopId, "orders");
          const ordersSnapshot = await getDocs(ordersRef);

          ordersSnapshot.forEach((orderDoc) => {
            allOrders.push({
              id: orderDoc.id,
              shopId,
              ...orderDoc.data(),
            });
          });
        }

        setOrders(allOrders);
      } catch (error) {
        console.error("Error fetching admin orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllOrders();
  }, [db]);

  if (loading) {
    return <p>Loading orders...</p>;
  }

  return (
    <div>
      <h3>All Orders (Admin)</h3>

      {orders.length === 0 && <p>No orders found.</p>}

      {orders.length > 0 && (
        <table border="1" cellPadding="8" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Shop ID</th>
              <th>Status</th>
              <th>Total</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.shopId}</td>
                <td>{order.orderStatus}</td>
                <td>₹{order.totalAmount}</td>
                <td>{order.orderType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
