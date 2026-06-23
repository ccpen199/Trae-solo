import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Authentication from "@/pages/Authentication";
import WaybillNew from "@/pages/WaybillNew";
import WaybillList from "@/pages/WaybillList";
import WaybillDetail from "@/pages/WaybillDetail";
import ExceptionList from "@/pages/ExceptionList";
import ExceptionReview from "@/pages/ExceptionReview";
import UserManagement from "@/pages/UserManagement";
import AuditLogs from "@/pages/AuditLogs";
import RegulatoryOrders from "@/pages/RegulatoryOrders";
import Statistics from "@/pages/Statistics";
import { AppLayout } from "@/components/Layout/AppLayout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="authentication" element={<Authentication />} />
          <Route path="waybills" element={<WaybillList />} />
          <Route path="waybills/new" element={<WaybillNew />} />
          <Route path="waybills/:id" element={<WaybillDetail />} />
          <Route path="exceptions" element={<ExceptionList />} />
          <Route path="exceptions/:id/review" element={<ExceptionReview />} />
          <Route path="admin/users" element={<UserManagement />} />
          <Route path="admin/audit" element={<AuditLogs />} />
          <Route path="admin/orders" element={<RegulatoryOrders />} />
          <Route path="admin/statistics" element={<Statistics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
