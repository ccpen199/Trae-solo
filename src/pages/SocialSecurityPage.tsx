import { useEffect, useMemo, useState } from "react";
import {
  Home,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileDown,
  Eye,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import GradientCard from "@/components/ui/GradientCard";
import StatRing from "@/components/ui/StatRing";
import SkeletonCard from "@/components/ui/SkeletonCard";
import TabBar from "@/components/ui/TabBar";
import { socialSecurityApi } from "@/api";
import { useAppStore } from "@/store/useAppStore";
import type { SocialSecurityAccount } from "../../shared/types";
import { formatMoney, formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

interface InsuranceItem {
  key: keyof SocialSecurityAccount["socialInsurance"];
  label: string;
  color: string;
  maxMonths: number;
}

const INSURANCE_LIST: InsuranceItem[] = [
  { key: "pension", label: "养老保险", color: "#1E6FFF", maxMonths: 360 },
  { key: "medical", label: "医疗保险", color: "#10B981", maxMonths: 300 },
  { key: "unemployment", label: "失业保险", color: "#F59E0B", maxMonths: 240 },
  { key: "workInjury", label: "工伤保险", color: "#EF4444", maxMonths: 240 },
  { key: "maternity", label: "生育保险", color: "#EC4899", maxMonths: 120 },
];

type ChartType = "area" | "bar";

export default function SocialSecurityPage() {
  const { showToast, setLoading } = useAppStore();
  const [account, setAccount] = useState<SocialSecurityAccount | null>(null);
  const [loading, setLoadingState] = useState(true);
  const [chartType, setChartType] = useState<ChartType>("area");
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [generatingCert, setGeneratingCert] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await socialSecurityApi.getAccount();
        setAccount(data);
      } catch (e) {
        console.error(e);
        showToast("获取社保公积金信息失败", "error");
      } finally {
        setLoadingState(false);
      }
    })();
  }, [showToast]);

  const chartData = useMemo(() => {
    if (!account) return [];
    return account.contributionHistory
      .slice()
      .reverse()
      .map((item) => ({
        month: item.month.slice(5),
        公积金: item.housingFund,
        养老保险: item.pension,
        医疗保险: item.medical,
        失业保险: item.unemployment,
        合计: item.housingFund + item.pension + item.medical + item.unemployment,
      }));
  }, [account]);

  const handleGenerateCertificate = async () => {
    if (generatingCert) return;
    setGeneratingCert(true);
    setLoading("certificate", true);
    try {
      const result = await socialSecurityApi.generateCertificate();
      showToast("电子凭证生成成功", "success");

      const binaryString = atob(result.base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename || `社保公积金凭证_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      showToast("生成电子凭证失败，请稍后重试", "error");
    } finally {
      setGeneratingCert(false);
      setLoading("certificate", false);
    }
  };

  return (
    <AppLayout showHeader={false} showBottomNav={false} className="!pb-6">
      <PageHeader title="公积金·社保" />

      <div className="space-y-5">
        {loading ? (
          <>
            <SkeletonCard count={1} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card p-4 flex flex-col items-center">
                  <div className="skeleton w-20 h-20 rounded-full mb-2" />
                  <div className="skeleton h-3 w-16 mb-1" />
                  <div className="skeleton h-3 w-12" />
                </div>
              ))}
            </div>
            <SkeletonCard count={2} />
          </>
        ) : (
          account && (
            <>
              <GradientCard
                title="公积金账户余额"
                value={formatMoney(account.housingFund.balance)}
                icon={<Home className="w-6 h-6" />}
                description={`月缴存额：${formatMoney(account.housingFund.monthlyContribution, { decimals: 0 })}`}
                variant="blue"
                footer={
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-white/80">
                        <Calendar className="w-4 h-4" />
                        <span>最后缴存日期</span>
                      </div>
                      <span className="font-medium">
                        {formatDate(account.housingFund.lastDepositDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-white/80">
                        <Building2 className="w-4 h-4" />
                        <span>缴存单位</span>
                      </div>
                      <span className="font-medium text-right max-w-[60%] truncate">
                        {account.housingFund.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/15">
                      <span className="text-white/80 text-sm">账户状态</span>
                      <span
                        className={cn(
                          "chip",
                          account.housingFund.status === "normal"
                            ? "bg-emerald-400/30 text-white border border-white/20"
                            : "bg-amber-400/30 text-white border border-white/20"
                        )}
                      >
                        {account.housingFund.status === "normal" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            正常缴存
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            已停缴
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                }
              />

              <div>
                <h3 className="section-title mb-3">社保五险状态</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {INSURANCE_LIST.map((item) => {
                    const info = account.socialInsurance[item.key];
                    return (
                      <div
                        key={item.key}
                        className="card p-4 flex flex-col items-center text-center"
                      >
                        <StatRing
                          value={info.months}
                          max={item.maxMonths}
                          size={88}
                          strokeWidth={8}
                          color={item.color}
                          label={`${info.months}`}
                          sublabel="个月"
                        />
                        <div className="mt-2 text-sm font-medium text-slate-700">
                          {item.label}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {info.status}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="section-title">缴费趋势</h3>
                  <TabBar
                    tabs={[
                      { key: "area", label: "面积图", icon: TrendingUp },
                      { key: "bar", label: "柱状图", icon: BarChart3 },
                    ]}
                    activeKey={chartType}
                    onChange={(k) => setChartType(k as ChartType)}
                    variant="pills"
                    className="!gap-1"
                  />
                </div>
                <div className="card p-4">
                  <div className="h-64 md:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "area" ? (
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1E6FFF" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#1E6FFF" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorFund" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorMedical" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                          <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `¥${v}`} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid #E2E8F0",
                              boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                              fontSize: 13,
                            }}
                            formatter={(value: number) => [formatMoney(value), ""]}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                          <Area type="monotone" dataKey="合计" stroke="#1E6FFF" strokeWidth={2} fill="url(#colorTotal)" />
                          <Area type="monotone" dataKey="公积金" stroke="#10B981" strokeWidth={2} fill="url(#colorFund)" />
                          <Area type="monotone" dataKey="养老保险" stroke="#6366F1" strokeWidth={1.5} fill="transparent" />
                          <Area type="monotone" dataKey="医疗保险" stroke="#F59E0B" strokeWidth={1.5} fill="url(#colorMedical)" />
                        </AreaChart>
                      ) : (
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                          <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `¥${v}`} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid #E2E8F0",
                              boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                              fontSize: 13,
                            }}
                            formatter={(value: number) => [formatMoney(value), ""]}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="公积金" fill="#10B981" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="养老保险" fill="#6366F1" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="医疗保险" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="失业保险" fill="#EC4899" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="section-title">缴费明细</h3>
                  <span className="text-xs text-slate-500">
                    共 {account.contributionHistory.length} 个月
                  </span>
                </div>
                <div className="space-y-2.5">
                  {account.contributionHistory.map((record) => {
                    const isExpanded = expandedMonth === record.month;
                    const total =
                      record.housingFund +
                      record.pension +
                      record.medical +
                      record.unemployment;
                    return (
                      <div key={record.month} className="card overflow-hidden">
                        <button
                          onClick={() => setExpandedMonth(isExpanded ? null : record.month)}
                          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center text-brand-600">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-semibold text-slate-800">
                                {record.month.replace("-", "年")}月
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                共 4 项缴费
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-bold text-slate-800">
                                {formatMoney(total)}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                合计
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-slate-100 px-4 py-3 space-y-2.5 bg-slate-50/50 animate-slide-down">
                            {[
                              { label: "住房公积金", value: record.housingFund, color: "text-emerald-600", bg: "bg-emerald-50" },
                              { label: "养老保险", value: record.pension, color: "text-indigo-600", bg: "bg-indigo-50" },
                              { label: "医疗保险", value: record.medical, color: "text-amber-600", bg: "bg-amber-50" },
                              { label: "失业保险", value: record.unemployment, color: "text-pink-600", bg: "bg-pink-50" },
                            ].map((item) => (
                              <div
                                key={item.label}
                                className="flex items-center justify-between py-1.5"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={cn("w-2 h-2 rounded-full", item.bg.replace("bg-", "bg-").replace("-50", "-400"))} />
                                  <span className="text-sm text-slate-600">{item.label}</span>
                                </div>
                                <span className={cn("text-sm font-semibold", item.color)}>
                                  {formatMoney(item.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGenerateCertificate}
                  disabled={generatingCert}
                  className="w-full btn-primary py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {generatingCert ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      正在生成凭证...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-5 h-5" />
                      生成电子凭证
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500 text-center mt-2.5 flex items-center justify-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  生成的 PDF 凭证与纸质凭证具有同等法律效力
                </p>
              </div>
            </>
          )
        )}
      </div>
    </AppLayout>
  );
}
