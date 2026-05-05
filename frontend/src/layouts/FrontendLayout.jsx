import React from 'react';
import { Layout, Menu, Input, Button, Dropdown, Space, message } from 'antd';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  HomeOutlined,
  ProductOutlined,
  FileTextOutlined,
  TeamOutlined,
  PhoneOutlined,
  SearchOutlined,
  DownOutlined,
  BriefcaseOutlined
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;

const navItems = [
  {
    key: '/',
    label: '首页',
    icon: <HomeOutlined />
  },
  {
    key: '/products',
    label: '产品中心',
    icon: <ProductOutlined />
  },
  {
    key: '/news',
    label: '新闻中心',
    icon: <FileTextOutlined />
  },
  {
    key: '/jobs',
    label: '人力资源',
    icon: <BriefcaseOutlined />
  },
  {
    key: '/company',
    label: '企业介绍',
    icon: <TeamOutlined />,
    children: [
      { key: '/company', label: '公司简介' },
      { key: '/company', label: '信誉认证' },
      { key: '/company', label: '组织结构' },
    ]
  },
  {
    key: '/contact',
    label: '联系我们',
    icon: <PhoneOutlined />
  },
];

function FrontendLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchKeyword, setSearchKeyword] = React.useState('');

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchKeyword)}`);
    } else {
      message.warning('请输入搜索关键词');
    }
  };

  const selectedKey = navItems.find(item => item.key === location.pathname)?.key || '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 1, 
        display: 'flex', 
        alignItems: 'center',
        background: '#fff',
        padding: '0 50px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          fontSize: 24, 
          fontWeight: 'bold', 
          color: '#1890ff',
          marginRight: 48
        }}>
          某某科技
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={navItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, minWidth: 0, borderBottom: 'none' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input
            placeholder="搜索产品..."
            prefix={<SearchOutlined />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
        </div>
      </Header>
      
      <Content style={{ background: '#f5f5f5' }}>
        <Outlet />
      </Content>

      <Footer style={{ textAlign: 'center', background: '#001529', color: '#fff' }}>
        <div style={{ marginBottom: 16 }}>
          <Space size="large">
            <Link to="/" style={{ color: '#fff' }}>首页</Link>
            <Link to="/products" style={{ color: '#fff' }}>产品中心</Link>
            <Link to="/news" style={{ color: '#fff' }}>新闻中心</Link>
            <Link to="/company" style={{ color: '#fff' }}>企业介绍</Link>
            <Link to="/contact" style={{ color: '#fff' }}>联系我们</Link>
          </Space>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)' }}>
          <p>某某科技有限公司 版权所有 | 地址：北京市海淀区中关村科技园</p>
          <p>电话：400-888-8888 | 邮箱：contact@example.com</p>
          <p>Copyright © 2024 All Rights Reserved</p>
        </div>
      </Footer>
    </Layout>
  );
}

export default FrontendLayout;
