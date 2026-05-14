import { Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import AdPage from './pages/AdPage';
import AdDetailPage from './pages/AdDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import RecommendPage from './pages/RecommendPage';
import SearchPage from './pages/SearchPage';
import CartPage from './pages/CartPage';
import OrderPage from './pages/OrderPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProfilePage from './pages/ProfilePage';
import { useAuth } from './context/AuthContext';

function App() {
  const { isFirstLaunch } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/ad" element={<AdPage />} />
        <Route path="/ad/:id" element={<AdDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/recommend" element={<RecommendPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrderPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </div>
  );
}

export default App;
