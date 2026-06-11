import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Create from '@/pages/Create';
import Editor from '@/pages/Editor';
import Lab from '@/pages/Lab';
import Cases from '@/pages/Cases';
import CaseDetail from '@/pages/CaseDetail';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<Layout />}>
          <Route path="/create" element={<Create />} />
          <Route path="/editor/:id" element={<Editor />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}
