import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MapPin,
  Warehouse,
  ShieldCheck,
  Recycle,
  Box,
  Users,
  Search,
  Bell,
  User,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { Link, useLocation, Outlet } from "react-router-dom";
import Breadcrumb from "@/components/admin/Breadcrumb";
import type { BreadcrumbItem } from "@/components/admin/Breadcrumb";

interface AdminLayoutProps {}

interface SidebarItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  breadcrumb: BreadcrumbItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    label: "运营总览",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    breadcrumb: [{ label: "运营总览" }],
  },
  {
    label: "城市网络",
    href: "/admin/city-network",
    icon: MapPin,
    breadcrumb: [{ label: "运营中心" }, { label: "城市网络" }],
  },
  {
    label: "库存周转",
    href: "/admin/inventory",
    icon: Warehouse,
    breadcrumb: [{ label: "仓储中心" }, { label: "库存周转" }],
  },
  {
    label: "质量飞检",
    href: "/admin/quality",
    icon: ShieldCheck,
    breadcrumb: [{ label: "质检中心" }, { label: "质量飞检" }],
  },
  {
    label: "环保计量",
    href: "/admin/eco-metrics",
    icon: Recycle,
    breadcrumb: [{ label: "可持续发展" }, { label: "环保计量" }],
  },
  {
    label: "商品库管理",
    href: "/admin/products",
    icon: Box,
    breadcrumb: [{ label: "基础数据" }, { label: "商品库" }],
  },
  {
    label: "检测师管理",
    href: "/admin/inspectors",
    icon: Users,
    breadcrumb: [{ label: "人力资源" }, { label: "检测师" }],
  },
];

export default function AdminLayout(_props: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentItem = sidebarItems.find((item) => location.pathname.startsWith(item.href));
  const breadcrumb = currentItem?.breadcrumb ?? [];

  const renderSidebar = () => (
    <aside
      className={`relative flex h-full flex-col bg-gradient-to-b from-ink-950 via-ink-900 to-ink-950 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-forest-900/40 via-transparent to-gold-900/20 pointer-events-none" />

      <div className="relative flex h-16 items-center justify-between border-b border-gold-500/15 px-4">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2.5"
          >
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-forest-500 via-forest-600 to-forest-800 flex items-center justify-center shadow-gold-sm" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold-400/40 to-transparent" />
            </div>
            <div>
              <h1 className="font-display text-base font-bold gold-text leading-tight">奢收管家</h1>
              <p className="text-[10px] text-ink-400 tracking-wider">ADMIN CONSOLE</p>
            </div>
          </motion.div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-800 hover:text-gold-500"
        >
          <Menu className="h-5 w-5 hidden md:block" />
          <X className="h-5 w-5 md:hidden" onClick={() => setMobileOpen(false)} />
        </button>
      </div>

      <nav className="relative flex-1 space-y-1 p-3">
        {sidebarItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.href);
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Link
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-forest-500/20 via-forest-500/10 to-transparent text-gold-400 ring-1 ring-forest-500/30 shadow-gold-sm"
                    : "text-ink-300 hover:bg-ink-800/60 hover:text-ink-100"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-gradient-to-b from-gold-400 to-forest-400"
                  />
                )}
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    isActive ? "text-gold-400" : "text-ink-400 group-hover:text-gold-400"
                  }`}
                />
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

      <div className="relative border-t border-gold-500/15 p-3">
        <div
          className={`flex items-center gap-3 rounded-xl bg-ink-800/50 border border-white/[0.04] p-3 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="relative h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-gold-500 via-gold-600 to-gold-800 flex items-center justify-center ring-2 ring-gold-500/30">
            <User className="h-5 w-5 text-ink-950" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-jade-500 ring-2 ring-ink-900" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-semibold text-ink-100">运营管理员</p>
                <ChevronDown className="h-4 w-4 text-ink-500" />
              </div>
              <p className="truncate text-xs text-forest-400">超级管理员权限</p>
            </motion.div>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-ink-900">
      <div className="hidden md:block">{renderSidebar()}</div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="absolute inset-y-0 left-0 w-72 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {renderSidebar()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-gold-500/10 bg-ink-950/70 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between gap-4 px-4 md:px-8">
            <div className="flex items-center gap-4 min-w-0">
              <button
                className="rounded-lg p-2 text-ink-300 hover:bg-ink-800 md:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden md:block min-w-0">
                <Breadcrumb items={breadcrumb} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-white/[0.06] bg-ink-850 px-3 py-2 lg:flex w-72">
                <Search className="h-4 w-4 text-ink-400" />
                <input
                  placeholder="搜索订单 / 检测师 / 商品..."
                  className="w-full bg-transparent text-sm text-ink-100 placeholder-ink-500 outline-none"
                />
                <kbd className="rounded border border-white/[0.08] bg-ink-800 px-1.5 py-0.5 text-[10px] text-ink-400">
                  ⌘K
                </kbd>
              </div>

              <button className="relative rounded-xl border border-white/[0.06] bg-ink-850 p-2.5 text-ink-300 transition-all hover:border-gold-500/30 hover:text-gold-500 hover:shadow-gold-sm">
                <Bell className="h-5 w-5" />
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white ring-2 ring-ink-950"
                >
                  8
                </motion.span>
              </button>

              <div className="h-9 w-px bg-white/[0.08]" />

              <div className="hidden items-center gap-3 sm:flex">
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink-100 leading-tight">李运营</p>
                  <p className="text-[11px] text-forest-400">今日已处理 23 单</p>
                </div>
                <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center ring-2 ring-gold-500/20">
                  <User className="h-5 w-5 text-ink-950" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gradient-to-b from-ink-900 via-ink-950 to-ink-900 p-4 md:p-8">
          <div className="mx-auto max-w-[1600px]">
            <div className="md:hidden mb-6">
              <Breadcrumb items={breadcrumb} />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
