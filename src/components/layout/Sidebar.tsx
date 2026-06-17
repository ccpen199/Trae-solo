import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Vote,
  Wallet,
  Stamp,
  Wrench,
  Handshake,
  Users,
  Building2,
  Home,
  ChevronRight,
  Menu,
  X,
  FileText,
  PlusCircle,
  Eye,
  Receipt,
  FileCheck,
  FolderKanban,
  PackageOpen,
  Gift,
  CircleUser,
  Building,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { cn } from "@/utils";

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  children?: MenuItem[];
}

const menuConfig: MenuItem[] = [
  {
    path: "/dashboard",
    label: "工作台",
    icon: LayoutDashboard,
  },
  {
    path: "/council",
    label: "民主议事",
    icon: Vote,
    children: [
      { path: "/council/motions", label: "议案列表", icon: FileText },
      { path: "/council/motions/new", label: "发起议案", icon: PlusCircle },
    ],
  },
  {
    path: "/finance",
    label: "财务透明",
    icon: Wallet,
    children: [
      { path: "/finance/overview", label: "财务总览", icon: Eye },
      { path: "/finance/invoices", label: "票据管理", icon: Receipt },
      { path: "/finance/audit", label: "审计报告", icon: FileCheck },
    ],
  },
  {
    path: "/seal",
    label: "印章管控",
    icon: Stamp,
    children: [
      { path: "/seal/applications", label: "用章申请", icon: FolderKanban },
      { path: "/seal/applications/new", label: "申请用章", icon: PlusCircle },
      { path: "/seal/cabinet", label: "印章柜监控", icon: Eye },
    ],
  },
  {
    path: "/property",
    label: "物业协同",
    icon: Wrench,
    children: [
      { path: "/property/tickets", label: "报修工单", icon: Wrench },
      { path: "/property/supervision", label: "街道督办", icon: Eye },
    ],
  },
  {
    path: "/economy",
    label: "邻里经济",
    icon: Handshake,
    children: [
      { path: "/economy/home", label: "邻里经济首页", icon: Home },
      { path: "/economy/swap", label: "旧物置换", icon: PackageOpen },
      { path: "/economy/crowdfunding", label: "众筹预售", icon: Gift },
      { path: "/economy/exchange", label: "能量兑换", icon: Gift },
    ],
  },
  {
    path: "/admin",
    label: "后台管理",
    icon: Users,
    children: [
      { path: "/admin/owners", label: "业主管理", icon: CircleUser },
      { path: "/admin/council", label: "业委会管理", icon: Users },
      { path: "/admin/property", label: "物业公司", icon: Building },
      { path: "/admin/street", label: "街道监管", icon: Building2 },
    ],
  },
];

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-40 overflow-hidden"
    >
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-trust-500 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-slate-800 font-display">
                  社区治理
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? (
              <Menu className="w-5 h-5 text-slate-600" />
            ) : (
              <X className="w-5 h-5 text-slate-600" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {menuConfig.map((item, index) => (
            <div key={item.path} className="mb-1">
              <NavLink to={item.path} end={!item.children}>
                {({ isActive: linkActive }) => (
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
                      linkActive || (item.children && isActive(item.path))
                        ? "bg-primary-50 text-primary-700"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <AnimatePresence mode="wait">
                      {!sidebarCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="font-medium text-sm flex-1"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {item.children && !sidebarCollapsed && (
                      <motion.div
                        animate={{
                          rotate:
                            item.children && isActive(item.path) ? 90 : 0,
                        }}
                        className="w-4 h-4 flex-shrink-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </motion.div>
                    )}
                  </div>
                )}
              </NavLink>

              <AnimatePresence>
                {item.children && isActive(item.path) && !sidebarCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-3">
                      {item.children.map((child) => (
                        <NavLink key={child.path} to={child.path} end>
                          {({ isActive: linkActive }) => (
                            <div
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 text-sm",
                                linkActive
                                  ? "bg-primary-50 text-primary-700 font-medium"
                                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              )}
                            >
                              <child.icon className="w-4 h-4 flex-shrink-0" />
                              <span>{child.label}</span>
                            </div>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-gradient-to-br from-primary-50 to-trust-50 rounded-xl p-4"
              >
                <p className="text-xs text-slate-600 mb-2">社区治理平台</p>
                <p className="text-sm font-semibold text-slate-800">
                  v1.0.0
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
