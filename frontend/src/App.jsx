import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import useUserStore from './store/userStore';
import Toast from './components/Toast';
import TabBar from './components/TabBar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import LivePage from './pages/LivePage';
import PublishPage from './pages/PublishPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const location = useLocation();
  const { init } = useUserStore();
  const [showTabBar, setShowTabBar] = useState(true);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    setShowTabBar(location.pathname !== '/');
  }, [location.pathname]);

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/publish" element={<PublishPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      
      {showTabBar && <TabBar />}
      <Toast />
    </div>
  );
}
