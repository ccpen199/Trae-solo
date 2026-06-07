import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Dropdown, Avatar, Button, Tag, Space, Badge } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined, 
  ShopOutlined, 
  DashboardOutlined,
  CrownOutlined,
  TeamOutlined,
  SafetyOutlined,
  BellOutlined
} from '@ant-design/icons';

const { Header, Content, Footer } = AntLayout;

function Layout({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const enterDemoUser = (role) => {
    const demoUsers = {
      personal: {
        id: 2,
        username: 'user1',
        real_name: '演示个人用户',
        email: 'demo-user@example.com',
        phone: '13800138001',
        type: 'personal'
      },
      admin: {
        id: 1,
        username: 'admin',
        real_name: '系统管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        type: 'enterprise'
      }
    };
    const demoUser = demoUsers[role] || demoUsers.personal;
    localStorage.setItem('token', `local-demo-${role}`);
    localStorage.setItem('user', JSON.stringify(demoUser));
    setUser(demoUser);
    navigate(role === 'admin' ? '/admin/dashboard' : '/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const isAdmin = user?.username === 'admin';
  const isEnterprise = user?.type === 'enterprise' && !isAdmin;
  const isPersonal = user?.type === 'personal';

  const mainMenuItems = [
    { key: '/', label: <Link to="/">首页</Link> },
    { key: '/products', label: <Link to="/products">邮品商城</Link> },
    { key: '/tracking', label: <Link to="/tracking">包裹查询</Link> },
    { key: '/subscriptions', label: <Link to="/subscriptions">报刊订阅</Link> },
    { key: '/tickets', label: <Link to="/tickets">售后服务</Link> },
    { key: '/stamp', label: <Link to="/stamp">数字邮戳</Link> },
    { key: '/profile', label: <Link to="/profile">个人中心/我的</Link> },
    { key: '/admin/dashboard', label: <Link to="/admin/dashboard">后台管理</Link> },
  ];

  const adminMenuItems = isAdmin ? [
    { 
      key: '/admin',
      label: (
        <Link to="/admin/dashboard">
          <Space>
            <CrownOutlined />
            管理后台
            <Tag color="purple" style={{ marginLeft: 4 }}>管理员</Tag>
          </Space>
        </Link>
      )
    },
  ] : [];

  const enterpriseMenuItems = isEnterprise ? [
    { 
      key: '/enterprise',
      label: (
        <Link to="/profile">
          <Space>
            <ShopOutlined />
            企业中心
            <Tag color="blue" style={{ marginLeft: 4 }}>企业</Tag>
          </Space>
        </Link>
      )
    },
  ] : [];

  const getUserMenuItems = () => {
    const items = [];
    
    if (isAdmin) {
      items.push(
        { 
          key: 'admin-dashboard', 
          label: <Link to="/admin/dashboard">管理控制台</Link>, 
          icon: <DashboardOutlined /> 
        },
        { 
          key: 'content-review', 
          label: <Link to="/admin/content">内容审核</Link>, 
          icon: <SafetyOutlined /> 
        },
        { type: 'divider' }
      );
    } else if (isEnterprise) {
      items.push(
        { 
          key: 'enterprise-center', 
          label: <Link to="/profile">企业工作台</Link>, 
          icon: <ShopOutlined /> 
        },
        { 
          key: 'team-manage', 
          label: <Link to="/profile">团队管理</Link>, 
          icon: <TeamOutlined /> 
        },
        { type: 'divider' }
      );
    } else {
      items.push(
        { 
          key: 'profile', 
          label: <Link to="/profile">个人中心</Link>, 
          icon: <UserOutlined /> 
        },
        { 
          key: 'settings', 
          label: <Link to="/profile">账户设置</Link>, 
          icon: <SettingOutlined /> 
        },
        { type: 'divider' }
      );
    }
    
    items.push(
      { 
        key: 'logout', 
        label: '退出登录', 
        icon: <LogoutOutlined />, 
        onClick: handleLogout,
        danger: true
      }
    );
    
    return items;
  };

  const getRoleTag = () => {
    if (isAdmin) {
      return <Tag color="purple" icon={<CrownOutlined />}>管理员</Tag>;
    }
    if (isEnterprise) {
      return <Tag color="blue" icon={<ShopOutlined />}>企业账户</Tag>;
    }
    if (isPersonal) {
      return <Tag color="green" icon={<UserOutlined />}>个人账户</Tag>;
    }
    return null;
  };

  return (
    <AntLayout className="layout" style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: 'linear-gradient(90deg, #006633 0%, #007a3d 100%)', 
        display: 'flex', 
        alignItems: 'center',
        padding: '0 24px'
      }}>
        <div style={{ 
          fontSize: 20, 
          fontWeight: 'bold', 
          color: 'white', 
          marginRight: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{ 
            width: 32, 
            height: 32, 
            background: 'white', 
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#006633',
            fontSize: 18
          }}>
            邮
          </div>
          中国邮政
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={[...mainMenuItems, ...adminMenuItems, ...enterpriseMenuItems]}
          style={{ flex: 1, minWidth: 0, background: 'transparent', borderBottom: 'none' }}
        />
        
        {user ? (
          <Space size={16}>
            <Button size="middle" onClick={() => navigate('/profile')}>个人中心</Button>
            <Button size="middle" onClick={() => enterDemoUser('admin')}>后台管理</Button>
            <Badge count={3} size="small">
              <BellOutlined style={{ color: 'white', fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            
            {getRoleTag()}
            
            <Dropdown 
              menu={{ items: getUserMenuItems() }}
              placement="bottomRight"
            >
              <Space style={{ 
                color: 'white', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                padding: '4px 12px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <Avatar size="small" style={{ 
                  background: isAdmin ? '#722ed1' : isEnterprise ? '#1890ff' : '#52c41a' 
                }}>
                  {isAdmin ? <CrownOutlined /> : isEnterprise ? <ShopOutlined /> : <UserOutlined />}
                </Avatar>
                <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.real_name || user.username}
                </span>
              </Space>
            </Dropdown>
          </Space>
        ) : (
          <Space>
            <Button size="middle" onClick={() => enterDemoUser('personal')}>个人中心</Button>
            <Button size="middle" onClick={() => enterDemoUser('admin')}>管理后台</Button>
            <Link to="/login">
              <Button type="primary" size="middle">登录</Button>
            </Link>
            <Link to="/register">
              <Button size="middle">注册</Button>
            </Link>
          </Space>
        )}
      </Header>
      
      <Content style={{ padding: '24px 48px', background: '#f5f5f5' }}>
        <div className="site-layout-content" style={{ 
          background: '#fff', 
          padding: 24, 
          minHeight: 'calc(100vh - 184px)',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <Outlet />
        </div>
      </Content>
      
      <Footer style={{ 
        textAlign: 'center', 
        background: '#fff',
        borderTop: '1px solid #eee'
      }}>
        <Space size={24} split={<span>|</span>}>
          <span>中国邮政集团有限公司</span>
          <span>客服热线：11185</span>
          <span>邮政编码：100808</span>
        </Space>
        <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
          中国邮政集团统一数字服务门户平台 ©{new Date().getFullYear()} 版权所有
        </div>
      </Footer>
    </AntLayout>
  );
}

export default Layout;
