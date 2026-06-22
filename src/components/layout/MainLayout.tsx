import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  className?: string;
  children?: React.ReactNode;
}

export default function MainLayout({ className, children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-paper-50">
      <Header />
      <main className={cn('flex-1 pt-16 md:pt-20', className)}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {children ?? <Outlet />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
