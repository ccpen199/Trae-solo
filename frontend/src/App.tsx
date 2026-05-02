import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AccountList from './pages/AccountList';
import AccountDetail from './pages/AccountDetail';
import { OrderList, OrderDetail } from './pages/OrderList';
import { ExceptionList, ExceptionDetail } from './pages/ExceptionList';
import TodoList from './pages/TodoList';
import PublishAccount from './pages/PublishAccount';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="accounts" element={<AccountList />} />
        <Route path="accounts/:id" element={<AccountDetail />} />
        <Route path="publish" element={<PublishAccount />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="exceptions" element={<ExceptionList />} />
        <Route path="exceptions/:id" element={<ExceptionDetail />} />
        <Route path="todos" element={<TodoList />} />
      </Route>
    </Routes>
  );
};

export default App;
