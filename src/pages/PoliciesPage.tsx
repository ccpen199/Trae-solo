import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  HardDrive,
  Download,
  ChevronDown,
  Wifi,
  WifiOff,
  Settings2,
} from "lucide-react";
import { policiesApi } from "@/api";
import { useOfflineCache } from "@/hooks/useOfflineCache";
import { useAppStore } from "@/store/useAppStore";
import AppLayout from "@/components/AppLayout";
import type { PolicyDocument } from "../../shared/types";
import { cn } from "@/lib/utils";

const DEPARTMENTS = [
  { key: "all", label: "全部" },
  { key: "人社局", label: "人社局" },
  { key: "住建局", label: "住建局" },
  { key: "教育局", label: "教育局" },
  { key: "医保局", label: "医保局" },
  { key: "商务局", label: "商务局" },
  { key: "公安局", label: "公安局" },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export default function PoliciesPage() {
  const navigate = useNavigate();
  const { isCached } = useOfflineCache();
  const { isOnline, setOnline, showToast } = useAppStore();
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [activeDept, setActiveDept] = useState("all");
  const [onlyCached, setOnlyCached] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, [setOnline]);

  useEffect(() => {
    async function loadPolicies() {
      setLoading(true);
      try {
        const data = await policiesApi.getList();
        setPolicies(data);
      } catch {
        showToast("加载政策列表失败", "error");
      } finally {
        setLoading(false);
      }
    }
    if (isOnline) {
      loadPolicies();
    }
  }, [isOnline, showToast]);

  const filteredPolicies = useMemo(() => {
    let list = policies;
    if (activeDept !== "all") {
      list = list.filter((p) => p.department.includes(activeDept));
    }
    if (onlyCached) {
      list = list.filter((p) => isCached(p.id));
    }
    return list;
  }, [policies, activeDept, onlyCached, isCached]);

  const handleCardClick = (policy: PolicyDocument) => {
    if (isCached(policy.id) || isOnline) {
      navigate(`/policies/${policy.id}`);
    } else {
      showToast("请先联网缓存", "warning");
    }
  };

  return (
    <AppLayout className="bg-slate-50">
      {!isOnline && (
        <div className="bg-slate-700 text-white text-xs py-2 px-4 text-center flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          当前离线模式，仅展示已缓存内容
        </div>
      )}

      <header className="sticky top-0 z-20 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-serif text-lg font-semibold text-slate-800">
            政策中心
          </h1>
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-1 text-xs text-brand-600 font-medium px-3 py-1.5 rounded-full bg-brand-50 hover:bg-brand-100 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            离线管理
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept.key}
                  onClick={() => setActiveDept(dept.key)}
                  className={cn(
                    "flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                    activeDept === dept.key
                      ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {dept.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-3 bg-white border-b border-slate-100">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              checked={onlyCached}
              onChange={(e) => setOnlyCached(e.target.checked)}
              className="sr-only"
            />
            <div
              className={cn(
                "w-9 h-5 rounded-full transition-colors duration-200",
                onlyCached ? "bg-brand-500" : "bg-slate-200"
              )}
            />
            <div
              className={cn(
                "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                onlyCached ? "translate-x-4" : "translate-x-0"
              )}
            />
          </div>
          <span className="text-sm text-slate-600">仅看已缓存</span>
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-slate-400 ml-auto" />
          )}
        </label>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card p-4 space-y-2.5"
              >
                <div className="skeleton h-5 w-3/4" />
                <div className="flex gap-2">
                  <div className="skeleton h-5 w-16" />
                  <div className="skeleton h-5 w-20" />
                </div>
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-5/6" />
              </div>
            ))}
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <HardDrive className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">
              {onlyCached ? "暂无已缓存的政策" : "暂无政策内容"}
            </p>
          </div>
        ) : (
          filteredPolicies.map((policy, idx) => {
            const cached = isCached(policy.id);
            return (
              <div
                key={policy.id}
                onClick={() => handleCardClick(policy)}
                className={cn(
                  "card p-4 cursor-pointer animate-fade-in-up",
                  !cached && !isOnline && "opacity-60 cursor-not-allowed"
                )}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-base font-semibold text-slate-800 leading-snug mb-2">
                      {policy.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="chip bg-brand-50 text-brand-700">
                        {policy.category}
                      </span>
                      <span className="chip bg-slate-100 text-slate-600">
                        {policy.department.length > 10
                          ? policy.department.slice(0, 10) + "..."
                          : policy.department}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(policy.publishedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                      {policy.summary}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                      cached
                        ? "bg-emerald-50 text-emerald-500"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {cached ? (
                      <HardDrive className="w-5 h-5" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </AppLayout>
  );
}
