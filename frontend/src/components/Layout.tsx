import React, { useEffect, useState } from 'react';
import { Layout as AntLayout, Menu, Dropdown, Avatar, Badge, message, Modal } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  ScheduleOutlined,
  SettingOutlined,
  BarChartOutlined,
  TeamOutlined,
  LogoutOutlined,
  UserOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuthStore, useSchedulingStore } from '@/store';
import { authApi, orderApi } from '@/api';

const { Header, Sider, Content } = AntLayout;
const { confirm } = Modal;

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { lockedOrders, clearBatch, setBatch, batchId } = useSchedulingStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const checkLockedOrders = async () => {
      try {
        const res = await orderApi.getMyLocked();
        if (res.data.lockedOrders && res.data.lockedOrders.length > 0) {
          const orders = res.data.lockedOrders;
          const firstOrder = orders[0];
          const existingBatchId = firstOrder.batch_id || firstOrder.batchId;
          
          if (!batchId) {
            const now = Date.now();
            const expiresAt = new Date(firstOrder.expires_at || firstOrder.expiresAt).getTime();
            const remainingMinutes = Math.max(1, Math.ceil((expiresAt - now) / 60000));
            
            setBatch(existingBatchId, orders, remainingMinutes);
            message.info(`已恢复 ${orders.length} 个正在处理的订单`);
          }
        }
      } catch {}
    };
    checkLockedOrders();
  }, [batchId, setBatch]);

  const handleLogout = () => {
    if (lockedOrders.length > 0) {
      confirm({
        title: '确认退出？',
        icon: <ExclamationCircleOutlined />,
        content: `您当前有 ${lockedOrders.length} 个未处理的订单，退出后这些订单将被释放回调度队列。`,
        okText: '确认退出',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          try {
            await authApi.logout();
          } catch {}
          clearAuth();
          clearBatch();
          navigate('/login');
          message.success('已退出登录，个人队列已释放');
        }
      });
    } else {
      clearAuth();
      clearBatch();
      navigate('/login');
    }
  };

  const userMenu = {
    items: [
      {
        key: 'user',
        icon: <UserOutlined />,
        label: (
          <div>
            <div>{user?.name}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {user?.branchName} | {user?.positionName}
            </div>
          </div>
        ),
        disabled: true
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout
      }
    ]
  };

  const menuItems = [
    {
      key: '/scheduling',
      icon: (
        <Badge count={lockedOrders.length} size="small">
          <ScheduleOutlined />
        </Badge>
      ),
      label: '订单调度'
    },
    {
      key: '/configs',
      icon: <SettingOutlined />,
      label: '调度配置',
      disabled: !user?.permissions?.includes('admin')
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '调度报表'
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: '用户管理',
      disabled: !user?.permissions?.includes('admin')
    }
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 12 : 16,
          fontWeight: 'bold',
          background: 'rgba(255,255,255,0.1)'
        }}>
          {collapsed ? '调度' : '大件订单调度系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Dropdown menu={userMenu}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
