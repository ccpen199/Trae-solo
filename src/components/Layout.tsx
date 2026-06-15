import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, LayoutTemplate, Shield, Settings, Brain } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: '工作台' },
    { path: '/templates', icon: LayoutTemplate, label: '模板库' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/95 backdrop-blur-sm border-b border-navy-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-navy-600 to-navy-700 rounded-xl flex items-center justify-center shadow-glow">
              <FileText className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-navy-700">智能简历工作台</h1>
              <p className="text-xs text-navy-400">Resume Workbench</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link flex items-center gap-2 px-4 py-2 ${isActive(item.path) ? 'nav-link-active' : ''}`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/settings"
              className={`nav-link flex items-center gap-2 ${isActive('/settings') ? 'nav-link-active' : ''}`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">设置</span>
            </Link>
          </div>
        </div>

        <nav className="md:hidden flex justify-around border-t border-navy-50 py-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg ${
                isActive(item.path) ? 'text-navy-600' : 'text-navy-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-white/60 border-t border-navy-100 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-navy-400">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Shield className="w-4 h-4" />
            <span>隐私保护模式 · 数据仅存本地 · AES加密存储</span>
          </div>
          <p>© 2025 智能简历工作台 · 专注应届生与职场新人的职业表达优化</p>
        </div>
      </footer>
    </div>
  );
}
