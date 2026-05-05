import { Layout, Menu, Dropdown, Avatar, Badge, theme } from 'antd';
import {
  HomeOutlined,
  FileAddOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  InboxOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../utils/api';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [statistics, setStatistics] = useState({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const response = await api.get('/common/statistics');
        setStatistics(response.data);
      } catch (error) {
        console.error('加载统计数据失败:', error);
      }
    };
    if (user) {
      loadStatistics();
    }
  }, [user]);

  const getMenuItems = () => {
    const items = [
      {
        key: '/',
        icon: <HomeOutlined />,
        label: '首页',
      },
      {
        key: '/application/create',
        icon: <FileAddOutlined />,
        label: '发起报销',
      },
      {
        key: '/applications',
        icon: <FileTextOutlined />,
        label: '我的申请',
        badge: statistics.my_pending > 0 ? (
          <Badge count={statistics.my_pending} size="small" />
        ) : null,
      },
    ];

    if (user?.role === 'approver' || user?.role === 'admin') {
      items.push({
        key: '/approval',
        icon: <CheckCircleOutlined />,
        label: '我的审批',
        badge: statistics.to_approve > 0 ? (
          <Badge count={statistics.to_approve} size="small" />
        ) : null,
      });
    }

    if (user?.role === 'finance' || user?.role === 'admin') {
      items.push({
        key: '/finance',
        icon: <CheckCircleOutlined />,
        label: '财务复核',
        badge: statistics.to_review > 0 ? (
          <Badge count={statistics.to_review} size="small" />
        ) : null,
      });
    }

    items.push(
      {
        key: '/cc',
        icon: <CopyOutlined />,
        label: '抄送给我',
        badge: statistics.cc_count > 0 ? (
          <Badge count={statistics.cc_count} size="small" />
        ) : null,
      },
      {
        key: '/archive',
        icon: <InboxOutlined />,
        label: '归档记录',
      }
    );

    return items.map(item => ({
      ...item,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{item.label}</span>
          {item.badge}
        </div>
      ),
    }));
  };

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
        label: `${user?.name} (${user?.role})`,
        disabled: true,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="light"
        style={{
          background: colorBgContainer,
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: collapsed ? 12 : 18,
          background: '#f0f2f5'
        }}>
          {collapsed ? 'OA' : 'OA费用报销系统'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: colorBgContainer }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
