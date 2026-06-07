import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Riders from "@/pages/Riders";
import Orders from "@/pages/Orders";
import Grids from "@/pages/Grids";
import Training from "@/pages/Training";
import Monitoring from "@/pages/Monitoring";
import Analytics from "@/pages/Analytics";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/riders" element={<Riders />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/grids" element={<Grids />} />
          <Route path="/training" element={<Training />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </Router>
  );
}
