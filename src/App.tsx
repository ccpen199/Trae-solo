import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/Home";
import CaseList from "@/pages/CaseList";
import CaseDetail from "@/pages/CaseDetail";
import Case3DView from "@/pages/Case3DView";
import FloorplanMatch from "@/pages/FloorplanMatch";
import PurchaseList from "@/pages/PurchaseList";
import PdfDelivery from "@/pages/PdfDelivery";
import DesignerRegister from "@/pages/DesignerRegister";
import DesignerDashboard from "@/pages/DesignerDashboard";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/cases" element={<CaseList />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/floorplan-match" element={<FloorplanMatch />} />
          <Route path="/purchase-list" element={<PurchaseList />} />
          <Route path="/pdf-delivery/:id" element={<PdfDelivery />} />
        </Route>

        <Route path="/cases/:id/3d" element={<Case3DView />} />
        <Route path="/designer/register" element={<DesignerRegister />} />
        <Route path="/designer/dashboard" element={<DesignerDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}
