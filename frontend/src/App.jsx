import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from './store';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ListingDetailPage from './pages/ListingDetailPage';
import PublishPage from './pages/PublishPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import MerchantPage from './pages/MerchantPage';
import AdminPage from './pages/AdminPage';
import MapPage from './pages/MapPage';

function App() {
  const { fetchCategories, fetchCurrentUser, token } = useStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (token) {
      fetchCurrentUser();
    }
    setInitialized(true);
  }, []);

  if (!initialized) return <div>Loading...</div>;

  return (
    <div className="app">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/listing/:id" element={<ListingDetailPage />} />
        <Route path="/publish" element={<PublishPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/merchant" element={<MerchantPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
    </div>
  );
}

export default App;
