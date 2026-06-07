import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Button, Dropdown, Avatar } from 'antd';
import {
  HomeOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  SolutionOutlined,
  UserOutlined,
  SettingOutlined,
  DashboardOutlined,
  BellOutlined,
  SoundOutlined,
  MoreOutlined,
} from '@ant-design/icons';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState('/');
  const [currentGrid, setCurrentGrid] = useState('济南中心社区');

  useEffect(() => {
    setSelectedKey(location.pathname);
  }, [location.pathname]);

  const menuItems = [
    { key: '/', label: '首页', icon: <HomeOutlined /> },
    { key: '/map', label: '服务地图', icon: <EnvironmentOutlined /> },
    { key: '/services', label: '服务商', icon: <ShopOutlined /> },
    { key: '/demands', label: '互助需求', icon: <SolutionOutlined /> },
    {
      key: 'more',
      label: '更多',
      icon: <MoreOutlined />,
      children: [
        { key: '/announcements', label: '社区公告', icon: <BellOutlined /> },
        { key: '/dialect-search', label: '方言搜索', icon: <SoundOutlined /> },
      ],
    },
  ];

  const userMenuItems = [
    {
      key: 'admin',
      label: '运营后台',
      icon: <DashboardOutlined />,
      onClick: () => navigate('/admin/dashboard'),
    },
    {
      key: 'settings',
      label: '个人设置',
      icon: <SettingOutlined />,
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <EnvironmentOutlined className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Noto Serif SC, serif' }}>
              县域生活
            </h1>
            <div className="flex items-center text-xs text-gray-500">
              <span className="animate-pulse-slow w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              {currentGrid}
            </div>
          </div>
        </div>

        <nav className="hidden md:block">
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            className="border-none bg-transparent"
          />
        </nav>

        <div className="flex items-center space-x-3">
          <Button type="primary" size="small" onClick={() => navigate('/demands/publish')}>
            发布需求
          </Button>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar
              icon={<UserOutlined />}
              className="cursor-pointer bg-gradient-to-br from-blue-500 to-blue-700"
            />
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
