import { Route } from 'react-router-dom';
import ComplianceMonitorPage from '../pages/compliance/ComplianceMonitorPage';
import SpeechReviewPage from '../pages/compliance/SpeechReviewPage';
import WithdrawReviewPage from '../pages/compliance/WithdrawReviewPage';
import GeoFencePage from '../pages/compliance/GeoFencePage';

const complianceRoutes = (
  <>
    <Route path="compliance/monitor" element={<ComplianceMonitorPage />} />
    <Route path="compliance/speech" element={<SpeechReviewPage />} />
    <Route path="compliance/withdraw" element={<WithdrawReviewPage />} />
    <Route path="compliance/geofence" element={<GeoFencePage />} />
  </>
);

export default complianceRoutes;
