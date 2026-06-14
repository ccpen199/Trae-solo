import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout'
import Home from '@/pages/Home'
import TracePage from '@/pages/Trace'
import TraceResult from '@/pages/Trace/TraceResult'
import FarmPage from '@/pages/Farm'
import PlotDetail from '@/pages/Farm/PlotDetail'
import ProcessPage from '@/pages/Process'
import LogisticsPage from '@/pages/Logistics'
import LogisticsDetail from '@/pages/Logistics/LogisticsDetail'
import MarketPage from '@/pages/Market'
import ShopPage from '@/pages/Shop'
import ShopDetail from '@/pages/Shop/ShopDetail'
import ContractPage from '@/pages/Contract'
import ContractDetail from '@/pages/Contract/ContractDetail'
import KnowledgePage from '@/pages/Knowledge'
import QAPage from '@/pages/Knowledge/QA'
import DiagnosePage from '@/pages/Knowledge/Diagnose'
import WeatherPage from '@/pages/Knowledge/Weather'
import SupervisionPage from '@/pages/Supervision'
import SupervisionReport from '@/pages/Supervision/Report'

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trace" element={<TracePage />} />
          <Route path="/trace/:traceCode" element={<TraceResult />} />
          <Route path="/farm" element={<FarmPage />} />
          <Route path="/farm/plot/:id" element={<PlotDetail />} />
          <Route path="/process" element={<ProcessPage />} />
          <Route path="/logistics" element={<LogisticsPage />} />
          <Route path="/logistics/:id" element={<LogisticsDetail />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:id" element={<ShopDetail />} />
          <Route path="/contract" element={<ContractPage />} />
          <Route path="/contract/:id" element={<ContractDetail />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/knowledge/qa" element={<QAPage />} />
          <Route path="/knowledge/diagnose" element={<DiagnosePage />} />
          <Route path="/knowledge/weather" element={<WeatherPage />} />
          <Route path="/supervision" element={<SupervisionPage />} />
          <Route path="/supervision/report" element={<SupervisionReport />} />
        </Routes>
      </Layout>
    </Router>
  )
}
