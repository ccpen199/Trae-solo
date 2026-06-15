import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Templates from '@/pages/Templates';
import Editor from '@/pages/Editor';
import Diagnosis from '@/pages/Diagnosis';
import AtsCheck from '@/pages/AtsCheck';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import { initAuditLog } from './utils/audit';

export default function App() {
  useEffect(() => {
    initAuditLog();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/editor/:id" element={<Editor />} />
        <Route path="/diagnosis/:id" element={<Diagnosis />} />
        <Route path="/ats-check/:id" element={<AtsCheck />} />
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}
