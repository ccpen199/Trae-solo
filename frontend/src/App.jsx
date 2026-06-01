import React, { useState, useEffect } from 'react';
import { ConfigProvider, message, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import Login from './pages/Login';
import UserSubmit from './pages/UserSubmit';
import DispatchBoard from './pages/DispatchBoard';
import TechnicianWork from './pages/TechnicianWork';
import ExceptionList from './pages/ExceptionList';
import Settlement from './pages/Settlement';

const ROLE_PAGES = {
  customer: 'submit',
  service_agent: 'dispatch',
  dispatcher: 'dispatch',
  engineer: 'technician',
  finance: 'settlement',
};

const PAGE_COMPONENTS = {
  submit: UserSubmit,
  dispatch: DispatchBoard,
  technician: TechnicianWork,
  exceptions: ExceptionList,
  settlement: Settlement,
};

const ROLE_MENUS = {
  customer: [
    { key: 'submit', label: '提交报修' },
  ],
  service_agent: [
    { key: 'dispatch', label: '调度台' },
    { key: 'exceptions', label: '异常处理' },
  ],
  dispatcher: [
    { key: 'dispatch', label: '调度台' },
    { key: 'exceptions', label: '异常处理' },
    { key: 'settlement', label: '结算报表' },
  ],
  engineer: [
    { key: 'technician', label: '我的工单' },
    { key: 'exceptions', label: '异常上报' },
  ],
  finance: [
    { key: 'settlement', label: '结算报表' },
  ],
};

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        const u = JSON.parse(userStr);
        setUser(u);
        setPage(ROLE_PAGES[u.role] || 'submit');
      }
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setInitializing(false);
  }, []);

  const handleLoginSuccess = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    const defaultPage = ROLE_PAGES[userData.role] || 'submit';
    setPage(defaultPage);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPage(null);
  };

  const handleNavigate = (key) => {
    setPage(key);
  };

  if (initializing) {
    return <div style={{ padding: 48, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  if (!user) {
    return (
      <ConfigProvider locale={zhCN}>
        <Login onLoginSuccess={handleLoginSuccess} />
      </ConfigProvider>
    );
  }

  const menuItems = ROLE_MENUS[user.role] || [];
  const PageComponent = PAGE_COMPONENTS[page] || UserSubmit;

  return (
    <ConfigProvider locale={zhCN}>
      <Layout
        user={user}
        menuItems={menuItems}
        currentPage={page}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
        <PageComponent />
      </Layout>
    </ConfigProvider>
  );
}
