import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import Services from './pages/Services';
import Demands from './pages/Demands';
import DemandPublish from './pages/DemandPublish';
import DemandDetail from './pages/DemandDetail';
import Announcements from './pages/Announcements';
import DialectSearch from './pages/DialectSearch';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProviders from './pages/admin/Providers';
import AdminSettlement from './pages/admin/Settlement';
import './App.css';

const { Content } = Layout;

function App() {
  return (
    <Layout className="min-h-screen">
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/providers" element={<AdminProviders />} />
        <Route path="/admin/settlement" element={<AdminSettlement />} />
        
        <Route
          path="*"
          element={
            <>
              <Navbar />
              <Content className="pt-16">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/demands" element={<Demands />} />
                  <Route path="/demands/publish" element={<DemandPublish />} />
                  <Route path="/demands/:id" element={<DemandDetail />} />
                  <Route path="/announcements" element={<Announcements />} />
                  <Route path="/dialect-search" element={<DialectSearch />} />
                </Routes>
              </Content>
            </>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
