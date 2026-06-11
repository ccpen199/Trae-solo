import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import Location from "@/pages/Location"
import Calls from "@/pages/Calls"
import SOS from "@/pages/SOS"
import Devices from "@/pages/Devices"
import Members from "@/pages/Members"
import Profile from "@/pages/Profile"
import Privacy from "@/pages/Privacy"
import Analytics from "@/pages/Analytics"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/location" element={<Location />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/sos" element={<SOS />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/members" element={<Members />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </Router>
  )
}
