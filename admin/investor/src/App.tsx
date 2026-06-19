import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import DeviceMap from './pages/DeviceMap';
import DeviceDetails from './pages/DeviceDetails';
import EnergyAnalysis from './pages/EnergyAnalysis';
import Reports from './pages/Reports';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('investor_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="devices-map" element={<DeviceMap />} />
        <Route path="device/:id" element={<DeviceDetails />} />
        <Route path="energy-analysis" element={<EnergyAnalysis />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
