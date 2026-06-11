import { useState } from "react";
import {
  Search,
  AlertCircle,
  HelpCircle,
  FileText,
  ChevronRight,
  Brain,
  Lightbulb,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingDown,
  WifiOff,
  ShieldAlert,
  Tag,
  ArrowRight,
  Eye,
} from "lucide-react";
import { apiFetch, useApi } from "@/utils/api";
import { formatDate } from "@/utils/format";

interface DiagnosisResult {
  orderId: string;
  rootCause: string;
  category: string;
  categoryName: string;
  suggestions: string[];
  relatedKnowledge: string[];
  confidence: number;
  estimatedTime: string;
}

interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  rootCause: string;
  solution: string;
  keywords: string[];
  views: number;
  helpful: number;
}

const SCENARIOS = [
  { key: "timeout", label: "缴费超时", desc: "支付后订单一直处理中", icon: Clock, color: "from-amber-400 to-orange-500" },
  { key: "bank_fail", label: "银行扣款失败", desc: "银行卡已签约但代扣失败", icon: XCircle, color: "from-rose-400 to-rose-600" },
  { key: "balance", label: "余额不足", desc: "账户余额不足导致失败", icon: TrendingDown, color: "from-violet-400 to-violet-600" },
  { key: "network", label: "网络异常", desc: "缴费过程中网络中断", icon: WifiOff, color: "from-sky-400 to-sky-600" },
  { key: "verify", label: "身份验证失败", desc: "实名验证不通过", icon: ShieldAlert, color: "from-emerald-400 to-emerald-600" },
  { key: "discount", label: "优惠未生效", desc: "优惠券/红包无法使用", icon: Tag, color: "from-gold-400 to-gold-600" },
];

export default function DiagnosisPage() {
  const [orderId, setOrderId] = useState("");
  const [diagnosing, setDiagnosing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [keyword, setKeyword] = useState("");
  const { data: knowledge } = useApi<KnowledgeItem[]>("/api/diagnosis/knowledge");

  const diagnose = async (scenario?: string) => {
    if (!orderId.trim() && !scenario) return;
    setDiagnosing(true);
    try {
      const data = await apiFetch<DiagnosisResult>("/api/diagnosis/analyze", {
        method: "POST",
        body: JSON.stringify({ orderId, scenario }),
      });
      setResult(data);
    } finally {
      setDiagnosing(false);
    }
  };

  const filtered = (knowledge || []).filter((k) => {
    if (!keyword.trim()) return true;
    return k.title.includes(keyword) || k.keywords.some((w) => w.includes(keyword));
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 rounded-2xl p-8 text-white shadow-card-hover relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 85% 20%, #fff 0, transparent 40%)" }}
        />
        <div className="relative flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <Brain className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1.5">智能缴费诊断</h2>
            <p className="text-white/80 text-sm mb-5">基于AI知识库，智能识别缴费失败原因，提供精准解决方案，累计解决 128,560+ 次问题</p>
            <div className="flex gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && diagnose()}
                  placeholder="请输入失败的缴费订单号，例如 PAY2026061000001"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-gold-400 transition"
                />
              </div>
              <button
                onClick={() => diagnose()}
                disabled={diagnosing || !orderId.trim()}
                className="px-6 py-3 bg-gold-gradient text-brand-800 font-semibold rounded-xl hover:shadow-lg transition disabled:opacity-60"
              >
                {diagnosing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-brand-800 border-t-transparent rounded-full animate-spin" />
                    诊断中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4" /> 开始诊断
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="card animate-fade-in-up">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-brand-700 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-gold-500" /> 诊断报告
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                订单号：<span className="font-mono">{result.orderId}</span>
                <span className="mx-3">·</span>
                置信度：<span className="font-semibold text-emerald-600">{result.confidence}%</span>
              </p>
            </div>
            <span className="tag-info">{result.categoryName}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 bg-rose-50 border border-rose-100 rounded-xl">
              <div className="flex items-center gap-2 text-rose-700 font-semibold mb-3">
                <AlertCircle className="w-5 h-5" /> 根因定位
              </div>
              <p className="text-rose-800 leading-relaxed">{result.rootCause}</p>
              <div className="mt-4 space-y-2 text-xs text-rose-700/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  预计解决时间：{result.estimatedTime}
                </div>
              </div>
            </div>

            <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-3">
                <Lightbulb className="w-5 h-5" /> 解决方案
              </div>
              <ol className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-emerald-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> 关联知识库条目
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {result.relatedKnowledge.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0">
                    <HelpCircle className="w-4 h-4 text-brand-500 shrink-0" />
                    <span className="text-sm text-slate-700 truncate">{t}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div className="card">
          <h3 className="section-title">
            <AlertCircle className="w-5 h-5" /> 常见失败场景
          </h3>
          <p className="text-sm text-slate-500 mb-4">点击下方卡片快速诊断常见问题</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCENARIOS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.key}
                  onClick={() => diagnose(s.key)}
                  className="group relative overflow-hidden rounded-xl p-5 border border-slate-200 hover:shadow-card-hover cursor-pointer transition-all"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shrink-0 shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 group-hover:text-white transition-colors">
                        {s.label}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5 group-hover:text-white/90 transition-colors">
                        {s.desc}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-white transition-all group-hover:translate-x-1 shrink-0 mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">
            <FileText className="w-5 h-5" /> 缴费失败知识库
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索关键词，如：超时、扣款、余额"
              className="input pl-9 w-64"
            />
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {filtered.map((k) => (
            <div key={k.id} className="py-4 first:pt-0 last:pb-0 hover:bg-slate-50/60 -mx-5 px-5 rounded transition cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="tag-info">{k.category}</span>
                    <h4 className="font-semibold text-brand-700">{k.title}</h4>
                  </div>
                  <p className="text-sm text-slate-600 mb-2"><span className="text-slate-400">根因：</span>{k.rootCause}</p>
                  <p className="text-sm text-slate-600"><span className="text-slate-400">方案：</span>{k.solution}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {k.views} 次浏览</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {k.helpful} 人认为有帮助</span>
                    <div className="flex items-center gap-1">
                      {k.keywords.map((w) => (
                        <span key={w} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">#{w}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 shrink-0 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
