import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen bg-deep-sea">
      <Sidebar />
      <main
        className={cn(
          'flex-1 min-h-screen overflow-y-auto md:ml-64',
          'p-6 md:p-8',
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
