import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Capacity from './pages/Capacity'
import Qualification from './pages/Qualification'
import Matching from './pages/Matching'
import Tracking from './pages/Tracking'
import Contracts from './pages/Contracts'
import Settlement from './pages/Settlement'
import Risk from './pages/Risk'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/capacity" element={<Capacity />} />
        <Route path="/qualification" element={<Qualification />} />
        <Route path="/matching" element={<Matching />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/settlement" element={<Settlement />} />
        <Route path="/risk" element={<Risk />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
