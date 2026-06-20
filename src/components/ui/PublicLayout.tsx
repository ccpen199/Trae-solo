import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BackToTop } from './BackToTop';

interface PublicLayoutProps {
  children?: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-ink-900">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children ?? <Outlet />}
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export { PublicLayout };
export default PublicLayout;
