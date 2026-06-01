import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Credentials from './pages/Credentials';
import CredentialDetail from './pages/CredentialDetail';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import AccessRequests from './pages/AccessRequests';
import RotationCenter from './pages/RotationCenter';
import Incidents from './pages/Incidents';
import IncidentDetail from './pages/IncidentDetail';
import AuditLogs from './pages/AuditLogs';
import { authApi } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi.getMe()
        .then(res => {
          setUser(res.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>加载中...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
      <Route path="/" element={
        user ? <MainLayout user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />
      }>
        <Route index element={<Dashboard user={user} />} />
        <Route path="credentials" element={<Credentials user={user} />} />
        <Route path="credentials/:id" element={<CredentialDetail user={user} />} />
        <Route path="teams" element={<Teams user={user} />} />
        <Route path="teams/:id" element={<TeamDetail user={user} />} />
        <Route path="access" element={<AccessRequests user={user} />} />
        <Route path="rotation" element={<RotationCenter user={user} />} />
        <Route path="incidents" element={<Incidents user={user} />} />
        <Route path="incidents/:id" element={<IncidentDetail user={user} />} />
        <Route path="audit" element={<AuditLogs user={user} />} />
      </Route>
    </Routes>
  );
}

export default App;
