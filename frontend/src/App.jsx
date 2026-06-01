import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Space, Button } from 'antd';
import { UserOutlined, BookOutlined, EditOutlined, DashboardOutlined, DollarOutlined, LogoutOutlined, HomeOutlined } from '@ant-design/icons';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NovelDetail from './pages/NovelDetail.jsx';
import Reader from './pages/Reader.jsx';
import AuthorCenter from './pages/AuthorCenter.jsx';
import EditorCenter from './pages/EditorCenter.jsx';
import FinanceCenter from './pages/FinanceCenter.jsx';
import Bookshelf from './pages/Bookshelf.jsx';

const { Header, Content, Footer } = Layout;

function AppContent({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const navigateToCenter = () => {
    if (!user) return;
    switch (user.role) {
      case 'author':
        navigate('/author/novels');
        break;
      case 'editor':
      case 'admin':
        navigate('/editor/dashboard');
        break;
      case 'finance':
        navigate('/finance/settlements');
        break;
      default:
        navigate('/bookshelf');
    }
  };

  const getNavItems = () => {
    const items = [
      { key: '/', icon: <HomeOutlined />, label: '首页' }
    ];
    items.push({ key: '/bookshelf', icon: <BookOutlined />, label: '书架' });
    items.push({ key: '/author/novels', icon: <EditOutlined />, label: '创作中心' });
    if (user && (user.role === 'editor' || user.role === 'admin')) {
      items.push({ key: '/editor/dashboard', icon: <DashboardOutlined />, label: '编辑后台' });
    }
    if (user && (user.role === 'finance' || user.role === 'admin')) {
      items.push({ key: '/finance/settlements', icon: <DollarOutlined />, label: '结算中心' });
    }
    return items;
  };

  const userMenu = user ? {
    items: [
      { key: 'center', icon: <UserOutlined />, label: '个人中心', onClick: navigateToCenter },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }
    ]
  } : null;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <h1 style={{ margin: 0, fontSize: 20, color: '#1677ff', cursor: 'pointer' }} onClick={() => navigate('/')}>
            小说连载平台
          </h1>
          <Menu
            mode="horizontal"
            items={getNavItems()}
            selectedKeys={[location.pathname]}
            onClick={({ key }) => navigate(key)}
            style={{ borderBottom: 'none', flex: 1 }}
          />
        </div>
        <div>
          {user ? (
            <Dropdown menu={userMenu}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user.nickname}</span>
              </Space>
            </Dropdown>
          ) : (
            <Space>
              <Button type="link" onClick={() => navigate('/login')}>登录</Button>
              <Button type="primary" onClick={() => navigate('/register')}>注册</Button>
            </Space>
          )}
        </div>
      </Header>
      <Content style={{ padding: '24px 0' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />
          <Route path="/novel/:id" element={<NovelDetail user={user} />} />
          <Route path="/read/:novelId/:chapterId" element={<Reader user={user} />} />
          <Route path="/bookshelf" element={user ? <Bookshelf user={user} /> : <Navigate to="/login" />} />
          <Route path="/author" element={user && (user.role === 'author' || user.role === 'admin') ? <Navigate to="/author/novels" /> : <Navigate to="/login" />} />
          <Route path="/author/*" element={user && (user.role === 'author' || user.role === 'admin') ? <AuthorCenter user={user} /> : <Navigate to="/login" />} />
          <Route path="/editor" element={user && (user.role === 'editor' || user.role === 'admin') ? <Navigate to="/editor/dashboard" /> : <Navigate to="/login" />} />
          <Route path="/editor/*" element={user && (user.role === 'editor' || user.role === 'admin') ? <EditorCenter user={user} /> : <Navigate to="/login" />} />
          <Route path="/finance" element={user && (user.role === 'finance' || user.role === 'admin') ? <Navigate to="/finance/settlements" /> : <Navigate to="/login" />} />
          <Route path="/finance/*" element={user && (user.role === 'finance' || user.role === 'admin') ? <FinanceCenter user={user} /> : <Navigate to="/login" />} />
        </Routes>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #e8e8e8' }}>
        小说连载平台 ©2024 - 全栈业务系统演示
      </Footer>
    </Layout>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <Router>
      <AppContent user={user} setUser={setUser} />
    </Router>
  );
}

export default App;
