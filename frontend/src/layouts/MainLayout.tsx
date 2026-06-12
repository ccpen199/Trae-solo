import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Tag, App } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  MenuFoldOutlined, MenuUnfoldOutlined, DashboardOutlined, FileTextOutlined,
  AccountBookOutlined, BulbOutlined, TeamOutlined, MessageOutlined,
  ContactsOutlined, IdcardOutlined, RocketOutlined,
  TrophyOutlined, UserOutlined, LogoutOutlined, BellOutlined, SettingOutlined,
  AuditOutlined, SwapOutlined, BookOutlined
} from '@ant-design/icons';
import { useAppStore, User } from '../store';
import api from '../api';

const { Header, Sider, Content } = Layout;

const roleConfig: Record<string, { name: string; color: string; icon: string }> = {
  jobseeker: { name: '求职者', color: 'blue', icon: '👤' },
  hr: { name: 'HR', color: 'green', icon: '💼' },
  trainer: { name: '培训师', color: 'purple', icon: '🎓' },
  admin: { name: '管理员', color: 'red', icon: '🛡️' }
};

const menuItems = (role: string) => {
  const base = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' }
  ];
  if (role === 'jobseeker' || role === 'admin') {
    base.push({ key: '/resumes', icon: <FileTextOutlined />, label: '我的简历' });
  }
  if (role === 'jobseeker' || role === 'admin') {
    base.push({ key: '/jobs', icon: <AccountBookOutlined />, label: '岗位广场' });
  }
  if (role === 'hr' || role === 'admin') {
    base.push({ key: '/jobs', icon: <AccountBookOutlined />, label: '岗位管理' });
    base.push({ key: '/resumes', icon: <FileTextOutlined />, label: '人才库' });
  }
  base.push({ key: '/matching', icon: <BulbOutlined />, label: '智能匹配' });
  base.push({ key: '/community', icon: <TeamOutlined />, label: '职场社区' });
  if (role === 'hr' || role === 'admin' || role === 'trainer') {
    base.push({ key: '/community/moderation', icon: <AuditOutlined />, label: '内容审核' });
  }
  base.push({ key: '/chat', icon: <MessageOutlined />, label: '直聊系统' });
  if (role === 'hr' || role === 'admin') {
    base.push({ key: '/leads', icon: <ContactsOutlined />, label: '客户线索池' });
    base.push({ key: '/business-card', icon: <IdcardOutlined />, label: '电子名片' });
    base.push({ key: '/push-engine', icon: <RocketOutlined />, label: '精准推送' });
  }
  base.push({ key: '/courses', icon: <BookOutlined />, label: '网校课程' });
  if (role === 'trainer' || role === 'admin') {
    base.push({ key: '/courses/new', icon: <BookOutlined />, label: '发布课程' });
  }
  if (role === 'jobseeker' || role === 'admin') {
    base.push({ key: '/my-learning', icon: <BookOutlined />, label: '我的学习' });
    base.push({ key: '/certificates', icon: <TrophyOutlined />, label: '我的证书' });
  }
  if (role === 'admin') {
    base.push({ key: '/users', icon: <UserOutlined />, label: '用户管理' });
    base.push({ key: '/audit-logs', icon: <AuditOutlined />, label: '审计日志' });
  }
  return base;
};

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout, setUser, setUnreadCount, unreadCount } = useAppStore();
  const [roleOptions, setRoleOptions] = useState<any[]>([]);
  const { message } = App.useApp();

  useEffect(() => {
    api.get('/auth/roles/available').then((d: any) => setRoleOptions(d.roles || []));
  }, []);

  useEffect(() => {
    if (token) {
      api.get('/chat/unread/count').then((d: any) => setUnreadCount(d.count || 0)).catch(() => {});
      api.get('/notifications/unread-count').then((d: any) => setUnreadCount((prev: number) => prev + (d.count || 0))).catch(() => {});
    }
  }, [token, setUnreadCount]);

  const switchRole = async (role: string) => {
    try {
      const data = await api.post('/auth/switch-role', { role }) as any;
      const newUser: User = { ...user!, role: data.user.role as any };
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      message.success(`已切换到「${roleConfig[role].name}」角色`);
      navigate('/dashboard');
    } catch (e: any) {
      message.error(e.error || '切换失败');
    }
  };

  if (!user) return null;
  const roleInfo = roleConfig[user.role];

  const userMenu = {
    items: [
      { key: 'profile', icon: <SettingOutlined />, label: '个人中心', onClick: () => navigate('/profile') },
      { key: 'notifications', icon: <BellOutlined />, label: `消息通知`, onClick: () => navigate('/notifications') },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/login'); } }
    ]
  };

  const roleMenu = {
    items: roleOptions.filter((r: any) => r.key !== user.role).map((r: any) => ({
      key: r.key,
      icon: <SwapOutlined />,
      label: (
        <div>
          <div style={{ fontWeight: 500 }}>{r.name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{r.desc}</div>
        </div>
      ),
      onClick: () => switchRole(r.key)
    }))
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div className="logo" style={{ color: 'white', fontSize: collapsed ? 14 : 16 }}>
          {collapsed ? '招聘' : '招聘内训工作台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems(user.role)}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {collapsed
              ? <MenuUnfoldOutlined className="trigger" onClick={() => setCollapsed(!collapsed)} />
              : <MenuFoldOutlined className="trigger" onClick={() => setCollapsed(!collapsed)} />
            }
            <Tag color={roleInfo.color as any} style={{ marginLeft: 16, fontSize: 14 }}>
              {roleInfo.icon} {roleInfo.name}
            </Tag>
            {roleOptions.length > 0 && (
              <Dropdown menu={roleMenu} placement="bottomLeft">
                <Button size="small" style={{ marginLeft: 8 }} icon={<SwapOutlined />}>切换角色</Button>
              </Dropdown>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: 24, gap: 16 }}>
            <Badge count={unreadCount} size="small">
              <Button type="text" icon={<BellOutlined />} onClick={() => navigate('/notifications')} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                <Avatar icon={<UserOutlined />} src={user.avatar} />
                <span>{user.name}</span>
                {user.points != null && <Tag color="gold">积分 {user.points}</Tag>}
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 0, background: '#f0f2f5' }}>
          <div className="page-container">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
