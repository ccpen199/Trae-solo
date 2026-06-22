import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MatchPage from './pages/MatchPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import CreateActivityPage from './pages/CreateActivityPage';
import BubblePage from './pages/BubblePage';
import BubbleRoomPage from './pages/BubbleRoomPage';
import SafetyPage from './pages/SafetyPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import CouponsPage from './pages/CouponsPage';
import Toast from './components/Toast';
import UserSwitcher from './components/UserSwitcher';
import { useAppStore } from './store/appStore';

export default function App() {
  const { fetchCurrentUser, fetchRiskStatus, currentUserId } = useAppStore();

  useEffect(() => {
    if (currentUserId) {
      void fetchCurrentUser();
      void fetchRiskStatus();
    }
  }, [currentUserId]);

  return (
    <Layout>
      <UserSwitcher />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/match" element={<MatchPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/activities/new" element={<CreateActivityPage />} />
        <Route path="/activities/:id" element={<ActivityDetailPage />} />
        <Route path="/bubble" element={<BubblePage />} />
        <Route path="/bubble/:id" element={<BubbleRoomPage />} />
        <Route path="/safety" element={<SafetyPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/coupons" element={<CouponsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </Layout>
  );
}
