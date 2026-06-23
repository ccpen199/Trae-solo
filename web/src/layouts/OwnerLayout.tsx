import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Badge, Dropdown, Button } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  ToolOutlined,
  BellOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../api';

const { Header, Sider, Content } = Layout;

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/messages/unread-count').then((res) => setUnread(res.data.count));
  }, []);

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/bills', icon: <FileTextOutlined />, label: '物业费' },
    { key: '/workorders', icon: <ToolOutlined />, label: '报修服务' },
    { key: '/announcements', icon: <BellOutlined />, label: '小区公告' },
    { key: '/posts', icon: <TeamOutlined />, label: '邻里圈' },
    { key: '/messages', icon: <Badge count={unread}><MessageOutlined /></Badge>, label: '消息中心' },
    { key: '/profile', icon: <UserOutlined />, label: '个人中心' },
  ];

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '个人中心', onClick: () => navigate('/profile') },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/login'); } },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
      >
        <div style={{ padding: 20, textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ margin: 0, color: '#1677ff' }}>智慧社区</h2>
          <p style={{ margin: 0, fontSize: 12, color: '#999' }}>业主端</p>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', padding: '8px 0' }}
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
