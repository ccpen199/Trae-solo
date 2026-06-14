import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import FreightList from "@/pages/FreightList";
import FreightDetail from "@/pages/FreightDetail";
import FreightCreate from "@/pages/FreightCreate";
import OrderList from "@/pages/OrderList";
import OrderDetail from "@/pages/OrderDetail";
import InvoiceList from "@/pages/InvoiceList";
import InvoiceDetail from "@/pages/InvoiceDetail";
import InvoiceEntity from "@/pages/InvoiceEntity";
import Settlement from "@/pages/Settlement";
import Safety from "@/pages/Safety";
import Certification from "@/pages/Certification";
import Profile from "@/pages/Profile";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Home />} />
          <Route path="freight" element={<FreightList />} />
          <Route path="freight/create" element={<FreightCreate />} />
          <Route path="freight/:id" element={<FreightDetail />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="invoices/entity" element={<InvoiceEntity />} />
          <Route path="settlement" element={<Settlement />} />
          <Route path="safety" element={<Safety />} />
          <Route path="certification" element={<Certification />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}
