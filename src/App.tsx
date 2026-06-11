import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import ChargingMap from '@/pages/ChargingMap'
import Devices from '@/pages/Devices'
import DeviceDetail from '@/pages/DeviceDetail'
import Orders from '@/pages/Orders'
import Billing from '@/pages/Billing'
import Alerts from '@/pages/Alerts'
import Safety from '@/pages/Safety'
import Users from '@/pages/Users'
import Settlement from '@/pages/Settlement'
import Prediction from '@/pages/Prediction'
import Profile from '@/pages/Profile'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="map" element={<ChargingMap />} />
          <Route path="devices" element={<Devices />} />
          <Route path="devices/:id" element={<DeviceDetail />} />
          <Route path="orders" element={<Orders />} />
          <Route path="billing" element={<Billing />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="safety" element={<Safety />} />
          <Route path="users" element={<Users />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settlement" element={<Settlement />} />
          <Route path="prediction" element={<Prediction />} />
        </Route>
      </Routes>
    </Router>
  )
}
