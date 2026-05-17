import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const NavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  z-index: 100;
`;

const NavItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 16px;
  color: ${props => props.$active ? '#3b82f6' : '#666'};
  transition: color 0.2s;
  
  &:active {
    opacity: 0.7;
  }
`;

const NavIcon = styled.div`
  font-size: 22px;
`;

const NavLabel = styled.span`
  font-size: 11px;
`;

const navItems = [
  { path: '/', label: '读书', icon: '📚' },
  { path: '/explore', label: '找书', icon: '🔍' },
  { path: '/vip', label: 'VIP', icon: '👑' },
  { path: '/profile', label: '我的', icon: '👤' }
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <NavContainer>
      {navItems.map((item) => (
        <NavItem
          key={item.path}
          $active={location.pathname === item.path}
          onClick={() => navigate(item.path)}
        >
          <NavIcon>{item.icon}</NavIcon>
          <NavLabel>{item.label}</NavLabel>
        </NavItem>
      ))}
    </NavContainer>
  );
};

export default BottomNav;
