import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Tag, App, Spin, Alert } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  MenuFoldOutlined, MenuUnfoldOutlined, DashboardOutlined, FileTextOutlined,
  AccountBookOutlined, BulbOutlined, TeamOutlined, MessageOutlined,
  ContactsOutlined, IdcardOutlined, RocketOutlined,
  TrophyOutlined, UserOutlined, LogoutOutlined, BellOutlined, SettingOutlined,
  AuditOutlined, SwapOutlined, BookOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import { useAppStore, User } from '../store';
import api from '../api';

const { Header, Sider, Content } = Layout;

const roleConfig: Record<string, { name: string; color: string; icon: string; desc: string }> = {
  jobseeker: { name: '个人求职者', color: 'blue', icon: '👤', desc: '投递简历、浏览岗位、社区互动' },
  hr: { name: 'HR招聘专员', color: 'green', icon: '💼', desc: '发布岗位、管理简历、线索池、聊天沟通' },
  trainer: { name: '培训管理员', color: 'purple', icon: '🎓', desc: '课程管理、学习进度、结业证书' },
  admin: { name: '系统管理员', color: 'red', icon: '🛡️', desc: '全功能权限、用户管理、审计日志' }
};

const normalizeUser = (raw: any, fallback?: User | null): User => ({
  id: raw.id || fallback?.id || '',
  username: raw.username || fallback?.username || '',
  name: raw.name || fallback?.name || raw.username || '',
  email: raw.email || fallback?.email || '',
  role: raw.role || fallback?.role || 'jobseeker',
  tenantId: raw.tenantId || raw.tenant_id || fallback?.tenantId || '',
  avatar: raw.avatar ?? fallback?.avatar ?? undefined,
  points: raw.points ?? fallback?.points ?? 0,
});

const getStoredUser = (): User | null => {
  try {
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

const menuItems = (role: string) => {
  const base: any[] = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' }
  ];

  if (role === 'jobseeker' || role === 'admin') {
    base.push({ key: '/resumes', icon: <FileTextOutlined />, label: '我的简历' });
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
    base.push({ type: 'divider' as const });
    base.push({ key: '/users', icon: <UserOutlined />, label: '用户管理' });
    base.push({ key: '/audit-logs', icon: <AuditOutlined />, label: '操作审计日志' });
    base.push({ key: '/permissions', icon: <SafetyCertificateOutlined />, label: 'RBAC权限边界' });
  }

  return base;
};

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, setAuth, setUnreadCount, unreadCount } = useAppStore();
  const [roleOptions, setRoleOptions] = useState<any[]>([]);
  const { message } = App.useApp();

  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser());

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const storedUser = getStoredUser();
      const storedToken = localStorage.getItem('token');

      if (!storedToken || !storedUser) {
        if (!cancelled) {
          setLoading(false);
          navigate('/login', { replace: true });
        }
        return;
      }

      const normalizedUser = normalizeUser(storedUser, null);
      if (!cancelled) setCurrentUser(normalizedUser);

      try {
        try {
          await useAppStore.getState().fetchMe();
          const storeState = useAppStore.getState();
          if (storeState.user) {
            if (!cancelled) setCurrentUser(normalizeUser(storeState.user, normalizedUser));
          }
        } catch (e) {
          console.warn('[MainLayout] fetchMe failed, using stored user');
        }

        try {
          const rolesRes = await api.get('/auth/roles/available') as any;
          if (!cancelled) setRoleOptions(rolesRes.roles || []);
        } catch (e) {
          if (!cancelled) {
            setRoleOptions([
              { key: 'jobseeker', name: '个人求职者', desc: '投递简历、浏览岗位、社区互动' },
              { key: 'hr', name: 'HR招聘专员', desc: '发布岗位、管理简历、线索池、聊天沟通' },
              { key: 'trainer', name: '培训管理员', desc: '课程管理、学习进度、结业证书' }
            ]);
          }
        }

        try {
          const [chatRes, notifyRes] = await Promise.allSettled([
            api.get('/chat/unread/count'),
            api.get('/notifications/unread-count')
          ]) as any[];
          const chatCount = chatRes.status === 'fulfilled' ? (chatRes.value as any).count || 0 : 0;
          const notifyCount = notifyRes.status === 'fulfilled' ? (notifyRes.value as any).count || 0 : 0;
          if (!cancelled) setUnreadCount(chatCount + notifyCount);
        } catch {}

        if (!cancelled) setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setInitError(e?.message || '身份验证失败');
          setLoading(false);
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  const switchRole = async (role: string) => {
    try {
      const data = await api.post('/auth/switch-role', { role }) as any;
      const newUser = normalizeUser(data.user, currentUser);
      const newToken = data.token || useAppStore.getState().token || localStorage.getItem('token') || '';

      try {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
      } catch {}

      setAuth(newToken, newUser);
      setCurrentUser(newUser);

      await new Promise(r => setTimeout(r, 50));

      message.success(`已切换到「${roleConfig[role]?.name || role}」角色`);
      navigate('/dashboard');
    } catch (e: any) {
      message.error(e?.error || '切换失败，请稍后重试');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ background: 'white', padding: 40, borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#666', fontSize: 14 }}>
            正在加载{currentUser?.role ? ` ${roleConfig[currentUser.role]?.name || ''}` : ''}工作台...
          </div>
          <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
            {currentUser?.name || currentUser?.username || ''}
          </div>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#f0f2f5'
      }}>
        <div style={{ maxWidth: 500, width: '100%' }}>
          <Alert
            message="登录状态异常"
            description={initError}
            type="error"
            showIcon
            action={
              <Button size="small" type="primary" onClick={() => {
                try { logout(); localStorage.removeItem('token'); localStorage.removeItem('user'); } catch {}
                navigate('/login', { replace: true });
              }}>
                返回登录
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const effectiveUser = user || currentUser;

  if (!effectiveUser) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5'
      }}>
        <Alert message="无法获取用户信息" type="warning" showIcon />
        <Button
          style={{ marginTop: 16 }}
          type="primary"
          onClick={() => {
            try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch {}
            navigate('/login', { replace: true });
          }}
        >
          返回登录
        </Button>
      </div>
    );
  }

  const roleInfo = roleConfig[effectiveUser.role] || roleConfig.jobseeker;

  const userMenu = {
    items: [
      { key: 'profile', icon: <SettingOutlined />, label: '个人中心', onClick: () => navigate('/profile') },
      { key: 'notifications', icon: <BellOutlined />, label: '消息通知', onClick: () => navigate('/notifications') },
      { type: 'divider' as const },
      {
        key: 'tenant-info',
        icon: <SafetyCertificateOutlined />,
        label: (
          <div>
            <div style={{ fontWeight: 500 }}>🔐 租户信息</div>
            <div style={{ fontSize: 11, color: '#999' }}>租户ID: {effectiveUser.tenantId?.substring(0, 12) || 'N/A'}...</div>
            <div style={{ fontSize: 11, color: '#999' }}>用户ID: {effectiveUser.id?.substring(0, 12) || 'N/A'}...</div>
            <div style={{ fontSize: 11, color: '#999' }}>角色: {roleInfo.name}（{effectiveUser.role}）</div>
          </div>
        )
      },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '🚪 退出登录', onClick: () => {
        try { logout(); } catch {}
        try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch {}
        navigate('/login', { replace: true });
      }}
    ]
  };

  const roleMenu = {
    items: roleOptions.filter((r: any) => r.key !== effectiveUser.role).map((r: any) => ({
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
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" width={230}>
        <div style={{
          color: 'white',
          fontSize: collapsed ? 14 : 17,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          padding: '0 12px',
          letterSpacing: 1
        }}>
          {collapsed ? '🏢 HRT' : '🏢 招聘内训工作台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems(effectiveUser.role)}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, paddingTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: 0,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          height: 64,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {collapsed
              ? <MenuUnfoldOutlined style={{ fontSize: 18, padding: '0 24px', cursor: 'pointer', color: '#1677ff' }} onClick={() => setCollapsed(!collapsed)} />
              : <MenuFoldOutlined style={{ fontSize: 18, padding: '0 24px', cursor: 'pointer', color: '#1677ff' }} onClick={() => setCollapsed(!collapsed)} />
            }
            <Tag color={roleInfo.color as any} style={{ fontSize: 13, padding: '4px 14px', borderRadius: 6 }}>
              <span style={{ marginRight: 4 }}>{roleInfo.icon}</span>
              <strong>{roleInfo.name}</strong>
              <span style={{ marginLeft: 6, opacity: 0.7, fontWeight: 400 }}>
                @{effectiveUser.username}
              </span>
            </Tag>
            {roleOptions.length > 0 && (
              <Dropdown menu={roleMenu} placement="bottomLeft" arrow>
                <Button size="small" style={{ marginLeft: 14 }} icon={<SwapOutlined />} type="default">
                  切换角色
                </Button>
              </Dropdown>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: 24, gap: 16 }}>
            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
              <Button type="text" size="large" icon={<BellOutlined style={{ fontSize: 18 }} />} onClick={() => navigate('/notifications')} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight" arrow trigger={['click']}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                gap: 10,
                padding: '6px 12px',
                borderRadius: 8,
                transition: 'background 0.2s'
              }}>
                <Avatar size={36} icon={<UserOutlined />} src={effectiveUser.avatar} style={{ backgroundColor: '#1677ff' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>{effectiveUser.name}</div>
                  <div style={{ fontSize: 11, color: '#999', lineHeight: 1.4 }}>
                    {effectiveUser.points != null && effectiveUser.points > 0
                      ? <Tag color="gold" style={{ margin: 0, padding: '0 6px' }}>💰 {effectiveUser.points} 积分</Tag>
                      : <span>在线</span>
                    }
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 0, background: '#f0f2f5', padding: '20px', minHeight: 'calc(100vh - 64px)' }}>
          <div style={{ maxWidth: '100%' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
