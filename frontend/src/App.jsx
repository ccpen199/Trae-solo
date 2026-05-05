import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import FrontendLayout from './layouts/FrontendLayout';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import ProductList from './pages/admin/ProductList';
import NewsList from './pages/admin/NewsList';
import MessageList from './pages/admin/MessageList';
import JobList from './pages/admin/JobList';
import ResumeList from './pages/admin/ResumeList';
import MemberList from './pages/admin/MemberList';
import Home from './pages/frontend/Home';
import ProductPage from './pages/frontend/ProductPage';
import ProductDetail from './pages/frontend/ProductDetail';
import NewsPage from './pages/frontend/NewsPage';
import NewsDetail from './pages/frontend/NewsDetail';
import JobPage from './pages/frontend/JobPage';
import JobDetail from './pages/frontend/JobDetail';
import CompanyPage from './pages/frontend/CompanyPage';
import ContactPage from './pages/frontend/ContactPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<FrontendLayout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<ProductPage />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="news/:id" element={<NewsDetail />} />
        <Route path="jobs" element={<JobPage />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="company" element={<CompanyPage />} />
        <Route path="contact" element={<ContactPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />
      
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="news" element={<NewsList />} />
        <Route path="messages" element={<MessageList />} />
        <Route path="jobs" element={<JobList />} />
        <Route path="resumes" element={<ResumeList />} />
        <Route path="members" element={<MemberList />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
