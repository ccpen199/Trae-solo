import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import TeamList from './pages/sanxiaxiang/TeamList';
import CheckIn from './pages/sanxiaxiang/CheckIn';
import PracticeLogs from './pages/sanxiaxiang/PracticeLogs';
import ScholarshipProjects from './pages/scholarship/ScholarshipProjects';
import Donors from './pages/scholarship/Donors';
import ScholarshipStories from './pages/scholarship/ScholarshipStories';
import News from './pages/News';
import CreditManagement from './pages/admin/CreditManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import BaseManagement from './pages/admin/BaseManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          
          <Route path="sanxiaxiang">
            <Route index element={<Navigate to="teams" replace />} />
            <Route path="teams" element={<TeamList />} />
            <Route path="checkin" element={<CheckIn />} />
            <Route path="logs" element={<PracticeLogs />} />
          </Route>

          <Route path="scholarship">
            <Route index element={<Navigate to="projects" replace />} />
            <Route path="projects" element={<ScholarshipProjects />} />
            <Route path="donors" element={<Donors />} />
            <Route path="stories" element={<ScholarshipStories />} />
          </Route>

          <Route path="news" element={<News />} />

          <Route path="admin">
            <Route index element={<Navigate to="credits" replace />} />
            <Route path="credits" element={<CreditManagement />} />
            <Route path="departments" element={<DepartmentManagement />} />
            <Route path="bases" element={<BaseManagement />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
