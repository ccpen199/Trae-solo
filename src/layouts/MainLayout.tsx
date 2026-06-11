import React, { useState, useMemo, useEffect } from 'react';
import { Layout, Avatar, Dropdown, Badge, Button, Input, theme, Tooltip } from 'antd';
import {
  DashboardOutlined,
  TrademarkCircleOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  BellOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RightOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

interface NavChild {
  key: string;
  label: string;
}

interface NavSection {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: NavChild[];
}

const navConfig: NavSection[] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
  {
    key: '/trademark',
    icon: <TrademarkCircleOutlined />,
    label: '商标管理',
    children: [
      { key: '/trademark/ai-search', label: '图形AI检索' },
      { key: '/trademark/tracker', label: '注册进度追踪' },
      { key: '/trademark/contracts', label: '转让/许可合同' },
    ],
  },
  {
    key: '/patent',
    icon: <FileProtectOutlined />,
    label: '专利管理',
    children: [
      { key: '/patent/ipc-nav', label: 'IPC分类导航' },
      { key: '/patent/fee-reminder', label: '年费代缴提醒' },
      { key: '/patent/value-assessment', label: '专利价值评估' },
    ],
  },
  {
    key: '/copyright',
    icon: <SafetyCertificateOutlined />,
    label: '版权管理',
    children: [
      { key: '/copyright/hash-deposit', label: '作品哈希存证' },
      { key: '/copyright/infringement', label: '侵权线索抓取' },
      { key: '/copyright/evidence', label: '维权证据包' },
    ],
  },
  {
    key: '/admin',
    icon: <SettingOutlined />,
    label: '后台管理',
    children: [
      { key: '/admin/agent-workbench', label: '代理人工作台' },
      { key: '/admin/subsidy-engine', label: '补贴申报引擎' },
    ],
  },
];

const firstChildMap: Record<string, string> = {};
navConfig.forEach((s) => {
  if (s.children?.length) {
    firstChildMap[s.key] = s.children[0].key;
  }
});

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const activeSections = useMemo(() => {
    const set = new Set<string>();
    navConfig.forEach((s) => {
      if (s.children?.some((c) => location.pathname.startsWith(c.key))) {
        set.add(s.key);
      }
    });
    return set;
  }, [location.pathname]);

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
    const set = new Set<string>();
    navConfig.forEach((s) => {
      if (s.children?.some((c) => location.pathname.startsWith(c.key))) {
        set.add(s.key);
      }
    });
    return set;
  });

  useEffect(() => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      activeSections.forEach((k) => next.add(k));
      return next;
    });
  }, [activeSections]);

  const handleSectionClick = (section: NavSection) => {
    if (section.children?.length) {
      setExpandedKeys((prev) => {
        const next = new Set(prev);
        next.add(section.key);
        return next;
      });
      navigate(firstChildMap[section.key]);
    } else {
      navigate(section.key);
    }
  };

  const handleChildClick = (key: string) => {
    navigate(key);
  };

  const submitSearch = () => {
    const keyword = searchKeyword.trim();
    if (!keyword) return;
    navigate(`/trademark/ai-search?q=${encodeURIComponent(keyword)}`);
    setSearchKeyword('');
  };

  const userMenu = {
    items: [
      {
        key: 'role',
        icon: <CrownOutlined />,
        label: '角色：专利代理人',
        disabled: true,
      },
      { type: 'divider' as const },
      { key: 'profile', icon: <UserOutlined />, label: '身份资料' },
      { key: 'settings', icon: <SettingOutlined />, label: '系统设置' },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '结束会话', danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'profile') navigate('/auth');
      if (key === 'settings') navigate('/admin/agent-workbench');
      if (key === 'logout') {
        localStorage.removeItem('ip_platform_token');
        localStorage.removeItem('ip_platform_user');
        navigate('/login');
      }
    },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #0d1b2a 0%, #1b2838 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 900,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            IP
          </div>
          {!collapsed && (
            <span
              style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                marginLeft: 12,
                whiteSpace: 'nowrap',
                letterSpacing: '0.5px',
              }}
            >
              知产全链条平台
            </span>
          )}
        </div>

        <nav aria-label="主导航" style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {navConfig.map((section) => {
            const isActive = section.key === location.pathname || activeSections.has(section.key);
            const isExpanded = expandedKeys.has(section.key);
            const hasChildren = !!section.children?.length;

            return (
              <div key={section.key}>
                <button
                  type="button"
                  onClick={() => handleSectionClick(section)}
                  style={{
                    width: '100%',
                    border: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    padding: collapsed ? '12px 0' : '0 20px',
                    height: 44,
                    cursor: 'pointer',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                    background: isActive ? 'rgba(102,126,234,0.25)' : 'transparent',
                    transition: 'all 0.2s',
                    borderRight: isActive ? '3px solid #667eea' : '3px solid transparent',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(102,126,234,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{section.icon}</span>
                    {!collapsed && (
                      <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }}>
                        {section.label}
                      </span>
                    )}
                  </div>
                  {!collapsed && hasChildren && (
                    <RightOutlined
                      style={{
                        fontSize: 10,
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}
                    />
                  )}
                </button>

                {!collapsed && hasChildren && isExpanded && (
                  <div style={{ paddingBottom: 4 }}>
                    {section.children!.map((child) => {
                      const isChildActive = location.pathname === child.key;
                      return (
                        <button
                          type="button"
                          key={child.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChildClick(child.key);
                          }}
                          style={{
                            width: '100%',
                            border: 0,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 20px 0 52px',
                            height: 40,
                            cursor: 'pointer',
                            color: isChildActive ? '#667eea' : 'rgba(255,255,255,0.55)',
                            background: isChildActive ? 'rgba(102,126,234,0.12)' : 'transparent',
                            borderRight: isChildActive ? '3px solid #667eea' : '3px solid transparent',
                            transition: 'all 0.2s',
                            fontSize: 13,
                            fontWeight: isChildActive ? 600 : 400,
                            fontFamily: 'inherit',
                            textAlign: 'left',
                          }}
                          onMouseEnter={(e) => {
                            if (!isChildActive) {
                              e.currentTarget.style.background = 'rgba(102,126,234,0.08)';
                              e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isChildActive) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                            }
                          }}
                        >
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {!collapsed && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                background: 'rgba(102,126,234,0.15)',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CrownOutlined style={{ color: '#667eea', fontSize: 14 }} />
              <div>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>
                  代理人模式
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
                  张代理 · 星河知产
                </div>
              </div>
            </div>
          </div>
        )}
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            height: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              style: { fontSize: 18, cursor: 'pointer', color: token.colorText },
              onClick: () => setCollapsed(!collapsed),
            })}
            <Input
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              onPressEnter={submitSearch}
              placeholder="搜索商标、专利、版权..."
              prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
              style={{ width: 320, borderRadius: 8 }}
              allowClear
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button size="small" onClick={() => navigate('/patent/ipc-nav')}>
              分类发现
            </Button>
            <Button size="small" onClick={() => navigate('/login')}>
              登录
            </Button>
            <Button size="small" type="primary" onClick={() => navigate('/register')}>
              注册
            </Button>
            <Tooltip title="通知中心">
              <Badge count={5} size="small">
                <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
              </Badge>
            </Tooltip>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar
                  size={32}
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  icon={<UserOutlined />}
                />
                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>张代理</div>
                  <div style={{ fontSize: 11, color: token.colorTextSecondary }}>专利代理人</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 16,
            minHeight: 'calc(100vh - 64px - 32px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
