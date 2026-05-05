import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainPage from './pages/MainPage';
import './App.css';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="app">
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/" 
          element={isAuthenticated ? <MainPage /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </div>
  );
}

export default App;
