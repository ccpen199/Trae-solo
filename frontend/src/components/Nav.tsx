import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: '总览' },
  { to: '/photographers', label: '摄影师' },
  { to: '/bookings', label: '预约' },
  { to: '/orders', label: '订单' },
  { to: '/deliveries', label: '交付' },
  { to: '/reports', label: '报表' },
];

export default function Nav() {
  const location = useLocation();

  function isActive(to: string) {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  }

  return (
    <nav className="nav-bar">
      <div className="nav-brand">摄影运营台</div>
      <ul className="nav-links">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className={isActive(link.to) ? 'active' : ''}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
