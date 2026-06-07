import { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, message, Tag, Typography, Badge, Spin } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  AuditOutlined,
  ShoppingCartOutlined,
  OrderedListOutlined,
  SettingOutlined,
  WarningOutlined,
  BarChartOutlined,
  SafetyOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BankOutlined,
  IdcardOutlined,
  WalletOutlined,
  TagOutlined,
  LoadingOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { authApi } from '../services/api';

const { Text } = Typography;

const { Header, Sider, Content } = Layout;

const allMenuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '控制台', roles: ['admin', 'merchant', 'user'] },
  { key: '/providers', icon: <ShopOutlined />, label: '服务商管理', roles: ['admin', 'merchant'] },
  { key: '/providers/audit', icon: <AuditOutlined />, label: '服务商审核', roles: ['admin'] },
  { key: '/products', icon: <ShoppingCartOutlined />, label: '商品管理', roles: ['admin', 'merchant'] },
  { key: '/orders', icon: <OrderedListOutlined />, label: '订单管理', roles: ['admin', 'merchant', 'user'] },
  { key: '/fee-config', icon: <SettingOutlined />, label: '费率配置', roles: ['admin'] },
  { key: '/arbitrations', icon: <WarningOutlined />, label: '仲裁工单', roles: ['admin'] },
  { key: '/reports', icon: <BarChartOutlined />, label: '数据报表', roles: ['admin'] },
  { key: '/risk-events', icon: <SafetyOutlined />, label: '风控事件', roles: ['admin'] },
];

function parseStoredUserInfo() {
  const stored = localStorage.getItem('userInfo');
  if (!stored) return null;
  try { return JSON.parse(stored); } catch { return null; }
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const stored = parseStoredUserInfo();
    if (stored) {
      setUserInfo(stored);
      setLoading(false);
    }

    let cancelled = false;
    authApi
      .getProfile()
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        setUserInfo(data);
        localStorage.setItem('userInfo', JSON.stringify(data));
        if (loading) setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          localStorage.removeItem('permissions');
          localStorage.removeItem('workbenchPath');
          navigate('/login', { replace: true });
        } else if (!stored) {
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [navigate]);

  const role = userInfo?.role || 'user';

  const menuItems = useMemo(() => {
    return allMenuItems.filter((item) => item.roles.includes(role));
  }, [role]);

  const roleLabel = useMemo(() => {
    const map = { admin: '审核运营', merchant: '商户', user: '普通用户' };
    return map[role] || '用户';
  }, [role]);

  const roleColor = useMemo(() => {
    const map = { admin: 'blue', merchant: 'green', user: 'orange' };
    return map[role] || 'default';
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('permissions');
    localStorage.removeItem('workbenchPath');
    message.success('已退出登录');
    navigate('/login', { replace: true });
  };

  const dropdownItems = {
    items: [
      {
        key: 'info',
        label: (
          <div style={{ padding: '4px 0', minWidth: 180 }}>
            <div style={{ marginBottom: 4 }}>
              <Tag color={roleColor}>{roleLabel}</Tag>
            </div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {userInfo?.phone}
            </div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>
              <IdcardOutlined style={{ marginRight: 4 }} />
              {userInfo?.idCardVerified ? '已实名' : '未实名'}
            </div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>
              <BankOutlined style={{ marginRight: 4 }} />
              {userInfo?.hasBankCard ? '已绑卡' : '免绑卡'}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>
              <WalletOutlined style={{ marginRight: 4 }} />
              余额 ¥{Number(userInfo?.walletBalance || 0).toFixed(2)}
            </div>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  if (loading && !userInfo) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spinning />} tip="正在进入工作台..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} trigger={null} theme="dark">
        <div
          style={{
            height: 48,
            margin: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 16,
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {collapsed ? '建行' : '建行本地生活'}
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
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <span style={{ fontSize: 18, fontWeight: 600, marginLeft: 12 }}>
              建行本地生活服务中台
            </span>
            <Tag color={roleColor} style={{ marginLeft: 12 }}>
              {roleLabel}工作台
            </Tag>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {role === 'user' && (
              <Tag icon={<WalletOutlined />} color="blue">
                ¥{Number(userInfo?.walletBalance || 0).toFixed(2)}
              </Tag>
            )}
            {role === 'user' && (
              <Tag icon={<TagOutlined />} color="orange">
                优惠券
              </Tag>
            )}
            {role === 'admin' && (
              <Tag icon={<SafetyOutlined />} color="red">
                风控事件可复查
              </Tag>
            )}
            <Dropdown menu={dropdownItems} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar
                  icon={<UserOutlined />}
                  style={{
                    background: roleColor === 'blue' ? '#1677ff' : roleColor === 'green' ? '#52c41a' : '#faad14',
                  }}
                />
                <span>{userInfo?.realName || userInfo?.phone || '用户'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#f5f5f5', borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
