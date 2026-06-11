import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import PropertyList from "@/pages/PropertyList";
import PropertyDetail from "@/pages/PropertyDetail";
import PriceAnalysis from "@/pages/PriceAnalysis";
import TimeMachine from "@/pages/TimeMachine";
import ReportCenter from "@/pages/ReportCenter";
import UserCenter from "@/pages/UserCenter";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import { Layout } from "@/components/Layout";
import { AdminLayout } from "@/components/AdminLayout";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/properties/:category" element={<PropertyList />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/price-analysis" element={<PriceAnalysis />} />
          <Route path="/time-machine" element={<TimeMachine />} />
          <Route path="/report" element={<ReportCenter />} />
          <Route path="/user-center" element={<UserCenter />} />
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/reports" element={<AdminDashboard />} />
          <Route path="/admin/agents" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}
