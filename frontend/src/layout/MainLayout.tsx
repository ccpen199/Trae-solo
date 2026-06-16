import { Layout, Menu, Badge, Avatar, Dropdown, Button, App } from 'antd';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  DashboardOutlined, SendOutlined, TruckOutlined, LineChartOutlined,
  UserOutlined, ShoppingCartOutlined, BellOutlined, LogoutOutlined,
  BulbOutlined, ShopOutlined, SafetyCertificateOutlined, ApiOutlined,
  ExclamationCircleOutlined, MessageOutlined, GlobalOutlined
} from '@ant-design/icons';
import Dashboard from '../pages/Dashboard';
import Orders from '../pages/Orders';
import OrderDetail from '../pages/OrderDetail';
import Brands from '../pages/Brands';
import Couriers from '../pages/Couriers';
import CourierWorkbench from '../pages/CourierWorkbench';
import PriceCompare from '../pages/PriceCompare';
import Complaints from '../pages/Complaints';
import Branches from '../pages/Branches';
import ApiCenter from '../pages/ApiCenter';
import MyPackages from '../pages/MyPackages';
import CreateOrder from '../pages/CreateOrder';
import { api } from '../api';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '数据仪表盘', roles: ['admin'] },
  { key: '/create', icon: <SendOutlined />, label: '智能发件', roles: ['admin', 'user', 'courier'] },
  { key: '/price', icon: <BulbOutlined />, label: '比价决策', roles: ['admin', 'user', 'courier'] },
  { key: '/packages', icon: <ShoppingCartOutlined />, label: '我的包裹', roles: ['admin', 'user'] },
  { key: '/orders', icon: <MessageOutlined />, label: '运单管理', roles: ['admin', 'courier'] },
  { key: '/courier-workbench', icon: <TruckOutlined />, label: '快递员工作台', roles: ['admin', 'courier'] },
  { key: '/brands', icon: <ShopOutlined />, label: '品牌资源池', roles: ['admin'] },
  { key: '/couriers', icon: <UserOutlined />, label: '快递员管理', roles: ['admin'] },
  { key: '/branches', icon: <GlobalOutlined />, label: '网点拓扑', roles: ['admin'] },
  { key: '/complaints', icon: <ExclamationCircleOutlined />, label: '投诉与SLA', roles: ['admin', 'user', 'courier'] },
  { key: '/api-center', icon: <ApiOutlined />, label: 'API开放中心', roles: ['admin'] },
  { key: '/quality', icon: <LineChartOutlined />, label: '服务质量', roles: ['admin'] },
];

export default function MainLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const { modal, message } = App.useApp();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [unread, setUnread] = useState(0);

  const items = menuItems.filter(m => m.roles.includes(user.role));
  const selectedKey = items.find(i => loc.pathname === i.key || (i.key !== '/' && loc.pathname.startsWith(i.key)))?.key || '/';

  useEffect(() => {
    api.notifications.unread().then((r: any) => setUnread(r.unread_count || 0)).catch(() => {});
  }, []);

  const onLogout = () => {
    modal.confirm({
      title: '确认退出登录？', icon: <LogoutOutlined />,
      onOk: () => { localStorage.clear(); nav('/login'); }
    });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={236} theme="dark">
        <div className="logo">🚚 快递开放平台</div>
        <Menu
          theme="dark" mode="inline" selectedKeys={[selectedKey]}
          items={items.map(i => ({ key: i.key, icon: i.icon, label: <Link to={i.key}>{i.label}</Link> }))}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {items.find(i => i.key === selectedKey)?.label || '首页'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={unread} size="small">
              <Button type="text" icon={<BellOutlined style={{ color: '#fff' }} />} onClick={() => message.info('消息中心入口')} />
            </Badge>
            <Dropdown menu={{
              items: [
                { key: 'a', icon: <UserOutlined />, label: `${user.name || user.username} (${user.role})`, disabled: true },
                { type: 'divider' as any },
                { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: onLogout }
              ]
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size="small" style={{ background: '#1677ff' }} icon={<UserOutlined />} />
                <span style={{ color: '#fff' }}>{user.name || user.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 16, padding: 0 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateOrder />} />
            <Route path="/price" element={<PriceCompare />} />
            <Route path="/packages" element={<MyPackages />} />
            <Route path="/packages/:id" element={<OrderDetail />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/courier-workbench" element={<CourierWorkbench />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/couriers" element={<Couriers />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/api-center" element={<ApiCenter />} />
            <Route path="/quality" element={<Dashboard />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
