import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Home as HomeIcon, AlertTriangle, Bell, Search, User, Settings as SettingsIcon, ShieldCheck, Briefcase, FileText, ClipboardCheck, DollarSign, Lock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import Button from "@/components/Button";
import type { User as UserType } from "../shared/types";

const ROLE_LABELS: Record<string, string> = {
  admin: '管理员',
  creator: '创作者',
  requester: '需求方',
  user: '学习者',
};

function getRoleLabel(role?: string): string {
  return ROLE_LABELS[role || 'user'] || '学习者';
}

function getNavItemsForApp(role?: string) {
  const baseItems = [
    { path: '/', label: '首页', icon: HomeIcon },
    { path: '/feed', label: '内容社区', icon: Search },
    { path: '/orders', label: '订单广场', icon: Bell },
    { path: '/guarantee', label: '保障中心', icon: ShieldCheck },
    { path: '/users/local-admin', label: '个人中心', icon: User },
  ];

  const r = role || 'user';

  if (r === 'admin') {
    return [
      ...baseItems.slice(0, 3),
      { path: '/workspace', label: '工作台', icon: Briefcase },
      { path: '/orders/my', label: '我的需求', icon: FileText },
      ...baseItems.slice(3),
      { path: '/admin', label: '管理后台', icon: SettingsIcon },
      { path: '/admin/review', label: '审核中心', icon: ClipboardCheck },
      { path: '/admin/finance', label: '财务管理', icon: DollarSign },
    ];
  }

  if (r === 'creator') {
    return [
      ...baseItems.slice(0, 2),
      { path: '/workspace', label: '工作台入口', icon: Briefcase },
      ...baseItems.slice(2),
    ];
  }

  if (r === 'requester') {
    return [
      ...baseItems.slice(0, 3),
      { path: '/orders/my', label: '我的需求', icon: FileText },
      ...baseItems.slice(3),
    ];
  }

  return baseItems;
}

function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-50 to-white p-8">
      <div className="text-center animate-fade-in-up">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 mb-4">权限不足</h1>
        <p className="text-lg text-zinc-500 mb-8">抱歉，您没有权限访问该页面</p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => navigate(-1)} variant="ghost" className="inline-flex items-center gap-2">
            返回上一页
          </Button>
          <Button onClick={() => navigate('/')} variant="primary" className="inline-flex items-center gap-2">
            <HomeIcon className="w-4 h-4" />
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}

function OrderRedirect() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useEffect(() => {
    navigate(`/orders/${id || ''}`, { replace: true });
  }, [id, navigate]);
  return null;
}

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

  const navItems = useMemo(() => getNavItemsForApp(user?.role), [user?.role]);
  const roleLabel = useMemo(() => getRoleLabel(user?.role), [user?.role]);
  const userRole = user?.role || 'user';

  const handleUserMenuNav = (path: string) => {
    navigate(path);
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

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
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  location.pathname === item.path
                    ? "bg-primary-100 text-primary-700"
                    : "text-zinc-600 hover:text-primary-600 hover:bg-primary-50"
                )}
              >
                <item.icon className="w-4 h-4" />
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
                      {roleLabel}
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
                      <p className="text-sm text-zinc-500">{roleLabel}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => handleUserMenuNav(`/users/${user?.id}`)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        <User className="w-4 h-4" /> 个人主页
                      </button>
                      {(userRole === 'creator' || userRole === 'admin') && (
                        <button
                          onClick={() => handleUserMenuNav('/workspace')}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          <Briefcase className="w-4 h-4" /> 创作者工作台
                        </button>
                      )}
                      {userRole === 'admin' && (
                        <>
                          <button
                            onClick={() => handleUserMenuNav('/admin/review')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                          >
                            <ClipboardCheck className="w-4 h-4" /> 审核中心
                          </button>
                          <button
                            onClick={() => handleUserMenuNav('/admin/finance')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                          >
                            <DollarSign className="w-4 h-4" /> 财务管理
                          </button>
                        </>
                      )}
                      {(userRole === 'requester' || userRole === 'admin') && (
                        <button
                          onClick={() => handleUserMenuNav('/orders/my')}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          <FileText className="w-4 h-4" /> 我的需求
                        </button>
                      )}
                      <button
                        onClick={() => handleUserMenuNav('/settings')}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        <SettingsIcon className="w-4 h-4" /> 账号设置
                      </button>
                      <button
                        onClick={handleLogout}
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
  const initAuth = useAuthStore((state) => state.init);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    initConfig();
    initAuth();
  }, [initConfig, initAuth]);

  if (isAuthPage || isWorkspace || isAdmin) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        
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
          <Route path="/order/:id" element={<OrderRedirect />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route 
            path="/orders/*" 
            element={
              <RouteGuard allowedRoles={[]}>
                <Routes>
                  <Route path="" element={<OrdersPage />} />
                  <Route path="publish" element={<OrdersPage />} />
                  <Route path="my" element={<OrdersPage />} />
                </Routes>
              </RouteGuard>
            } 
          />
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
