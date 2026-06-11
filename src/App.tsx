import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Dining from '@/pages/Dining'
import DiningOrder from '@/pages/DiningOrder'
import DiningRider from '@/pages/DiningRider'
import Store from '@/pages/Store'
import StoreExpiring from '@/pages/StoreExpiring'
import StoreDeliverer from '@/pages/StoreDeliverer'
import Social from '@/pages/Social'
import SocialTrade from '@/pages/SocialTrade'
import SocialIntern from '@/pages/SocialIntern'
import Admin from '@/pages/Admin'
import AdminOrg from '@/pages/AdminOrg'
import AdminGeofence from '@/pages/AdminGeofence'
import AdminVerify from '@/pages/AdminVerify'
import AdminAnalytics from '@/pages/AdminAnalytics'
import AdminSentiment from '@/pages/AdminSentiment'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dining" element={<Dining />} />
          <Route path="/dining/order/:id" element={<DiningOrder />} />
          <Route path="/dining/rider" element={<DiningRider />} />
          <Route path="/store" element={<Store />} />
          <Route path="/store/expiring" element={<StoreExpiring />} />
          <Route path="/store/deliverer" element={<StoreDeliverer />} />
          <Route path="/social" element={<Social />} />
          <Route path="/social/trade" element={<SocialTrade />} />
          <Route path="/social/intern" element={<SocialIntern />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/org" element={<AdminOrg />} />
          <Route path="/admin/geofence" element={<AdminGeofence />} />
          <Route path="/admin/verify" element={<AdminVerify />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/sentiment" element={<AdminSentiment />} />
        </Route>
      </Routes>
    </Router>
  )
}
