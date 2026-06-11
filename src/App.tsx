import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Pickup from './pages/Pickup'
import Scan from './pages/Scan'
import Waybill from './pages/Waybill'
import Tracking from './pages/Tracking'
import Contraband from './pages/Contraband'
import Freight from './pages/Freight'
import Complaint from './pages/Complaint'
import Invoice from './pages/Invoice'
import Membership from './pages/Membership'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pickup" element={<Pickup />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/waybill" element={<Waybill />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/contraband" element={<Contraband />} />
        <Route path="/freight" element={<Freight />} />
        <Route path="/complaint" element={<Complaint />} />
        <Route path="/invoice" element={<Invoice />} />
        <Route path="/membership" element={<Membership />} />
      </Route>
    </Routes>
  )
}
