import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Properties from "@/pages/Properties";
import PropertyDetail from "@/pages/PropertyDetail";
import MortgageCalculator from "@/pages/MortgageCalculator";
import Agents from "@/pages/Agents";
import AdminDashboard from "@/pages/AdminDashboard";
import DecorationPlans from "@/pages/DecorationPlans";
import MapSearch from "@/pages/MapSearch";
import PropertyPublish from "@/pages/PropertyPublish";
import Appeal from "@/pages/Appeal";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/map-search" element={<MapSearch />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
          <Route path="/decoration-plans" element={<DecorationPlans />} />
          <Route path="/publish" element={<PropertyPublish />} />
          <Route path="/appeal" element={<Appeal />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}
