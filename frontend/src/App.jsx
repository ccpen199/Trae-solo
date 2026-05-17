import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import TabBar from './components/TabBar';
import TranslatePage from './pages/TranslatePage';
import SpeakingPage from './pages/SpeakingPage';
import WorldPage from './pages/WorldPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CameraPage from './pages/CameraPage';
import FavoritesPage from './pages/FavoritesPage';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
              <Routes>
                <Route path="/" element={<TranslatePage />} />
                <Route path="/speaking" element={<SpeakingPage />} />
                <Route path="/world" element={<WorldPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/camera" element={<CameraPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
              </Routes>
              <TabBar />
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
