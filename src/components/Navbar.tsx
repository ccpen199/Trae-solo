import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Briefcase, User, Building2, LayoutDashboard, LogOut, UserPlus } from 'lucide-react';

export default function Navbar() {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const logout = useAuthStore(state => state.logout);
  const role = user?.role;
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-800">灵活用工平台</span>
            </Link>

            {isAuthenticated && (
              <div className="hidden md:flex ml-10 items-center space-x-4">
                <Link
                  to="/jobs"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
                >
                  岗位大厅
                </Link>

                {role === 'job_seeker' && (
                  <>
                    <Link
                      to="/jobs/recommendations"
                      className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
                    >
                      智能匹配
                    </Link>
                    <Link
                      to="/my/applications"
                      className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
                    >
                      我的申请
                    </Link>
                  </>
                )}

                {role === 'employer' && (
                  <>
                    <Link
                      to="/employer/jobs"
                      className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
                    >
                      我发布的岗位
                    </Link>
                    <Link
                      to="/employer/jobs/create"
                      className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-medium rounded-lg transition"
                    >
                      发布岗位
                    </Link>
                  </>
                )}

                {role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition"
                  >
                    管理后台
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">{user?.name || user?.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm">退出</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-600 px-4 py-2 text-sm font-medium transition"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-1"
                >
                  <UserPlus className="h-4 w-4" />
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
