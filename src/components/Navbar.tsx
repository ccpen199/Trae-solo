import { useState, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogIn, ChevronDown, LayoutDashboard, UserCircle, LogOut, Building2, Users, UserCheck, Zap, ClipboardCheck, Settings } from "lucide-react";
import { useAppStore, ROLE_LABELS } from "@/store";
import LangSwitcher from "./LangSwitcher";
import BilingualText from "./BilingualText";
import LoginModal from "./LoginModal";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const restrictedPaths = ["/admin", "/profile"];

const navLinks = [
  { path: "/", zh: "首页", it: "Home" },
  { path: "/translate", zh: "智能互译", it: "Traduzione" },
  { path: "/projects", zh: "项目库", it: "Progetti" },
  { path: "/pocket-translator", zh: "随身翻译", it: "Tascabile" },
  { path: "/news", zh: "资讯聚合", it: "Notizie" },
  { path: "/admin", zh: "后台管理", it: "Admin" },
  { path: "/profile", zh: "个人中心", it: "Profilo" },
];

const roleIcons: Record<UserRole, typeof UserCheck> = {
  government: Building2,
  culture: Users,
  public: UserCheck,
  translator: Zap,
  reviewer: ClipboardCheck,
  admin: Settings,
};

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { lang, user, logout, setLoginModalOpen, isLoginModalOpen } = useAppStore();
  const navigate = useNavigate();

  const isLoggedIn = !!user;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDropdownOpen || isLoginModalOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isDropdownOpen, isLoginModalOpen]);

  const handleRestrictedClick = (path: string, e: React.MouseEvent) => {
    if (!isLoggedIn && restrictedPaths.includes(path)) {
      e.preventDefault();
      setLoginModalOpen(true);
      return false;
    }
    return true;
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate("/");
  };

  const handleDashboardClick = () => {
    if (!user) return;
    setIsDropdownOpen(false);
    const dashboardRoute = ROLE_LABELS[user.role].dashboardRoute;
    navigate(dashboardRoute);
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    navigate("/profile");
  };

  const getUserInitials = () => {
    if (!user) return "";
    const name = lang === "zh" ? user.nameZh : user.nameIt;
    if (lang === "zh") {
      return name.charAt(name.length - 1);
    }
    return name.split(" ").map((n) => n.charAt(0)).slice(0, 2).join("").toUpperCase();
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-ivory-100/80 backdrop-blur-xl shadow-elegant border-b border-warm-gold-500/10"
          : "bg-transparent"
      )}
    >
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center">
              <span className="text-2xl">🇨🇳</span>
              <div className="w-1 h-6 mx-0.5 bg-gradient-to-b from-cn-red-500 via-warm-gold-500 to-it-green-500 rounded-full" />
              <span className="text-2xl">🇮🇹</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display-zh text-lg font-bold bg-clip-text text-transparent bg-text-gradient-cnit">
                中意桥
              </span>
              <span className="font-display-it text-xs text-charcoal-400 -mt-0.5">
                Ponte Cina-Italia
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === "/"}
                onClick={(e) => handleRestrictedClick(link.path, e)}
                className={({ isActive }) =>
                  cn("nav-link", isActive && "nav-link-active")
                }
              >
                <BilingualText zh={link.zh} it={link.it} />
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <LangSwitcher />

            <div className="hidden md:block" ref={dropdownRef}>
              {isLoggedIn && user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={cn(
                      "flex items-center gap-2 rounded-full p-0.5 transition-all duration-300",
                      "bg-gradient-cnit hover:shadow-hover",
                      isDropdownOpen && "shadow-hover"
                    )}
                  >
                    <div className="flex items-center gap-2 rounded-full bg-ivory-100 pl-1 pr-3 py-1">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br shadow-sm",
                        ROLE_LABELS[user.role].color
                      )}>
                        {getUserInitials()}
                      </div>
                      <span className="text-sm font-medium text-charcoal-500 max-w-[120px] truncate">
                        {lang === "zh" ? user.nameZh : user.nameIt}
                      </span>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-charcoal-400 transition-transform duration-200",
                        isDropdownOpen && "rotate-180"
                      )} />
                    </div>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-2xl border border-charcoal-500/5 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right duration-200 z-50">
                      <div className="p-4 bg-gradient-cnit/5 border-b border-charcoal-500/5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br shadow-md flex-shrink-0",
                            ROLE_LABELS[user.role].color
                          )}>
                            {getUserInitials()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-charcoal-600 truncate">
                              {lang === "zh" ? user.nameZh : user.nameIt}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {(() => {
                                const Icon = roleIcons[user.role];
                                return <Icon className="w-3 h-3 text-warm-gold-500" />;
                              })()}
                              <span className="text-xs text-charcoal-400">
                                {lang === "zh" ? ROLE_LABELS[user.role].zh : ROLE_LABELS[user.role].it}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-charcoal-400 mt-2 truncate font-mono">
                          {user.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={handleDashboardClick}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                            "text-charcoal-500 hover:bg-warm-gold-500/10 hover:text-charcoal-600"
                          )}
                        >
                          <LayoutDashboard className="w-4 h-4 text-warm-gold-500" />
                          <BilingualText zh="前往工作台" it="Vai alla Dashboard" />
                        </button>
                        <button
                          onClick={handleProfileClick}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                            "text-charcoal-500 hover:bg-warm-gold-500/10 hover:text-charcoal-600"
                          )}
                        >
                          <UserCircle className="w-4 h-4 text-it-green-500" />
                          <BilingualText zh="个人中心" it="Profilo Personale" />
                        </button>
                      </div>

                      <div className="px-3 py-2 border-t border-charcoal-500/5">
                        <button
                          onClick={handleLogout}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            "text-cn-red-600 hover:bg-cn-red-50"
                          )}
                        >
                          <LogOut className="w-4 h-4" />
                          <BilingualText zh="退出登录" it="Esci" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="btn-primary text-sm !py-2 !px-4"
                >
                  <LogIn className="w-4 h-4" />
                  <BilingualText zh="登录" it="Accedi" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "lg:hidden inline-flex items-center justify-center p-2 rounded-lg",
                "text-charcoal-500 hover:text-cn-red-500 hover:bg-charcoal-500/5",
                "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-warm-gold-500/30"
              )}
              aria-label="菜单"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300 ease-out",
            isMobileMenuOpen ? "max-h-[800px] pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col gap-1 pt-2 border-t border-charcoal-500/10">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === "/"}
                onClick={(e) => {
                  const allowed = handleRestrictedClick(link.path, e);
                  if (allowed) setIsMobileMenuOpen(false);
                }}
                className={({ isActive }) =>
                  cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    "flex items-center gap-2",
                    isActive
                      ? "bg-gradient-cnit/10 text-cn-red-600"
                      : "text-charcoal-500 hover:bg-charcoal-500/5 hover:text-cn-red-500",
                    !isLoggedIn && restrictedPaths.includes(link.path) && "pr-8"
                  )
                }
              >
                <BilingualText zh={link.zh} it={link.it} />
                {!isLoggedIn && restrictedPaths.includes(link.path) && (
                  <span className="ml-auto text-xs bg-cn-red-50 text-cn-red-600 px-2 py-0.5 rounded-full">
                    <BilingualText zh="需登录" it="Login" />
                  </span>
                )}
              </NavLink>
            ))}
            <div className="pt-2 mt-2 border-t border-charcoal-500/10">
              {isLoggedIn && user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-cnit/5">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br shadow-md flex-shrink-0",
                      ROLE_LABELS[user.role].color
                    )}>
                      {getUserInitials()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-charcoal-600 truncate">
                        {lang === "zh" ? user.nameZh : user.nameIt}
                      </p>
                      <p className="text-xs text-charcoal-400 truncate">
                        {lang === "zh" ? ROLE_LABELS[user.role].zh : ROLE_LABELS[user.role].it}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleDashboardClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm",
                      "bg-white border border-charcoal-500/5 text-charcoal-500",
                      "hover:bg-warm-gold-500/10 transition-colors"
                    )}
                  >
                    <LayoutDashboard className="w-4 h-4 text-warm-gold-500" />
                    <BilingualText zh="前往工作台" it="Vai alla Dashboard" />
                  </button>

                  <button
                    onClick={() => {
                      handleProfileClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm",
                      "bg-white border border-charcoal-500/5 text-charcoal-500",
                      "hover:bg-warm-gold-500/10 transition-colors"
                    )}
                  >
                    <UserCircle className="w-4 h-4 text-it-green-500" />
                    <BilingualText zh="个人中心" it="Profilo Personale" />
                  </button>

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm",
                      "bg-cn-red-50 text-cn-red-600 hover:bg-cn-red-100 transition-colors"
                    )}
                  >
                    <LogOut className="w-4 h-4" />
                    <BilingualText zh="退出登录" it="Esci" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setLoginModalOpen(true);
                  }}
                  className="w-full btn-primary"
                >
                  <LogIn className="w-4 h-4" />
                  <BilingualText zh="登录" it="Accedi" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <LoginModal />
    </header>
  );
}
