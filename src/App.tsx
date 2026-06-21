import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout/Layout'
import Home from '@/pages/Home/index'
import Government from '@/pages/Government/index'
import ServiceDetail from '@/pages/Government/ServiceDetail'
import CityService from '@/pages/CityService/index'
import Transport from '@/pages/CityService/Transport'
import Scenic from '@/pages/CityService/Scenic'
import Hospital from '@/pages/CityService/Hospital'
import Education from '@/pages/CityService/Education'
import PublicService from '@/pages/PublicService/index'
import SmartGuide from '@/pages/SmartGuide/index'
import Elderly from '@/pages/Elderly/index'
import Profile from '@/pages/Profile/index'
import Monitor from '@/pages/Admin/Monitor'

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/government" element={<Government />} />
          <Route path="/government/:serviceId" element={<ServiceDetail />} />
          <Route path="/city-service" element={<CityService />} />
          <Route path="/city-service/transport" element={<Transport />} />
          <Route path="/city-service/scenic" element={<Scenic />} />
          <Route path="/city-service/hospital" element={<Hospital />} />
          <Route path="/city-service/education" element={<Education />} />
          <Route path="/public-service" element={<PublicService />} />
          <Route path="/smart-guide" element={<SmartGuide />} />
          <Route path="/elderly" element={<Elderly />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/monitor" element={<Monitor />} />
        </Routes>
      </Layout>
    </Router>
  )
}
