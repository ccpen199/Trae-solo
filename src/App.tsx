import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Parts from "@/pages/Parts";
import StockIn from "@/pages/StockIn";
import StockOut from "@/pages/StockOut";
import WorkOrders from "@/pages/WorkOrders";
import Inventory from "@/pages/Inventory";
import Returns from "@/pages/Returns";
import Scraps from "@/pages/Scraps";
import Transfers from "@/pages/Transfers";
import StockTaking from "@/pages/StockTaking";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="parts" element={<Parts />} />
          <Route path="stock-in" element={<StockIn />} />
          <Route path="stock-out" element={<StockOut />} />
          <Route path="work-orders" element={<WorkOrders />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="returns" element={<Returns />} />
          <Route path="scraps" element={<Scraps />} />
          <Route path="transfers" element={<Transfers />} />
          <Route path="stock-taking" element={<StockTaking />} />
        </Route>
      </Routes>
    </Router>
  );
}
