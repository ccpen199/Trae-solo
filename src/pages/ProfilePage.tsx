import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  ShieldCheck,
  Shield,
  Star,
  Receipt,
  HardDrive,
  Database,
  MapPin,
  Info,
  LogOut,
  ChevronRight,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { userApi } from "@/api";
import { useOfflineCache } from "@/hooks/useOfflineCache";
import { useAppStore } from "@/store/useAppStore";
import AppLayout from "@/components/AppLayout";
import type { UserProfile, Favorite } from "../../shared/types";
import { cn } from "@/lib/utils";

type FavTab = "poi" | "policy" | "service";

interface ParsedFav {
  id: string;
  name: string;
  sub?: string;
}

function parseFavorite(fav: Favorite): ParsedFav | null {
  try {
    const data = JSON.parse(fav.targetData) as Record<string, string>;
    if (fav.targetType === "poi") {
      return { id: data.id, name: data.name, sub: data.address };
    }
    if (fav.targetType === "policy") {
      return { id: data.id, name: data.title, sub: data.category };
    }
    if (fav.targetType === "service") {
      return { id: data.id, name: data.name, sub: data.category };
    }
    return null;
  } catch {
    return null;
  }
}

const MENU_ITEMS = [
  {
    key: "favorites",
    icon: Star,
    label: "我的收藏",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    key: "records",
    icon: Receipt,
    label: "缴费记录",
    color: "text-brand-500",
    bg: "bg-brand-50",
  },
  {
    key: "offline",
    icon: HardDrive,
    label: "离线缓存",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    key: "cache-mgmt",
    icon: Database,
    label: "缓存管理",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    key: "lbs",
    icon: MapPin,
    label: "LBS定位设置",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    key: "about",
    icon: Info,
    label: "关于",
    color: "text-slate-500",
    bg: "bg-slate-100",
  },
];

const FAV_TABS: { key: FavTab; label: string }[] = [
  { key: "poi", label: "POI" },
  { key: "policy", label: "政策" },
  { key: "service", label: "服务" },
];

function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + "****" + phone.slice(-4);
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { cachedPolicies, clearCache, cacheSize } = useOfflineCache();
  const {
    user,
    setUser,
    favorites,
    setFavorites,
    removeFavorite,
    showToast,
    reset,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<FavTab>("poi");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        if (!user) {
          const profile = await userApi.getProfile();
          setUser(profile);
        }
        const favs = await userApi.getFavorites();
        setFavorites(favs);
      } catch {
        showToast("加载用户信息失败", "error");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [user, setUser, setFavorites, showToast]);

  const filteredFavs = favorites.filter((f) => f.targetType === activeTab);

  const handleClearCache = () => {
    if (cacheSize === 0) return;
    if (window.confirm(`确定要清空 ${cacheSize} 条缓存政策吗？`)) {
      clearCache();
      showToast("缓存已清空", "success");
    }
  };

  const handleRemoveFav = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavorite(id);
    showToast("已删除收藏", "info");
  };

  const handleLogout = () => {
    if (window.confirm("确定要退出登录吗？")) {
      reset();
      showToast("已退出登录（演示模式）", "info");
    }
  };

  const handleMenuClick = (key: string) => {
    switch (key) {
      case "offline":
      case "cache-mgmt":
        showToast("缓存管理功能", "info");
        break;
      case "favorites":
        showToast("我的收藏", "info");
        break;
      case "records":
        navigate("/payment");
        break;
      case "lbs":
        showToast("LBS定位设置", "info");
        break;
      case "about":
        showToast("青岛市民通 v1.0.0", "info");
        break;
    }
  };

  const displayUser: UserProfile | null = user ?? {
    id: "demo",
    phone: "13800138000",
    name: "演示用户",
    verified: true,
    createdAt: new Date().toISOString(),
  };

  const approxSpace = (cacheSize * 8).toFixed(1);

  return (
    <AppLayout className="bg-slate-50">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-serif text-lg font-semibold text-slate-800">
            个人中心
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        <div className="card p-5 bg-gradient-to-br from-brand-500 to-brand-700 text-white border-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-2 ring-white/30">
              <User className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-serif text-xl font-semibold truncate">
                  {displayUser?.name ?? "加载中..."}
                </h2>
                {displayUser?.verified ? (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-400/30 text-xs font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    已实名
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-400/30 text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    未实名
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-white/80 text-sm">
                <Phone className="w-3.5 h-3.5" />
                {maskPhone(displayUser?.phone ?? "")}
              </div>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          {MENU_ITEMS.map((item, idx) => (
            <button
              key={item.key}
              onClick={() => handleMenuClick(item.key)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left",
                idx !== MENU_ITEMS.length - 1 && "border-b border-slate-100"
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center",
                  item.bg,
                  item.color
                )}
              >
                <item.icon className="w-4.5 h-4.5" />
              </div>
              <span className="flex-1 text-sm text-slate-700 font-medium">
                {item.label}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base font-semibold text-slate-800">
              我的收藏
            </h3>
            <span className="text-xs text-slate-400">
              共 {favorites.length} 条
            </span>
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
            {FAV_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                  activeTab === tab.key
                    ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredFavs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Star className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">暂无{FAV_TABS.find((t) => t.key === activeTab)?.label}收藏</p>
              </div>
            ) : (
              filteredFavs.map((fav) => {
                const parsed = parseFavorite(fav);
                if (!parsed) return null;
                return (
                  <div
                    key={fav.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-brand-500">
                      <Star className="w-4.5 h-4.5 fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {parsed.name}
                      </p>
                      {parsed.sub && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {parsed.sub}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleRemoveFav(fav.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base font-semibold text-slate-800">
              缓存管理
            </h3>
            {cacheSize > 0 && (
              <button
                onClick={handleClearCache}
                className="flex items-center gap-1 text-xs text-rose-500 font-medium hover:text-rose-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                一键清空
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-emerald-50">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-emerald-700 font-medium">
                  已缓存政策
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-600 font-serif">
                {cacheSize}
                <span className="text-sm font-normal ml-1">条</span>
              </p>
            </div>
            <div className="p-4 rounded-xl bg-violet-50">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-violet-500" />
                <span className="text-xs text-violet-700 font-medium">
                  占用空间
                </span>
              </div>
              <p className="text-2xl font-bold text-violet-600 font-serif">
                {approxSpace}
                <span className="text-sm font-normal ml-1">KB</span>
              </p>
            </div>
          </div>

          {cacheSize > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                离线模式下可查看已缓存的政策内容，建议定期清理不再需要的缓存以释放空间。
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-xl bg-white border border-rose-200 text-rose-500 font-medium text-sm flex items-center justify-center gap-2 hover:bg-rose-50 hover:border-rose-300 transition-all active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>

        <p className="text-center text-xs text-slate-400 py-4">
          青岛市民通 v1.0.0
        </p>
      </div>
    </AppLayout>
  );
}
