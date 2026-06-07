import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  EnvironmentOutlined,
  BuildOutlined,
  VideoCameraOutlined,
  CommentOutlined,
  SafetyCertificateOutlined,
  CalculatorOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import Home from './pages/Home';
import MapSearch from './pages/MapSearch';
import ListingDetail from './pages/ListingDetail';
import ListingManager from './pages/ListingManager';
import VRViewer from './pages/VRViewer';
import Reviews from './pages/Reviews';
import PolicyCheck from './pages/PolicyCheck';
import TaxCalc from './pages/TaxCalc';
import AgentSpace from './pages/AgentSpace';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

const { Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/map', icon: <EnvironmentOutlined />, label: '地图找房' },
  { key: '/listings', icon: <BuildOutlined />, label: '房源管理' },
  { key: '/vr', icon: <VideoCameraOutlined />, label: 'VR看房' },
  { key: '/reviews', icon: <CommentOutlined />, label: '小区口碑' },
  { key: '/policy', icon: <SafetyCertificateOutlined />, label: '政策合规' },
  { key: '/tax', icon: <CalculatorOutlined />, label: '税费计算' },
  { key: '/agent', icon: <TeamOutlined />, label: '经纪人协作' },
  { key: '/profile', icon: <TeamOutlined />, label: '个人中心' },
  { key: '/admin', icon: <SettingOutlined />, label: '后台管理' },
];

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const selectedKey = '/' + location.pathname.split('/')[1];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{ background: '#001529' }}
      >
        <div
          style={{
            height: 48,
            margin: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 16,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {collapsed ? '房' : '房产交易中台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Content style={{ padding: 24, background: '#f0f2f5', minHeight: 'calc(100vh - 0px)' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<MapSearch />} />
            <Route path="/listings" element={<ListingManager />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/vr" element={<VRViewer />} />
            <Route path="/vr/:listingId" element={<VRViewer />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/policy" element={<PolicyCheck />} />
            <Route path="/tax" element={<TaxCalc />} />
            <Route path="/agent" element={<AgentSpace />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
