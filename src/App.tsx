import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Home from "@/pages/Home"
import Service from "@/pages/Service"
import Certificate from "@/pages/Certificate"
import Traffic from "@/pages/Traffic"
import Consult from "@/pages/Consult"
import Suggestion from "@/pages/Suggestion"
import Profile from "@/pages/Profile"
import Admin from "@/pages/Admin"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/service" element={<Service />} />
          <Route path="/service/:serviceId" element={<Service />} />
          <Route path="/certificate" element={<Certificate />} />
          <Route path="/traffic" element={<Traffic />} />
          <Route path="/consult" element={<Consult />} />
          <Route path="/suggestion" element={<Suggestion />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </Router>
  )
}
