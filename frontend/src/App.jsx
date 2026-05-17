import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import NearbyPage from './pages/NearbyPage';
import FollowingPage from './pages/FollowingPage';
import CapturePage from './pages/CapturePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VideoDetailPage from './pages/VideoDetailPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/nearby" element={<NearbyPage />} />
          <Route path="/following" element={<FollowingPage />} />
          <Route path="/capture" element={<CapturePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/user/:id" element={<ProfilePage />} />
          <Route path="/video/:id" element={<VideoDetailPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
