import { Link, Outlet, useLocation } from 'react-router-dom';
import { FileText, PenTool, Archive, AlertTriangle, FileSignature } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/contract/templates', label: '合同模板库', icon: FileText },
  { path: '/contract/sign', label: '合同签署', icon: PenTool },
  { path: '/contract/records', label: '签约记录', icon: Archive },
  { path: '/contract/disputes', label: '争议调解', icon: AlertTriangle },
];

export default function ContractLayout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <FileSignature className="h-5 w-5 text-white" />
            </div>
            <span className="font-serif text-lg font-bold tracking-wide text-primary">
              合同与争议中心
            </span>
          </div>

          <nav className="flex items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all duration-200',
                    active
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
