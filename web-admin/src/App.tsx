import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import HealthOverviewPage from '@/pages/HealthOverview';
import DeviceHealthDetail from '@/pages/DeviceHealthDetail';
import AuditLogs from '@/pages/AuditLogs';
import FirmwareManagement from '@/pages/ota/FirmwareManagement';
import OTATasks from '@/pages/ota/OTATasks';
import CreateOTATask from '@/pages/ota/CreateOTATask';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/health" replace />} />
        <Route path="health" element={<HealthOverviewPage />} />
        <Route path="health/:deviceId" element={<DeviceHealthDetail />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="ota/firmwares" element={<FirmwareManagement />} />
        <Route path="ota/tasks" element={<OTATasks />} />
        <Route path="ota/tasks/create" element={<CreateOTATask />} />
        <Route path="*" element={<Navigate to="/health" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
