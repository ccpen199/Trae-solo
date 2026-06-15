import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Home as HomeIcon, AlertTriangle, Bell, Search, User, Settings as SettingsIcon } from "lucide-react";
import { useState, useEffect } from "react";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import FeedPage from "@/pages/FeedPage";
import CourseDetail from "@/pages/CourseDetail";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetail from "@/pages/OrderDetail";
import CreatorProfile from "@/pages/CreatorProfile";
import GuaranteeCenter from "@/pages/GuaranteeCenter";
import RouteGuard from "@/components/RouteGuard";
import WorkspaceLayout from "@/pages/workspace/WorkspaceLayout";
import WorkspaceDashboard from "@/pages/workspace/Dashboard";
import CourseList from "@/pages/workspace/CourseList";
import CourseEditor from "@/pages/workspace/CourseEditor";
import WorkspaceOrderList from "@/pages/workspace/OrderList";
import Earnings from "@/pages/workspace/Earnings";
import WorkspaceSettings from "@/pages/workspace/Settings";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import ReviewCenter from "@/pages/admin/ReviewCenter";
import OrderManage from "@/pages/admin/OrderManage";
import Finance from "@/pages/admin/Finance";
import { useAuthStore, useAppStore } from "@/store/authStore";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import Button from "@/components/Button";

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-50 to-white p-8">
      <div className="text-center animate-fade-in-up">
        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-12 h-12 text-primary-500" />
        </div>
        <h1 className="text-6xl font-bold text-zinc-900 mb-4">404</h1>
        <p className="text-xl text-zinc-500 mb-8">抱歉，您访问的页面不存在</p>
        <Button onClick={() => window.location.href = '/'} variant="primary" className="inline-flex items-center gap-2">
          <HomeIcon className="w-4 h-4" />
          返回首页
        </Button>
      </div>
    </div>
  );
}

function UserManagePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">用户管理</h1>
      <p className="text-zinc-400">该页面功能正在完善中...</p>
    </div>
  );
}

function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isWorkspace = location.pathname.startsWith('/workspace');
  const isAdmin = location.pathname.startsWith('/admin');
  
  if (isWorkspace || isAdmin) return null;

  const navItems = [
    { path: '/', label: '首页', icon: HomeIcon },
    { path: '/feed', label: '内容社区', icon: Search },
    { path: '/orders', label: '服务广场', icon: Bell },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg font-display">S</span>
            </div>
            <span className="font-display text-xl font-bold text-zinc-900">SkillVerse</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  location.pathname === item.path
                    ? "bg-primary-100 text-primary-700"
                    : "text-zinc-600 hover:text-primary-600 hover:bg-primary-50"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigate('/login')}>登录</Button>
                <Button variant="primary" onClick={() => navigate('/login?tab=register')}>注册</Button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <div className="hidden md:block text-right mr-2">
                    <p className="text-sm font-medium text-zinc-900">{user?.username}</p>
                    <p className="text-xs text-zinc-500">
                      {user?.role === 'creator' ? '创作者' : user?.role === 'admin' ? '管理员' : '普通用户'}
                    </p>
                  </div>
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-lg border border-zinc-100 overflow-hidden animate-fade-in">
                    <div className="p-3 border-b border-zinc-100">
                      <p className="font-medium text-zinc-900">{user?.username}</p>
                      <p className="text-sm text-zinc-500">{user?.role === 'creator' ? '创作者' : user?.role === 'admin' ? '管理员' : '普通用户'}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => { navigate(`/creator/${user?.id}`); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        <User className="w-4 h-4" /> 个人主页
                      </button>
                      {user?.role === 'creator' && (
                        <button
                          onClick={() => { navigate('/workspace'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          <SettingsIcon className="w-4 h-4" /> 创作者工作台
                        </button>
                      )}
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => { navigate('/admin'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          <SettingsIcon className="w-4 h-4" /> 管理后台
                        </button>
                      )}
                      <button
                        onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        <SettingsIcon className="w-4 h-4" /> 账号设置
                      </button>
                      <button
                        onClick={() => { logout(); setShowUserMenu(false); navigate('/'); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors mt-1"
                      >
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const location = useLocation();
  const isWorkspace = location.pathname.startsWith('/workspace');
  const isAdmin = location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  const initConfig = useAppStore((state) => state.initConfig);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    initConfig();
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [initConfig, fetchProfile, isAuthenticated]);

  if (isAuthPage || isWorkspace || isAdmin) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        
        <Route 
          path="/workspace/*" 
          element={
            <RouteGuard allowedRoles={['creator', 'admin']}>
              <WorkspaceLayout />
            </RouteGuard>
          }
        >
          <Route index element={<Navigate to="/workspace/dashboard" replace />} />
          <Route path="dashboard" element={<WorkspaceDashboard />} />
          <Route path="courses" element={<CourseList />} />
          <Route path="courses/new" element={<CourseEditor />} />
          <Route path="courses/:id/edit" element={<CourseEditor />} />
          <Route path="orders" element={<WorkspaceOrderList />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="settings" element={<WorkspaceSettings />} />
        </Route>

        <Route 
          path="/admin/*" 
          element={
            <RouteGuard allowedRoles={['admin']}>
              <AdminLayout />
            </RouteGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="review" element={<ReviewCenter />} />
          <Route path="orders" element={<OrderManage />} />
          <Route path="finance" element={<Finance />} />
          <Route path="users" element={<UserManagePage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/courses" element={<FeedPage />} />
          <Route path="/search" element={<FeedPage />} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/publish" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/guarantee" element={<GuaranteeCenter />} />
          <Route path="/creator/:id" element={<CreatorProfile />} />
          <Route path="/creators/:id" element={<CreatorProfile />} />
          <Route path="/users/:id" element={<CreatorProfile />} />
          <Route path="/settings" element={<WorkspaceSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      <footer className="bg-zinc-900 text-zinc-400 py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg font-display">S</span>
                </div>
                <span className="font-display text-xl font-bold text-white">SkillVerse</span>
              </div>
              <p className="text-sm">让每个人的技能都能创造价值</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">产品</h4>
              <div className="space-y-2 text-sm">
                <Link to="/feed" className="block hover:text-white transition-colors">视频课程</Link>
                <Link to="/orders" className="block hover:text-white transition-colors">定制服务</Link>
                <Link to="/" className="block hover:text-white transition-colors">创作者中心</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">关于</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block hover:text-white transition-colors">关于我们</a>
                <a href="#" className="block hover:text-white transition-colors">用户协议</a>
                <a href="#" className="block hover:text-white transition-colors">隐私政策</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">平台保障</h4>
              <div className="space-y-2 text-sm">
                <Link to="/guarantee" className="block hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  双向信用评价
                </Link>
                <Link to="/guarantee" className="block hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  服务过程留痕
                </Link>
                <Link to="/guarantee" className="block hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  争议仲裁机制
                </Link>
                <Link to="/guarantee" className="block hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  保险对接接口
                </Link>
                <Link to="/guarantee" className="block hover:text-white transition-colors flex items-center gap-2 mt-3">
                  <span className="text-primary-400">→</span>
                  查看完整保障体系
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-800 mt-8 pt-8 text-center text-sm">
            © 2026 SkillVerse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
