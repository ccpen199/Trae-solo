import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button, Dropdown, Avatar, Menu } from 'antd';
import {
  HomeOutlined,
  TrophyOutlined,
  HistoryOutlined,
  GiftOutlined,
  LogoutOutlined,
  UserOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  {
    key: '/',
    label: '仪表盘',
    icon: <HomeOutlined />,
  },
  {
    key: '/leaderboard',
    label: '排行榜',
    icon: <TrophyOutlined />,
  },
  {
    key: '/match/report',
    label: '战绩上报',
    icon: <PlusOutlined />,
  },
  {
    key: '/matches',
    label: '比赛记录',
    icon: <HistoryOutlined />,
  },
  {
    key: '/rewards',
    label: '奖励中心',
    icon: <GiftOutlined />,
  },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (e) => {
    navigate(e.key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: '1',
        label: (
          <div>
            <div style={{ fontWeight: 'bold' }}>{user?.nickname || user?.username}</div>
            <div style={{ fontSize: 12, color: '#999' }}>
              {roleLabels[user?.role] || user?.role}
            </div>
          </div>
        ),
        disabled: true,
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        label: '退出登录',
        icon: <LogoutOutlined />,
        onClick: handleLogout,
      },
    ],
  };

  const roleLabels = {
    admin: '管理员',
    operator: '运营',
    customer_service: '客服',
    anticheat: '反作弊审核',
    player: '玩家'
  };

  return (
    <div className="layout-container">
      <header className="layout-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <h1 className="layout-logo">游戏排行榜系统</h1>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ background: 'transparent', border: 'none' }}
            theme="dark"
          />
        </div>
        <div className="layout-user-info">
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.nickname || user?.username}</span>
            </div>
          </Dropdown>
        </div>
      </header>
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
