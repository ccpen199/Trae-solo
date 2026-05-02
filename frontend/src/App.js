import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, ConfigProvider } from 'antd';
import { UserOutlined, LaptopOutlined, ToolOutlined, BuildOutlined, BarChartOutlined, LogoutOutlined, HistoryOutlined } from '@ant-design/icons';
import axios from 'axios';

// 导入页面组件
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EquipmentManagement from './pages/EquipmentManagement';
import MaintenancePlan from './pages/MaintenancePlan';
import RepairOrder from './pages/RepairOrder';
import SparePartManagement from './pages/SparePartManagement';
import Statistics from './pages/Statistics';
import HistoryQuery from './pages/HistoryQuery';

const { Header, Content, Sider } = Layout;

function App() {
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  // 检查用户登录状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:3001/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        setUser(response.data.user);
      })
      .catch(error => {
        localStorage.removeItem('token');
        setUser(null);
      });
    }
  }, []);

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // 根据用户角色生成菜单
  const getMenuItems = () => {
    const menuItems = [
      {
        key: 'dashboard',
        icon: <UserOutlined />,
        label: '仪表盘',
        path: '/dashboard'
      }
    ];

    // 设备管理员菜单
    if (user?.role === 'admin') {
      menuItems.push(
        {
          key: 'equipment',
          icon: <LaptopOutlined />,
          label: '设备管理',
          path: '/equipment'
        },
        {
          key: 'maintenance',
          icon: <ToolOutlined />,
          label: '保养计划',
          path: '/maintenance'
        },
        {
          key: 'repair',
          icon: <BuildOutlined />,
          label: '维修管理',
          path: '/repair'
        },
        {
          key: 'sparePart',
          icon: <ToolOutlined />,
          label: '备件管理',
          path: '/sparePart'
        },
        {
          key: 'statistics',
          icon: <BarChartOutlined />,
          label: '统计分析',
          path: '/statistics'
        },
        {
          key: 'history',
          icon: <HistoryOutlined />,
          label: '履历查询',
          path: '/history'
        }
      );
    }

    // 维修工菜单
    if (user?.role === 'technician') {
      menuItems.push(
        {
          key: 'maintenance',
          icon: <ToolOutlined />,
          label: '保养计划',
          path: '/maintenance'
        },
        {
          key: 'repair',
          icon: <BuildOutlined />,
          label: '维修管理',
          path: '/repair'
        }
      );
    }

    // 使用人菜单
    if (user?.role === 'user') {
      menuItems.push(
        {
          key: 'repair',
          icon: <BuildOutlined />,
          label: '维修管理',
          path: '/repair'
        }
      );
    }

    // 备件管理员菜单
    if (user?.role === 'sparePartManager') {
      menuItems.push(
        {
          key: 'sparePart',
          icon: <ToolOutlined />,
          label: '备件管理',
          path: '/sparePart'
        }
      );
    }

    return menuItems;
  };

  return (
    <ConfigProvider>
      <Router>
        <Routes>
          {/* 登录页面 */}
          <Route path="/login" element={<Login setUser={setUser} />} />

          {/* 主应用页面 */}
          <Route path="/" element={user ? <MainLayout user={user} collapsed={collapsed} setCollapsed={setCollapsed} handleLogout={handleLogout} menuItems={getMenuItems()} /> : <Navigate to="/login" />}>
            <Route path="dashboard" element={<Dashboard user={user} />} />
            <Route path="equipment" element={<EquipmentManagement />} />
            <Route path="maintenance" element={<MaintenancePlan />} />
            <Route path="repair" element={<RepairOrder />} />
            <Route path="sparePart" element={<SparePartManagement />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="history" element={<HistoryQuery />} />
            <Route index element={<Navigate to="dashboard" />} />
          </Route>

          {/* 重定向其他路径到登录页 */}
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

// 主布局组件
function MainLayout({ user, collapsed, setCollapsed, handleLogout, menuItems, children }) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          设备维护系统
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['dashboard']}>
          {menuItems.map(item => (
            <Menu.Item key={item.key} icon={item.icon}>
              <a href={`#${item.path}`}>{item.label}</a>
            </Menu.Item>
          ))}
          <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
            登出
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: 0, background: '#fff' }}>
          <div style={{ marginRight: 24 }}>
            欢迎，{user?.name} ({user?.role === 'admin' ? '设备管理员' : user?.role === 'technician' ? '维修工' : user?.role === 'user' ? '使用人' : '备件管理员'})
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;