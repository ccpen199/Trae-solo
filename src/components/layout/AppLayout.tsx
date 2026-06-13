import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAppStore } from "@/store/useAppStore";
import { AlertTriangle } from "lucide-react";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [checkFailed, setCheckFailed] = useState(false);
  const user = useAppStore((s) => s.user);
  const nav = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function doCheck() {
      try {
        await useAppStore.persist.rehydrate();
      } catch (e) {
        console.warn("rehydrate error", e);
      }

      if (!mounted) return;

      const currentUser = useAppStore.getState().user;
      if (currentUser) {
        setChecking(false);
      } else {
        setChecking(false);
        nav("/login", { replace: true });
      }
    }

    const failTimer = setTimeout(() => {
      if (mounted && !useAppStore.getState().user) {
        setCheckFailed(true);
        setChecking(false);
        nav("/login", { replace: true });
      }
    }, 2000);

    doCheck();

    return () => {
      mounted = false;
      clearTimeout(failTimer);
    };
  }, [nav]);

  useEffect(() => {
    if (!checking && !user && !checkFailed) {
      nav("/login", { replace: true });
    }
  }, [user, checking, checkFailed, nav]);

  if (checking) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-hero-grad">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ember-500/30 border-t-ember-500" />
          <div className="text-ink-300 text-sm">正在进入工作台...</div>
          <div className="text-ink-500 text-xs">正在加载用户身份验证</div>
        </div>
      </div>
    );
  }

  if (checkFailed) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-hero-grad">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-ember-400" />
          <div className="text-white text-lg font-semibold">登录验证超时</div>
          <div className="text-ink-300 text-sm">请返回登录页重新登录</div>
          <button
            onClick={() => {
              localStorage.removeItem("syt-app-store");
              nav("/login", { replace: true });
            }}
            className="btn-primary mt-2"
          >
            清除缓存并返回登录
          </button>
        </div>
      </div>
    );
  }

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
