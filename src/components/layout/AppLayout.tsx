import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAuthStore } from '@/stores/auth.store';

export interface AppLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function AppLayout({ children, showFooter = true }: AppLayoutProps) {
  const { role } = useAuthStore();
  const showSidebar = role === 'lawyer' || role === 'admin';
  const showUserFooter = showFooter && role === 'user';

  return (
    <div className="min-h-screen flex flex-col bg-neutral-warm">
      <Header />
      <div className="flex flex-1 min-h-0">
        {showSidebar && <Sidebar />}
        <main className="flex-1 flex flex-col min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 p-4 md:p-6 lg:p-8"
          >
            <div className="container mx-auto max-w-7xl">
              {children}
            </div>
          </motion.div>
          {showUserFooter && <Footer />}
        </main>
      </div>
    </div>
  );
}
