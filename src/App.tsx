import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Canals from '@/pages/Canals'
import Pumps from '@/pages/Pumps'
import Gates from '@/pages/Gates'
import Zones from '@/pages/Zones'
import Crops from '@/pages/Crops'
import Applications from '@/pages/Applications'
import Schedules from '@/pages/Schedules'
import Dispatches from '@/pages/Dispatches'
import Monitoring from '@/pages/Monitoring'
import Reports from '@/pages/Reports'
import Logs from '@/pages/Logs'
import Quotas from '@/pages/Quotas'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/canals" element={<Canals />} />
          <Route path="/pumps" element={<Pumps />} />
          <Route path="/gates" element={<Gates />} />
          <Route path="/zones" element={<Zones />} />
          <Route path="/crops" element={<Crops />} />
          <Route path="/quotas" element={<Quotas />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/dispatches" element={<Dispatches />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="*" element={<div className="text-center text-xl py-20">404 - 页面不存在</div>} />
        </Route>
      </Routes>
    </Router>
  )
}
