import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import useStore from './store';
import Login from './pages/Login';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import Room from './pages/Room';
import Chat from './pages/Chat';
import ChatDetail from './pages/ChatDetail';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/create-room" element={
              <ProtectedRoute>
                <CreateRoom />
              </ProtectedRoute>
            } />
            <Route path="/room/:roomId" element={
              <ProtectedRoute>
                <Room />
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/chat/:friendId" element={
              <ProtectedRoute>
                <ChatDetail />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
