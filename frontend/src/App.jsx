import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Select, Avatar, Dropdown, message } from 'antd';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  CloudOutlined,
  SettingOutlined,
  BarChartOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard.jsx';
import Competitors from './pages/Competitors.jsx';
import CompetitorDetail from './pages/CompetitorDetail.jsx';
import CrawlTasks from './pages/CrawlTasks.jsx';
import TaskDetail from './pages/TaskDetail.jsx';
import PriceMonitor from './pages/PriceMonitor.jsx';
import ConfigPage from './pages/ConfigPage.jsx';
import Reports from './pages/Reports.jsx';
import Logs from './pages/Logs.jsx';
import { users } from './api.js';

const { Header, Sider, Content } = Layout;

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    } else {
      loadDefaultUser();
    }
  }, []);

  const loadDefaultUser = async () => {
    try {
      const userList = await users.getAll();
      if (userList && userList.length > 0) {
        const defaultUser = userList[0];
        localStorage.setItem('currentUser', JSON.stringify(defaultUser));
        setCurrentUser(defaultUser);
      }
    } catch (error) {
      console.error('加载用户失败:', error);
    }
  };

  const handleUserChange = async () => {
    try {
      const userList = await users.getAll();
      return userList || [];
    } catch (error) {
      return [];
    }
  };

  const selectUser = (username) => {
    handleUserChange().then((userList) => {
      const user = userList.find(u => u.username === username);
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
        message.success(`已切换到用户: ${user.display_name}`);
      }
    });
  };

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
    { key: '/competitors', icon: <UnorderedListOutlined />, label: '竞品清单' },
    { key: '/tasks', icon: <CloudOutlined />, label: '抓取任务' },
    { key: '/prices', icon: <BarChartOutlined />, label: '价格监控' },
    { key: '/reports', icon: <FileTextOutlined />, label: '分析报告' },
    { key: '/config', icon: <SettingOutlined />, label: '系统配置' },
    { key: '/logs', icon: <FileTextOutlined />, label: '操作日志' }
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        message.info('已退出登录');
      }
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 'bold',
          background: 'rgba(255,255,255,0.1)'
        }}>
          {collapsed ? 'AI' : 'AI 竞品分析'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => {
            navigate(key);
          }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: 'white',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{ margin: 0, color: '#1890ff' }}>AI 竞品分析 Agent</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {currentUser && (
              <>
                <Select
                  style={{ width: 150 }}
                  value={currentUser.username}
                  onChange={selectUser}
                  onOpenChange={() => handleUserChange()}
                >
                  {['admin', 'operator', 'auditor', 'user'].map(role => (
                    <Select.Option key={role} value={role}>
                      {role === 'admin' ? '业务负责人' :
                       role === 'operator' ? '模型运营' :
                       role === 'auditor' ? '审核人员' : '一线使用者'}
                    </Select.Option>
                  ))}
                </Select>
                <Dropdown menu={{ items: userMenuItems }}>
                  <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar icon={<UserOutlined />} />
                    <span>{currentUser.display_name}</span>
                  </div>
                </Dropdown>
              </>
            )}
          </div>
        </Header>
        <Content style={{ margin: '24px', padding: 24, background: 'white', borderRadius: 8 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard currentUser={currentUser} />} />
            <Route path="/competitors" element={<Competitors currentUser={currentUser} />} />
            <Route path="/competitors/:id" element={<CompetitorDetail currentUser={currentUser} />} />
            <Route path="/tasks" element={<CrawlTasks currentUser={currentUser} />} />
            <Route path="/tasks/:id" element={<TaskDetail currentUser={currentUser} />} />
            <Route path="/prices" element={<PriceMonitor currentUser={currentUser} />} />
            <Route path="/reports" element={<Reports currentUser={currentUser} />} />
            <Route path="/config" element={<ConfigPage currentUser={currentUser} />} />
            <Route path="/logs" element={<Logs currentUser={currentUser} />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
