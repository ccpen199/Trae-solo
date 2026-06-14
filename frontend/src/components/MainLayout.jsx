import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Dashboard from '../pages/Dashboard';
import TrademarkList from '../pages/trademarks/List';
import TrademarkSearch from '../pages/trademarks/Search';
import TrademarkAlerts from '../pages/trademarks/Alerts';
import TrademarkTransfers from '../pages/trademarks/Transfers';
import PatentList from '../pages/patents/List';
import PatentFees from '../pages/patents/Fees';
import CopyrightList from '../pages/copyrights/List';
import CopyrightEvidence from '../pages/copyrights/Evidence';
import CopyrightBulk from '../pages/copyrights/Bulk';
import ClientList from '../pages/manager/ClientList';
import CaseList from '../pages/manager/CaseList';
import CaseDetail from '../pages/manager/CaseDetail';
import ContractList from '../pages/manager/ContractList';
import Statistics from '../pages/manager/Statistics';
import NotificationList from '../pages/NotificationList';

const menuConfig = {
  inventor: [
    { key: 'dashboard', name: '工作台', icon: '📊', path: '/dashboard' },
    { key: 'trademarks', name: '商标管理', icon: '™️', path: '/trademarks', children: [
      { key: 'tm-list', name: '商标库', path: '/trademarks' },
      { key: 'tm-search', name: '商标检索', path: '/trademarks/search' },
      { key: 'tm-alerts', name: '风险预警', path: '/trademarks/alerts' },
      { key: 'tm-transfer', name: '转让交易', path: '/trademarks/transfers' }
    ]},
    { key: 'patents', name: '专利管理', icon: '💡', path: '/patents', children: [
      { key: 'pt-list', name: '专利库', path: '/patents' },
      { key: 'pt-fees', name: '年费提醒', path: '/patents/fees' }
    ]},
    { key: 'copyrights', name: '版权管理', icon: '©️', path: '/copyrights', children: [
      { key: 'cr-list', name: '版权库', path: '/copyrights' },
      { key: 'cr-evidence', name: '存证取证', path: '/copyrights/evidence' },
      { key: 'cr-bulk', name: '批量登记', path: '/copyrights/bulk' }
    ]},
    { key: 'notifications', name: '消息通知', icon: '🔔', path: '/notifications' }
  ],
  enterprise: [
    { key: 'dashboard', name: '工作台', icon: '📊', path: '/dashboard' },
    { key: 'trademarks', name: '商标管理', icon: '™️', path: '/trademarks', children: [
      { key: 'tm-list', name: '商标库', path: '/trademarks' },
      { key: 'tm-search', name: '商标检索', path: '/trademarks/search' },
      { key: 'tm-apply', name: '注册申请', path: '/trademarks/search' },
      { key: 'tm-alerts', name: '风险预警', path: '/trademarks/alerts' }
    ]},
    { key: 'patents', name: '专利管理', icon: '💡', path: '/patents', children: [
      { key: 'pt-list', name: '专利库', path: '/patents' },
      { key: 'pt-status', name: '法律状态', path: '/patents' },
      { key: 'pt-fees', name: '年费提醒', path: '/patents/fees' },
      { key: 'pt-value', name: '价值评估', path: '/patents' }
    ]},
    { key: 'copyrights', name: '版权管理', icon: '©️', path: '/copyrights', children: [
      { key: 'cr-list', name: '版权库', path: '/copyrights' },
      { key: 'cr-evidence', name: '存证取证', path: '/copyrights/evidence' },
      { key: 'cr-bulk', name: '批量登记', path: '/copyrights/bulk' }
    ]},
    { key: 'notifications', name: '消息通知', icon: '🔔', path: '/notifications' }
  ],
  lawfirm: [
    { key: 'dashboard', name: '工作台', icon: '📊', path: '/dashboard' },
    { key: 'manager', name: '管家服务', icon: '👔', path: '/manager', children: [
      { key: 'mg-clients', name: '客户管理', path: '/manager/clients' },
      { key: 'mg-cases', name: '案件管理', path: '/manager/cases' },
      { key: 'mg-contracts', name: '套餐合同', path: '/manager/contracts' },
      { key: 'mg-stats', name: '胜诉率统计', path: '/manager/statistics' }
    ]},
    { key: 'trademarks', name: '商标管理', icon: '™️', path: '/trademarks', children: [
      { key: 'tm-list', name: '商标库', path: '/trademarks' },
      { key: 'tm-search', name: 'AI近似检索', path: '/trademarks/search' },
      { key: 'tm-alerts', name: '风险预警', path: '/trademarks/alerts' },
      { key: 'tm-transfer', name: '转让交易', path: '/trademarks/transfers' }
    ]},
    { key: 'patents', name: '专利管理', icon: '💡', path: '/patents', children: [
      { key: 'pt-list', name: '专利库', path: '/patents' },
      { key: 'pt-fees', name: '年费提醒', path: '/patents/fees' }
    ]},
    { key: 'copyrights', name: '版权管理', icon: '©️', path: '/copyrights', children: [
      { key: 'cr-list', name: '版权库', path: '/copyrights' },
      { key: 'cr-evidence', name: '存证取证', path: '/copyrights/evidence' },
      { key: 'cr-bulk', name: '批量登记', path: '/copyrights/bulk' }
    ]},
    { key: 'notifications', name: '消息通知', icon: '🔔', path: '/notifications' }
  ],
  agency: [
    { key: 'dashboard', name: '工作台', icon: '📊', path: '/dashboard' },
    { key: 'manager', name: '管家服务', icon: '👔', path: '/manager', children: [
      { key: 'mg-clients', name: '客户绑定', path: '/manager/clients' },
      { key: 'mg-cases', name: '案件时间轴', path: '/manager/cases' },
      { key: 'mg-contracts', name: '套餐合同', path: '/manager/contracts' },
      { key: 'mg-stats', name: '胜诉率统计', path: '/manager/statistics' }
    ]},
    { key: 'trademarks', name: '商标服务', icon: '™️', path: '/trademarks', children: [
      { key: 'tm-list', name: '商标库检索', path: '/trademarks' },
      { key: 'tm-search', name: 'AI近似风险', path: '/trademarks/search' },
      { key: 'tm-apply', name: '在线注册申请', path: '/trademarks/search' },
      { key: 'tm-alerts', name: '进度异常预警', path: '/trademarks/alerts' },
      { key: 'tm-transfer', name: '转让交易', path: '/trademarks/transfers' }
    ]},
    { key: 'patents', name: '专利服务', icon: '💡', path: '/patents', children: [
      { key: 'pt-list', name: '专利库', path: '/patents' },
      { key: 'pt-status', name: '法律状态', path: '/patents' },
      { key: 'pt-fees', name: '年费提醒', path: '/patents/fees' },
      { key: 'pt-value', name: '价值评估', path: '/patents' }
    ]},
    { key: 'copyrights', name: '版权服务', icon: '©️', path: '/copyrights', children: [
      { key: 'cr-list', name: '版权库', path: '/copyrights' },
      { key: 'cr-evidence', name: '存证取证', path: '/copyrights/evidence' },
      { key: 'cr-bulk', name: '批量登记', path: '/copyrights/bulk' }
    ]},
    { key: 'notifications', name: '消息通知', icon: '🔔', path: '/notifications' }
  ]
};

const roleNames = {
  inventor: '个人发明人',
  enterprise: '中小企业',
  lawfirm: '律所',
  agency: '代理机构'
};

function getDefaultExpandedMenus(menu) {
  return menu.reduce((expanded, item) => {
    if (item.children) {
      expanded[item.key] = true;
    }
    return expanded;
  }, {});
}

export default function MainLayout() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const menu = menuConfig[user?.role] || menuConfig.inventor;
  const [expandedMenus, setExpandedMenus] = useState(() => getDefaultExpandedMenus(menu));
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setExpandedMenus(getDefaultExpandedMenus(menu));
  }, [user?.role]);

  useEffect(() => {
    menu.forEach(item => {
      if (item.children && item.children.some(c => location.pathname.startsWith(c.path))) {
        setExpandedMenus(prev => ({ ...prev, [item.key]: true }));
      }
    });
  }, [location.pathname]);

  const expandMenu = (key) => {
    setExpandedMenus(prev => ({ ...prev, [key]: true }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>IP</div>
          <div>
            <div style={styles.logoText}>知识产权平台</div>
            <div style={styles.logoSubtext}>{roleNames[user?.role]}</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {menu.map((item) => (
            <div key={item.key}>
              {item.children ? (
                <>
	                  <div
	                    role="button"
	                    tabIndex={0}
	                    aria-label={item.name}
	                    data-nav-label={item.name}
	                    style={{
	                      ...styles.menuItem,
	                      ...(expandedMenus[item.key] ? styles.menuItemActive : {})
	                    }}
	                    onClick={() => expandMenu(item.key)}
	                    onKeyDown={(event) => {
	                      if (event.key === 'Enter' || event.key === ' ') {
	                        event.preventDefault();
	                        expandMenu(item.key);
	                      }
	                    }}
	                  >
                    <span style={{ flex: 1 }}>{item.name}</span>
                    <span style={{ ...styles.arrow, transform: expandedMenus[item.key] ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                  </div>
                  {expandedMenus[item.key] && (
                    <div style={styles.submenu}>
                      {item.children.map((child) => (
	                        <Link
	                          key={child.key}
	                          to={child.path}
	                          aria-label={child.name}
	                          aria-current={location.pathname === child.path ? 'page' : undefined}
	                          data-nav-label={child.name}
	                          style={{
	                            ...styles.submenuItem,
	                            ...(location.pathname === child.path ? styles.submenuItemActive : {})
                          }}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
	                <Link
	                  to={item.path}
	                  aria-label={item.name}
	                  aria-current={location.pathname === item.path ? 'page' : undefined}
	                  data-nav-label={item.name}
	                  style={{
	                    ...styles.menuItem,
	                    ...(location.pathname === item.path ? styles.menuItemActive : {})
                  }}
                >
                  <span>{item.name}</span>
                  {item.key === 'notifications' && unreadCount > 0 && (
                    <span style={styles.badge}>{unreadCount}</span>
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <div style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h2 style={styles.pageTitle}>
              {getPageTitle(location.pathname, menu)}
            </h2>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.userInfo}>
              <div style={styles.avatar}>{user?.name?.[0] || 'U'}</div>
              <div>
                <div style={styles.userName}>{user?.name}</div>
                <div style={styles.userRole}>{roleNames[user?.role]}</div>
              </div>
            </div>
            <button style={styles.logoutButton} onClick={handleLogout}>
              退出
            </button>
          </div>
        </header>

        <main style={styles.content}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/trademarks" element={<TrademarkList />} />
            <Route path="/trademarks/search" element={<TrademarkSearch />} />
            <Route path="/trademarks/alerts" element={<TrademarkAlerts />} />
            <Route path="/trademarks/transfers" element={<TrademarkTransfers />} />
            <Route path="/patents" element={<PatentList />} />
            <Route path="/patents/fees" element={<PatentFees />} />
            <Route path="/copyrights" element={<CopyrightList />} />
            <Route path="/copyrights/evidence" element={<CopyrightEvidence />} />
            <Route path="/copyrights/bulk" element={<CopyrightBulk />} />
            <Route path="/manager/clients" element={<ClientList />} />
            <Route path="/manager/cases" element={<CaseList />} />
            <Route path="/manager/cases/:id" element={<CaseDetail />} />
            <Route path="/manager/contracts" element={<ContractList />} />
            <Route path="/manager/statistics" element={<Statistics />} />
            <Route path="/notifications" element={<NotificationList />} />
            <Route path="/manager" element={<Navigate to="/manager/clients" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function getPageTitle(pathname, menu) {
  for (const item of menu) {
    if (item.children) {
      for (const child of item.children) {
        if (pathname === child.path) {
          return child.name;
        }
      }
    } else if (pathname === item.path) {
      return item.name;
    }
  }
  return '工作台';
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f0f2f5'
  },
  sidebar: {
    width: '260px',
    background: '#001529',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0
  },
  logo: {
    padding: '24px 20px',
    borderBottom: '1px solid #1f1f1f',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoIcon: {
    width: '44px',
    height: '44px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '18px'
  },
  logoText: {
    fontSize: '16px',
    fontWeight: '600'
  },
  logoSubtext: {
    fontSize: '12px',
    color: '#8c8c8c'
  },
  nav: {
    flex: 1,
    padding: '12px 0',
    overflowY: 'auto'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    color: '#b8c3cc',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px'
  },
  menuItemActive: {
    background: '#1890ff',
    color: '#fff'
  },
  arrow: {
    fontSize: '10px',
    transition: 'transform 0.2s'
  },
  submenu: {
    background: '#000c17'
  },
  submenuItem: {
    display: 'block',
    padding: '10px 20px 10px 48px',
    color: '#8c8c8c',
    textDecoration: 'none',
    fontSize: '13px',
    transition: 'all 0.2s'
  },
  submenuItemActive: {
    color: '#fff',
    background: 'rgba(24, 144, 255, 0.2)'
  },
  badge: {
    background: '#ff4d4f',
    color: '#fff',
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '10px',
    marginLeft: '8px'
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    background: '#fff',
    padding: '16px 24px',
    borderBottom: '1px solid #e8e8e8',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0
  },
  headerLeft: {
    flex: 1
  },
  pageTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#262626'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '16px'
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#262626'
  },
  userRole: {
    fontSize: '12px',
    color: '#8c8c8c'
  },
  logoutButton: {
    padding: '8px 16px',
    border: '1px solid #d9d9d9',
    background: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#595959'
  },
  content: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto'
  }
};
