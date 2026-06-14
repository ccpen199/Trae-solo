import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  HomeOutlined,
  AppstoreOutlined,
  FormOutlined,
  UserOutlined,
  LoginOutlined,
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;

const HallLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/hall', icon: <HomeOutlined />, label: '办事大厅' },
    { key: '/hall/scene', icon: <AppstoreOutlined />, label: '场景服务' },
    { key: '/hall/feedback', icon: <FormOutlined />, label: '市民反馈' },
    { key: '/hall/my', icon: <UserOutlined />, label: '我的办件' },
  ];

  const selectedKey = location.pathname === '/hall' ? '/hall' : location.pathname;

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm flex items-center justify-between px-8" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/hall')}>
          <div className="w-8 h-8 bg-blue-800 rounded flex items-center justify-center">
            <HomeOutlined className="text-white" />
          </div>
          <span className="text-lg font-bold text-blue-900">常州市公共服务聚合平台</span>
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="border-none flex-1 justify-center"
        />
        <div className="flex items-center gap-3">
          <a onClick={() => navigate('/login')} className="text-blue-800 hover:text-blue-600 cursor-pointer flex items-center gap-1">
            <LoginOutlined /> 登录工作台
          </a>
        </div>
      </Header>
      <Content className="bg-gray-50">
        <Outlet />
      </Content>
      <Footer className="text-center text-gray-400 bg-gray-50 text-sm py-4">
        常州市公共服务聚合平台 · 城市服务中枢 · 一网通办 © 2026
      </Footer>
    </Layout>
  );
};

export default HallLayout;
