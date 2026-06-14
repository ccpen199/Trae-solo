import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Home,
  Search,
  FileText,
  Users,
  MessageCircle,
  Video,
  Shield,
  User,
  LogOut,
  ChevronDown,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import HomePage from '@/pages/Home';
import Login from '@/pages/Login';
import Recommend from '@/pages/Recommend';
import RecommendResult from '@/pages/RecommendResult';
import VolunteerPlan from '@/pages/VolunteerPlan';
import Collaboration from '@/pages/Collaboration';
import UniversitySearch from '@/pages/UniversitySearch';
import Compare from '@/pages/Compare';
import QACommunity from '@/pages/QACommunity';
import Live from '@/pages/Live';
import Admin from '@/pages/Admin';

function ProtectedRoute({ children, requireAdmin = false, requireLogin = true }: { children: React.ReactNode; requireAdmin?: boolean; requireLogin?: boolean }) {
  const { isAuthenticated, user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (requireLogin && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/universities', label: '院校查询', icon: Search },
    { path: '/recommend', label: '志愿填报', icon: GraduationCap },
    { path: '/plans', label: '志愿方案', icon: FileText },
    { path: '/collaboration', label: '协作空间', icon: Users },
    { path: '/qa', label: '问答社区', icon: MessageCircle },
    { path: '/live', label: '直播', icon: Video },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: '管理后台', icon: Shield });
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/login');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'student': return '考生';
      case 'parent': return '家长';
      case 'teacher': return '教师';
      case 'expert': return '专家';
      case 'admin': return '管理员';
      default: return '';
    }
  };

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">智愿通</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{getRoleLabel(user?.role || '')}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border py-2 z-50">
                      <div className="px-4 py-3 border-b">
                        <p className="font-medium text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.phone}</p>
                      </div>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/plans');
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        我的志愿方案
                      </button>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                onClick={() => navigate('/login')}
              >
                登录
              </button>
            )}

            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function AppRoutes() {
  const { initAuth } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initAuth();
      setInitializing(false);
    };
    init();
  }, [initAuth]);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">智愿通</h1>
          <p className="text-gray-500 mb-6">智能高考志愿填报系统</p>
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<><Navbar /><HomePage /></>} />
      <Route path="/login" element={<Login />} />
      <Route path="/universities" element={<><Navbar /><UniversitySearch /></>} />
      <Route path="/universities/:id" element={<><Navbar /><UniversitySearch /></>} />
      <Route path="/compare" element={<><Navbar /><Compare /></>} />
      <Route path="/qa" element={<><Navbar /><QACommunity /></>} />
      <Route path="/qa/:id" element={<><Navbar /><QACommunity /></>} />
      <Route path="/live" element={<><Navbar /><Live /></>} />
      <Route path="/live/:id" element={<><Navbar /><Live /></>} />
      
      <Route
        path="/recommend"
        element={
          <ProtectedRoute requireLogin={false}>
            <Navbar />
            <Recommend />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recommend/result"
        element={
          <ProtectedRoute requireLogin={false}>
            <Navbar />
            <RecommendResult />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plans"
        element={
          <ProtectedRoute requireLogin={false}>
            <Navbar />
            <VolunteerPlan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plans/:id"
        element={
          <ProtectedRoute requireLogin={false}>
            <Navbar />
            <VolunteerPlan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/collaboration"
        element={
          <ProtectedRoute requireLogin={false}>
            <Navbar />
            <Collaboration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <Admin />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-6">页面未找到</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                返回首页
              </Link>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <AppRoutes />
      </div>
    </Router>
  );
}
