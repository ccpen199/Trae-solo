import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { DashboardOutlined, WarningOutlined, SafetyOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Sider, Content } = Layout;

const adminMenuItems: MenuProps['items'] = [
  { key: '/admin', icon: <DashboardOutlined />, label: '管理仪表盘' },
  { key: '/admin/fraud', icon: <WarningOutlined />, label: '欺诈溯源' },
  { key: '/admin/risk', icon: <SafetyOutlined />, label: '风控管理' },
];

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = location.pathname === '/admin' ? '/admin' : location.pathname;

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div
          style={{
            height: 32,
            margin: 16,
            color: '#fff',
            textAlign: 'center',
            fontSize: collapsed ? 14 : 16,
            fontWeight: 'bold',
            lineHeight: '32px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {collapsed ? '管理' : '管理后台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={adminMenuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Content style={{ margin: 16, padding: 24, background: '#f5f5f5', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
