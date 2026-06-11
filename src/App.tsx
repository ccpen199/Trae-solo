import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AuthLogin from './pages/AuthLogin'
import StandardizedItems from './pages/StandardizedItems'
import ElectronicSeal from './pages/ElectronicSeal'
import ElectronicLicense from './pages/ElectronicLicense'
import DataSharingHub from './pages/DataSharingHub'
import PortalAggregation from './pages/PortalAggregation'
import MonitorDashboard from './pages/MonitorDashboard'
import AuditLog from './pages/AuditLog'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthLogin />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/auth" replace />} />
        <Route path="auth" element={<AuthLogin />} />
        <Route path="items" element={<StandardizedItems />} />
        <Route path="seal" element={<ElectronicSeal />} />
        <Route path="license" element={<ElectronicLicense />} />
        <Route path="data-sharing" element={<DataSharingHub />} />
        <Route path="portal" element={<PortalAggregation />} />
        <Route path="monitor" element={<MonitorDashboard />} />
        <Route path="audit" element={<AuditLog />} />
      </Route>
    </Routes>
  )
}
