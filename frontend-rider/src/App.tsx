import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useOfflineStore } from '@/store/offlineStore';
import { websocketService } from '@/utils/websocket';
import { offlineSync } from '@/utils/offline';
import { registerSW, isUpdateAvailable, applyUpdate } from '@/sw-register';
import BottomNav from '@/components/BottomNav';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Home from '@/pages/Home';
import TaskDetail from '@/pages/TaskDetail';
import OrderExecute from '@/pages/OrderExecute';
import Profile from '@/pages/Profile';
import RealNameAuth from '@/pages/RealNameAuth';
import Preferences from '@/pages/Preferences';
import OrderHistory from '@/pages/OrderHistory';
import CreditScore from '@/pages/CreditScore';
import MessageCenter from '@/pages/MessageCenter';
import AppealList from '@/pages/AppealList';
import RiderStats from '@/pages/RiderStats';
import OfflineCenter from '@/pages/OfflineCenter';
import TrackingPage from '@/pages/TrackingPage';
import GeofencePage from '@/pages/GeofencePage';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  const { token, user } = useAuthStore();
  const { isOnline, pendingSync, syncInProgress, startSync } = useOfflineStore();
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    if (token && user) {
      try {
        websocketService.connect(user.id, token);
      } catch {}
      try {
        offlineSync.initialize();
      } catch {}
    }

    return () => {
      try {
        websocketService.disconnect();
      } catch {}
    };
  }, [token, user]);

  useEffect(() => {
    const enableSW = import.meta.env.PROD || import.meta.env.VITE_ENABLE_SW === 'true';
    if (enableSW) {
      registerSW();
    }

    const handleSWUpdate = () => {
      if (isUpdateAvailable()) {
        const shouldUpdate = window.confirm('发现新版本，是否立即更新？');
        if (shouldUpdate) {
          applyUpdate();
        }
      }
    };

    window.addEventListener('sw-update-available', handleSWUpdate);

    return () => {
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      useOfflineStore.getState().setOnline(true);
      if (pendingSync.length > 0 && !syncInProgress) {
        setSyncMessage(`正在同步 ${pendingSync.length} 条数据...`);
        startSync().finally(() => {
          setSyncMessage('');
        });
      }
    };

    const handleOffline = () => {
      useOfflineStore.getState().setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingSync.length, syncInProgress, startSync]);

  return (
    <div className="h-full">
      {!isOnline && <div className="offline-indicator">当前处于离线模式，操作将在联网后自动同步</div>}
      {syncMessage && <div className="sync-progress">{syncMessage}</div>}

      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/" replace /> : <Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/task/:id"
          element={
            <ProtectedRoute>
              <TaskDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order/:id/execute"
          element={
            <ProtectedRoute>
              <OrderExecute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/realname"
          element={
            <ProtectedRoute>
              <RealNameAuth />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/preferences"
          element={
            <ProtectedRoute>
              <Preferences />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrderHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/credit"
          element={
            <ProtectedRoute>
              <CreditScore />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessageCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appeals"
          element={
            <ProtectedRoute>
              <AppealList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stats"
          element={
            <ProtectedRoute>
              <RiderStats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/offline"
          element={
            <ProtectedRoute>
              <OfflineCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracking"
          element={
            <ProtectedRoute>
              <TrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/geofence"
          element={
            <ProtectedRoute>
              <GeofencePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {token && <BottomNav />}
    </div>
  );
}

export default App;
