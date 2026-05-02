import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Space } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  MedicineBoxOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  AlertOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;

const getMenuItems = (role) => {
  const commonItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '工作台',
    }
  ];

  const roleItems = {
    ADMIN: [
      {
        key: '/purchases',
        icon: <ShoppingCartOutlined />,
        label: '采购管理',
      },
      {
        key: '/inventory',
        icon: <InboxOutlined />,
        label: '库存管理',
        children: [
          { key: '/inventory/batches', label: '库存批次' },
          { key: '/inventory/alerts', label: '效期预警' },
        ]
      },
      {
        key: '/prescriptions',
        icon: <FileTextOutlined />,
        label: '处方管理',
      },
      {
        key: '/sales',
        icon: <MedicineBoxOutlined />,
        label: '销售管理',
        children: [
          { key: '/sales/pos', label: '收银台' },
          { key: '/sales/list', label: '销售记录' },
          { key: '/sales/recalls', label: '药品召回' },
        ]
      },
      {
        key: '/drugs',
        icon: <SearchOutlined />,
        label: '药品管理',
      }
    ],
    PURCHASER: [
      {
        key: '/purchases',
        icon: <ShoppingCartOutlined />,
        label: '采购管理',
      },
    ],
    WAREHOUSE_KEEPER: [
      {
        key: '/purchases',
        icon: <ShoppingCartOutlined />,
        label: '采购收货',
      },
      {
        key: '/inventory',
        icon: <InboxOutlined />,
        label: '库存管理',
        children: [
          { key: '/inventory/batches', label: '库存批次' },
          { key: '/inventory/alerts', label: '效期预警' },
        ]
      }
    ],
    PHARMACIST: [
      {
        key: '/prescriptions',
        icon: <FileTextOutlined />,
        label: '处方审核',
      },
      {
        key: '/sales/recalls',
        icon: <AlertOutlined />,
        label: '药品召回',
      }
    ],
    CASHIER: [
      {
        key: '/sales/pos',
        icon: <MedicineBoxOutlined />,
        label: '收银台',
      },
      {
        key: '/sales/list',
        icon: <FileTextOutlined />,
        label: '销售记录',
      }
    ]
  };

  return [...commonItems, ...(roleItems[role] || [])];
};

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: user?.name,
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
    ],
  };

  const roleLabels = {
    ADMIN: '系统管理员',
    PURCHASER: '采购员',
    WAREHOUSE_KEEPER: '库管',
    PHARMACIST: '执业药师',
    CASHIER: '收银员'
  };

  const selectedKey = location.pathname;

  return (
    <Layout className="main-layout">
      <Header className="header">
        <div className="header-logo">
          <MedicineBoxOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <span>药房进销存管理系统</span>
        </div>
        <div className="header-user">
          <Space>
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>
              {roleLabels[user?.role] || user?.role}
            </span>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span style={{ color: 'white' }}>{user?.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </div>
      </Header>
      <Layout>
        <Sider
          width={220}
          className="sidebar"
          theme="dark"
        >
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={['/inventory', '/sales']}
            items={getMenuItems(user?.role)}
            onClick={handleMenuClick}
            style={{ borderRight: 0 }}
          />
        </Sider>
        <Layout>
          <Content className="content-container">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
