import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Space, message } from 'antd';
import { UserOutlined, LogoutOutlined, BookOutlined, FileTextOutlined, AlertOutlined, HomeOutlined } from '@ant-design/icons';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssignmentList from './pages/AssignmentList';
import AssignmentDetail from './pages/AssignmentDetail';
import SubmissionDetail from './pages/SubmissionDetail';
import AppealList from './pages/AppealList';
import AppealDetail from './pages/AppealDetail';
import { authAPI } from './api';

const { Header, Content, Sider } = Layout;

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (username, password) => {
    const response = await authAPI.login(username, password);
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    message.success('登录成功');
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    message.success('已退出登录');
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>加载中...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/assignments', icon: <BookOutlined />, label: '作业任务' },
    { key: '/appeals', icon: <AlertOutlined />, label: '申诉管理' }
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  const roleNames = {
    teacher: '教师',
    assistant: '助教',
    student: '学生'
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#001529', padding: '0 20px' }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginRight: '40px' }}>
          作业查重系统
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[window.location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Space>
          <span style={{ color: 'white' }}>{user.name}</span>
          <span style={{ color: '#ccc', fontSize: '12px' }}>({roleNames[user.role]})</span>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar icon={<UserOutlined />} />
          </Dropdown>
        </Space>
      </Header>
      <Layout>
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/assignments" element={<AssignmentList user={user} />} />
            <Route path="/assignments/:id" element={<AssignmentDetail user={user} />} />
            <Route path="/submissions/:id" element={<SubmissionDetail user={user} />} />
            <Route path="/appeals" element={<AppealList user={user} />} />
            <Route path="/appeals/:id" element={<AppealDetail user={user} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return <AppContent />;
}
