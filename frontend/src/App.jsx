
import { Routes, Route, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Toast from './components/Toast.jsx';
import Header from './components/Header.jsx';
import BottomNav from './components/BottomNav.jsx';
import Home from './pages/Home.jsx';
import VideoDetail from './pages/VideoDetail.jsx';
import Login from './pages/Login.jsx';
import Messages from './pages/Messages.jsx';
import Profile from './pages/Profile.jsx';
import Search from './pages/Search.jsx';

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-100">
        {!isLoginPage && <Header />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/video/:id" element={<VideoDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<Search />} />
        </Routes>
        {!isLoginPage && <BottomNav />}
        <Toast />
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return <AppContent />;
}
