import { Link, useLocation } from "react-router-dom";
import { Bell, Search, ChevronRight, Package, LogOut, User } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { logout } from "@/utils/auth";
import { useMemo, useState } from "react";

const routeTitleMap: Record<string, string> = {
  dashboard: "工作台",
  "print-center": "云打印中心",
  customers: "客户关系管理",
  "order-entry": "智能录单",
  tracking: "物流轨迹查询",
  analytics: "网点经营看板",
  finance: "分账对账中心",
  settings: "系统设置",
};

export default function Topbar() {
  const { user, announcements, logout: storeLogout } = useAppStore();
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const crumbs = useMemo(() => {
    const parts = loc.pathname.split("/").filter(Boolean);
    return parts.map((p, i) => ({
      label: routeTitleMap[p] || p,
      path: "/" + parts.slice(0, i + 1).join("/"),
    }));
  }, [loc.pathname]);

  const doLogout = () => {
    try {
      storeLogout();
      logout();
    } catch (e) {}
    try {
      window.location.replace("/login");
    } catch (e) {
      window.location.href = "/login";
    }
  };

  return (
    <header className="h-16 border-b border-divider bg-white/80 backdrop-blur sticky top-0 z-30 flex items-center px-6 gap-6">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/dashboard" className="text-ink-400 hover:text-ink-700 flex items-center gap-1.5">
          <Package size={14} />
          <span>速驿通</span>
        </Link>
        {crumbs.map((c, i) => (
          <span key={c.path} className="flex items-center gap-1.5">
            <ChevronRight size={12} className="text-ink-300" />
            <Link to={c.path} className={i === crumbs.length - 1 ? "text-ink-800 font-medium" : "text-ink-500"}>
              {c.label}
            </Link>
          </span>
        ))}
      </div>

      <div className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            placeholder="搜索运单号 / 客户手机号 / 订单号"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-ink-100 bg-ink-50 text-sm focus:border-ember-400 focus:bg-white focus:ring-2 focus:ring-ember-500/10 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-ink-500 hover:bg-ink-50 transition-colors relative">
            <Bell size={18} />
            {announcements.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-ember-500 animate-pulseGlow" />
            )}
          </button>
          <div className="absolute right-0 top-12 w-80 app-card p-3 hidden group-hover:block z-50">
            <div className="text-sm font-semibold mb-2">公告通知</div>
            <div className="space-y-2">
              {announcements.slice(0, 3).map((a) => (
                <div key={a.id} className="p-2 rounded-lg hover:bg-ink-50">
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <span
                      className={
                        "chip " +
                        (a.type === "warning"
                          ? "bg-ember-50 text-ember-600"
                          : a.type === "success"
                          ? "bg-mint-50 text-mint-600"
                          : "bg-ink-50 text-ink-600")
                      }
                    >
                      {a.type === "warning" ? "提醒" : a.type === "success" ? "通知" : "公告"}
                    </span>
                    <span>{a.date}</span>
                  </div>
                  <div className="text-sm font-medium mt-1">{a.title}</div>
                  <div className="text-xs text-ink-500 mt-0.5">{a.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-ink-100" />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
            className="flex items-center gap-3 rounded-lg hover:bg-ink-50 px-2 py-1.5 transition"
          >
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{user?.realName}</div>
              <div className="text-[11px] text-ink-400">{user?.branchName}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ember-400 to-ember-600 flex items-center justify-center text-white font-semibold shadow-glow/60">
              {user?.realName?.charAt(0) || "U"}
            </div>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-ink-100 bg-white p-1 shadow-card-hover z-50 animate-slideUp">
              <div className="px-3 py-2.5 border-b border-ink-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ember-400 to-ember-600 flex items-center justify-center text-white text-sm font-semibold">
                    {user?.realName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-ink-800">{user?.realName}</div>
                    <div className="text-[11px] text-ink-400">
                      {user?.role === "branch_admin"
                        ? "网点管理员"
                        : user?.role === "courier"
                        ? "快递员"
                        : "区域主管"}
                    </div>
                  </div>
                </div>
              </div>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-600 hover:bg-ink-50 rounded-lg transition">
                <User size={14} />
                个人资料
              </button>
              <button
                onClick={doLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-alert-600 hover:bg-alert-50 rounded-lg transition"
              >
                <LogOut size={14} />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
