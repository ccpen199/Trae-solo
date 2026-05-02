import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu, theme, Badge } from 'antd';
import {
  DashboardOutlined,
  ControlOutlined,
  ThunderboltOutlined,
  AuditOutlined,
  HistoryOutlined,
  LockOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import RuleManager from './pages/RuleManager';
import RuleEditor from './pages/RuleEditor';
import DecisionTester from './pages/DecisionTester';
import ReviewPool from './pages/ReviewPool';
import BacktestPage from './pages/BacktestPage';
import ActionManage from './pages/ActionManage';
import AuditPage from './pages/AuditPage';

const { Header, Sider, Content } = Layout;

function App() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">仪表盘</Link>,
    },
    {
      key: '/rules',
      icon: <ControlOutlined />,
      label: <Link to="/rules">规则管理</Link>,
    },
    {
      key: '/decision',
      icon: <ThunderboltOutlined />,
      label: <Link to="/decision">决策测试</Link>,
    },
    {
      key: '/reviews',
      icon: <AuditOutlined />,
      label: (
        <Link to="/reviews">
          人工审核
          <Badge count={5} style={{ marginLeft: 8 }} />
        </Link>
      ),
    },
    {
      key: '/backtest',
      icon: <HistoryOutlined />,
      label: <Link to="/backtest">回测分析</Link>,
    },
    {
      key: '/actions',
      icon: <LockOutlined />,
      label: <Link to="/actions">处置管理</Link>,
    },
    {
      key: '/audit',
      icon: <FileSearchOutlined />,
      label: <Link to="/audit">审计日志</Link>,
    },
  ];

  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          width={220}
          style={{
            background: colorBgContainer,
            borderRight: '1px solid #f0f0f0',
          }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <ControlOutlined
              style={{ fontSize: 24, color: '#1890ff', marginRight: 8 }}
            />
            <span
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#001529',
              }}
            >
              风控规则引擎
            </span>
          </div>
          <Menu
            mode="inline"
            defaultSelectedKeys={['/']}
            items={menuItems}
            style={{ borderRight: 0 }}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              padding: '0 24px',
              background: colorBgContainer,
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 500 }}>
              企业风控中台管理系统
            </span>
            <span style={{ color: '#666' }}>
              前端: 11090 | 后端: 11089
            </span>
          </Header>
          <Content
            style={{
              margin: 24,
              padding: 24,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/rules" element={<RuleManager />} />
              <Route path="/rules/:id" element={<RuleEditor />} />
              <Route path="/decision" element={<DecisionTester />} />
              <Route path="/reviews" element={<ReviewPool />} />
              <Route path="/backtest" element={<BacktestPage />} />
              <Route path="/actions" element={<ActionManage />} />
              <Route path="/audit" element={<AuditPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
