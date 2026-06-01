import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Space } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  HomeOutlined,
  ScanOutlined,
  FileTextOutlined,
  ToolOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import api from '../utils/api';

const { Header, Sider, Content } = Layout;

function MainLayout({ user, onLogout, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlertCount = async () => {
    try {
      const response = await api.get('/alerts/unread-count');
      setAlertCount(response.data.count);
    } catch (error) {
      console.error('获取告警数量失败');
    }
  };

  const getMenuItems = () => {
    const items = [];
    
    items.push({
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘'
    });

    if (['manager'].includes(user.role)) {
      items.push({
        key: '/buildings',
        icon: <HomeOutlined />,
        label: '楼栋管理'
      });
      items.push({
        key: '/checkpoints',
        icon: <ScanOutlined />,
        label: '点位管理'
      });
      items.push({
        key: '/plans',
        icon: <BarChartOutlined />,
        label: '巡更计划'
      });
    }

    if (['patrol', 'manager'].includes(user.role)) {
      items.push({
        key: '/patrol',
        icon: <ScanOutlined />,
        label: '巡更执行'
      });
    }

    items.push({
      key: '/patrol/records',
      icon: <FileTextOutlined />,
      label: '巡更记录'
    });

    items.push({
      key: '/workorders',
      icon: <ToolOutlined />,
      label: '工单管理'
    });

    if (user.role === 'manager') {
      items.push({
        key: '/users',
        icon: <UserOutlined />,
        label: '用户管理'
      });
    }

    return items;
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user.name
    },
    {
      key: 'role',
      label: `角色：${getRoleText(user.role)}`
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录'
    }
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      onLogout();
    } else {
      navigate(key);
    }
  };

  const getRoleText = (role) => {
    const roleMap = {
      manager: '项目经理',
      patrol: '巡更员',
      repair: '维修人员',
      customer_service: '客服'
    };
    return roleMap[role] || role;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? 14 : 18, fontWeight: 'bold' }}>
          {collapsed ? '巡更' : '物业巡更系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            欢迎使用物业巡更管理系统
          </div>
          <Space size="middle">
            <Badge count={alertCount} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{user.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '24px' }}>
          <div className="page-container">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
