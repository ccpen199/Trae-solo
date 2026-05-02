import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authApi } from '../api';
import { wsService } from '../websocket';

const Layout = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('登出错误:', err);
    }
    logout();
    wsService.disconnect();
    navigate('/login');
  };

  const getMenuItems = () => {
    const items = [];

    if (user?.role === 'investor') {
      items.push(
        { key: '/', label: '行情中心', icon: '📈' },
        { key: '/trade', label: '委托下单', icon: '📝' },
        { key: '/positions', label: '持仓查询', icon: '💼' },
        { key: '/orders', label: '订单查询', icon: '📋' },
        { key: '/funds', label: '资金账户', icon: '💰' },
        { key: '/reports', label: '结算报表', icon: '📊' }
      );
    } else if (user?.role === 'risk_officer') {
      items.push(
        { key: '/', label: '风控概览', icon: '🛡️' },
        { key: '/risk/logs', label: '风控日志', icon: '📝' },
        { key: '/risk/interceptions', label: '拦截记录', icon: '🚫' },
        { key: '/orders', label: '订单监控', icon: '📋' }
      );
    } else if (user?.role === 'exchange_admin') {
      items.push(
        { key: '/', label: '系统概览', icon: '🖥️' },
        { key: '/market', label: '行情监控', icon: '📈' },
        { key: '/orders', label: '订单管理', icon: '📋' },
        { key: '/users', label: '用户管理', icon: '👥' },
        { key: '/audit', label: '审计日志', icon: '📜' }
      );
    } else if (user?.role === 'financial_settler') {
      items.push(
        { key: '/', label: '结算概览', icon: '💰' },
        { key: '/settlement/reports', label: '结算报表', icon: '📊' },
        { key: '/funds/all', label: '资金监控', icon: '💳' },
        { key: '/positions/all', label: '持仓监控', icon: '💼' }
      );
    }

    return items;
  };

  const getRoleName = (role) => {
    const roleNames = {
      investor: '投资者',
      risk_officer: '风控官',
      exchange_admin: '交易所管理员',
      financial_settler: '财务结算员'
    };
    return roleNames[role] || role;
  };

  const menuItems = getMenuItems();
  const currentPath = window.location.pathname;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }}>
      <div style={{ 
        width: '240px', 
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>证券交易系统</h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
            {getRoleName(user?.role)}工作台
          </p>
        </div>

        <nav style={{ flex: 1, padding: '16px 0' }}>
          {menuItems.map((item) => (
            <div
              key={item.key}
              onClick={() => navigate(item.key)}
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                background: currentPath === item.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: currentPath === item.key ? 'white' : 'rgba(255,255,255,0.7)',
                borderLeft: currentPath === item.key ? '3px solid #3b82f6' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentPath !== item.key) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPath !== item.key) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{user?.name}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                {user?.username}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px',
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            退出登录
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ 
          background: 'white', 
          padding: '16px 24px', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              {menuItems.find(m => m.key === currentPath)?.label || '首页'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
            <span>交易状态: <span style={{ color: '#10b981', fontWeight: '500' }}>正常交易</span></span>
            <span>当前时间: {new Date().toLocaleString('zh-CN')}</span>
          </div>
        </header>

        <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
