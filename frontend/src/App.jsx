import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import { AuthProvider } from './context/AuthContext';
import AppHeader from './components/Header';
import LoginModal from './components/LoginModal';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import CompanyList from './pages/CompanyList';
import CompanyDetail from './pages/CompanyDetail';
import Favorites from './pages/Favorites';

const { Content, Footer } = Layout;

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AuthProvider>
        <Router>
          <Layout style={{ minHeight: '100vh' }}>
            <AppHeader />
            <Content
              style={{
                padding: '0 24px',
                maxWidth: 1400,
                margin: '0 auto',
                width: '100%',
                minHeight: 'calc(100vh - 134px)',
              }}
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/companies" element={<CompanyList />} />
                <Route path="/companies/:id" element={<CompanyDetail />} />
                <Route path="/favorites" element={<Favorites />} />
              </Routes>
            </Content>
            <Footer
              style={{
                textAlign: 'center',
                background: '#f0f2f5',
              }}
            >
              B2B Global Market Favorite Management System ©{new Date().getFullYear()}
            </Footer>
            <LoginModal />
          </Layout>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
