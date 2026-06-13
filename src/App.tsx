import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import PropertyDetail from "@/pages/Properties/PropertyDetail";
import Publish from "@/pages/Properties/Publish";
import WorkOrders from "@/pages/WorkOrders";
import WorkOrderDetail from "@/pages/WorkOrders/WorkOrderDetail";
import CreateWorkOrder from "@/pages/WorkOrders/Create";
import Matching from "@/pages/Matching";
import Negotiation from "@/pages/Matching/Negotiation";
import Contract from "@/pages/Matching/Contract";
import AdminDashboard from "@/pages/Admin/Dashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/publish" element={<Publish />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          
          <Route path="/orders" element={<WorkOrders />} />
          <Route path="/orders/create" element={<CreateWorkOrder />} />
          <Route path="/orders/:id" element={<WorkOrderDetail />} />
          
          <Route path="/matching" element={<Matching />} />
          <Route path="/negotiation/:id" element={<Negotiation />} />
          <Route path="/contract/:id" element={<Contract />} />
          
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}
