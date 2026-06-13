import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import PrintCenter from "@/pages/PrintCenter";
import Customers from "@/pages/Customers";
import OrderEntry from "@/pages/OrderEntry";
import Tracking from "@/pages/Tracking";
import Analytics from "@/pages/Analytics";
import Finance from "@/pages/Finance";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/print-center" element={<PrintCenter />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/order-entry" element={<OrderEntry />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
