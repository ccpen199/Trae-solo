import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout, Spin } from 'antd';
import MainLayout from '@/layouts/MainLayout';
import HomePage from '@/pages/Home';
import NewsPage from '@/pages/News';
import NewsDetailPage from '@/pages/News/Detail';
import ProductPage from '@/pages/Product';
import ProductDetailPage from '@/pages/Product/Detail';
import CartPage from '@/pages/Cart';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import { useUserStore } from '@/store/userStore';

function App() {
  const { fetchCurrentUser, isLoading, token } = useUserStore();

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token, fetchCurrentUser]);

  if (isLoading && token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Layout>
  );
}

export default App;
