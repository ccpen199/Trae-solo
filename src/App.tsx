import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Transport from '@/pages/Transport'
import SocialSecurity from '@/pages/SocialSecurity'
import HealthCode from '@/pages/HealthCode'
import Certificates from '@/pages/Certificates'
import CertificateDetail from '@/pages/CertificateDetail'
import Profile from '@/pages/Profile'
import Settings from '@/pages/Settings'
import AuditLogPage from '@/pages/AuditLog'
import TrackingCenter from '@/pages/TrackingCenter'
import Household from '@/pages/Household'
import HouseholdApply from '@/pages/HouseholdApply'
import HouseholdProgress from '@/pages/HouseholdProgress'
import Education from '@/pages/Education'
import EducationEnroll from '@/pages/EducationEnroll'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/transport" element={<Transport />} />
          <Route path="/social-security" element={<SocialSecurity />} />
          <Route path="/household" element={<Household />} />
          <Route path="/household/apply/:type" element={<HouseholdApply />} />
          <Route path="/household/progress/:id" element={<HouseholdProgress />} />
          <Route path="/education" element={<Education />} />
          <Route path="/education/enroll" element={<EducationEnroll />} />
          <Route path="/health" element={<HealthCode />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/certificates/:id" element={<CertificateDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/settings" element={<Settings />} />
          <Route path="/audit" element={<AuditLogPage />} />
          <Route path="/tracking" element={<TrackingCenter />} />
        </Route>

        <Route path="*" element={<div className="text-center p-8 text-gray-500">404 - 页面未找到</div>} />
      </Routes>
    </Router>
  )
}
