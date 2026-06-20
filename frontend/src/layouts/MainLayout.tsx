import { Layout, Menu, Button, Dropdown, Avatar, Tag } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined, HomeOutlined, ApartmentOutlined, DashboardOutlined, SafetyOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;

interface Props {
  user: any;
  onLogout: () => void;
}

export default function MainLayout({ user, onLogout }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = getSelectedKey(location.pathname);

  function getSelectedKey(path: string): string {
    if (path.startsWith('/properties')) return 'properties';
    if (path.startsWith('/user')) return 'user';
    if (path.startsWith('/agent')) return 'agent';
    if (path.startsWith('/developer')) return 'developer';
    if (path.startsWith('/governance')) return 'governance';
    return 'home';
  }

  const menuItems = [
    { key: 'home', icon: <HomeOutlined />, label: '首页', onClick: () => navigate('/') },
    { key: 'properties', icon: <ApartmentOutlined />, label: '房源市场', 
      children: [
        { key: 'new', label: '新房', onClick: () => navigate('/properties/new') },
        { key: 'secondhand', label: '二手房', onClick: () => navigate('/properties/secondhand') },
        { key: 'rental', label: '租房', onClick: () => navigate('/properties/rental') },
        { key: 'commercial', label: '商业物业', onClick: () => navigate('/properties/commercial') },
      ]
    },
    { key: 'governance', icon: <SafetyOutlined />, label: '真房源治理', onClick: () => navigate('/governance') },
  ];

  if (user?.role === 'agent') {
    menuItems.push({ key: 'agent', icon: <DashboardOutlined />, label: '经纪人工作台', onClick: () => navigate('/agent/dashboard') });
  }
  if (user?.role === 'developer') {
    menuItems.push({ key: 'developer', icon: <DashboardOutlined />, label: '开发商看板', onClick: () => navigate('/developer/dashboard') });
  }
  if (user?.role === 'admin') {
    menuItems.push({ key: 'user', icon: <DashboardOutlined />, label: '管理后台', onClick: () => navigate('/user') });
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'agent': return '经纪人';
      case 'developer': return '开发商';
      case 'admin': return '管理员';
      default: return '用户/业主';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'agent': return 'blue';
      case 'developer': return 'purple';
      case 'admin': return 'orange';
      default: return 'green';
    }
  };

  const getUserMenuItems = () => {
    const items: any[] = [];
    
    if (user?.role === 'agent') {
      items.push({ key: 'dashboard', label: '📊 经纪人工作台', onClick: () => navigate('/agent/dashboard') });
    }
    if (user?.role === 'developer') {
      items.push({ key: 'dashboard', label: '📈 开发商营销看板', onClick: () => navigate('/developer/dashboard') });
    }
    if (user?.role === 'admin') {
      items.push({ key: 'governance', label: '🔍 真房源治理', onClick: () => navigate('/governance') });
    }
    
    items.push({ key: 'center', label: '👤 个人中心', onClick: () => navigate('/user') });
    items.push({ key: 'transactions', label: '📝 我的交易', onClick: () => navigate('/transactions') });
    
    if (user?.role === 'user') {
      items.push({ key: 'favorites', label: '⭐ 我的收藏', onClick: () => navigate('/user') });
      items.push({ key: 'recommend', label: '🤖 智能推荐', onClick: () => navigate('/user') });
    }
    
    items.push({ type: 'divider' as const });
    items.push({ key: 'logout', label: '🚪 退出登录', onClick: onLogout });
    
    return items;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: '0 24px',
      }}>
        <div style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          color: '#1890ff',
          marginRight: '40px',
          cursor: 'pointer',
        }} onClick={() => navigate('/')}>
          🏠 房产交易协同平台
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ flex: 1, borderBottom: 'none' }}
        />
        {user ? (
          <Dropdown menu={{ items: getUserMenuItems() }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} src={user.avatar} />
              <span>{user.real_name || user.username}</span>
              <Tag color={getRoleColor(user.role)} style={{ marginLeft: 4 }}>
                {getRoleLabel(user.role)}
              </Tag>
            </div>
          </Dropdown>
        ) : (
          <Button type="primary" onClick={() => navigate('/login')}>登录</Button>
        )}
      </Header>
      <Content style={{ background: '#f5f5f5' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center', background: '#fff' }}>
        区域性全链条房产交易协同平台 ©2024 Created by Real Estate Platform | 已接入地方住建监管平台
      </Footer>
    </Layout>
  );
}
