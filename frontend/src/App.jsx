import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import CreditApply from './pages/CreditApply';
import CreditResult from './pages/CreditResult';
import CreditList from './pages/CreditList';
import CreditDetail from './pages/CreditDetail';
import LoanDetail from './pages/LoanDetail';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/credit/apply/:id" element={<CreditApply />} />
          <Route path="/credit/result/:id" element={<CreditResult />} />
          <Route path="/credit" element={<CreditList />} />
          <Route path="/credit/:id" element={<CreditDetail />} />
          <Route path="/loan/:id" element={<LoanDetail />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
