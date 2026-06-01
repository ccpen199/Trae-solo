import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Select, Card } from 'antd';
import {
  DashboardOutlined,
  ScheduleOutlined,
  UserOutlined,
  InboxOutlined,
  FileTextOutlined,
  WarningOutlined
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Scheduling from './pages/Scheduling';
import Employees from './pages/Employees';
import Inventory from './pages/Inventory';
import PrepPlan from './pages/PrepPlan';
import LossAnalysis from './pages/LossAnalysis';
import api from './utils/api';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

function App() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(1);
  const location = useLocation();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    const res = await api.get('/stores');
    if (res.success) {
      setStores(res.data);
      if (res.data.length > 0) {
        setSelectedStore(res.data[0].id);
      }
    }
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: <Link to="/">仪表盘</Link> },
    { key: '/scheduling', icon: <ScheduleOutlined />, label: <Link to="/scheduling">排班管理</Link> },
    { key: '/employees', icon: <UserOutlined />, label: <Link to="/employees">员工管理</Link> },
    { key: '/inventory', icon: <InboxOutlined />, label: <Link to="/inventory">原料库存</Link> },
    { key: '/prep', icon: <FileTextOutlined />, label: <Link to="/prep">备料计划</Link> },
    { key: '/loss', icon: <WarningOutlined />, label: <Link to="/loss">损耗分析</Link> }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#ffffff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: 0, color: '#000000' }}>🍵 茶饮门店排班与损耗管理系统</h2>
        <Select
          style={{ width: 200 }}
          value={selectedStore}
          onChange={setSelectedStore}
          placeholder="选择门店"
        >
          {stores.map(store => (
            <Option key={store.id} value={store.id}>{store.name}</Option>
          ))}
        </Select>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#ffffff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content>
            <Card style={{ background: '#ffffff' }}>
              <Routes>
                <Route path="/" element={<Dashboard storeId={selectedStore} />} />
                <Route path="/scheduling" element={<Scheduling storeId={selectedStore} />} />
                <Route path="/employees" element={<Employees storeId={selectedStore} />} />
                <Route path="/inventory" element={<Inventory storeId={selectedStore} />} />
                <Route path="/prep" element={<PrepPlan storeId={selectedStore} />} />
                <Route path="/loss" element={<LossAnalysis storeId={selectedStore} />} />
              </Routes>
            </Card>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
