import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Layout from '@/components/Layout'
import PermitIndex from '@/pages/permit'
import EbikeIndex from '@/pages/ebike'
import Appointment from '@/pages/Appointment'
import ViolationPage from '@/pages/violation'
import AccidentPage from '@/pages/accident'
import Chatbot from '@/pages/Chatbot'
import AdminIndex from '@/pages/admin'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />

          <Route path="permit/*" element={<PermitIndex />} />

          <Route path="violation/*" element={<ViolationPage />} />

          <Route path="accident/*" element={<AccidentPage />} />

          <Route path="ebike/*" element={<EbikeIndex />} />

          <Route path="appointment" element={<Appointment />} />

          <Route path="chatbot" element={<Chatbot />} />

          <Route path="admin/*" element={<AdminIndex />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
