import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, theme, Button, notification } from 'antd';
import {
  DashboardOutlined,
  LineChartOutlined,
  FileTextOutlined,
  SettingOutlined,
  BellOutlined,
  WifiOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import Dashboard from './pages/Dashboard';
import Traceability from './pages/Traceability';
import AuditLogs from './pages/AuditLogs';
import { webSocketService } from './services/websocket';
import { useFarmStore } from './store/farmStore';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    isWebSocketConnected,
    setWebSocketConnected,
    setCurrentUser,
    selectedZone,
    addNotification,
  } = useFarmStore();

  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    setCurrentUser({
      id: 'user-1',
      name: '农场主',
      role: 'admin',
    });

    webSocketService.connect('user-1', '农场主');
    webSocketService.subscribe(['zone-a', 'zone-b', '*']);

    const unsubscribeSensorReading = webSocketService.on('sensor_reading', (data) => {
      addNotification('info', `收到传感器数据: ${data.sensorReading?.sensorId || '未知'}`);
    });

    const unsubscribeAlarmCreated = webSocketService.on('alarm_created', (data) => {
      const alarm = data.alarm;
      const severity = alarm?.severity || 'warning';
      const notificationType =
        severity === 'critical' ? 'error' : severity === 'warning' ? 'warning' : 'info';
      api[notificationType]({
        message: '新告警',
        description: alarm?.title || '未知告警',
        duration: 10,
      });
    });

    return () => {
      unsubscribeSensorReading();
      unsubscribeAlarmCreated();
      webSocketService.disconnect();
    };
  }, []);

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '监控看板',
    },
    {
      key: '/traceability',
      icon: <LineChartOutlined />,
      label: '数据溯源',
    },
    {
      key: '/audit-logs',
      icon: <FileTextOutlined />,
      label: '审计日志',
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    window.location.hash = key;
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#52c41a',
          borderRadius: 6,
        },
      }}
    >
      {contextHolder}
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
            theme="dark"
            style={{
              background: 'linear-gradient(180deg, #001529 0%, #002140 100%)',
            }}
          >
            <div
              style={{
                height: 64,
                margin: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: collapsed ? 14 : 18,
                fontWeight: 'bold',
              }}
            >
              {collapsed ? '🌾' : '🌾 智慧农场'}
            </div>
            <Menu
              theme="dark"
              mode="inline"
              defaultSelectedKeys={['/dashboard']}
              items={menuItems}
              onClick={handleMenuClick}
              style={{ borderRight: 0 }}
            />
          </Sider>
          <Layout>
            <Header
              style={{
                padding: '0 24px',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 18, fontWeight: 500 }}>智慧农场监测平台</span>
                <span
                  style={{
                    padding: '2px 8px',
                    background: '#e6f7ff',
                    borderRadius: 4,
                    fontSize: 12,
                    color: '#1890ff',
                  }}
                >
                  当前区域: {selectedZone}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Button
                  type="text"
                  icon={isWebSocketConnected ? <WifiOutlined /> : <CloseCircleOutlined />}
                  style={{
                    color: isWebSocketConnected ? '#52c41a' : '#ff4d4f',
                  }}
                >
                  {isWebSocketConnected ? '在线' : '离线'}
                </Button>
                <Button type="text" icon={<BellOutlined />}>
                  告警
                </Button>
                <Button type="text" icon={<SettingOutlined />}>
                  设置
                </Button>
              </div>
            </Header>
            <Content
              style={{
                margin: 24,
                padding: 24,
                background: '#fff',
                borderRadius: 8,
                minHeight: 280,
              }}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/traceability" element={<Traceability />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;
