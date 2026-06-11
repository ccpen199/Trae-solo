import {
  Droplets,
  Zap,
  Flame,
  Thermometer,
  Phone,
  Landmark,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Calendar,
  FileText,
  CreditCard,
  Signature,
  Calculator,
  FileCheck,
  Shield,
  MapPin,
  Percent,
  Activity,
  AlertTriangle,
  RotateCcw,
  Bell,
  MessageSquare,
  Smartphone,
  AlertCircle,
  Receipt,
  Scale,
  Undo2,
  RefreshCw,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useApi } from "@/utils/api";
import { formatMoney } from "@/utils/format";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface HomeOverview {
  success: boolean;
  billSummary: {
    totalUnpaid: number;
    totalAmount: number;
    overdueCount: number;
    overdueAmount: number;
    processingCount: number;
    failedCount: number;
    byCategory: Array<{
      category: string;
      name: string;
      count: number;
      amount: number;
      status: string;
      canDeduct: boolean;
      hasSigned: boolean;
    }>;
    pendingCorrection: number;
    pendingArbitration: number;
    pendingInvoices: number;
  };
  reminderSummary: {
    totalConfigs: number;
    activeChannels: { sms: boolean; system: boolean; wechat: boolean };
    todaySent: number;
    todayFailed: number;
    pendingRetry: number;
    nextReminderTime: string;
    channelStats: Array<{
      channel: string;
      name: string;
      sent: number;
      success: number;
      failed: number;
      rate: string;
    }>;
  };
  financeSummary: {
    totalAssets: number;
    totalProfit: number;
    riskLevel: string;
    riskLabel: string;
    pendingContracts: number;
    activeProducts: number;
    loanQuota: number;
    supervisingAmount: number;
  };
  operationSummary: {
    dataCenter: {
      totalPayments: number;
      totalAmount: number;
      topRegion: string;
      topCategory: string;
      growthRate: string;
    };
    merchant: {
      settledMerchants: number;
      pendingSettlement: number;
      settlementStatus: string;
      lastSettleDate: string;
      totalProfitShare: number;
    };
    promotion: {
      activeCampaigns: number;
      totalCoupons: number;
      usedCoupons: number;
      roi: string;
      todayEffect: string;
    };
    diagnosis: {
      todayFailures: number;
      resolvedToday: number;
      pendingReview: number;
      autoCorrectionRate: string;
      topCause: string;
    };
  };
}

interface PaymentCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface FinanceProduct {
  id: string;
  name: string;
  type: "wealth" | "insurance" | "loan";
  riskLevel: string;
  annualRate: string;
  term: string;
  minAmount: number;
}

interface ReminderItem {
  id: string;
  category: string;
  amount: number;
  dueDate: string;
  urgent: boolean;
  message: string;
}

const CATEGORY_ICONS: Record<string, typeof Droplets> = {
  water: Droplets,
  electricity: Zap,
  gas: Flame,
  heating: Thermometer,
  communication: Phone,
  social: Landmark,
};

const CATEGORY_COLORS: Record<string, string> = {
  water: "from-sky-400 to-blue-600",
  electricity: "from-amber-400 to-orange-500",
  gas: "from-rose-400 to-red-500",
  heating: "from-orange-400 to-amber-600",
  communication: "from-emerald-400 to-green-600",
  social: "from-violet-400 to-purple-600",
};

export default function Home() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const { data: overview } = useApi<HomeOverview>("/api/home/overview");
  const { data: categories } = useApi<PaymentCategory[]>("/api/payment/categories");
  const { data: products } = useApi<FinanceProduct[]>("/api/finance/products?limit=4");
  const { data: reminders } = useApi<ReminderItem[]>("/api/payment/reminder/list?limit=3");
  const { data: trendData } = useApi<{ date: string; amount: number }[]>(
    "/api/data/trend?range=7d",
  );

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const stats = [
    { label: "本月已缴", value: 1286.5, delta: "+12.4%", icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
    { label: "累计缴费", value: 15820.3, delta: "+8.1%", icon: FileText, color: "text-brand-500 bg-brand-50" },
    { label: "累计收益", value: 1824.78, delta: "+5.3%", icon: TrendingUp, color: "text-gold-500 bg-gold-50" },
    { label: "提醒事项", value: 3, delta: "紧急 1", icon: Calendar, color: "text-rose-600 bg-rose-50" },
  ];

  const banners = [
    { title: "夏日缴费节", sub: "水电缴费满200立减20", gradient: "from-brand-500 via-brand-600 to-brand-800" },
    { title: "新客理财专享", sub: "30天稳利 年化4.8%", gradient: "from-gold-400 via-gold-500 to-gold-600" },
    { title: "社保缴费提醒", sub: "6月30日前完成不罚息", gradient: "from-emerald-500 via-teal-600 to-teal-800" },
  ];

  return (
    <div className="space-y-6">
      <div className="relative h-56 rounded-2xl overflow-hidden shadow-card-hover">
        <div className={`h-full w-full bg-gradient-to-r ${banners[0].gradient} relative`}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0, transparent 40%)" }}
          />
          <div className="relative h-full flex items-center px-10">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs mb-3">
                <Sparkles className="w-3 h-3" /> 限时活动
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{banners[0].title}</h2>
              <p className="text-white/90 mb-5">{banners[0].sub}</p>
              <button
                onClick={() => navigate("/payment")}
                className="btn bg-white text-brand-600 hover:bg-white/90 shadow-lg"
              >
                提交缴费订单 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="absolute bottom-4 right-6 flex gap-1.5">
            {banners.map((_, i) => (
              <span key={i} className={`w-2 h-2 rounded-full ${i === 0 ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card card-hover">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-500">{s.label}</div>
                  <div className="text-2xl font-bold text-brand-800 mt-1">{formatMoney(s.value)}</div>
                  <div className={`text-xs mt-1 ${s.delta.startsWith("+") ? "text-emerald-600" : "text-rose-500"}`}>
                    {s.delta}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <CreditCard className="w-5 h-5 text-brand-500" /> 缴费项目
            </h3>
            <button onClick={() => navigate("/payment")} className="btn-ghost text-sm">
              去提交缴费 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {(categories || []).map((c) => {
              const Icon = CATEGORY_ICONS[c.icon] || CreditCard;
              return (
                <div
                  key={c.id}
                  onClick={() => navigate("/payment")}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-50 cursor-pointer transition group"
                >
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${CATEGORY_COLORS[c.icon] || "from-brand-400 to-brand-600"} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{c.name}</span>
                  <span className="text-xs text-slate-400">{c.count}项</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="section-title mb-4">
            <Calendar className="w-5 h-5 text-rose-500" /> 缴费提醒
          </h3>
          <div className="space-y-3">
            {(reminders || []).map((r) => (
              <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition">
                <div className={`w-1 rounded-full self-stretch ${r.urgent ? "bg-rose-500" : "bg-amber-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">{r.category}</span>
                    <span className="text-sm font-bold text-rose-600">{formatMoney(r.amount)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{r.message}</p>
                  <p className="text-xs text-slate-400 mt-1">截止：{r.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/payment/reminder")}
            className="w-full btn-secondary mt-4"
          >
            管理提醒设置
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <Receipt className="w-5 h-5 text-brand-500" /> 账单业务处理
            </h3>
            <button onClick={() => navigate("/payment")} className="btn-ghost text-sm">
              去缴费中心 <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-slate-50 text-center">
              <div className="text-xs text-slate-500">待缴费</div>
              <div className="text-lg font-bold text-brand-700 mt-1">{overview?.billSummary.totalUnpaid || 0}笔</div>
              <div className="text-xs text-slate-600 font-medium">{formatMoney(overview?.billSummary.totalAmount || 0)}</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-center">
              <div className="text-xs text-rose-500">逾期待处理</div>
              <div className="text-lg font-bold text-rose-600 mt-1">{overview?.billSummary.overdueCount || 0}笔</div>
              <div className="text-xs text-rose-600 font-medium">{formatMoney(overview?.billSummary.overdueAmount || 0)}</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-center">
              <div className="text-xs text-blue-500">处理中</div>
              <div className="text-lg font-bold text-blue-600 mt-1">{overview?.billSummary.processingCount || 0}笔</div>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 text-center">
              <div className="text-xs text-orange-500">支付失败</div>
              <div className="text-lg font-bold text-orange-600 mt-1">{overview?.billSummary.failedCount || 0}笔</div>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-center">
              <div className="text-xs text-purple-500">待冲正</div>
              <div className="text-lg font-bold text-purple-600 mt-1">{overview?.billSummary.pendingCorrection || 0}笔</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 text-center">
              <div className="text-xs text-slate-500">待仲裁</div>
              <div className="text-lg font-bold text-slate-600 mt-1">{overview?.billSummary.pendingArbitration || 0}笔</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-center">
              <div className="text-xs text-emerald-500">待开票</div>
              <div className="text-lg font-bold text-emerald-600 mt-1">{overview?.billSummary.pendingInvoices || 0}笔</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(overview?.billSummary.byCategory || []).slice(0, 6).map((item, i) => {
              const Icon = CATEGORY_ICONS[item.category] || CreditCard;
              const statusTag = item.status === "unpaid" ? "tag" :
                               item.status === "processing" ? "tag tag-info" :
                               item.status === "failed" ? "tag tag-danger" :
                               item.status === "overdue" ? "tag bg-red-100 text-red-700" : "tag";
              const statusText = item.status === "unpaid" ? "待缴费" :
                                item.status === "processing" ? "处理中" :
                                item.status === "failed" ? "支付失败" :
                                item.status === "overdue" ? "已逾期" : item.status;
              return (
                <div
                  key={i}
                  onClick={() => navigate("/payment")}
                  className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${CATEGORY_COLORS[item.category] || "from-brand-400 to-brand-600"} flex items-center justify-center text-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-700">{item.name}</div>
                      <span className={statusTag}>{statusText}</span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-brand-700 mb-2">{formatMoney(item.amount)}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.canDeduct && !item.hasSigned && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate("/payment/auto-deduct"); showToast("正在跳转到代扣开通页面", "info"); }}
                        className="btn px-2 py-1 text-xs bg-emerald-500 text-white hover:bg-emerald-600"
                      >
                        <Signature className="w-3 h-3" /> 开通代扣
                      </button>
                    )}
                    {item.status === "failed" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate("/payment/correction"); showToast("正在跳转到冲正页面", "info"); }}
                        className="btn px-2 py-1 text-xs bg-rose-500 text-white hover:bg-rose-600"
                      >
                        <Undo2 className="w-3 h-3" /> 去冲正
                      </button>
                    )}
                    {item.status === "failed" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate("/payment"); showToast("正在提交仲裁申请", "info"); }}
                        className="btn px-2 py-1 text-xs bg-slate-500 text-white hover:bg-slate-600"
                      >
                        <Scale className="w-3 h-3" /> 仲裁申请
                      </button>
                    )}
                    {(overview?.billSummary.pendingInvoices || 0) > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate("/payment/invoice"); showToast("正在跳转到开票页面", "info"); }}
                        className="btn px-2 py-1 text-xs bg-blue-500 text-white hover:bg-blue-600"
                      >
                        <FileText className="w-3 h-3" /> 去开票
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <Bell className="w-5 h-5 text-brand-500" /> 多通道提醒触达
            </h3>
            <button onClick={() => navigate("/payment/reminder")} className="btn-ghost text-sm">
              管理设置 <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 mb-5">
            {(overview?.reminderSummary.channelStats || []).map((ch) => {
              const isActive = overview?.reminderSummary.activeChannels[ch.channel as keyof typeof overview.reminderSummary.activeChannels];
              const ChannelIcon = ch.channel === "sms" ? Smartphone : ch.channel === "wechat" ? MessageSquare : Bell;
              return (
                <div
                  key={ch.channel}
                  onClick={() => navigate("/payment/reminder")}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition"
                >
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full ${isActive ? "bg-brand-100 text-brand-600" : "bg-slate-200 text-slate-400"} flex items-center justify-center`}>
                      <ChannelIcon className="w-5 h-5" />
                    </div>
                    <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"} border-2 border-white`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">{ch.name}</span>
                      <span className="text-xs text-slate-500">成功率 {ch.rate}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>发送 {ch.sent}</span>
                      <span className="text-emerald-600">成功 {ch.success}</span>
                      <span className="text-rose-600">失败 {ch.failed}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-2 rounded-lg bg-slate-50 text-center">
              <div className="text-xl font-bold text-brand-700">{overview?.reminderSummary.todaySent || 0}</div>
              <div className="text-xs text-slate-500">今日已发送</div>
            </div>
            <div className="p-2 rounded-lg bg-rose-50 text-center">
              <div className="text-xl font-bold text-rose-600">{overview?.reminderSummary.todayFailed || 0}</div>
              <div className="text-xs text-rose-500">发送失败</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 text-center">
              <div className="text-xl font-bold text-amber-600">{overview?.reminderSummary.pendingRetry || 0}</div>
              <div className="text-xs text-amber-500">待重试</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-brand-50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" />
              <span className="text-sm text-slate-600">下次提醒：{overview?.reminderSummary.nextReminderTime || "--"}</span>
            </div>
            {(overview?.reminderSummary.todayFailed || 0) > 0 && (
              <button
                onClick={() => { showToast("已触发失败通知补发", "success"); }}
                className="btn px-2 py-1 text-xs bg-rose-500 text-white hover:bg-rose-600"
              >
                <RefreshCw className="w-3 h-3" /> 补发失败通知
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="section-title mb-4">
            <TrendingUp className="w-5 h-5 text-brand-500" /> 近7日缴费趋势
          </h3>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={trendData || []}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1B3A5C" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1B3A5C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} />
                <Area type="monotone" dataKey="amount" stroke="#1B3A5C" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <Landmark className="w-5 h-5 text-gold-500" /> 金融交易闭环
            </h3>
            <button onClick={() => navigate("/finance")} className="btn-ghost text-sm">
              进入金融超市 <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gold-50 to-brand-50 rounded-xl p-5 mb-4">
                <div className="text-xs text-slate-500 mb-1">总持有资产</div>
                <div className="text-3xl font-bold text-brand-800">{formatMoney(overview?.financeSummary.totalAssets || 0)}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500">累计收益</span>
                  <span className="text-sm font-semibold text-emerald-600">+{formatMoney(overview?.financeSummary.totalProfit || 0)}</span>
                </div>
                <div className="mt-3">
                  <span className={`tag ${overview?.financeSummary.riskLevel === "低" ? "tag-success" : overview?.financeSummary.riskLevel === "中" ? "tag-warning" : "tag-danger"}`}>
                    {overview?.financeSummary.riskLevel}风险 · {overview?.financeSummary.riskLabel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => { navigate("/finance/risk-assessment"); showToast("正在跳转到风险测评", "info"); }}
                  className="btn flex-col py-3 bg-slate-50 hover:bg-slate-100 text-slate-700"
                >
                  <Shield className="w-5 h-5 mb-1" />
                  <span className="text-xs">风险测评</span>
                </button>
                <button
                  onClick={() => { navigate("/finance/calculator"); showToast("正在跳转到额度试算", "info"); }}
                  className="btn flex-col py-3 bg-slate-50 hover:bg-slate-100 text-slate-700"
                >
                  <Calculator className="w-5 h-5 mb-1" />
                  <span className="text-xs">额度试算</span>
                </button>
                <button
                  onClick={() => { navigate("/finance/contract"); showToast("正在跳转到合同页面", "info"); }}
                  className="btn flex-col py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 relative"
                >
                  <FileCheck className="w-5 h-5 mb-1" />
                  <span className="text-xs">待签合同</span>
                  {(overview?.financeSummary.pendingContracts || 0) > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">
                      {overview?.financeSummary.pendingContracts}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { navigate("/finance/supervision"); showToast("正在跳转到资金监管", "info"); }}
                  className="btn flex-col py-3 bg-slate-50 hover:bg-slate-100 text-slate-700"
                >
                  <Scale className="w-5 h-5 mb-1" />
                  <span className="text-xs">资金监管</span>
                  <span className="text-[10px] text-slate-500">{formatMoney(overview?.financeSummary.supervisingAmount || 0)}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-brand-50 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">贷款额度可用</div>
                  <div className="text-lg font-bold text-brand-700">{formatMoney(overview?.financeSummary.loanQuota || 0)}</div>
                </div>
                <button
                  onClick={() => { navigate("/finance"); showToast("正在申请贷款", "info"); }}
                  className="btn px-3 py-1.5 text-xs bg-brand-500 text-white hover:bg-brand-600"
                >
                  立即申请
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(products || []).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate("/finance")}
                    className="p-4 rounded-xl bg-gradient-to-br from-brand-50 to-gold-50 hover:shadow-card-hover transition cursor-pointer border border-brand-100/60"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-brand-700">{p.name}</span>
                      <span className="tag-gold">{p.riskLevel}</span>
                    </div>
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <div className="text-xs text-slate-500">预期年化</div>
                        <div className="text-2xl font-bold text-rose-600">{p.annualRate}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">{p.term}</div>
                        <div className="text-xs text-slate-400">起投 {formatMoney(p.minAmount)}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate("/finance"); showToast("正在跳转到购买页面", "info"); }}
                        className="flex-1 btn px-2 py-1.5 text-xs bg-brand-500 text-white hover:bg-brand-600"
                      >
                        立即购买
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (p.type === "loan") {
                            navigate("/finance/calculator");
                            showToast("正在跳转到额度试算", "info");
                          } else {
                            navigate("/finance/risk-assessment");
                            showToast("正在跳转到风险匹配", "info");
                          }
                        }}
                        className="btn px-2 py-1.5 text-xs bg-white text-brand-500 border border-brand-500 hover:bg-brand-50"
                      >
                        {p.type === "loan" ? (
                          <><Calculator className="w-3 h-3 mr-1" /> 额度试算</>
                        ) : (
                          <><Shield className="w-3 h-3 mr-1" /> 风险匹配</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card lg:col-span-4">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-title mb-0">
              <Activity className="w-5 h-5 text-brand-500" /> 运营工作台
            </h3>
            <div className="flex gap-2">
              <button onClick={() => navigate("/data-center")} className="btn-ghost text-xs">
                数据中心 <ArrowUpRight className="w-3 h-3" />
              </button>
              <button onClick={() => navigate("/merchant")} className="btn-ghost text-xs">
                商户结算 <ArrowUpRight className="w-3 h-3" />
              </button>
              <button onClick={() => navigate("/promotion")} className="btn-ghost text-xs">
                优惠活动 <ArrowUpRight className="w-3 h-3" />
              </button>
              <button onClick={() => navigate("/diagnosis")} className="btn-ghost text-xs">
                缴费诊断 <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-brand-50 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-blue-700">数据资产中心</span>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">总交易</span>
                  <span className="text-sm font-semibold text-slate-700">{overview?.operationSummary.dataCenter.totalPayments || 0}笔 / {formatMoney(overview?.operationSummary.dataCenter.totalAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">增速</span>
                  <span className="text-sm font-semibold text-emerald-600">{overview?.operationSummary.dataCenter.growthRate || "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">热门省份</span>
                  <span className="text-sm font-semibold text-slate-700">{overview?.operationSummary.dataCenter.topRegion || "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">热门品类</span>
                  <span className="text-sm font-semibold text-slate-700">{overview?.operationSummary.dataCenter.topCategory || "--"}</span>
                </div>
              </div>
              <button
                onClick={() => { navigate("/data-center"); showToast("正在跳转到地域分析", "info"); }}
                className="w-full btn px-2 py-1.5 text-xs bg-blue-500 text-white hover:bg-blue-600"
              >
                <MapPin className="w-3 h-3 mr-1" /> 查看地域分析
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-gold-50 border border-amber-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-amber-700">商户分润结算</span>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">已入驻商户</span>
                  <span className="text-sm font-semibold text-slate-700">{overview?.operationSummary.merchant.settledMerchants || 0}家</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">待结算</span>
                  <span className="text-sm font-semibold text-amber-600">{overview?.operationSummary.merchant.pendingSettlement || 0}笔</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">累计分润</span>
                  <span className="text-sm font-semibold text-slate-700">{formatMoney(overview?.operationSummary.merchant.totalProfitShare || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">上次结算</span>
                  <span className="text-sm font-semibold text-slate-700">{overview?.operationSummary.merchant.lastSettleDate || "--"}</span>
                </div>
              </div>
              <button
                onClick={() => { navigate("/merchant"); showToast("正在跳转到清算明细", "info"); }}
                className="w-full btn px-2 py-1.5 text-xs bg-amber-500 text-white hover:bg-amber-600"
              >
                <Receipt className="w-3 h-3 mr-1" /> 查看清算明细
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center">
                  <Percent className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-rose-700">优惠活动配置</span>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">进行中活动</span>
                  <span className="text-sm font-semibold text-slate-700">{overview?.operationSummary.promotion.activeCampaigns || 0}个</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">已发券/已核销</span>
                  <span className="text-sm font-semibold text-slate-700">{overview?.operationSummary.promotion.totalCoupons || 0} / {overview?.operationSummary.promotion.usedCoupons || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">ROI</span>
                  <span className="text-sm font-semibold text-emerald-600">{overview?.operationSummary.promotion.roi || "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">今日效果</span>
                  <span className="text-sm font-semibold text-slate-700">{overview?.operationSummary.promotion.todayEffect || "--"}</span>
                </div>
              </div>
              <button
                onClick={() => { navigate("/promotion"); showToast("正在跳转到活动管理", "info"); }}
                className="w-full btn px-2 py-1.5 text-xs bg-rose-500 text-white hover:bg-rose-600"
              >
                <Sparkles className="w-3 h-3 mr-1" /> 管理活动规则
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-purple-500 text-white flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-purple-700">缴费诊断知识库</span>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">今日失败</span>
                  <span className="text-sm font-semibold text-rose-600">{overview?.operationSummary.diagnosis.todayFailures || 0}笔</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">已解决</span>
                  <span className="text-sm font-semibold text-emerald-600">{overview?.operationSummary.diagnosis.resolvedToday || 0}笔</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">待复查</span>
                  <span className="text-sm font-semibold text-amber-600">{overview?.operationSummary.diagnosis.pendingReview || 0}笔</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">自动纠错率</span>
                  <span className="text-sm font-semibold text-slate-700">{overview?.operationSummary.diagnosis.autoCorrectionRate || "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">最常见原因</span>
                  <span className="text-sm font-semibold text-slate-700">{overview?.operationSummary.diagnosis.topCause || "--"}</span>
                </div>
              </div>
              <button
                onClick={() => { navigate("/diagnosis"); showToast("正在跳转到失败根因复查", "info"); }}
                className="w-full btn px-2 py-1.5 text-xs bg-purple-500 text-white hover:bg-purple-600"
              >
                <AlertTriangle className="w-3 h-3 mr-1" /> 失败根因复查
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-up ${
          toast.type === "success" ? "bg-emerald-500 text-white" :
          toast.type === "error" ? "bg-rose-500 text-white" :
          "bg-brand-500 text-white"
        }`}>
          {toast.type === "success" && <FileCheck className="w-5 h-5" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5" />}
          {toast.type === "info" && <Bell className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
