import React from 'react';
import { NavBar } from 'antd-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface LayoutProps {
  title: string;
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  title,
  children,
  showBack = false,
  onBack,
  rightContent,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const hideTabBarRoutes = ['/login', '/attendance/checkin', '/offline'];
  const showTabBar = !hideTabBarRoutes.some((route) => location.pathname.startsWith(route));

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-page)]">
      <NavBar
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #3b82f6 100%)',
          color: '#fff',
          fontWeight: 600,
        }}
        back={showBack ? <ChevronLeft className="h-5 w-5" /> : null}
        onBack={showBack ? handleBack : undefined}
        right={rightContent}
      >
        {title}
      </NavBar>

      <main className="flex-1 overflow-auto scrollbar-hide pb-[calc(env(safe-area-inset-bottom)+60px)]">
        {children}
      </main>

      {showTabBar && <div className="h-[env(safe-area-inset-bottom)]" />}
    </div>
  );
};

export default Layout;
