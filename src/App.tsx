import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import OrderList from "@/pages/OrderList";
import OrderDetail from "@/pages/OrderDetail";
import WorkerDashboard from "@/pages/worker/WorkerDashboard";
import WorkerProfile from "@/pages/worker/WorkerProfile";
import WorkerScoring from "@/pages/worker/WorkerScoring";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminWorkers from "@/pages/admin/AdminWorkers";
import AdminDispatch from "@/pages/admin/AdminDispatch";
import AdminSop from "@/pages/admin/AdminSop";
import AdminInsurance from "@/pages/admin/AdminInsurance";
import AdminQA from "@/pages/admin/AdminQA";
import EnterpriseDashboard from "@/pages/enterprise/EnterpriseDashboard";
import EnterpriseBilling from "@/pages/enterprise/EnterpriseBilling";
import EnterpriseOrders from "@/pages/enterprise/EnterpriseOrders";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/orders/:id" element={<OrderDetail />} />

        <Route path="/worker" element={<WorkerDashboard />} />
        <Route path="/worker/profile" element={<WorkerProfile />} />
        <Route path="/worker/scoring" element={<WorkerScoring />} />

        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/workers" element={<AdminWorkers />} />
        <Route path="/admin/dispatch" element={<AdminDispatch />} />
        <Route path="/admin/sop" element={<AdminSop />} />
        <Route path="/admin/insurance" element={<AdminInsurance />} />
        <Route path="/admin/qa" element={<AdminQA />} />

        <Route path="/enterprise" element={<EnterpriseDashboard />} />
        <Route path="/enterprise/billing" element={<EnterpriseBilling />} />
        <Route path="/enterprise/orders" element={<EnterpriseOrders />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
