import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { getCurrentUser } from "@/utils/auth";
import { useAppStore } from "@/store/useAppStore";
import { AlertTriangle, LogIn } from "lucide-react";

function hardRedirect(path: string) {
  try {
    window.location.replace(path);
  } catch (e) {
    window.location.href = path;
  }
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasUser, setHasUser] = useState(false);
  const storeUser = useAppStore((s) => s.user);
  const syncUserFromStorage = useAppStore((s) => s.syncUserFromStorage);

  useEffect(() => {
    let mounted = true;

    const user = getCurrentUser();
    if (user) {
      if (!storeUser) {
        try {
          syncUserFromStorage();
        } catch (e) {
          // ignore
        }
      }
      if (mounted) {
        setHasUser(true);
        setChecking(false);
      }
    } else {
      if (mounted) {
        setChecking(false);
        setHasUser(false);
        hardRedirect("/login");
      }
    }

    return () => {
      mounted = false;
    };
  }, [storeUser, syncUserFromStorage]);

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

  if (!hasUser) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-hero-grad">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
          <AlertTriangle className="h-12 w-12 text-ember-400" />
          <div className="text-white text-lg font-semibold">未检测到登录状态</div>
          <div className="text-ink-300 text-sm">
            登录凭证已过期或未登录，请先登录再进入工作台
          </div>
          <button
            onClick={() => hardRedirect("/login")}
            className="mt-2 flex items-center gap-2 rounded-lg bg-ember-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-ember-600"
          >
            <LogIn className="h-4 w-4" />
            前往登录
          </button>
        </div>
      </div>
    );
  }

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
