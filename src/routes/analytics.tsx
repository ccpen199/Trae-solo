import { Route } from 'react-router-dom';
import TeamFissionPage from '../pages/analytics/TeamFissionPage';
import SalesAnalysisPage from '../pages/analytics/SalesAnalysisPage';
import MarketSaturationPage from '../pages/analytics/MarketSaturationPage';

const analyticsRoutes = (
  <>
    <Route path="analytics/team" element={<TeamFissionPage />} />
    <Route path="analytics/sales" element={<SalesAnalysisPage />} />
    <Route path="analytics/market" element={<MarketSaturationPage />} />
  </>
);

export default analyticsRoutes;
