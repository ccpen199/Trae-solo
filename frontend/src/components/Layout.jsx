import React from 'react';
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown, Badge, Tag } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeOutlined, 
  FileTextOutlined, 
  PlusCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
  SolutionOutlined,
  SafetyOutlined,
  GiftOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = AntLayout;

const ROLE_MENUS = {
  resident: [
    { key: 'dashboard', label: '工作台', icon: <HomeOutlined /> },
    { key: 'create-order', label: '预约回收', icon: <PlusCircleOutlined /> },
    { key: 'orders', label: '我的订单', icon: <FileTextOutlined /> },
    { key: 'credit', label: '绿色积分', icon: <GiftOutlined /> },
    { key: 'footprint', label: '环保足迹', icon: <BarChartOutlined /> }
  ],
  rider: [
    { key: 'dashboard', label: '工作台', icon: <HomeOutlined /> },
    { key: 'nearby-orders', label: '附近订单', icon: <EnvironmentOutlined /> },
    { key: 'my-orders', label: '我的任务', icon: <FileTextOutlined /> }
  ],
  center: [
    { key: 'dashboard', label: '工作台', icon: <HomeOutlined /> },
    { key: 'pending-receive', label: '待签收', icon: <SolutionOutlined /> },
    { key: 'received', label: '已签收', icon: <FileTextOutlined /> }
  ],
  operator: [
    { key: 'dashboard', label: '工作台', icon: <HomeOutlined /> },
    { key: 'orders', label: '订单管理', icon: <FileTextOutlined /> },
    { key: 'disputes', label: '异议处理', icon: <ExclamationCircleOutlined /> },
    { key: 'audit-logs', label: '审计日志', icon: <SafetyOutlined /> },
    { key: 'stats', label: '数据统计', icon: <BarChartOutlined /> }
  ]
};

const ROLE_NAMES = {
  resident: '社区居民',
  rider: '回收员',
  center: '集散中心',
  operator: '平台运营'
};

const Layout = ({ children, activeKey, onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = user ? ROLE_MENUS[user.role] || [] : [];

  const handleMenuClick = ({ key }) => {
    if (onMenuClick) {
      onMenuClick(key);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        label: '个人信息',
        icon: <UserOutlined />
      },
      {
        key: 'logout',
        label: '退出登录',
        icon: <LogoutOutlined />,
        danger: true,
        onClick: handleLogout
      }
    ]
  };

  const getDefaultSelectedKey = () => {
    if (activeKey) return activeKey;
    const path = location.pathname;
    if (path.includes('order')) return 'orders';
    if (path.includes('create')) return 'create-order';
    if (path.includes('credit')) return 'credit';
    if (path.includes('footprint')) return 'footprint';
    if (path.includes('nearby')) return 'nearby-orders';
    if (path.includes('my-orders')) return 'my-orders';
    if (path.includes('pending')) return 'pending-receive';
    if (path.includes('received')) return 'received';
    if (path.includes('disputes')) return 'disputes';
    if (path.includes('audit')) return 'audit-logs';
    if (path.includes('stats')) return 'stats';
    return 'dashboard';
  };

  return (
    <AntLayout className="layout">
      <Header className="header">
        <div className="header-logo">🌱 绿回收</div>
        <div className="header-title">
          垃圾分类回收平台 - {user ? ROLE_NAMES[user.role] : ''}
        </div>
        {user && (
          <Dropdown menu={userMenu} placement="bottomRight">
            <div className="header-user" style={{ cursor: 'pointer' }}>
              <div className="header-user-info">
                <div>{user.name || user.username}</div>
                <div className="header-user-role">
                  <Tag color={
                    user.role === 'resident' ? 'blue' :
                    user.role === 'rider' ? 'green' :
                    user.role === 'center' ? 'orange' : 'purple'
                  }>
                    {ROLE_NAMES[user.role]}
                  </Tag>
                </div>
              </div>
              <Avatar icon={<UserOutlined />} />
            </div>
          </Dropdown>
        )}
      </Header>
      
      <AntLayout>
        <Sider 
          className="sider"
          theme="dark"
          width={200}
        >
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[getDefaultSelectedKey()]}
            items={menuItems}
            onClick={handleMenuClick}
          />
        </Sider>
        
        <Content className="content">
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
