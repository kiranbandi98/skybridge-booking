import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

export default function AdminVendors() {
  const db = getFirestore();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const snapshot = await getDocs(collection(db, "shops"));
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setShops(list);
      } catch (err) {
        console.error("Error fetching shops:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [db]);

  const toggleActive = async (shopId, currentStatus) => {
    try {
      await updateDoc(doc(db, "shops", shopId), {
        active: !currentStatus,
      });

      setShops((prev) =>
        prev.map((s) =>
          s.id === shopId ? { ...s, active: !currentStatus } : s
        )
      );
    } catch (err) {
      console.error("Failed to update shop status:", err);
    }
  };

  if (loading) {
    return <p>Loading vendors...</p>;
  }

  return (
    <div>
      <h3>Vendor Management</h3>

      {shops.length === 0 && <p>No vendors found.</p>}

      <table border="1" cellPadding="8" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Shop Name</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {shops.map((shop) => (
            <tr key={shop.id}>
              <td>{shop.shopName || "Unnamed Shop"}</td>
              <td>{shop.active ? "Active" : "Disabled"}</td>
              <td>
                <button
                  onClick={() => toggleActive(shop.id, shop.active)}
                >
                  {shop.active ? "Disable" : "Enable"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
