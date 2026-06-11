import { Bell, Search, User } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store/app";
import { useLocation, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "@/config/nav";
import { apiFetch } from "@/utils/api";

interface SearchResult {
  title: string;
  type: string;
  path: string;
  summary: string;
}

const FALLBACK_RESULTS: SearchResult[] = [
  { title: "缴费中心", type: "缴费", path: "/payment", summary: "查询账单、去结算、提交订单、确认支付和查看订单记录" },
  { title: "金融超市", type: "金融", path: "/finance", summary: "按风险等级筛选理财、保险和贷款产品" },
  { title: "商户分润结算", type: "运营", path: "/merchant", summary: "查看商户账单、清算进度和分润明细" },
];

export default function Topbar() {
  const { user } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<SearchResult[]>(FALLBACK_RESULTS);
  const [searchedKeyword, setSearchedKeyword] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const current = NAV_ITEMS.find(
    (i) =>
      i.path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(i.path),
  );

  const visibleResults = keyword.trim() ? results : FALLBACK_RESULTS;

  const runSearch = async (nextKeyword = keyword) => {
    const normalized = nextKeyword.trim();
    if (!normalized) {
      setPanelOpen(false);
      return;
    }
    setPanelOpen(true);
    setSearchedKeyword(normalized);
    try {
      const data = await apiFetch<{ results: SearchResult[] }>(
        `/api/search?q=${encodeURIComponent(normalized)}`,
      );
      setResults(data.results?.length ? data.results : FALLBACK_RESULTS);
    } catch {
      setResults(FALLBACK_RESULTS);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-brand-700">
          {current?.label || "全域缴费平台"}
        </h1>
        <span className="text-slate-400">/</span>
        <span className="text-sm text-slate-500">{current?.group || "工作台"}</span>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={keyword}
            onChange={(e) => {
              const next = e.target.value;
              setKeyword(next);
              setPanelOpen(Boolean(next.trim()));
              if (next.trim()) {
                setSearchedKeyword(next.trim());
              }
            }}
            onFocus={() => keyword.trim() && setPanelOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void runSearch();
              }
              if (e.key === "Escape") {
                setPanelOpen(false);
              }
            }}
            placeholder="搜索缴费项目、产品、商户..."
            className="pl-9 pr-3 py-2 w-72 bg-slate-50 rounded-md text-sm border border-transparent focus:border-brand-300 focus:bg-white focus:outline-none transition"
          />
          {panelOpen && (
            <div className="absolute right-0 top-12 z-50 w-96 rounded-xl border border-slate-200 bg-white p-3 shadow-card-hover">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <div className="text-sm font-semibold text-brand-700">搜索结果</div>
                  <div className="text-xs text-slate-500">
                    查询结果关键词：{searchedKeyword || keyword.trim()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void runSearch()}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  查询
                </button>
              </div>
              <div className="mt-2 space-y-1">
                {visibleResults.map((item) => (
                  <button
                    key = {item.path}
                    type="button"
                    onClick={() => {
                      setPanelOpen(false);
                      navigate(item.path);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-800">{item.title}</span>
                      <span className="rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-600">{item.type}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{item.summary}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button className="relative p-2 rounded-md hover:bg-slate-100 text-slate-600">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white">
            <User className="w-5 h-5" />
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="text-sm font-medium text-brand-700">{user.name}</div>
            <div className="text-xs text-slate-500">{user.phone}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
