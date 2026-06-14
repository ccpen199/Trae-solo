import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import PortalLayout from '@/components/Layout/PortalLayout'
import AdminLayout from '@/components/Layout/AdminLayout'
import UserLayout from '@/components/Layout/UserLayout'
import Home from '@/pages/Home'
import Services from '@/pages/Services'
import ServiceDetail from '@/pages/Services/[id]'
import Scenes from '@/pages/Scenes'
import SceneDetail from '@/pages/Scenes/[id]'
import Bus from '@/pages/Bus'
import Venues from '@/pages/Venues'
import Repair from '@/pages/Community/Repair'
import Help from '@/pages/Community/Help'
import Feedback from '@/pages/Feedback'
import Profile from '@/pages/User/Profile'
import Certificates from '@/pages/User/Certificates'
import Applications from '@/pages/User/Applications'
import Bookings from '@/pages/User/Bookings'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Admin/Dashboard'
import AdminServices from '@/pages/Admin/Services'
import Monitor from '@/pages/Admin/Monitor'
import AdminScenes from '@/pages/Admin/Scenes'
import AdminFeedback from '@/pages/Admin/Feedback'
import Heatmap from '@/pages/Admin/Analytics/Heatmap'
import Fusion from '@/pages/Admin/Analytics/Fusion'
import Users from '@/pages/Admin/Users'
import AdminCertificates from '@/pages/Admin/Certificates'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn)
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn)
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<PortalLayout />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="services/:id" element={<ServiceDetail />} />
        <Route path="scenes" element={<Scenes />} />
        <Route path="scenes/:id" element={<SceneDetail />} />
        <Route path="bus" element={<Bus />} />
        <Route path="venues" element={<Venues />} />
        <Route path="community/repair" element={<Repair />} />
        <Route path="community/help" element={<Help />} />
        <Route path="feedback" element={<Feedback />} />
      </Route>

      <Route
        path="/user"
        element={
          <PrivateRoute>
            <UserLayout />
          </PrivateRoute>
        }
      >
        <Route path="profile" element={<Profile />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="applications" element={<Applications />} />
        <Route path="bookings" element={<Bookings />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="monitor" element={<Monitor />} />
        <Route path="scenes" element={<AdminScenes />} />
        <Route path="feedback" element={<AdminFeedback />} />
        <Route path="analytics/heatmap" element={<Heatmap />} />
        <Route path="analytics/fusion" element={<Fusion />} />
        <Route path="users" element={<Users />} />
        <Route path="certificates" element={<AdminCertificates />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
