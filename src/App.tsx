import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import BottomTab from '@/components/BottomTab'
import AdminLayout from '@/components/admin/AdminLayout'
import Home from '@/pages/Home'
import Category from '@/pages/Category'
import MerchantJoin from '@/pages/MerchantJoin'
import MerchantDetail from '@/pages/MerchantDetail'
import PackageDetail from '@/pages/PackageDetail'
import OrderDetail from '@/pages/OrderDetail'
import Orders from '@/pages/Orders'
import Dashboard from '@/pages/admin/Dashboard'
import MerchantManage from '@/pages/admin/MerchantManage'
import CampaignManage from '@/pages/admin/CampaignManage'
import ReportDetail from '@/pages/admin/ReportDetail'
import Geofence from '@/pages/admin/Geofence'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="merchants" element={<MerchantManage />} />
          <Route path="campaigns" element={<CampaignManage />} />
          <Route path="reports" element={<ReportDetail />} />
          <Route path="geofence" element={<Geofence />} />
        </Route>
        <Route path="*" element={
          <div className="min-h-screen bg-[var(--color-bg-secondary)]">
            <Navbar />
            <main className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/category/:type" element={<Category />} />
                <Route path="/merchant-join" element={<MerchantJoin />} />
                <Route path="/merchant/:id" element={<MerchantDetail />} />
                <Route path="/package/:id" element={<PackageDetail />} />
                <Route path="/order/:id" element={<OrderDetail />} />
                <Route path="/orders" element={<Orders />} />
              </Routes>
            </main>
            <BottomTab />
          </div>
        } />
      </Routes>
    </Router>
  )
}
