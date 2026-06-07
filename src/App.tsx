import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import Owners from "@/pages/Owners";
import Tenants from "@/pages/Tenants";
import Leases from "@/pages/Leases";
import Loans from "@/pages/Loans";
import Tax from "@/pages/Tax";
import Reports from "@/pages/Reports";
import Appointments from "@/pages/Appointments";
import Reminders from "@/pages/Reminders";
import Compliance from "@/pages/Compliance";
import Mall from "@/pages/Mall";
import Sync from "@/pages/Sync";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="properties" element={<Properties />} />
          <Route path="owners" element={<Owners />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="leases" element={<Leases />} />
          <Route path="loans" element={<Loans />} />
          <Route path="tax" element={<Tax />} />
          <Route path="reports" element={<Reports />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="mall" element={<Mall />} />
          <Route path="sync" element={<Sync />} />
        </Route>
      </Routes>
    </Router>
  );
}
