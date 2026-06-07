import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Layout from "@/components/Layout"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import CapacityMap from "@/pages/CapacityMap"
import RoutePricing from "@/pages/RoutePricing"
import Matching from "@/pages/Matching"
import Bargaining from "@/pages/Bargaining"
import Cargo from "@/pages/Cargo"
import DriverWorkspace from "@/pages/DriverWorkspace"
import Monitoring from "@/pages/Monitoring"
import Settlement from "@/pages/Settlement"
import Warning from "@/pages/admin/Warning"
import Risk from "@/pages/admin/Risk"
import Credit from "@/pages/admin/Credit"
import Forecast from "@/pages/admin/Forecast"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/capacity" element={<CapacityMap />} />
          <Route path="/pricing" element={<RoutePricing />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/bargaining" element={<Bargaining />} />
          <Route path="/cargo" element={<Cargo />} />
          <Route path="/driver" element={<DriverWorkspace />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/settlement" element={<Settlement />} />
          <Route path="/admin/warning" element={<Warning />} />
          <Route path="/admin/risk" element={<Risk />} />
          <Route path="/admin/credit" element={<Credit />} />
          <Route path="/admin/forecast" element={<Forecast />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}
