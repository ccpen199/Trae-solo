import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Jobs from '@/pages/Jobs';
import JobCreate from '@/pages/JobCreate';
import JobMatch from '@/pages/JobMatch';
import Talents from '@/pages/Talents';
import TalentDetail from '@/pages/TalentDetail';
import Interviews from '@/pages/Interviews';
import InterviewRoom from '@/pages/InterviewRoom';
import Attendance from '@/pages/Attendance';
import AttendanceCheckin from '@/pages/AttendanceCheckin';
import Settlement from '@/pages/Settlement';
import SettlementBills from '@/pages/SettlementBills';
import MicroTasks from '@/pages/MicroTasks';
import Credit from '@/pages/Credit';
import Risk from '@/pages/Risk';
import Admin from '@/pages/Admin';
import AdminTenants from '@/pages/AdminTenants';
import AdminPermissions from '@/pages/AdminPermissions';
import AdminCompliance from '@/pages/AdminCompliance';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/create" element={<JobCreate />} />
          <Route path="/jobs/:id/match" element={<JobMatch />} />
          <Route path="/talents" element={<Talents />} />
          <Route path="/talents/:id" element={<TalentDetail />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/interviews/:id" element={<InterviewRoom />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/attendance/checkin" element={<AttendanceCheckin />} />
          <Route path="/settlement" element={<Settlement />} />
          <Route path="/settlement/bills" element={<SettlementBills />} />
          <Route path="/micro-tasks" element={<MicroTasks />} />
          <Route path="/credit" element={<Credit />} />
          <Route path="/risk" element={<Risk />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/tenants" element={<AdminTenants />} />
          <Route path="/admin/permissions" element={<AdminPermissions />} />
          <Route path="/admin/compliance" element={<AdminCompliance />} />
        </Route>
      </Routes>
    </Router>
  );
}
