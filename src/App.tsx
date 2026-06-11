import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Diagnosis from '@/pages/Diagnosis'
import Booking from '@/pages/Booking'
import OrderDetail from '@/pages/OrderDetail'
import Recycle from '@/pages/Recycle'
import AdminHome from '@/pages/admin/Index'
import Technicians from '@/pages/admin/Technicians'
import SLA from '@/pages/admin/SLA'
import Inventory from '@/pages/admin/Inventory'
import Complaints from '@/pages/admin/Complaints'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/diagnosis" element={<Diagnosis />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/order/:id" element={<OrderDetail />} />
          <Route path="/recycle" element={<Recycle />} />
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/technicians" element={<Technicians />} />
          <Route path="/admin/sla" element={<SLA />} />
          <Route path="/admin/inventory" element={<Inventory />} />
          <Route path="/admin/complaints" element={<Complaints />} />
        </Route>
      </Routes>
    </Router>
  )
}
