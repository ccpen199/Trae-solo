import { Outlet, NavLink, useNavigate } from 'react-router-dom';

function Layout() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getMenuItems = () => {
    const items = [
      { path: '/', label: '首页', icon: '🏠' }
    ];

    if (user.role === 'admin' || user.role === 'teacher') {
      items.push({ path: '/contacts', label: '通讯录', icon: '📇' });
    }

    items.push({ path: '/announcements', label: '公告通知', icon: '📢' });
    items.push({ path: '/leaves', label: '请假管理', icon: '📅' });
    items.push({ path: '/feedbacks', label: '反馈交流', icon: '💬' });

    return items;
  };

  const getRoleName = (role) => {
    const roles = {
      admin: '管理员',
      teacher: '老师',
      guardian: '家长'
    };
    return roles[role] || role;
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>家校沟通系统</h2>
        <nav>
          <ul>
            {getMenuItems().map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} className={({ isActive }) => isActive ? 'active' : ''}>
                  {item.icon} {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="main-content">
        <div className="header">
          <div></div>
          <div className="user-info">
            <span>👤 {user.name}</span>
            <span className="badge badge-info">{getRoleName(user.role)}</span>
            <button className="btn btn-sm btn-secondary" onClick={handleLogout}>
              退出
            </button>
          </div>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;
