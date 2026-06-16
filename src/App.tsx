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
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/templates" element={<Layout><Templates /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
        <Route path="/admin" element={<Layout><Admin /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
      </Routes>
    </Router>
  );
}
