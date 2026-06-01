import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Badge } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  AuditOutlined,
  BellOutlined,
  ExceptionOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

const { Header, Sider, Content } = Layout;

const roleNames = {
  platform_engineer: '平台工程师',
  ops: '运维',
  developer: '开发者',
  app_owner: '应用负责人',
  security_admin: '安全管理员'
};

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    loadAlertCount();
  }, []);

  const loadAlertCount = async () => {
    try {
      const response = await api.get('/alerts', { params: { status: 'active', pageSize: 1 } });
      setAlertCount(response.data.total || 0);
    } catch (e) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/applications',
      icon: <AppstoreOutlined />,
      label: '应用管理',
    },
    {
      key: '/environments',
      icon: <DatabaseOutlined />,
      label: '环境配置',
    },
    {
      key: '/strategies',
      icon: <SafetyOutlined />,
      label: '备份策略',
    },
    {
      key: '/tasks',
      icon: <PlayCircleOutlined />,
      label: '执行任务',
    },
    {
      key: '/change-orders',
      icon: <FileTextOutlined />,
      label: '变更管理',
    },
    {
      key: '/audit',
      icon: <AuditOutlined />,
      label: '审计日志',
    },
    {
      key: '/alerts',
      icon: (
        <Badge count={alertCount} size="small">
          <BellOutlined />
        </Badge>
      ),
      label: '告警中心',
    },
    {
      key: '/exceptions',
      icon: <ExceptionOutlined />,
      label: '异常处理',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '报表中心',
    },
  ];

  const userMenuItems = [
    {
      key: 'user',
      label: (
        <div>
          <strong>{user?.real_name}</strong>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{roleNames[user?.role]}</div>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="main-layout">
      <Sider theme="dark" width={220}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, fontWeight: 600 }}>
          <DatabaseOutlined style={{ marginRight: 8 }} />
          备份恢复平台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="header">
          <div className="header-title">数据库备份恢复管理平台</div>
          <div className="header-user">
            <Badge count={alertCount} size="small" offset={[-2, 2]}>
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                style={{ color: 'white' }}
                onClick={() => navigate('/alerts')}
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{user?.real_name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
