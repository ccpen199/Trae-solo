import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductDetailPage from './pages/ProductDetailPage';
import OrderPage from './pages/OrderPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import './App.css';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">加载中...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">加载中...</div>;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          
          <Route path="/register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />
          
          <Route path="/profile" element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          } />
          
          <Route path="/orders" element={
            <PrivateRoute>
              <OrderPage />
            </PrivateRoute>
          } />
          
          <Route path="/orders/:id" element={
            <PrivateRoute>
              <OrderDetailPage />
            </PrivateRoute>
          } />
          
          <Route path="/admin/*" element={
            <PrivateRoute adminOnly={true}>
              <AdminPage />
            </PrivateRoute>
          } />
          
          <Route path="*" element={
            <div className="not-found">
              <h2>页面不存在</h2>
              <p>您访问的页面不存在，请检查URL是否正确</p>
            </div>
          } />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 团购网 - 精选优惠</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
