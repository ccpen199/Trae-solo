import { Layout, Menu, Dropdown, Avatar, Tag, Badge } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined, 
  DashboardOutlined,
  SearchOutlined,
  FileTextOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  FileProtectOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

const { Header: AntHeader } = Layout;

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const user = auth?.user;

  const handleLogout = () => {
    auth.logout();
    navigate('/login', { replace: true });
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <SettingOutlined />,
        label: '个人中心',
        onClick: () => navigate('/profile')
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout
      }
    ]
  };

  const getNavItemsByRole = () => {
    if (!user) return [];
    
    const baseItems = [
      { key: '/', label: '首页', onClick: () => navigate('/') },
      { key: '/profile', label: '个人中心', icon: <UserOutlined />, onClick: () => navigate('/profile') },
    ];

    switch (user.role) {
      case 'worker':
        return [
          ...baseItems,
          { key: '/jobs', label: '招工大厅', icon: <SearchOutlined />, onClick: () => navigate('/jobs') },
          { key: '/my-jobs', label: '我的申请', icon: <FileTextOutlined />, onClick: () => navigate('/my-jobs') },
          { key: '/attendance', label: '考勤打卡', icon: <CheckCircleOutlined />, onClick: () => navigate('/attendance') },
        ];
      case 'company':
        return [
          ...baseItems,
          { key: '/create-job', label: '发布招工', icon: <PlusOutlined />, onClick: () => navigate('/create-job') },
          { key: '/my-jobs', label: '招工管理', icon: <FileTextOutlined />, onClick: () => navigate('/my-jobs') },
          { key: '/attendance', label: '工时确认', icon: <CheckCircleOutlined />, onClick: () => navigate('/attendance') },
          { key: '/admin', label: '劳务合规', icon: <FileProtectOutlined />, onClick: () => navigate('/admin') },
        ];
      case 'team':
        return [
          ...baseItems,
          { key: '/jobs', label: '承揽项目', icon: <SearchOutlined />, onClick: () => navigate('/jobs') },
          { key: '/my-jobs', label: '项目管理', icon: <FileTextOutlined />, onClick: () => navigate('/my-jobs') },
          { key: '/attendance', label: '班组考勤', icon: <TeamOutlined />, onClick: () => navigate('/attendance') },
        ];
      case 'admin':
        return [
          ...baseItems,
          { key: '/admin', label: '管理后台', icon: <DashboardOutlined />, onClick: () => navigate('/admin') },
          { key: '/my-jobs', label: '订单提交', icon: <FileTextOutlined />, onClick: () => navigate('/my-jobs') },
          { key: '/jobs', label: '招工大厅', icon: <SearchOutlined />, onClick: () => navigate('/jobs') },
        ];
      default:
        return baseItems;
    }
  };

  const getRoleTag = () => {
    if (!user) return null;
    const colors = {
      admin: 'green',
      worker: 'blue',
      company: 'purple',
      team: 'orange'
    };
    const labels = {
      admin: '管理员',
      worker: '工友',
      company: '项目方',
      team: '班组'
    };
    return <Tag color={colors[user.role] || 'default'}>{labels[user.role] || user.role}</Tag>;
  };

  if (!user || location.pathname === '/login' || location.pathname === '/register') return null;

  return (
    <AntHeader style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      background: 'linear-gradient(135deg, #001529 0%, #003a8c 100%)',
      padding: '0 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <div style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '28px' }}>🏗️</span>
        <span>建筑用工撮合平台</span>
        {getRoleTag()}
      </div>
      
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={getNavItemsByRole()}
        style={{ 
          minWidth: 500, 
          background: 'transparent',
          borderBottom: 'none',
          flex: 1,
          justifyContent: 'center',
          margin: '0 40px'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Badge dot>
          <span style={{ color: '#fff' }}>
            👤 {user.name || user.phone}
          </span>
        </Badge>
        <Dropdown menu={userMenu} placement="bottomRight">
          <Avatar 
            style={{ 
              cursor: 'pointer', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: '2px solid rgba(255,255,255,0.3)'
            }} 
            icon={<UserOutlined />} 
            size="default"
          />
        </Dropdown>
      </div>
    </AntHeader>
  );
}

export default Header;
