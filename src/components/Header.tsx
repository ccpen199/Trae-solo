import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  Search,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, isLoggedIn, logout, currentView, switchView } = useAppStore();
  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const setSearchKeyword = useAppStore((s) => s.setSearchKeyword);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchKeyword(searchValue);
    if (searchValue.trim()) {
      navigate("/services");
    }
  };

  const navItems = [
    { path: "/", label: "首页" },
    { path: "/services", label: "服务大厅" },
    { path: "/cases", label: "我的办件" },
    { path: "/certificates", label: "电子证照" },
    { path: "/profile", label: "个人中心" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-ink-border shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 gov-gradient rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-bold text-ink leading-tight">
                  昆山市政务服务
                </h1>
                <p className="text-xs text-ink-light">一网通办 · 统一工作台</p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname === item.path
                      ? "bg-gov-50 text-gov-700"
                      : "text-ink hover:bg-ink-bg hover:text-gov-600"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center bg-ink-bg rounded-lg px-3 py-1.5 w-64 focus-within:ring-2 focus-within:ring-gov-400 transition-all"
            >
              <Search className="w-4 h-4 text-ink-light" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="搜索服务事项..."
                className="flex-1 bg-transparent border-none outline-none text-sm ml-2 text-ink placeholder:text-ink-light"
              />
            </form>

            {isLoggedIn ? (
              <>
                <button
                  className="relative p-2 rounded-md hover:bg-ink-bg transition-colors"
                  title="消息通知"
                >
                  <Bell className="w-5 h-5 text-ink" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full animate-pulse-soft" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-ink-bg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gov-100 flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-gov-600" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-ink leading-tight">
                        {currentUser?.realName}
                      </p>
                      <p className="text-xs text-ink-light flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-success-500" />
                        L{currentUser?.authLevel}级认证
                      </p>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-card-hover border border-ink-border py-2 animate-fade-in">
                      <div className="px-4 py-2 border-b border-ink-border">
                        <p className="font-medium text-ink">{currentUser?.realName}</p>
                        <p className="text-xs text-ink-light">{currentUser?.phoneMasked}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate("/profile");
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-ink-bg transition-colors"
                      >
                        <User className="w-4 h-4" /> 个人中心
                      </button>
                      {currentView === "citizen" && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            switchView("admin");
                            navigate("/admin/dashboard");
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-ink-bg transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" /> 进入管理端
                        </button>
                      )}
                      {currentView === "admin" && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            switchView("citizen");
                            navigate("/");
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-ink-bg transition-colors"
                        >
                          <User className="w-4 h-4" /> 返回市民端
                        </button>
                      )}
                      <div className="border-t border-ink-border mt-2 pt-2">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                            navigate("/login");
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> 退出登录
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" className="btn-primary">
                <User className="w-4 h-4" /> 登录
              </Link>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-ink-bg"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden py-4 border-t border-ink-border animate-fade-in">
            <form onSubmit={handleSearch} className="mb-4 flex items-center bg-ink-bg rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-ink-light" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="搜索服务事项..."
                className="flex-1 bg-transparent border-none outline-none text-sm ml-2"
              />
            </form>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "px-4 py-2.5 rounded-md text-sm font-medium",
                    location.pathname === item.path
                      ? "bg-gov-50 text-gov-700"
                      : "text-ink hover:bg-ink-bg"
                  )}
                >
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
