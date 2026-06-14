import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  HardDrive,
  Download,
  Calendar,
  Clock,
  Building2,
  FileText,
} from "lucide-react";
import { policiesApi } from "@/api";
import { useOfflineCache } from "@/hooks/useOfflineCache";
import { useAppStore } from "@/store/useAppStore";
import AppLayout from "@/components/AppLayout";
import type { PolicyDocument } from "../../shared/types";
import { cn } from "@/lib/utils";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function parseContent(content: string): Array<{
  type: "paragraph" | "heading" | "list";
  content: string;
  items?: string[];
}> {
  const sections: Array<{
    type: "paragraph" | "heading" | "list";
    content: string;
    items?: string[];
  }> = [];
  const lines = content.split(/[。；\n]/).filter((l) => l.trim());
  let currentList: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[一二三四五六七八九十]+、/.test(trimmed)) {
      if (currentList.length > 0) {
        sections.push({ type: "list", content: "", items: currentList });
        currentList = [];
      }
      sections.push({ type: "heading", content: trimmed });
    } else if (/^\d+[、.．]/.test(trimmed)) {
      currentList.push(trimmed.replace(/^\d+[、.．]\s*/, ""));
    } else {
      if (currentList.length > 0) {
        sections.push({ type: "list", content: "", items: currentList });
        currentList = [];
      }
      sections.push({ type: "paragraph", content: trimmed + "。" });
    }
  }
  if (currentList.length > 0) {
    sections.push({ type: "list", content: "", items: currentList });
  }
  return sections;
}

export default function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addPolicy, isCached, getPolicy } = useOfflineCache();
  const { isOnline, showToast, isFavorite, addFavorite, removeFavorite } =
    useAppStore();
  const [policy, setPolicy] = useState<PolicyDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const fav = id ? isFavorite(id, "policy") : false;

  useEffect(() => {
    async function loadDetail() {
      if (!id) return;
      setLoading(true);
      try {
        const cached = getPolicy(id);
        if (!isOnline && cached) {
          setPolicy(cached);
          return;
        }
        if (isOnline) {
          const data = await policiesApi.getDetail(id);
          setPolicy(data);
        } else if (cached) {
          setPolicy(cached);
        } else {
          showToast("离线状态下未找到缓存内容", "warning");
        }
      } catch {
        const cached = getPolicy(id);
        if (cached) {
          setPolicy(cached);
        } else {
          showToast("加载政策详情失败", "error");
        }
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id, isOnline, getPolicy, showToast]);

  const handleCache = () => {
    if (!policy) return;
    addPolicy(policy);
    showToast("已缓存到本地", "success");
  };

  const handleToggleFav = () => {
    if (!policy) return;
    if (fav) {
      removeFavorite(policy.id);
      showToast("已取消收藏", "info");
    } else {
      addFavorite({
        id: `fav-${Date.now()}`,
        targetType: "policy",
        targetId: policy.id,
        targetData: JSON.stringify({
          id: policy.id,
          title: policy.title,
          category: policy.category,
        }),
        createdAt: new Date().toISOString(),
      });
      showToast("已添加收藏", "success");
    }
  };

  if (loading) {
    return (
      <AppLayout className="bg-white">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="skeleton w-9 h-9 rounded-full" />
            <div className="skeleton h-5 w-32" />
            <div className="skeleton w-16 h-9 rounded-full" />
          </div>
        </header>
        <div className="p-4 space-y-4">
          <div className="skeleton h-8 w-full" />
          <div className="skeleton h-8 w-3/4" />
          <div className="flex gap-3">
            <div className="skeleton h-5 w-24" />
            <div className="skeleton h-5 w-24" />
          </div>
          <div className="space-y-3 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-4 w-full" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!policy) {
    return (
      <AppLayout className="bg-white">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between px-4 py-3.5">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-serif text-lg font-semibold text-slate-800">
              政策详情
            </h1>
            <div className="w-16" />
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <FileText className="w-14 h-14 mb-3 opacity-50" />
          <p className="text-sm">未找到该政策</p>
        </div>
      </AppLayout>
    );
  }

  const cached = isCached(policy.id);
  const sections = parseContent(policy.content);

  return (
    <AppLayout className="bg-white flex flex-col min-h-screen">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-brand-500" />
            <span className="text-sm font-medium text-slate-700 max-w-[180px] truncate">
              {policy.department}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleFav}
              className={cn(
                "p-2 rounded-full transition-colors",
                fav
                  ? "text-amber-500 bg-amber-50"
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              <Star className={cn("w-5 h-5", fav && "fill-current")} />
            </button>
            <button
              onClick={handleCache}
              className={cn(
                "p-2 rounded-full transition-colors",
                cached
                  ? "text-emerald-500 bg-emerald-50"
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              {cached ? (
                <HardDrive className="w-5 h-5" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 pb-24">
        <div className="px-4 pt-5 pb-4">
          <h1 className="font-serif text-2xl font-bold text-slate-900 leading-snug tracking-tight">
            {policy.title}
          </h1>
          <div className="flex flex-wrap gap-3 mt-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              发布：{formatDate(policy.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              生效：{formatDate(policy.effectiveFrom)}
            </span>
            <span className="chip bg-brand-50 text-brand-700">
              {policy.category}
            </span>
          </div>
        </div>

        <div className="h-px bg-slate-100 mx-4" />

        <article className="px-4 py-5">
          {sections.map((section, idx) => {
            if (section.type === "heading") {
              return (
                <h2
                  key={idx}
                  className="font-serif text-base font-semibold text-slate-800 mt-5 mb-3 first:mt-0"
                >
                  {section.content}
                </h2>
              );
            }
            if (section.type === "list" && section.items) {
              return (
                <ol key={idx} className="space-y-2 mb-4 list-decimal list-inside">
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-slate-600 leading-relaxed pl-1"
                    >
                      {item}
                    </li>
                  ))}
                </ol>
              );
            }
            return (
              <p
                key={idx}
                className="text-sm text-slate-600 leading-relaxed mb-3 indent-8"
              >
                {section.content}
              </p>
            );
          })}
        </article>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 px-4 py-3 z-30">
        <button
          onClick={handleCache}
          disabled={cached}
          className={cn(
            "w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all",
            cached
              ? "bg-emerald-50 text-emerald-600 cursor-default"
              : "btn-primary"
          )}
        >
          {cached ? (
            <>
              <HardDrive className="w-4 h-4" />
              已缓存到本地
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              缓存到本地
            </>
          )}
        </button>
      </div>
    </AppLayout>
  );
}
