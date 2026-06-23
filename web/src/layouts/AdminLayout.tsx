import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Badge, Dropdown, Button } from 'antd';
import {
  DashboardOutlined,
  ToolOutlined,
  FileTextOutlined,
  CalendarOutlined,
  HomeOutlined,
  MessageOutlined,
  UserOutlined,
  LogoutOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../api';

const { Header, Sider, Content } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/messages/unread-count').then((res) => setUnread(res.data.count));
  }, []);

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '数据概览' },
    { key: '/workorders', icon: <ToolOutlined />, label: '工单管理' },
    { key: '/bills', icon: <FileTextOutlined />, label: '缴费管理' },
    { key: '/activities', icon: <CalendarOutlined />, label: '活动管理' },
    { key: '/communities', icon: <HomeOutlined />, label: '小区/项目' },
    { key: '/messages', icon: <Badge count={unread}><MessageOutlined /></Badge>, label: '消息中心' },
    { key: '/gov', icon: <ApiOutlined />, label: '政务对接' },
    { key: '/profile', icon: <UserOutlined />, label: '账户设置' },
  ];

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '账户设置', onClick: () => navigate('/profile') },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/login'); } },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider style={{ background: '#001529' }}>
        <div style={{ padding: 20, textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: '#fff' }}>物业运营平台</h2>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>SaaS 管理后台</p>
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
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Button type="text" icon={<MessageOutlined />} onClick={() => navigate('/messages')}>
            <Badge count={unread} offset={[4, 0]}>消息</Badge>
          </Button>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} src={user?.avatar} />
              <span>{user?.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ padding: 24, background: '#f5f7fa' }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
