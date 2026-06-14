import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
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

type Role = 'driver' | 'shipper' | 'admin'

function PrivateRoute({ children, allowRoles }: { children: React.ReactNode; allowRoles?: Role[] }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && isAuthenticated && !user) {
      useAuthStore.getState().loadUser()
    }
  }, [isAuthenticated, user])

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (allowRoles && user && !allowRoles.includes(user.role as Role)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function Bootstrap() {
  const loadUser = useAuthStore(s => s.loadUser)
  useEffect(() => {
    loadUser()
  }, [loadUser])
  return null
}

export default function App() {
  return (
    <Router>
      <Bootstrap />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Home />} />
          <Route path="freight" element={<FreightList />} />
          <Route path="freight/create" element={<PrivateRoute allowRoles={['shipper', 'admin']}><FreightCreate /></PrivateRoute>} />
          <Route path="freight/:id" element={<FreightDetail />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="invoices/entity" element={<PrivateRoute allowRoles={['shipper', 'admin']}><InvoiceEntity /></PrivateRoute>} />
          <Route path="settlement" element={<Settlement />} />
          <Route path="safety" element={<Safety />} />
          <Route path="certification" element={<PrivateRoute allowRoles={['driver', 'admin']}><Certification /></PrivateRoute>} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}
