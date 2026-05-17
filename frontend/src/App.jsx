import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useUserStore, useUIStore } from './store';
import Player from './components/Player';
import Login from './components/Login';
import Register from './components/Register';
import SubmitRecommendation from './components/SubmitRecommendation';
import Profile from './components/Profile';
import BottomNav from './components/BottomNav';
import { recommendationApi } from './api';

const HomePage = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const response = await recommendationApi.getList({ limit: 20 });
      if (response.data.success) {
        setRecommendations(response.data.data.list);
      }
    } catch (error) {
      console.error('加载推荐失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < recommendations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (recommendations.length > 0) {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (recommendations.length > 0) {
      setCurrentIndex(recommendations.length - 1);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
        <p className="text-white">暂无推荐内容</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-black">
      <Player
        recommendation={recommendations[currentIndex]}
        onNext={handleNext}
        onPrev={handlePrev}
      />
      <BottomNav />
    </div>
  );
};

const AppContent = () => {
  const location = useLocation();
  const toast = useUIStore((state) => state.toast);
  const loadUser = useUserStore((state) => state.loadUser);

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full text-white font-medium shadow-lg bg-gray-800">
          {toast.message}
        </div>
      )}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/submit" element={<SubmitRecommendation />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
