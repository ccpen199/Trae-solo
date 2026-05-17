import React, { useEffect, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import useStore from './store/useStore';
import Layout from './components/Layout';
import Loading from './components/Loading';
import ProtectedRoute from './components/ProtectedRoute';

const Home = React.lazy(() => import('./pages/Home'));
const VideoDetail = React.lazy(() => import('./pages/VideoDetail'));
const Live = React.lazy(() => import('./pages/Live'));
const Mall = React.lazy(() => import('./pages/Mall'));
const GameCenter = React.lazy(() => import('./pages/GameCenter'));
const Messages = React.lazy(() => import('./pages/Messages'));
const UserCenter = React.lazy(() => import('./pages/UserCenter'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const VerifyQuestions = React.lazy(() => import('./pages/VerifyQuestions'));

function App() {
  const initAuth = useStore(state => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Suspense fallback={<Loading fullScreen />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/video/:bvid" element={<VideoDetail />} />
          <Route path="/live" element={<Live />} />
          <Route path="/live/:userId" element={<Live />} />
          <Route path="/mall" element={<Mall />} />
          <Route path="/game" element={<GameCenter />} />
          <Route path="/verify" element={
            <ProtectedRoute>
              <VerifyQuestions />
            </ProtectedRoute>
          } />
          <Route path="/messages/*" element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          } />
          <Route path="/user/:userId" element={<UserCenter />} />
          <Route path="/my" element={
            <ProtectedRoute>
              <UserCenter isMy />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
