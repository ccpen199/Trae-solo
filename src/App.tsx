import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Molds from "@/pages/Molds";
import Production from "@/pages/Production";
import Maintenance from "@/pages/Maintenance";
import Quality from "@/pages/Quality";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/molds" element={<Molds />} />
          <Route path="/production" element={<Production />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/quality" element={<Quality />} />
        </Routes>
      </Layout>
    </Router>
  );
}
