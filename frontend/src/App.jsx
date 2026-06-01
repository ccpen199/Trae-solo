import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space, message } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  AlertOutlined,
  SearchOutlined,
  AuditOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';

import Dashboard from './pages/Dashboard.jsx';
import PolicyList from './pages/policies/PolicyList.jsx';
import PolicyDetail from './pages/policies/PolicyDetail.jsx';
import PolicyCreate from './pages/policies/PolicyCreate.jsx';
import ReportList from './pages/reports/ReportList.jsx';
import ReportDetail from './pages/reports/ReportDetail.jsx';
import ReportCreate from './pages/reports/ReportCreate.jsx';
import SurveyList from './pages/surveys/SurveyList.jsx';
import SurveyDetail from './pages/surveys/SurveyDetail.jsx';
import SurveyCreate from './pages/surveys/SurveyCreate.jsx';
import ClaimList from './pages/claims/ClaimList.jsx';
import ClaimDetail from './pages/claims/ClaimDetail.jsx';
import ClaimCreate from './pages/claims/ClaimCreate.jsx';
import Stats from './pages/Stats.jsx';
import Logs from './pages/Logs.jsx';
import { getHealth } from './utils/api.js';

const { Header, Sider, Content } = Layout;

const roleMap = {
  farmer: { name: '农户', color: 'green' },
  insurer: { name: '保险公司', color: 'blue' },
  surveyor: { name: '查勘员', color: 'orange' },
  township: { name: '乡镇', color: 'purple' },
  regulator: { name: '监管方', color: 'red' }
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState({ id: 1, username: 'admin', name: '系统管理员', role: 'regulator' });
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await getHealth();
        setHealth(res.data);
      } catch (e) {
        console.error('Health check failed:', e);
      }
    };
    checkHealth();
  }, []);

  const handleRoleChange = (role) => {
    const users = {
      regulator: { id: 1, username: 'admin', name: '系统管理员', role: 'regulator' },
      insurer: { id: 2, username: 'insurer1', name: '张保险', role: 'insurer' },
      surveyor: { id: 3, username: 'surveyor1', name: '李查勘', role: 'surveyor' },
      township: { id: 4, username: 'township1', name: '王乡镇', role: 'township' },
      farmer: { id: 5, username: 'farmer1', name: '赵农户', role: 'farmer' }
    };
    setCurrentUser(users[role]);
    message.success(`已切换到${roleMap[role].name}角色: ${users[role].name}`);
  };

  const userMenuItems = [
    { key: 'regulator', label: '监管方 - 系统管理员', onClick: () => handleRoleChange('regulator') },
    { key: 'insurer', label: '保险公司 - 张保险', onClick: () => handleRoleChange('insurer') },
    { key: 'surveyor', label: '查勘员 - 李查勘', onClick: () => handleRoleChange('surveyor') },
    { key: 'township', label: '乡镇 - 王乡镇', onClick: () => handleRoleChange('township') },
    { key: 'farmer', label: '农户 - 赵农户', onClick: () => handleRoleChange('farmer') }
  ];

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: <Link to="/">工作台</Link> },
    { key: '/policies', icon: <FileTextOutlined />, label: <Link to="/policies">保单管理</Link> },
    { key: '/reports', icon: <AlertOutlined />, label: <Link to="/reports">出险报案</Link> },
    { key: '/surveys', icon: <SearchOutlined />, label: <Link to="/surveys">查勘定损</Link> },
    { key: '/claims', icon: <AuditOutlined />, label: <Link to="/claims">理赔审核</Link> },
    { key: '/stats', icon: <BarChartOutlined />, label: <Link to="/stats">报表统计</Link> },
    { key: '/logs', icon: <SettingOutlined />, label: <Link to="/logs">操作日志</Link> }
  ];

  return (
    <Layout className="layout-container">
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} style={{ background: '#001529' }}>
        <div className="logo">
          {collapsed ? '农保' : '农作物保险理赔系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>农作物保险理赔系统</h2>
            {health && (
              <span style={{ color: '#52c41a', fontSize: 12 }}>
                ● 后端服务正常 (端口: {health.port})
              </span>
            )}
          </div>
          <Space>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text">
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <span>{currentUser.name}</span>
                  <span style={{ color: roleMap[currentUser.role].color }}>
                    ({roleMap[currentUser.role].name})
                  </span>
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '0 16px' }}>
          <div className="site-layout-content">
            <Routes>
              <Route path="/" element={<Dashboard currentUser={currentUser} />} />
              <Route path="/policies" element={<PolicyList currentUser={currentUser} />} />
              <Route path="/policies/:id" element={<PolicyDetail currentUser={currentUser} />} />
              <Route path="/policies/create" element={<PolicyCreate currentUser={currentUser} />} />
              <Route path="/reports" element={<ReportList currentUser={currentUser} />} />
              <Route path="/reports/:id" element={<ReportDetail currentUser={currentUser} />} />
              <Route path="/reports/create" element={<ReportCreate currentUser={currentUser} />} />
              <Route path="/surveys" element={<SurveyList currentUser={currentUser} />} />
              <Route path="/surveys/:id" element={<SurveyDetail currentUser={currentUser} />} />
              <Route path="/surveys/create" element={<SurveyCreate currentUser={currentUser} />} />
              <Route path="/claims" element={<ClaimList currentUser={currentUser} />} />
              <Route path="/claims/:id" element={<ClaimDetail currentUser={currentUser} />} />
              <Route path="/claims/create" element={<ClaimCreate currentUser={currentUser} />} />
              <Route path="/stats" element={<Stats currentUser={currentUser} />} />
              <Route path="/logs" element={<Logs currentUser={currentUser} />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
