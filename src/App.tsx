import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import Vent from '@/pages/Vent';
import Match from '@/pages/Match';
import Session from '@/pages/Session';
import Dashboard from '@/pages/Dashboard';
import CounselorWorkbench from '@/pages/CounselorWorkbench';
import Admin from '@/pages/Admin';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/vent" element={<Vent />} />
          <Route path="/match" element={<Match />} />
          <Route path="/session/:id" element={<Session />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/counselor" element={<CounselorWorkbench />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </Router>
  );
}
