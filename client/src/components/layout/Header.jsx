import React, { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Input, Space, Badge, message } from 'antd';
import { 
  HomeOutlined, 
  ShopOutlined, 
  FileTextOutlined, 
  DownloadOutlined,
  MessageOutlined,
  TeamOutlined,
  LinkOutlined,
  PhoneOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header: AntHeader } = Layout;

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchKeyword, setSearchKeyword] = useState('');

  const menuItems = [
    { key: '/', label: '首页', icon: <HomeOutlined /> },
    { key: '/products', label: '产品展示', icon: <ShopOutlined /> },
    { key: '/news', label: '新闻中心', icon: <FileTextOutlined /> },
    { key: '/downloads', label: '下载中心', icon: <DownloadOutlined /> },
    { key: '/jobs', label: '人力资源', icon: <TeamOutlined /> },
    { key: '/links', label: '合作链接', icon: <LinkOutlined /> },
    { key: '/contact', label: '联系方式', icon: <PhoneOutlined /> },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchKeyword)}`);
    } else {
      message.info('请输入搜索关键词');
    }
  };

  const handleLogout = async () => {
    await logout();
    message.success('退出登录成功');
    navigate('/');
  };

  const userMenuItems = [
    ...(isAdmin() ? [{
      key: '/admin',
      label: '后台管理',
      icon: <SettingOutlined />,
      onClick: () => navigate('/admin')
    }] : []),
    {
      key: 'profile',
      label: '个人中心',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout
    }
  ];

  const getSelectedKey = () => {
    if (location.pathname === '/') return '/';
    for (const item of menuItems) {
      if (location.pathname.startsWith(item.key) && item.key !== '/') {
        return item.key;
      }
    }
    return location.pathname;
  };

  return (
    <AntHeader 
      style={{ 
        padding: '0 50px', 
        background: '#fff', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          color: '#1890ff',
          marginRight: '30px'
        }}>
          企业网站
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: 'none', minWidth: '600px' }}
        />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Input.Search
          placeholder="搜索产品..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onSearch={handleSearch}
          style={{ width: 200 }}
        />
        
        {user ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user.nickname || user.username}</span>
            </Space>
          </Dropdown>
        ) : (
          <Space>
            <Button type="text" icon={<LoginOutlined />} onClick={() => navigate('/login')}>
              登录
            </Button>
            <Button type="primary" onClick={() => navigate('/register')}>
              注册
            </Button>
          </Space>
        )}
      </div>
    </AntHeader>
  );
};

export default Header;