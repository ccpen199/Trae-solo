import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore } from './store';
import Login from './pages/Login';
import Home from './pages/Home';
import Circles from './pages/Circles';
import Rooms from './pages/Rooms';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import CreatePost from './pages/CreatePost';
import CircleDetail from './pages/CircleDetail';
import RoomDetail from './pages/RoomDetail';
import Chat from './pages/Chat';
import UserProfile from './pages/UserProfile';

const TabBar = () => {
  const { currentTab, setCurrentTab } = useAppStore();
  const navigate = useNavigate();
  
  const tabs = [
    { key: 'home', label: '首页', icon: '🏠' },
    { key: 'circles', label: '圈子', icon: '👥' },
    { key: 'rooms', label: '房间', icon: '🎤' },
    { key: 'messages', label: '消息', icon: '💬' },
    { key: 'profile', label: '我的', icon: '👤' }
  ];

  return (
    <div className="tab-bar">
      {tabs.map(tab => (
        <div
          key={tab.key}
          className={`tab-item ${currentTab === tab.key ? 'active' : ''}`}
          onClick={() => {
            setCurrentTab(tab.key);
            navigate(`/${tab.key}`);
          }}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </div>
      ))}
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <>
      {children}
      <TabBar />
    </>
  );
};

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/circles" element={
          <ProtectedRoute>
            <Circles />
          </ProtectedRoute>
        } />
        <Route path="/circles/:id" element={
          <ProtectedRoute>
            <CircleDetail />
          </ProtectedRoute>
        } />
        <Route path="/rooms" element={
          <ProtectedRoute>
            <Rooms />
          </ProtectedRoute>
        } />
        <Route path="/rooms/:id" element={
          <ProtectedRoute>
            <RoomDetail />
          </ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        } />
        <Route path="/chat/:userId" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/profile/edit" element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        } />
        <Route path="/users/:id" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        <Route path="/create-post" element={
          <ProtectedRoute>
            <CreatePost />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;
