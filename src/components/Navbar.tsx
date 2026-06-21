import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, X, User, LogIn } from "lucide-react";
import { useAppStore } from "@/store";
import LangSwitcher from "./LangSwitcher";
import BilingualText from "./BilingualText";
import { cn } from "@/lib/utils";

const navLinks = [
  { path: "/", zh: "首页", it: "Home" },
  { path: "/translate", zh: "智能互译", it: "Traduzione" },
  { path: "/projects", zh: "项目库", it: "Progetti" },
  { path: "/pocket-translator", zh: "随身翻译", it: "Tascabile" },
  { path: "/news", zh: "资讯聚合", it: "Notizie" },
  { path: "/admin", zh: "后台管理", it: "Admin" },
  { path: "/profile", zh: "个人中心", it: "Profilo" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { lang } = useAppStore();
  const isLoggedIn = false;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

            <div className="hidden md:block">
              {isLoggedIn ? (
                <button className="flex items-center gap-2 rounded-full p-0.5 bg-gradient-cnit hover:shadow-hover transition-all duration-300">
                  <div className="flex items-center gap-2 rounded-full bg-ivory-100 pl-1 pr-3 py-1">
                    <div className="w-7 h-7 rounded-full bg-charcoal-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-charcoal-500" />
                    </div>
                    <span className="text-sm font-medium text-charcoal-500">
                      <BilingualText zh="用户" it="Utente" />
                    </span>
                  </div>
                </button>
              ) : (
                <button className="btn-primary text-sm !py-2 !px-4">
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
            isMobileMenuOpen ? "max-h-[500px] pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col gap-1 pt-2 border-t border-charcoal-500/10">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === "/"}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-cnit/10 text-cn-red-600"
                      : "text-charcoal-500 hover:bg-charcoal-500/5 hover:text-cn-red-500"
                  )
                }
              >
                <BilingualText zh={link.zh} it={link.it} />
              </NavLink>
            ))}
            <div className="pt-2 mt-2 border-t border-charcoal-500/10">
              {isLoggedIn ? (
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-charcoal-500 hover:bg-charcoal-500/5 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-charcoal-200 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <BilingualText zh="个人中心" it="Profilo" />
                </button>
              ) : (
                <button className="w-full btn-primary">
                  <LogIn className="w-4 h-4" />
                  <BilingualText zh="登录" it="Accedi" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
