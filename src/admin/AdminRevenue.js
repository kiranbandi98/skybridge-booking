import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
} from "firebase/firestore";

/* =======================
   CHART.JS IMPORTS
======================= */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Line } from "react-chartjs-2";

/* =======================
   REGISTER CHART.JS
======================= */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function AdminRevenue() {
  const db = getFirestore();
  const [loading, setLoading] = useState(true);

  /* =======================
     BASIC TOTALS
  ======================= */
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
  });

  /* =======================
     CHART DATA
  ======================= */
  const [monthlyData, setMonthlyData] = useState({});
  const [yearlyData, setYearlyData] = useState({});
  const [lastFiveYearsData, setLastFiveYearsData] = useState({});

  /* =======================
     SHOP-WISE DATA
  ======================= */
  const [shopRevenue, setShopRevenue] = useState([]);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const shopsSnapshot = await getDocs(collection(db, "shops"));

        let totalOrders = 0;
        let totalRevenue = 0;
        let todayRevenue = 0;
        let monthRevenue = 0;

        const monthlyMap = {};
        const yearlyMap = {};
        const shopMap = {};

        const now = new Date();
        const currentYear = now.getFullYear();

        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        const monthStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );

        for (const shopDoc of shopsSnapshot.docs) {
          const shopId = shopDoc.id;
          const shopData = shopDoc.data();

          if (!shopMap[shopId]) {
            shopMap[shopId] = {
              shopId,
              shopName: shopData.shopName || "Unnamed Shop",
              totalOrders: 0,
              totalRevenue: 0,
            };
          }

          const ordersRef = collection(
            db,
            "shops",
            shopId,
            "orders"
          );

          const ordersSnapshot = await getDocs(ordersRef);

          ordersSnapshot.forEach((orderDoc) => {
            const data = orderDoc.data();
            const amount = Number(data.totalAmount || 0);

            if (!data.createdAt?.toDate) return;

            const created = data.createdAt.toDate();

            totalOrders += 1;
            totalRevenue += amount;

            shopMap[shopId].totalOrders += 1;
            shopMap[shopId].totalRevenue += amount;

            if (created >= todayStart) {
              todayRevenue += amount;
            }

            if (created >= monthStart) {
              monthRevenue += amount;
            }

            const monthKey = `${created.getFullYear()}-${String(
              created.getMonth() + 1
            ).padStart(2, "0")}`;

            const yearKey = `${created.getFullYear()}`;

            monthlyMap[monthKey] =
              (monthlyMap[monthKey] || 0) + amount;

            yearlyMap[yearKey] =
              (yearlyMap[yearKey] || 0) + amount;
          });
        }

        /* =======================
           LAST 5 YEARS FILTER
        ======================= */
        const last5Years = {};
        for (let y = currentYear - 4; y <= currentYear; y++) {
          last5Years[y] = yearlyMap[y] || 0;
        }

        setStats({
          totalOrders,
          totalRevenue,
          todayRevenue,
          monthRevenue,
        });

        setMonthlyData(monthlyMap);
        setYearlyData(yearlyMap);
        setLastFiveYearsData(last5Years);

        setShopRevenue(
          Object.values(shopMap).sort(
            (a, b) => b.totalRevenue - a.totalRevenue
          )
        );
      } catch (err) {
        console.error("Revenue calculation failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [db]);

  if (loading) {
    return <p>Loading revenue...</p>;
  }

  /* =======================
     CHART CONFIGS
  ======================= */
  const monthlyChart = {
    labels: Object.keys(monthlyData),
    datasets: [
      {
        label: "Monthly Revenue (₹)",
        data: Object.values(monthlyData),
        backgroundColor: "#4CAF50",
      },
    ],
  };

  const yearlyChart = {
    labels: Object.keys(yearlyData),
    datasets: [
      {
        label: "Yearly Revenue (₹)",
        data: Object.values(yearlyData),
        borderColor: "#2196F3",
        backgroundColor: "#2196F3",
        fill: false,
      },
    ],
  };

  const lastFiveYearsChart = {
    labels: Object.keys(lastFiveYearsData),
    datasets: [
      {
        label: "Last 5 Years Revenue (₹)",
        data: Object.values(lastFiveYearsData),
        backgroundColor: "#FF9800",
      },
    ],
  };

  /* =======================
     TOP 5 VENDORS (NEW)
  ======================= */
  const topVendors = shopRevenue.slice(0, 5);

  return (
    <div style={{ padding: 20 }}>
      <h3>Revenue Summary (Admin)</h3>

      {/* TOTALS */}
      <div style={{ marginTop: 16 }}>
        <p><strong>Total Orders:</strong> {stats.totalOrders}</p>
        <p><strong>Total Revenue:</strong> ₹{stats.totalRevenue}</p>
        <p><strong>Today's Revenue:</strong> ₹{stats.todayRevenue}</p>
        <p><strong>This Month's Revenue:</strong> ₹{stats.monthRevenue}</p>
      </div>

      <hr />

      <h4>Monthly Revenue</h4>
      <Bar data={monthlyChart} />

      <hr />

      <h4>Yearly Revenue</h4>
      <Line data={yearlyChart} />

      <hr />

      <h4>Last 5 Years Revenue</h4>
      <Bar data={lastFiveYearsChart} />

      <hr />

      <h4>Shop-wise Revenue</h4>
      <table border="1" cellPadding="8" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Shop Name</th>
            <th>Shop ID</th>
            <th>Total Orders</th>
            <th>Total Revenue (₹)</th>
          </tr>
        </thead>
        <tbody>
          {shopRevenue.map((shop) => (
            <tr key={shop.shopId}>
              <td>{shop.shopName}</td>
              <td>{shop.shopId}</td>
              <td>{shop.totalOrders}</td>
              <td>₹{shop.totalRevenue}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      {/* =======================
          TOP VENDORS LEADERBOARD
      ======================= */}
      <h4>🏆 Top 5 Vendors</h4>
      <table border="1" cellPadding="8" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Shop Name</th>
            <th>Total Orders</th>
            <th>Total Revenue (₹)</th>
          </tr>
        </thead>
        <tbody>
          {topVendors.map((shop, index) => (
            <tr key={shop.shopId}>
              <td>{index + 1}</td>
              <td>{shop.shopName}</td>
              <td>{shop.totalOrders}</td>
              <td>₹{shop.totalRevenue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
