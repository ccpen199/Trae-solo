import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Badge } from 'antd';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  HomeOutlined, 
  ShopOutlined, 
  CameraOutlined, 
  PictureOutlined,
  GiftOutlined,
  BookOutlined,
  CalendarOutlined,
  DollarOutlined,
  ShoppingOutlined,
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  HeartOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { getUser, logout, isAuthenticated, isAdmin, isMerchant, isCouple } from '../../utils/auth.js';

const { Header, Content, Footer } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [selectedKey, setSelectedKey] = useState('/');

  useEffect(() => {
    setUser(getUser());
    const path = location.pathname;
    if (path.startsWith('/merchants')) setSelectedKey('/merchants');
    else if (path.startsWith('/services')) setSelectedKey('/services');
    else if (path.startsWith('/cases')) setSelectedKey('/cases');
    else if (path.startsWith('/marketing')) setSelectedKey('/marketing');
    else if (path.startsWith('/knowledge')) setSelectedKey('/knowledge');
    else if (path.startsWith('/couple')) setSelectedKey('/couple');
    else if (path.startsWith('/orders')) setSelectedKey('/orders');
    else if (path.startsWith('/merchant/')) setSelectedKey('/merchant/dashboard');
    else if (path.startsWith('/admin/')) setSelectedKey('/admin/dashboard');
    else setSelectedKey('/');
  }, [location.pathname]);

  const publicMenuItems = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">首页</Link> },
    { key: '/merchants', icon: <ShopOutlined />, label: <Link to="/merchants">商家入驻</Link> },
    { key: '/services', icon: <CameraOutlined />, label: <Link to="/services">服务市场</Link> },
    { key: '/cases', icon: <PictureOutlined />, label: <Link to="/cases">案例库</Link> },
    { key: '/marketing', icon: <GiftOutlined />, label: <Link to="/marketing">优惠活动</Link> },
    { key: '/knowledge', icon: <BookOutlined />, label: <Link to="/knowledge">筹备知识</Link> }
  ];

  const coupleMenuItems = [
    { key: '/couple/countdown', icon: <CalendarOutlined />, label: <Link to="/couple/countdown">婚期倒计时</Link> },
    { key: '/couple/tasks', icon: <HeartOutlined />, label: <Link to="/couple/tasks">筹备计划</Link> },
    { key: '/couple/budget', icon: <DollarOutlined />, label: <Link to="/couple/budget">预算管理</Link> },
    { key: '/orders', icon: <ShoppingOutlined />, label: <Link to="/orders">我的订单</Link> }
  ];

  const merchantMenuItems = [
    { key: '/merchant/dashboard', icon: <DashboardOutlined />, label: <Link to="/merchant/dashboard">商家中心</Link> },
    { key: '/merchant/services', icon: <CameraOutlined />, label: <Link to="/merchant/services">服务管理</Link> },
    { key: '/merchant/cases', icon: <PictureOutlined />, label: <Link to="/merchant/cases">案例管理</Link> },
    { key: '/merchant/marketing', icon: <GiftOutlined />, label: <Link to="/merchant/marketing">营销活动</Link> },
    { key: '/merchant/orders', icon: <ShoppingOutlined />, label: <Link to="/merchant/orders">订单管理</Link> }
  ];

  const adminMenuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: <Link to="/admin/dashboard">管理后台</Link> },
    { key: '/admin/merchants', icon: <ShopOutlined />, label: <Link to="/admin/merchants">商家审核</Link> },
    { key: '/admin/knowledge', icon: <BookOutlined />, label: <Link to="/admin/knowledge">知识图谱</Link> },
    { key: '/admin/managers', icon: <UserOutlined />, label: <Link to="/admin/managers">站长管理</Link> },
    { key: '/admin/deposits', icon: <SafetyCertificateOutlined />, label: <Link to="/admin/deposits">保证金监管</Link> }
  ];

  const getMenuItems = () => {
    let items = [...publicMenuItems];
    if (isCouple()) {
      items = [...items, { type: 'divider' }, ...coupleMenuItems];
    }
    if (isMerchant()) {
      items = [...items, { type: 'divider' }, ...merchantMenuItems];
    }
    if (isAdmin()) {
      items = [...items, { type: 'divider' }, ...adminMenuItems];
    }
    return items;
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'settings', icon: <SettingOutlined />, label: '账号设置' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true }
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
          <Link to="/" style={{ 
            fontSize: '22px', 
            fontWeight: 'bold', 
            color: '#ff4d6d',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <HeartOutlined style={{ fontSize: '28px' }} />
            婚嫁优选
          </Link>
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={getMenuItems()}
            style={{ minWidth: 0, flex: 1, borderBottom: 'none' }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isAuthenticated() ? (
            <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size="small" src={user?.avatar}>
                  {user?.real_name?.[0] || user?.username?.[0]}
                </Avatar>
                <span>{user?.real_name || user?.username}</span>
              </div>
            </Dropdown>
          ) : (
            <>
              <Button type="link" onClick={() => navigate('/login')}>登录</Button>
              <Button type="primary" onClick={() => navigate('/register')}>免费注册</Button>
            </>
          )}
        </div>
      </Header>
      
      <Content style={{ background: '#fafafa' }}>
        <Outlet />
      </Content>
      
      <Footer style={{ 
        textAlign: 'center', 
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        color: '#999'
      }}>
        婚嫁优选 ©{new Date().getFullYear()} 婚庆服务本地化撮合平台 | 去中介化 · 直连商家 · 透明交易
      </Footer>
    </Layout>
  );
};

export default MainLayout;
