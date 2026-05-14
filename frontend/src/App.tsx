
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import RidePage from './pages/RidePage';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
      <Route path="/messages" element={user ? <MessagesPage /> : <Navigate to="/login" />} />
      <Route path="/ride" element={user ? <RidePage /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
