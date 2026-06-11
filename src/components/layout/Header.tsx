import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronLeft, ChevronRight, User } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const breadcrumbMap: Record<string, string> = {
  "/": "首页大厅",
  "/rent": "租号中心",
  "/trade": "买卖市场",
  "/valuation": "估值系统",
  "/recycle": "回收竞价",
  "/insurance": "保险理赔",
  "/preview/demo": "VR预览",
  "/admin": "运营后台",
};

export default function Header() {
  const location = useLocation();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggle = useAppStore((s) => s.toggleSidebar);

  const segments = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.length === 0
    ? [{ label: "首页大厅", path: "/" }]
    : [{ label: "首页大厅", path: "/" }].concat(
        segments.reduce<Array<{ label: string; path: string }>>((acc, seg, i) => {
          const path = "/" + segments.slice(0, i + 1).join("/");
          const key = Object.keys(breadcrumbMap).find(
            (k) => k === path || k === "/" + seg
          );
          acc.push({
            label: key ? breadcrumbMap[key] : seg,
            path,
          });
          return acc;
        }, [])
      );

  return (
    <header className="h-14 glass-panel rounded-none border-b border-cyber-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="p-1.5 rounded-md text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-hover transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-cyber-border">
                  <ChevronRight size={14} />
                </span>
              )}
              <span
                className={
                  i === breadcrumbs.length - 1
                    ? "text-cyber-cyan font-medium"
                    : "text-cyber-muted"
                }
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/login"
          className="hidden sm:inline-flex text-xs font-bold px-3 py-1.5 rounded-lg border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors"
        >
          登录
        </Link>
        <Link
          to="/register"
          className="hidden sm:inline-flex text-xs font-bold px-3 py-1.5 rounded-lg bg-cyber-purple/20 border border-cyber-purple/40 text-cyber-purple hover:bg-cyber-purple/30 transition-colors"
        >
          注册
        </Link>
        <button className="relative p-2 rounded-lg text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-hover transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyber-red rounded-full" />
        </button>

        <Link to="/login" className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-cyber-hover border border-cyber-border flex items-center justify-center group-hover:border-cyber-cyan/40 transition-colors">
            <User size={16} className="text-cyber-muted group-hover:text-cyber-cyan transition-colors" />
          </div>
        </Link>
      </div>
    </header>
  );
}
