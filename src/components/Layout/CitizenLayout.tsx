import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Landmark } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const navLinks = [
  { label: '首页', path: '/' },
  { label: '服务大厅', path: '/services' },
  { label: '电子证照', path: '/certificates' },
  { label: '个人中心', path: '/profile' },
  { label: '管理后台', path: '/admin' },
];

export default function CitizenLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gov-bg">
      <header className="gov-gradient-hero sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-white shrink-0">
              <Landmark className="w-7 h-7" />
              <span className="text-xl font-bold tracking-wide">昆山政务通</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="px-4 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center bg-white/10 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                <Search className="w-4 h-4 text-white/60" />
                <input
                  type="text"
                  placeholder="搜索服务..."
                  className="bg-transparent border-none outline-none text-white placeholder-white/50 text-sm ml-2 w-36"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const q = (e.target as HTMLInputElement).value.trim();
                      if (q) navigate(`/services?q=${encodeURIComponent(q)}`);
                    }
                  }}
                />
              </div>

              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
                    {user.name[0]}
                  </div>
                  <span className="text-white text-sm hidden sm:inline">{user.name}</span>
                  <button onClick={logout} className="text-white/60 hover:text-white transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm"
                >
                  <User className="w-4 h-4" />
                  <span>登录</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gov-blue-dark text-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 text-white mb-3">
                <Landmark className="w-5 h-5" />
                <span className="font-bold">昆山政务通</span>
              </div>
              <p className="text-sm leading-relaxed">
                昆山市政务与民生服务统一平台，为您提供便捷、高效的在线政务服务。
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">快速链接</h4>
              <div className="flex flex-col gap-2 text-sm">
                {navLinks.map((link) => (
                  <Link key={link.path} to={link.path} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">联系我们</h4>
              <p className="text-sm leading-relaxed">服务热线：12345</p>
              <p className="text-sm leading-relaxed">工作时间：周一至周五 9:00-17:00</p>
              <p className="text-sm leading-relaxed">地址：昆山市前进中路108号</p>
            </div>
          </div>
          <div className="border-t border-white/10 mt-6 pt-6 text-center text-sm">
            © 2026 昆山市人民政府 版权所有 · 苏ICP备XXXXXXXX号
          </div>
        </div>
      </footer>
    </div>
  );
}
