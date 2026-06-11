import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import PersonalPortal from './pages/PersonalPortal'
import EnterprisePortal from './pages/EnterprisePortal'
import SocialSecurity from './pages/SocialSecurity'
import Employment from './pages/Employment'
import TalentService from './pages/TalentService'
import LaborRelation from './pages/LaborRelation'
import PolicyKnowledge from './pages/PolicyKnowledge'
import OCRMaterial from './pages/OCRMaterial'
import MonitoringDashboard from './pages/MonitoringDashboard'
import DataIntegration from './pages/DataIntegration'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/personal" replace />} />
        <Route path="personal" element={<PersonalPortal />} />
        <Route path="enterprise" element={<EnterprisePortal />} />
        <Route path="social-security" element={<SocialSecurity />} />
        <Route path="employment" element={<Employment />} />
        <Route path="talent" element={<TalentService />} />
        <Route path="labor" element={<LaborRelation />} />
        <Route path="policy" element={<PolicyKnowledge />} />
        <Route path="ocr" element={<OCRMaterial />} />
        <Route path="monitoring" element={<MonitoringDashboard />} />
        <Route path="data-integration" element={<DataIntegration />} />
      </Route>
    </Routes>
  )
}
