import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Forecast from './pages/Forecast';
import History from './pages/History';
import Alerts from './pages/Alerts';
import Cities from './pages/Cities';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminQuality from './pages/admin/Quality';
import AdminCircuitBreaker from './pages/admin/CircuitBreaker';
import AdminIndexConfig from './pages/admin/IndexConfig';
import AdminApi from './pages/admin/ApiManagement';
import AdminCompliance from './pages/admin/Compliance';
import AdminAlertManagement from './pages/admin/AlertManagement';
import { useWeatherStore } from './stores/weatherStore';

function App() {
  const { currentCity, fetchAllWeatherData, fetchFavoriteCities } = useWeatherStore();

  useEffect(() => {
    if (currentCity) {
      fetchAllWeatherData(currentCity.id);
      fetchFavoriteCities();
    }
  }, [currentCity?.id]);

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 bg-grid">
        <div className="fixed inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-slate-950 pointer-events-none" />
        <Navbar />
        <main className="pt-16 min-h-screen relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/history" element={<History />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/cities" element={<Cities />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/quality" element={<AdminQuality />} />
            <Route path="/admin/circuit-breaker" element={<AdminCircuitBreaker />} />
            <Route path="/admin/index-config" element={<AdminIndexConfig />} />
            <Route path="/admin/api" element={<AdminApi />} />
            <Route path="/admin/compliance" element={<AdminCompliance />} />
            <Route path="/admin/alerts" element={<AdminAlertManagement />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
