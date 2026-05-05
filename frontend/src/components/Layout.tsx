import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Badge, theme } from 'antd';
import {
  FileAddOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  SearchOutlined,
  HistoryOutlined,
  HomeOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { approvalApi } from '../services/api';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [todoCount, setTodoCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    const fetchTodoCount = async () => {
      try {
        const response = await approvalApi.getTodoList({ pageSize: 1, page: 1 });
        setTodoCount(response.total || 0);
      } catch (error) {
        console.error('获取待办数量失败:', error);
      }
    };

    if (user) {
      fetchTodoCount();
    }
  }, [user]);

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/documents/create')) return 'documents-create';
    if (path.startsWith('/documents/')) return 'documents';
    if (path.startsWith('/todos')) return 'todos';
    if (path.startsWith('/search')) return 'search';
    if (path.startsWith('/tracking')) return 'tracking';
    if (path.startsWith('/archived')) return 'archived';
    return path.slice(1);
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/'),
    },
    {
      key: 'documents-create',
      icon: <FileAddOutlined />,
      label: '公文呈报',
      onClick: () => navigate('/documents/create'),
    },
    {
      key: 'documents',
      icon: <FileTextOutlined />,
      label: '我的公文',
      onClick: () => navigate('/documents'),
    },
    {
      key: 'todos',
      icon: <Badge count={todoCount} showZero size="small"><CheckSquareOutlined /></Badge>,
      label: '待办公文',
      onClick: () => navigate('/todos'),
    },
    {
      key: 'search',
      icon: <SearchOutlined />,
      label: '公文查询',
      onClick: () => navigate('/search'),
    },
    {
      key: 'archived',
      icon: <HistoryOutlined />,
      label: '归档查询',
      onClick: () => navigate('/archived'),
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user?.name} (${user?.role === 'admin' ? '管理员' : user?.role === 'approver' ? '审批人' : '普通用户'})`,
      disabled: true,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
          margin: 16,
          borderRadius: 8
        }}>
          <span style={{ color: '#fff', fontSize: collapsed ? 14 : 18, fontWeight: 'bold' }}>
            {collapsed ? '公文' : '公文管理系统'}
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>
            {menuItems.find(item => item.key === getSelectedKey())?.label?.toString() || '公文管理系统'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={todoCount} showZero>
              <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} onClick={() => navigate('/todos')} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
