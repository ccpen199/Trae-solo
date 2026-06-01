import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Sites from '@/pages/Sites'
import SiteDetail from '@/pages/SiteDetail'
import Devices from '@/pages/Devices'
import DeviceDetail from '@/pages/DeviceDetail'
import Orders from '@/pages/Orders'
import OrderDetail from '@/pages/OrderDetail'
import WorkOrders from '@/pages/WorkOrders'
import WorkOrderDetail from '@/pages/WorkOrderDetail'
import Finance from '@/pages/Finance'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sites" element={<Sites />} />
          <Route path="/sites/:id" element={<SiteDetail />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/devices/:id" element={<DeviceDetail />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/work-orders/:id" element={<WorkOrderDetail />} />
          <Route path="/finance" element={<Finance />} />
        </Route>
      </Routes>
    </Router>
  )
}
