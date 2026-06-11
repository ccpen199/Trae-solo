import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import GraphHome from '@/pages/GraphHome';
import EntityDetail from '@/pages/EntityDetail';
import ExtractionCenter from '@/pages/ExtractionCenter';
import Subscriptions from '@/pages/Subscriptions';
import Workspace from '@/pages/Workspace';
import LineageAdmin from '@/pages/LineageAdmin';
import SourceScores from '@/pages/SourceScores';
import SummaryReview from '@/pages/SummaryReview';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<GraphHome />} />
          <Route path="/entity/:id" element={<EntityDetail />} />
          <Route path="/extraction" element={<ExtractionCenter />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/workspace/:reportId" element={<Workspace />} />
          <Route path="/admin/lineage" element={<LineageAdmin />} />
          <Route path="/admin/sources" element={<SourceScores />} />
          <Route path="/admin/summaries" element={<SummaryReview />} />
        </Route>
      </Routes>
    </Router>
  );
}
