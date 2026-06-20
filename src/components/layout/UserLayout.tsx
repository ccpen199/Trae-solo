import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronRight,
  Package,
  ArrowLeftRight,
  Leaf,
  Settings,
  User,
  Bell,
  Search,
} from "lucide-react";
import { Link, useLocation, Outlet } from "react-router-dom";

interface UserLayoutProps {}

interface MenuItem {
  label: string;
  href: string;
  icon: typeof Package;
}

const menuItems: MenuItem[] = [
  { label: "我的订单", href: "/user/orders", icon: Package },
  { label: "退货履约", href: "/user/returns", icon: ArrowLeftRight },
  { label: "环保证书", href: "/user/certificates", icon: Leaf },
  { label: "账户设置", href: "/user/settings", icon: Settings },
];

export default function UserLayout(_props: UserLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getBreadcrumb = () => {
    const item = menuItems.find((m) => location.pathname.startsWith(m.href));
    if (!item) return ["用户中心"];
    return ["用户中心", item.label];
  };

  const breadcrumb = getBreadcrumb();

  const renderSidebar = () => (
    <aside
      className={`flex h-full flex-col border-r border-gold-500/10 bg-ink-900 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-gold-500/10 px-4">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-gold-400" />
            </div>
            <span className="font-display text-lg font-bold gold-text">用户中心</span>
          </motion.div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto rounded-lg p-2 text-ink-300 transition-colors hover:bg-ink-800 hover:text-gold-500"
        >
          <Menu className="h-5 w-5 md:hidden" onClick={() => setMobileOpen(false)} />
          <Menu className="h-5 w-5 hidden md:block" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.href);
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                  isActive
                    ? "bg-gold-500/10 text-gold-400 ring-1 ring-gold-500/30 shadow-gold-sm"
                    : "text-ink-300 hover:bg-ink-800 hover:text-ink-100"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-gold-500" : "text-ink-400 group-hover:text-gold-400"}`} />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap text-sm font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="border-t border-gold-500/10 p-3">
        <div className={`flex items-center gap-3 rounded-xl bg-ink-800 p-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center ring-2 ring-gold-500/30">
            <User className="h-5 w-5 text-ink-900" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-100">张明远</p>
              <p className="truncate text-xs text-ink-400">138****8888</p>
            </motion.div>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-ink-800">
      <div className="hidden md:block">{renderSidebar()}</div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween" }}
              className="absolute inset-y-0 left-0 w-72"
              onClick={(e) => e.stopPropagation()}
            >
              {renderSidebar()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gold-500/10 bg-ink-900/80 backdrop-blur-xl px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-ink-300 hover:bg-ink-800 md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav className="flex items-center text-sm text-ink-300">
              {breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center">
                  {i > 0 && <ChevronRight className="mx-2 h-4 w-4 text-ink-500" />}
                  <span className={i === breadcrumb.length - 1 ? "font-medium text-gold-400" : "text-ink-400"}>
                    {crumb}
                  </span>
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button className="hidden items-center gap-2 rounded-xl border border-white/[0.06] bg-ink-800 px-3 py-2 text-sm text-ink-400 transition-colors hover:border-gold-500/20 hover:text-ink-200 sm:flex w-64">
              <Search className="h-4 w-4" />
              <span>搜索订单...</span>
            </button>
            <button className="relative rounded-xl p-2 text-ink-300 transition-colors hover:bg-ink-800 hover:text-gold-500">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-coral-500 ring-2 ring-ink-900" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-700 ring-2 ring-gold-500/20">
              <User className="h-5 w-5 text-ink-900" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-ink-800 p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {mobileOpen && (
        <button
          className="fixed right-4 top-18 z-50 rounded-full bg-ink-800 p-2 text-ink-100 shadow-lg md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
