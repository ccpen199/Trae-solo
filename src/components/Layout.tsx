import { Outlet, Link, NavLink } from 'react-router-dom';
import { Home, Search, Map, Calculator, Heart, User, Building2 } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

export default function Layout() {
  const { isLoggedIn, user, logout } = useUserStore();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-50 bg-white shadow-nav border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Building2 className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-serif font-bold text-primary-800">房产平台</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                <Home className="w-4 h-4" />
                <span>首页</span>
              </NavLink>
              <NavLink
                to="/properties"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                <Search className="w-4 h-4" />
                <span>房源</span>
              </NavLink>
              <NavLink
                to="/map"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                <Map className="w-4 h-4" />
                <span>地图找房</span>
              </NavLink>
              <NavLink
                to="/calculator"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                <Calculator className="w-4 h-4" />
                <span>计算器</span>
              </NavLink>
              {isLoggedIn && (
                <NavLink
                  to="/favorites"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <Heart className="w-4 h-4" />
                  <span>收藏</span>
                </NavLink>
              )}
            </nav>

            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.name}
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="btn-ghost text-sm py-1.5 px-3"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary text-sm py-1.5 px-4"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-6 h-6 text-primary-400" />
                <span className="text-lg font-serif font-bold text-white">房产平台</span>
              </div>
              <p className="text-sm text-gray-400">
                专业的房产交易服务平台，为您提供安全、透明的房产交易体验。
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">快速导航</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/properties" className="hover:text-white transition-colors">房源列表</Link></li>
                <li><Link to="/map" className="hover:text-white transition-colors">地图找房</Link></li>
                <li><Link to="/calculator" className="hover:text-white transition-colors">房贷计算器</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">关于我们</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white transition-colors">公司介绍</Link></li>
                <li><Link to="/agents" className="hover:text-white transition-colors">经纪人团队</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">联系我们</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">联系方式</h4>
              <ul className="space-y-2 text-sm">
                <li>客服热线：400-888-8888</li>
                <li>工作时间：9:00 - 21:00</li>
                <li>邮箱：service@example.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>© 2024 房产平台. 保留所有权利.</p>
          </div>
        </div>
      </footer>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 h-16">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 ${
                isActive ? 'text-primary-600' : 'text-gray-500'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">首页</span>
          </NavLink>
          <NavLink
            to="/properties"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 ${
                isActive ? 'text-primary-600' : 'text-gray-500'
              }`
            }
          >
            <Search className="w-5 h-5" />
            <span className="text-xs">房源</span>
          </NavLink>
          <NavLink
            to="/map"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 ${
                isActive ? 'text-primary-600' : 'text-gray-500'
              }`
            }
          >
            <Map className="w-5 h-5" />
            <span className="text-xs">地图</span>
          </NavLink>
          <NavLink
            to="/calculator"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 ${
                isActive ? 'text-primary-600' : 'text-gray-500'
              }`
            }
          >
            <Calculator className="w-5 h-5" />
            <span className="text-xs">计算</span>
          </NavLink>
          <NavLink
            to={isLoggedIn ? '/profile' : '/login'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 ${
                isActive ? 'text-primary-600' : 'text-gray-500'
              }`
            }
          >
            <User className="w-5 h-5" />
            <span className="text-xs">我的</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
