import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  FileSearchOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  FileTextOutlined,
  SettingOutlined,
  ExceptionOutlined
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import TaskDetail from './pages/TaskDetail';
import DataSources from './pages/DataSources';
import FieldCalibers from './pages/FieldCalibers';
import Reports from './pages/Reports';
import Configuration from './pages/Configuration';
import Exceptions from './pages/Exceptions';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">数据看板</Link> },
  { key: '/tasks', icon: <FileSearchOutlined />, label: <Link to="/tasks">查询任务</Link> },
  { key: '/data-sources', icon: <DatabaseOutlined />, label: <Link to="/data-sources">数据源</Link> },
  { key: '/field-calibers', icon: <BarChartOutlined />, label: <Link to="/field-calibers">字段口径</Link> },
  { key: '/reports', icon: <FileTextOutlined />, label: <Link to="/reports">解释报告</Link> },
  { key: '/exceptions', icon: <ExceptionOutlined />, label: <Link to="/exceptions">异常处理</Link> },
  { key: '/configuration', icon: <SettingOutlined />, label: <Link to="/configuration">配置管理</Link> }
];

function App() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255,255,255,0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
          {collapsed ? 'AI' : 'AI 异常解释'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div style={{ padding: '0 24px', fontSize: 18, fontWeight: 'bold' }}>
            AI 数据异常解释 Agent 系统
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG, minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/data-sources" element={<DataSources />} />
            <Route path="/field-calibers" element={<FieldCalibers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/exceptions" element={<Exceptions />} />
            <Route path="/configuration" element={<Configuration />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
