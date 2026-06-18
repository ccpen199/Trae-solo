import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Home from './pages/Home'
import InsuranceVerify from './pages/InsuranceVerify'
import PensionCalculator from './pages/PensionCalculator'
import UnemploymentApply from './pages/UnemploymentApply'
import MedicalInstitutions from './pages/MedicalInstitutions'
import PersonalCenter from './pages/PersonalCenter'
import OverviewPanel from './components/personal/OverviewPanel'
import ApplicationsPage from './pages/ApplicationsPage'
import BenefitsPage from './pages/BenefitsPage'
import AdminDashboard from './pages/admin/Dashboard'
import RiskControl from './pages/admin/RiskControl'
import PolicyTags from './pages/admin/PolicyTags'
import EfficiencyMonitor from './pages/admin/EfficiencyMonitor'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/insurance/verify" element={<InsuranceVerify />} />
          <Route path="/pension/calculator" element={<PensionCalculator />} />
          <Route path="/unemployment/apply" element={<UnemploymentApply />} />
          <Route path="/medical/institutions" element={<MedicalInstitutions />} />
          <Route path="/personal" element={<PersonalCenter />}>
            <Route index element={<OverviewPanel />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="benefits" element={<BenefitsPage />} />
          </Route>
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="risk-control" element={<RiskControl />} />
          <Route path="policy-tags" element={<PolicyTags />} />
          <Route path="efficiency" element={<EfficiencyMonitor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
