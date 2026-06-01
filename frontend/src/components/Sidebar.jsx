import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { id: 'flight', name: '机票', icon: '✈️', path: '/' },
  { id: 'hotel', name: '酒店', icon: '🏨', path: '#' },
  { id: 'train', name: '火车票', icon: '🚂', path: '/train' },
  { id: 'vacation', name: '度假', icon: '🌴', path: '#' },
  { id: 'ticket', name: '门票', icon: '🎫', path: '#' },
  { id: 'group', name: '团购', icon: '🛍️', path: '#' },
  { id: 'car', name: '车车', icon: '🚗', path: '#' }
];

function Sidebar() {
  const navigate = useNavigate();

  const handleNavClick = (itemId, itemPath) => {
    if (itemPath === '#') {
      alert(`${navItems.find(n => n.id === itemId).name}功能开发中...`);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">去哪儿</div>
      <ul className="sidebar-nav">
        {navItems.map(item => (
          <li key={item.id}>
            <NavLink
              to={item.path}
              className={({ isActive }) => (isActive && (item.id === 'flight' || item.id === 'train')) ? 'active' : ''}
              onClick={(e) => {
                if (item.path === '#') {
                  e.preventDefault();
                  handleNavClick(item.id, item.path);
                }
              }}
            >
              <span>{item.icon}</span>
              {item.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar;
