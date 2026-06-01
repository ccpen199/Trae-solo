import React from 'react';
import { Layout as AntLayout, Menu, Dropdown, Button, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';

const { Header, Content, Sider } = AntLayout;

const roleLabels = {
  customer: '用户',
  service_agent: '客服',
  dispatcher: '调度',
  engineer: '工程师',
  finance: '财务',
};

export default function Layout({ user, menuItems, currentPage, onNavigate, onLogout, children }) {
  const items = menuItems.map(item => ({
    key: item.key,
    label: item.label,
  }));

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#001529', padding: '0 24px' }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
          上门服务派单系统
        </div>
        <Dropdown
          menu={{
            items: [
              { key: 'info', label: `${user.name} (${roleLabels[user.role]})`, disabled: true },
              { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: onLogout },
            ],
          }}
        >
          <Button type="text" style={{ color: '#fff' }}>
            <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
            {user.name}
          </Button>
        </Dropdown>
      </Header>
      <AntLayout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[currentPage]}
            items={items}
            onClick={({ key }) => onNavigate(key)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <AntLayout style={{ padding: '16px' }}>
          <Content style={{ background: '#fff', padding: 24, borderRadius: 8, minHeight: 360 }}>
            {children}
          </Content>
        </AntLayout>
      </AntLayout>
    </AntLayout>
  );
}
