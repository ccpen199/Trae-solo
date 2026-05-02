import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from './store';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import TodoList from './pages/TodoList';
import Notifications from './pages/Notifications';
import OrgSync from './pages/OrgSync';

const PrivateRoute = ({ children }) => {
  const storeToken = useUserStore((state) => state.token);
  const setToken = useUserStore((state) => state.setToken);
  const setUser = useUserStore((state) => state.setUser);
  const location = useLocation();

  const localStorageToken = localStorage.getItem('token');
  const localStorageUser = localStorage.getItem('user');

  if (!storeToken && !localStorageToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!storeToken && localStorageToken) {
    setToken(localStorageToken);
    if (localStorageUser) {
      try {
        setUser(JSON.parse(localStorageUser));
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    }
  }

  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="todos" element={<TodoList />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="org-sync" element={<OrgSync />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
