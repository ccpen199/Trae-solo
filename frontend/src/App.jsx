import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Meeting from './pages/Meeting';
import ScheduleMeeting from './pages/ScheduleMeeting';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card text-center">
          <h2 className="title">加载中...</h2>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
      <Route path="/meeting/:meetingId" element={<Meeting />} />
      <Route path="/schedule" element={user ? <ScheduleMeeting /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
