import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAppStore } from "@/store/useAppStore";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const user = useAppStore((s) => s.user);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!user) nav("/login", { replace: true });
  }, [user, nav, loc.pathname]);

  if (!user) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-6 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
