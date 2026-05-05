import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';

import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ProductList from '../pages/ProductList';
import ProductDetail from '../pages/ProductDetail';
import NewsList from '../pages/NewsList';
import NewsDetail from '../pages/NewsDetail';

const { Content } = Layout;

const FrontendLayout = ({ children }) => (
  <Layout style={{ minHeight: '100vh' }}>
    <Header />
    <Content style={{ background: '#fff' }}>
      {children}
    </Content>
    <Footer />
  </Layout>
);

const AuthLayout = ({ children }) => (
  <Layout style={{ minHeight: '100vh' }}>
    <Content>
      {children}
    </Content>
  </Layout>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <FrontendLayout>
            <Home />
          </FrontendLayout>
        } 
      />
      
      <Route 
        path="/login" 
        element={
          <AuthLayout>
            <Login />
          </AuthLayout>
        } 
      />
      
      <Route 
        path="/register" 
        element={
          <AuthLayout>
            <Register />
          </AuthLayout>
        } 
      />
      
      <Route 
        path="/products" 
        element={
          <FrontendLayout>
            <ProductList />
          </FrontendLayout>
        } 
      />
      
      <Route 
        path="/products/:id" 
        element={
          <FrontendLayout>
            <ProductDetail />
          </FrontendLayout>
        } 
      />
      
      <Route 
        path="/news" 
        element={
          <FrontendLayout>
            <NewsList />
          </FrontendLayout>
        } 
      />
      
      <Route 
        path="/news/:id" 
        element={
          <FrontendLayout>
            <NewsDetail />
          </FrontendLayout>
        } 
      />
      
      <Route 
        path="/downloads" 
        element={
          <FrontendLayout>
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <h2>下载中心</h2>
              <p>该功能正在开发中...</p>
            </div>
          </FrontendLayout>
        } 
      />
      
      <Route 
        path="/jobs" 
        element={
          <FrontendLayout>
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <h2>人力资源</h2>
              <p>该功能正在开发中...</p>
            </div>
          </FrontendLayout>
        } 
      />
      
      <Route 
        path="/links" 
        element={
          <FrontendLayout>
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <h2>合作链接</h2>
              <p>该功能正在开发中...</p>
            </div>
          </FrontendLayout>
        } 
      />
      
      <Route 
        path="/contact" 
        element={
          <FrontendLayout>
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <h2>联系方式</h2>
              <p>该功能正在开发中...</p>
            </div>
          </FrontendLayout>
        } 
      />
      
      <Route 
        path="/about" 
        element={
          <FrontendLayout>
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <h2>企业介绍</h2>
              <p>该功能正在开发中...</p>
            </div>
          </FrontendLayout>
        } 
      />
      
      <Route 
        path="/service" 
        element={
          <FrontendLayout>
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <h2>客户服务</h2>
              <p>该功能正在开发中...</p>
            </div>
          </FrontendLayout>
        } 
      />
      
      <Route 
        path="/admin" 
        element={
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>后台管理系统</h2>
            <p>该功能正在开发中...</p>
          </div>
        } 
      />
      
      <Route 
        path="*" 
        element={
          <FrontendLayout>
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <h2>404 - 页面不存在</h2>
              <p>您访问的页面不存在或已被移除。</p>
            </div>
          </FrontendLayout>
        } 
      />
    </Routes>
  );
};

export default AppRoutes;