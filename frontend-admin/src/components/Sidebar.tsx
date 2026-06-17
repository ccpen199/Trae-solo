import { NavLink, useLocation } from 'react-router-dom';

const MENU_ITEMS = [
  { path: '/', icon: '📊', label: '运营概览', group: '数据中心' },
  { path: '/products', icon: '📦', label: '商品管理', group: '业务管理' },
  { path: '/orders', icon: '📋', label: '订单管理', group: '业务管理' },
  { path: '/card-pool', icon: '🎫', label: '卡密池管理', group: '业务管理' },
  { path: '/suppliers', icon: '🏭', label: '供应商管理', group: '业务管理' },
  { path: '/settlements', icon: '💰', label: '结算中心', group: '财务中心' },
  { path: '/risk', icon: '🛡️', label: '风控中心', group: '风控中心' },
  { path: '/users', icon: '👥', label: '用户管理', group: '系统管理' }
];

export default function Sidebar() {
  const location = useLocation();
  const grouped: Record<string, typeof MENU_ITEMS> = {};
  MENU_ITEMS.forEach(item => {
    if (!grouped[item.group]) grouped[item.group] = [];
    grouped[item.group].push(item);
  });

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span style={{ fontSize: 24 }}>💎</span>
        <span>VGF 管理台</span>
      </div>
      <div className="sidebar-menu">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <div className="sidebar-group-title">{group}</div>
            {items.map(item => (
              <NavLink key={item.path} to={item.path}
                aria-label={item.label}
                title={item.label}
                className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
