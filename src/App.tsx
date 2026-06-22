import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import Home from '@/pages/Home'
import BuildingDetail from '@/pages/BuildingDetail'
import Lottery from '@/pages/Lottery'
import Complaint from '@/pages/Complaint'
import ComplaintDetail from '@/pages/ComplaintDetail'
import Calculator from '@/pages/Calculator'
import MapSearch from '@/pages/MapSearch'
import Creator from '@/pages/Creator'
import Feed from '@/pages/Feed'
import Verify from '@/pages/Verify'
import MyCenter from '@/pages/MyCenter'
import Layout from '@/components/Layout'

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/detail/:id" element={<BuildingDetail />} />
          <Route path="/building/:id" element={<BuildingDetail />} />
          <Route path="/map" element={<MapSearch />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/lottery/:buildingId" element={<Lottery />} />
          <Route path="/complaint" element={<Complaint />} />
          <Route path="/complaint/:id" element={<ComplaintDetail />} />
          <Route path="/creator" element={<Creator />} />
          <Route path="/admin" element={<Creator />} />
          <Route path="/manage" element={<Creator />} />
          <Route path="/my" element={<MyCenter />} />
          <Route path="/profile" element={<MyCenter />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}
