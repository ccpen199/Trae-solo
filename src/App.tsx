import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Templates from '@/pages/Templates';
import Editor from '@/pages/Editor';
import Diagnosis from '@/pages/Diagnosis';
import AtsCheck from '@/pages/AtsCheck';
import Settings from '@/pages/Settings';

export default function App() {
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
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}
