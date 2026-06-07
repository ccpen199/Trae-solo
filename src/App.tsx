import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import RiderList from '@/pages/RiderList'
import RiderDetail from '@/pages/RiderDetail'
import RiderVerify from '@/pages/RiderVerify'
import OrderList from '@/pages/OrderList'
import OrderCreate from '@/pages/OrderCreate'
import OrderDetail from '@/pages/OrderDetail'
import MerchantList from '@/pages/MerchantList'
import MerchantDetail from '@/pages/MerchantDetail'
import DispatchCenter from '@/pages/DispatchCenter'
import TrackingCenter from '@/pages/TrackingCenter'
import SettlementCenter from '@/pages/SettlementCenter'
import OpsDashboard from '@/pages/OpsDashboard'
import RiskControl from '@/pages/RiskControl'
import Profile from '@/pages/Profile'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/riders" element={<RiderList />} />
          <Route path="/riders/:id/verify" element={<RiderVerify />} />
          <Route path="/riders/:id" element={<RiderDetail />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/create" element={<OrderCreate />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/merchants" element={<MerchantList />} />
          <Route path="/merchants/:id" element={<MerchantDetail />} />
          <Route path="/dispatch" element={<DispatchCenter />} />
          <Route path="/tracking" element={<TrackingCenter />} />
          <Route path="/settlement" element={<SettlementCenter />} />
          <Route path="/dashboard/ops" element={<OpsDashboard />} />
          <Route path="/admin" element={<OpsDashboard />} />
          <Route path="/risk" element={<RiskControl />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  )
}
