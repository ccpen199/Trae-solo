import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Shield, User, Menu, X, ChevronDown, ShoppingBag, GraduationCap, Heart, Plane, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const categories = [
  { code: 'consumer', name: '消费品牌', icon: ShoppingBag, path: '/category/consumer' },
  { code: 'education', name: '教育服务', icon: GraduationCap, path: '/category/education' },
  { code: 'medical', name: '医疗健康', icon: Heart, path: '/category/medical' },
  { code: 'travel', name: '旅游出行', icon: Plane, path: '/category/travel' },
];

const roleMenus = {
  user: [
    { name: '首页', path: '/' },
    { name: '榜单', path: '/rankings' },
    { name: '对比', path: '/compare' },
  ],
  reviewer: [
    { name: '工作台', path: '/reviewer/dashboard' },
    { name: '任务大厅', path: '/reviewer/tasks' },
    { name: '我的报告', path: '/reviewer/reports' },
    { name: '质量评分', path: '/reviewer/quality' },
  ],
  brand: [
    { name: '品牌后台', path: '/brand/dashboard' },
    { name: '舆情看板', path: '/brand/reputation' },
    { name: '申诉中心', path: '/brand/appeal' },
  ],
  admin: [
    { name: '管理面板', path: '/admin/dashboard' },
    { name: '计划排期', path: '/admin/plans' },
    { name: '审核工作流', path: '/admin/reviews' },
    { name: '申诉处理', path: '/admin/appeals' },
    { name: '权重配置', path: '/admin/weights' },
  ],
};

export function Navbar() {
  const { user, logout, switchRole } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const currentRole = user?.role || 'user';
  const menus = roleMenus[currentRole as keyof typeof roleMenus] || roleMenus.user;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue)}`);
    }
  };

  const handleLogout = () => {
    logout();
    setRoleMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="bg-surface/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              <span className="font-serif text-xl font-bold text-white">可信评价中枢</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {menus.map(menu => (
                <Link
                  key={menu.path}
                  to={menu.path}
                  className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-surface-light transition-colors"
                >
                  {menu.name}
                </Link>
              ))}

              <div className="relative" onMouseLeave={() => setCategoryOpen(false)}>
                <Link
                  to="/rankings"
                  onClick={() => setCategoryOpen(!categoryOpen)}
                  onMouseEnter={() => setCategoryOpen(true)}
                  className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-surface-light transition-colors inline-flex items-center gap-1"
                >
                  评价领域
                  <ChevronDown className={cn('w-4 transition-transform', categoryOpen && 'rotate-180')} />
                </Link>
                {categoryOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 card py-2 animate-fade-in">
                  {categories.map((cat) => (
                    <Link
                      key={cat.code}
                      to={cat.path}
                      onClick={() => setCategoryOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-surface-light hover:text-white transition-colors"
                    >
                      <cat.icon className="w-4 h-4 text-primary" />
                      {cat.name}
                    </Link>
                  ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="搜索品牌、机构..."
                className="w-56 px-9 py-1.5 pl-9 bg-surface-light/50 border border-border rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </form>

            {user ? (
              <div className="relative" onMouseLeave={() => setRoleMenuOpen(false)}>
                <button
                  onMouseEnter={() => setRoleMenuOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-surface-light transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-slate-200">{user.username}</span>
                  <ChevronDown className={cn('w-4 text-slate-400 transition-transform', roleMenuOpen && 'rotate-180')} />
                </button>
                {roleMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 card py-2 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-700/50">
                      <p className="text-sm font-medium text-slate-200">{user.username}</p>
                      <p className="text-xs text-slate-400 mt-0.5">切换角色</p>
                    </div>
                    <div className="py-1">
                      {(['user', 'reviewer', 'brand', 'admin'] as const).map((role) => (
                        <button
                          key={role}
                          onClick={() => {
                            switchRole(role);
                            setRoleMenuOpen(false);
                            const rolePaths: Record<string, string> = {
                              user: '/', reviewer: '/reviewer/dashboard', brand: '/brand/dashboard', admin: '/admin/dashboard',
                            };
                            navigate(rolePaths[role]);
                          }}
                          className={cn(
                            'w-full text-left px-4 py-2 text-sm transition-colors',
                            currentRole === role
                              ? 'text-primary bg-primary/10'
                              : 'text-slate-300 hover:bg-surface-light hover:text-white'
                          )}
                        >
                          {role === 'user' && '普通用户' }
                          {role === 'reviewer' && '评测员'}
                          {role === 'brand' && '品牌方'}
                          {role === 'admin' && '管理员'}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-slate-700/50 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary text-sm">登录</Link>
            )}
          </div>

          <button
            className="lg:hidden p-2 rounded-md text-slate-400 hover:text-white hover:bg-surface-light"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-700/50 animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {menus.map((menu) => (
              <Link
                key={menu.path}
                to={menu.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-surface-light hover:text-white"
              >
                {menu.name}
              </Link>
            ))}
            {categories.map((cat) => (
              <Link
                key={cat.code}
                to={cat.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-surface-light hover:text-white"
              >
                <cat.icon className="w-4 h-4" />
                {cat.name}
              </Link>
            ))}
            <form onSubmit={handleSearch} className="pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="搜索品牌、机构..."
                  className="w-full px-3 py-2 pl-9 bg-surface-light border border-border rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
