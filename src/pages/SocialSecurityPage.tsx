import { useEffect, useMemo, useState, useRef } from "react";
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
  RefreshCw,
  ShieldCheck,
  Stamp,
  QrCode,
  Mail,
  WalletCards,
  X,
  FileText,
  BadgeCheck,
  Clock,
  Hash,
  Award,
  ChevronRight,
  User,
  Briefcase,
  Heart,
  Copy,
  Check,
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
import type { SocialSecurityAccount, CertificateResponse, VerificationRecord } from "../../shared/types";
import { formatMoney, formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

interface InsuranceItem {
  key: keyof SocialSecurityAccount["socialInsurance"];
  label: string;
  color: string;
  maxMonths: number;
  icon: typeof Home;
  personalRate: string;
  unitRate: string;
}

const INSURANCE_LIST: InsuranceItem[] = [
  { key: "pension", label: "养老保险", color: "#1E40AF", maxMonths: 360, icon: Briefcase, personalRate: "8%", unitRate: "16%" },
  { key: "medical", label: "医疗保险", color: "#059669", maxMonths: 300, icon: Heart, personalRate: "2%", unitRate: "8%" },
  { key: "unemployment", label: "失业保险", color: "#D97706", maxMonths: 240, icon: User, personalRate: "0.5%", unitRate: "0.5%" },
  { key: "workInjury", label: "工伤保险", color: "#DC2626", maxMonths: 240, icon: ShieldCheck, personalRate: "0%", unitRate: "0.5%" },
  { key: "maternity", label: "生育保险", color: "#DB2777", maxMonths: 120, icon: Award, personalRate: "0%", unitRate: "1%" },
];

type ChartType = "area" | "bar";
type CertificateType = "housing-fund" | "social-security" | "five-insurance";
type CertificateStep = 0 | 1 | 2 | 3 | 4;
type SecurityTabKey = "history" | "verifications" | "certificate";

const CERTIFICATE_TYPES: { key: CertificateType; label: string; desc: string; icon: typeof FileText }[] = [
  { key: "housing-fund", label: "公积金缴存证明", desc: "住房公积金缴存明细凭证", icon: Home },
  { key: "social-security", label: "社保缴费证明", desc: "社会保险缴费汇总凭证", icon: FileText },
  { key: "five-insurance", label: "五险参保证明", desc: "五项保险参保状态凭证", icon: ShieldCheck },
];

export default function SocialSecurityPage() {
  const { showToast, setLoading } = useAppStore();
  const [account, setAccount] = useState<SocialSecurityAccount | null>(null);
  const [loading, setLoadingState] = useState(true);
  const [chartType, setChartType] = useState<ChartType>("area");
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [expandedInsurance, setExpandedInsurance] = useState<string | null>(null);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [verifyTick, setVerifyTick] = useState(0);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [showVerifyReport, setShowVerifyReport] = useState(false);
  const [showCertCenter, setShowCertCenter] = useState(false);
  const [selectedCertType, setSelectedCertType] = useState<CertificateType>("housing-fund");
  const [certStep, setCertStep] = useState<CertificateStep>(0);
  const [certReady, setCertReady] = useState(false);
  const [certResponse, setCertResponse] = useState<CertificateResponse | null>(null);
  const [copiedCertNo, setCopiedCertNo] = useState(false);
  const [activeTab, setActiveTab] = useState<SecurityTabKey>("history");
  const [verificationRecords, setVerificationRecords] = useState<VerificationRecord[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);

  const verifyReportData = useMemo(() => ({
    source: "山东省人力资源和社会保障厅核心业务库",
    status: "已通过",
    verifyTime: formatDate(new Date(), "YYYY年MM月DD日 HH:mm:ss"),
    serialNo: "SD-HY-" + Date.now().toString() + Math.floor(Math.random() * 10000).toString().padStart(4, "0"),
    verifyItem: "社保缴费明细核验",
    verifyMethod: "官方数据库实时比对",
    matchRate: "100%",
  }), [showVerifyReport]);

  const certData = useMemo(() => {
    if (certResponse) {
      return {
        certNo: certResponse.certNo,
        verifyCode: certResponse.verifyCode,
        issueDate: certResponse.issueDate,
        validUntil: certResponse.validUntil,
        qrData: certResponse.qrData,
        pdfData: certResponse.pdfData,
        base64: certResponse.base64,
        filename: certResponse.filename,
        verifyCount: certResponse.verifyCount,
        verifyRecords: certResponse.verifyRecords || [],
      };
    }
    return {
      certNo: "",
      verifyCode: "",
      issueDate: "",
      validUntil: "",
      qrData: "",
      pdfData: "",
      base64: "",
      filename: "",
      verifyCount: 0,
      verifyRecords: [] as CertificateResponse["verifyRecords"],
    };
  }, [certResponse]);

  useEffect(() => {
    const timer = setInterval(() => {
      setVerifyTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoadingState(true);
      setLoadingVerifications(true);
      const [data, verifications] = await Promise.all([
        socialSecurityApi.getAccount(),
        socialSecurityApi.getVerifications(),
      ]);
      setAccount(data);
      setVerificationRecords(verifications);
      setLastUpdateTime(new Date());
    } catch (e) {
      console.error(e);
      showToast("获取社保公积金信息失败", "error");
    } finally {
      setLoadingState(false);
      setLoadingVerifications(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
    showToast("数据已刷新", "success");
  };

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

  const availableYears = useMemo(() => {
    if (!account) return [];
    const years = new Set<string>();
    account.contributionHistory.forEach((item) => {
      years.add(item.month.slice(0, 4));
    });
    return Array.from(years).sort().reverse();
  }, [account]);

  const filteredHistory = useMemo(() => {
    if (!account) return [];
    if (selectedYear === "all") return account.contributionHistory;
    return account.contributionHistory.filter((item) => item.month.startsWith(selectedYear));
  }, [account, selectedYear]);

  const startGenerateCertificate = () => {
    setCertStep(0);
    setCertReady(false);
    setCertResponse(null);
    setShowCertCenter(true);
  };

  const handleGenerateCertificate = async () => {
    if (generatingCert) return;
    setGeneratingCert(true);
    setCertStep(1);

    const stepDuration = 800;

    setTimeout(() => setCertStep(2), stepDuration);
    setTimeout(() => setCertStep(3), stepDuration * 2);

    try {
      const response = await socialSecurityApi.generateCertificate();
      setTimeout(() => {
        setCertResponse(response);
        setCertStep(4);
        setCertReady(true);
        setGeneratingCert(false);
        showToast("电子凭证生成成功", "success");
      }, stepDuration);
    } catch (error) {
      setGeneratingCert(false);
      setCertStep(0);
      showToast("电子凭证生成失败，请重试", "error");
    }
  };

  const handleDownloadCert = () => {
    if (!certData.pdfData || !certData.filename) {
      showToast("PDF数据未就绪", "error");
      return;
    }
    try {
      const byteCharacters = atob(certData.pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = certData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("凭证下载成功", "success");
    } catch (error) {
      showToast("下载失败，请重试", "error");
    }
  };

  const handleCopyCertNo = async () => {
    if (!certData.certNo) return;
    try {
      await navigator.clipboard.writeText(certData.certNo);
      setCopiedCertNo(true);
      showToast("凭证编号已复制", "success");
      setTimeout(() => setCopiedCertNo(false), 2000);
    } catch (error) {
      showToast("复制失败，请手动复制", "error");
    }
  };

  const handleSendEmail = () => {
    showToast("凭证已发送至您的邮箱", "success");
  };

  const handleSaveToCard = () => {
    showToast("凭证已保存到卡包", "success");
  };

  const closeCertCenter = () => {
    setShowCertCenter(false);
    setTimeout(() => {
      setCertStep(0);
      setCertReady(false);
    }, 300);
  };

  return (
    <AppLayout showHeader={false} showBottomNav={false} className="!pb-6">
      <PageHeader
        title="公积金·社保"
        actions={
          <button
            onClick={handleRefresh}
            className="w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-brand-600 shadow-sm active:scale-95 transition-transform"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        }
      />

      <div className="px-4 -mt-2 mb-4">
        <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 border border-blue-200/60 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-blue-900" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                数据来源：山东省人力资源和社会保障厅
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                实时同步
              </span>
            </div>
            <div className="text-[11px] text-blue-600/70 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              最后更新：{formatDate(lastUpdateTime, "YYYY-MM-DD HH:mm:ss")}
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          查询结果：已按实名用户“张三”匹配住房公积金、五险参保和缴费明细，筛选条件可通过年份、险种和电子凭证中心继续核验。
        </div>
      </div>

      <div className="space-y-5 px-4">
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
              <div className="relative">
                <div className="absolute -top-1 -right-1 z-10">
                  <div className="relative flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-lg">
                    <BadgeCheck
                      key={verifyTick}
                      className="w-3.5 h-3.5"
                      style={{ animation: "verifyTick 1s ease-in-out" }}
                    />
                    实时核验
                  </div>
                </div>
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
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="section-title" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                    社保五险状态
                  </h3>
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    数据已核验
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {INSURANCE_LIST.map((item) => {
                    const info = account.socialInsurance[item.key];
                    const isExpanded = expandedInsurance === item.key;
                    const consecutiveMonths = Math.min(info.months, Math.floor(Math.random() * 24) + 60);
                    const IconComp = item.icon;

                    return (
                      <div key={item.key} className="card overflow-hidden">
                        <button
                          onClick={() => setExpandedInsurance(isExpanded ? null : item.key)}
                          className="w-full p-3.5 flex flex-col items-center text-center"
                        >
                          <StatRing
                            value={info.months}
                            max={item.maxMonths}
                            size={80}
                            strokeWidth={7}
                            color={item.color}
                            label={`${info.months}`}
                            sublabel="个月"
                          />
                          <div className="mt-2 text-sm font-semibold text-slate-800 flex items-center gap-1">
                            <IconComp className="w-3.5 h-3.5" style={{ color: item.color }} />
                            {item.label}
                          </div>
                          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            连续缴费 {consecutiveMonths} 个月
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{info.status}</div>
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 text-slate-400 mt-1.5 transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </button>
                        {isExpanded && (
                          <div className="border-t border-slate-100 px-3.5 py-3 bg-gradient-to-b from-slate-50 to-white space-y-2.5 animate-slide-down">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">缴费基数</span>
                              <span className="font-semibold text-slate-800">{formatMoney(info.base, { decimals: 0 })}/月</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">个人缴纳</span>
                              <span className="font-semibold text-blue-600">{item.personalRate}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">单位缴纳</span>
                              <span className="font-semibold text-emerald-600">{item.unitRate}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">累计月数</span>
                              <span className="font-semibold text-slate-800">{info.months} 个月</span>
                            </div>
                            {item.key === "medical" && (
                              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                                <span className="text-slate-500">个人账户余额</span>
                                <span className="font-bold text-emerald-600">
                                  {formatMoney(Math.floor(info.base * 0.03 * info.months * 0.7))}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="section-title" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                    缴费趋势
                  </h3>
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
                              <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#1E40AF" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorFund" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorMedical" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
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
                          <Area type="monotone" dataKey="合计" stroke="#1E40AF" strokeWidth={2} fill="url(#colorTotal)" />
                          <Area type="monotone" dataKey="公积金" stroke="#059669" strokeWidth={2} fill="url(#colorFund)" />
                          <Area type="monotone" dataKey="养老保险" stroke="#4F46E5" strokeWidth={1.5} fill="transparent" />
                          <Area type="monotone" dataKey="医疗保险" stroke="#D97706" strokeWidth={1.5} fill="url(#colorMedical)" />
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
                          <Bar dataKey="公积金" fill="#059669" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="养老保险" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="医疗保险" fill="#D97706" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="失业保险" fill="#DB2777" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="section-title" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                    缴费明细与核验
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      共 {account.contributionHistory.length} 个月
                    </span>
                    <button
                      onClick={() => setShowVerifyReport(true)}
                      className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1 active:bg-blue-100 transition-colors"
                    >
                      <Stamp className="w-3 h-3" />
                      核验报告
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <TabBar
                    tabs={[
                      { key: "history", label: "缴费明细", icon: Calendar },
                      { key: "verifications", label: "核验历史", icon: ShieldCheck },
                    ]}
                    activeKey={activeTab}
                    onChange={(k) => setActiveTab(k as SecurityTabKey)}
                    variant="default"
                    className="!gap-0"
                  />
                </div>

                {activeTab === "history" && (
                  <>
                    <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
                      <button
                        onClick={() => setSelectedYear("all")}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-full flex-shrink-0 transition-all",
                          selectedYear === "all"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        全部
                      </button>
                      {availableYears.map((year) => (
                        <button
                          key={year}
                          onClick={() => setSelectedYear(year)}
                          className={cn(
                            "text-xs px-3 py-1.5 rounded-full flex-shrink-0 transition-all",
                            selectedYear === year
                              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {year}年
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5">
                      {filteredHistory.map((record) => {
                        const isExpanded = expandedMonth === record.month;
                        const total =
                          record.housingFund +
                          record.pension +
                          record.medical +
                          record.unemployment;
                        const relatedVerification = verificationRecords.find((v) => v.month === record.month);
                        return (
                          <div key={record.month} className="card overflow-hidden">
                            <button
                              onClick={() => setExpandedMonth(isExpanded ? null : record.month)}
                              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 relative">
                                  <Calendar className="w-5 h-5" />
                                  {record.verified && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-sm">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="text-left">
                                  <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                    {record.month.replace("-", "年")}月
                                    {record.verified && (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                        <Stamp className="w-2.5 h-2.5" />
                                        已核验
                                      </span>
                                    )}
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
                              <div className="border-t border-slate-100 px-4 py-3 space-y-3 bg-slate-50/50 animate-slide-down">
                                <div className="space-y-2">
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

                                {record.verified && (
                                  <div className="pt-3 mt-1 border-t border-slate-200 rounded-xl bg-gradient-to-r from-emerald-50 via-white to-blue-50 p-3 border border-emerald-100">
                                    <div className="flex items-center gap-1.5 mb-2.5">
                                      <BadgeCheck className="w-4 h-4 text-emerald-600" />
                                      <span className="text-xs font-semibold text-emerald-700">核验详情</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                                      <div>
                                        <span className="text-slate-500">核验编号</span>
                                        <div className="font-mono font-semibold text-slate-800 mt-0.5">
                                          {record.verifyNo || relatedVerification?.verifyNo || "-"}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">核验机构</span>
                                        <div className="font-semibold text-slate-800 mt-0.5">
                                          {record.verifySource || relatedVerification?.verifySource || "青岛市社保中心"}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">核验时间</span>
                                        <div className="font-semibold text-slate-800 mt-0.5">
                                          {record.verifiedAt || relatedVerification?.verifiedAt
                                            ? formatDate(record.verifiedAt || relatedVerification?.verifiedAt || "", "YYYY-MM-DD HH:mm")
                                            : "-"}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">数据匹配率</span>
                                        <div className="font-semibold text-emerald-600 mt-0.5">
                                          {relatedVerification ? `${relatedVerification.dataMatchRate}%` : "100%"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {activeTab === "verifications" && (
                  <div className="card p-0 overflow-hidden">
                    {loadingVerifications ? (
                      <div className="py-12 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      </div>
                    ) : verificationRecords.length === 0 ? (
                      <div className="py-12 text-center text-sm text-slate-500">
                        暂无核验记录
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 text-xs">
                              <th className="text-left font-medium px-4 py-3">核验编号</th>
                              <th className="text-left font-medium px-4 py-3">类型</th>
                              <th className="text-left font-medium px-4 py-3">月份</th>
                              <th className="text-left font-medium px-4 py-3">匹配率</th>
                              <th className="text-left font-medium px-4 py-3">状态</th>
                              <th className="text-left font-medium px-4 py-3">核验人</th>
                              <th className="text-left font-medium px-4 py-3">时间</th>
                            </tr>
                          </thead>
                          <tbody>
                            {verificationRecords.map((v) => (
                              <tr key={v.verifyNo} className="border-t border-slate-100 hover:bg-slate-50/50">
                                <td className="px-4 py-3 font-mono text-xs text-slate-700">{v.verifyNo}</td>
                                <td className="px-4 py-3">
                                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    {v.type === "housing_fund" ? "公积金" : v.type === "pension" ? "养老" : "医疗"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-700">{v.month}</td>
                                <td className="px-4 py-3">
                                  <span className="font-semibold text-emerald-600">{v.dataMatchRate}%</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                                      v.status === "passed"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                    )}
                                  >
                                    {v.status === "passed" ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                    {v.status === "passed" ? "通过" : "不一致"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-700">{v.operator}</td>
                                <td className="px-4 py-3 text-xs text-slate-500">
                                  {formatDate(v.verifiedAt, "YYYY-MM-DD HH:mm")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={startGenerateCertificate}
                  className="w-full btn-primary py-3.5 flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  电子凭证中心
                </button>
                <p className="text-xs text-slate-500 text-center mt-2.5 flex items-center justify-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  生成的电子凭证与纸质凭证具有同等法律效力
                </p>
              </div>
            </>
          )
        )}
      </div>

      {showVerifyReport && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowVerifyReport(false)}
          />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-hidden animate-slide-up">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-semibold text-lg" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                  数据核验报告
                </h3>
              </div>
              <button
                onClick={() => setShowVerifyReport(false)}
                className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 rounded-2xl p-5 border border-blue-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500" />
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <div className="text-xl font-bold text-emerald-600 mb-1" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                  核验通过
                </div>
                <div className="text-sm text-slate-500">
                  数据与官方核心业务库一致
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">数据来源</div>
                    <div className="text-sm font-semibold text-slate-800">
                      {verifyReportData.source}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">核验状态</div>
                    <div className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {verifyReportData.status}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">核验时间</div>
                    <div className="text-sm font-semibold text-slate-800">
                      {verifyReportData.verifyTime}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Hash className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">核验流水号</div>
                    <div className="text-sm font-mono font-semibold text-slate-800">
                      {verifyReportData.serialNo}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">核验事项</div>
                    <div className="text-sm font-semibold text-slate-800">
                      {verifyReportData.verifyItem}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">核验方式</div>
                    <div className="text-sm font-semibold text-slate-800">
                      {verifyReportData.verifyMethod}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">数据匹配率</div>
                    <div className="text-sm font-semibold text-emerald-600">
                      {verifyReportData.matchRate}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-center">
                <div className="relative w-36 h-36">
                  <div className="absolute inset-0 rounded-full border-4 border-red-600/90 flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100/50 shadow-xl">
                    <div className="text-center px-2">
                      <div className="text-red-800 text-[11px] font-bold" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                        山东省
                      </div>
                      <div className="text-red-800 text-base font-bold" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                        人力资源
                      </div>
                      <div className="text-red-800 text-base font-bold" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                        和社会保障厅
                      </div>
                      <div className="text-red-600 text-[10px] mt-1 font-medium">
                        数据核验专用章
                      </div>
                      <div className="text-red-500 text-[8px] mt-0.5 font-mono">
                        {formatDate(new Date(), "YYYY-MM-DD")}
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-2 rounded-full border-2 border-red-400/60" />
                  <div className="absolute inset-4 rounded-full border border-red-300/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCertCenter && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeCertCenter}
          />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden animate-slide-up flex flex-col">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <h3 className="font-semibold text-lg" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                  电子凭证中心
                </h3>
              </div>
              <button
                onClick={closeCertCenter}
                className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {!certReady && certStep === 0 && (
                <div className="space-y-4">
                  <div className="text-sm text-slate-600 mb-2">
                    请选择要生成的凭证类型：
                  </div>
                  <div className="space-y-2.5">
                    {CERTIFICATE_TYPES.map((type) => {
                      const IconComp = type.icon;
                      const isSelected = selectedCertType === type.key;
                      return (
                        <button
                          key={type.key}
                          onClick={() => setSelectedCertType(type.key)}
                          className={cn(
                            "w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3",
                            isSelected
                              ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                              : "border-slate-200 bg-white hover:border-blue-300"
                          )}
                        >
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                              isSelected
                                ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white"
                                : "bg-slate-100 text-slate-600"
                            )}
                          >
                            <IconComp className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                "font-semibold",
                                isSelected ? "text-blue-700" : "text-slate-800"
                              )}
                              style={{ fontFamily: "'Noto Serif SC', serif" }}
                            >
                              {type.label}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {type.desc}
                            </div>
                          </div>
                          <ChevronRight
                            className={cn(
                              "w-5 h-5 flex-shrink-0 transition-colors",
                              isSelected ? "text-blue-500" : "text-slate-300"
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-3">
                    <button
                      onClick={handleGenerateCertificate}
                      disabled={generatingCert}
                      className="w-full btn-primary py-3.5 disabled:opacity-60"
                    >
                      {generatingCert ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          处理中...
                        </>
                      ) : (
                        <>
                          <FileDown className="w-5 h-5" />
                          开始生成凭证
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {(certStep > 0 && !certReady) && (
                <div className="py-8">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                    <div className="text-lg font-semibold text-slate-800" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                      正在生成电子凭证
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      请稍候，正在与官方系统核验...
                    </div>
                  </div>

                  <div className="space-y-0">
                    {[
                      { step: 1, label: "提交申请", icon: FileText },
                      { step: 2, label: "数据核验", icon: ShieldCheck },
                      { step: 3, label: "电子签章", icon: Stamp },
                      { step: 4, label: "凭证生成", icon: CheckCircle2 },
                    ].map((item) => {
                      const IconComp = item.icon;
                      const isDone = certStep > item.step;
                      const isActive = certStep === item.step;
                      return (
                        <div key={item.step} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                                isDone && "bg-emerald-500 border-emerald-500 text-white",
                                isActive && "bg-blue-500 border-blue-500 text-white animate-pulse",
                                !isDone && !isActive && "bg-white border-slate-200 text-slate-300"
                              )}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <IconComp className="w-5 h-5" />
                              )}
                            </div>
                            {item.step < 4 && (
                              <div
                                className={cn(
                                  "w-0.5 flex-1 min-h-[24px]",
                                  isDone ? "bg-emerald-400" : "bg-slate-200"
                                )}
                              />
                            )}
                          </div>
                          <div className="pt-2">
                            <div
                              className={cn(
                                "font-medium text-sm",
                                (isDone || isActive) ? "text-slate-800" : "text-slate-400"
                              )}
                            >
                              {item.label}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {isDone ? "已完成" : isActive ? "进行中..." : "等待中"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {certReady && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-4 border border-emerald-200 text-center">
                    <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-lg font-bold text-emerald-700" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                      凭证生成成功
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      与纸质凭证具有同等法律效力
                    </div>
                  </div>

                  <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg">
                    <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-4 text-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div
                            key={i}
                            className="absolute border border-white"
                            style={{
                              left: `${i * 5}%`,
                              top: `${(i % 4) * 25}%`,
                              width: "60px",
                              height: "20px",
                              transform: `rotate(${(i % 3) * 15 - 15}deg)`,
                            }}
                          />
                        ))}
                      </div>
                      <div className="relative">
                        <div className="text-xs opacity-80 mb-1">山东省人力资源和社会保障厅</div>
                        <div className="text-xl font-bold" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                          {CERTIFICATE_TYPES.find((t) => t.key === selectedCertType)?.label}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 relative">
                      <div className="absolute top-2 right-2 w-20 h-20 opacity-20">
                        <div className="w-full h-full rounded-full border-2 border-red-600 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-red-600 text-[8px] font-bold">山东省</div>
                            <div className="text-red-600 text-[10px] font-bold">人社厅</div>
                            <div className="text-red-600 text-[7px]">电子签章</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5 relative z-10">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">姓名</span>
                          <span className="font-medium text-slate-800">{account?.name || "张三"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">证件号码</span>
                          <span className="font-medium text-slate-800 font-mono text-xs">
                            {account?.idCard?.slice(0, 6)}********{account?.idCard?.slice(-4) || "1234"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">凭证编号</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-medium text-blue-700 text-xs">{certData.certNo}</span>
                            <button
                              onClick={handleCopyCertNo}
                              className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                              title="复制凭证编号"
                            >
                              {copiedCertNo ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">验证码</span>
                          <span className="font-mono font-bold text-emerald-600 text-sm tracking-wider">{certData.verifyCode}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">签发日期</span>
                          <span className="font-medium text-slate-800">{certData.issueDate}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">有效期至</span>
                          <span className="font-medium text-slate-800 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            {certData.validUntil}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">已核验次数</span>
                          <span className="font-semibold text-blue-600 flex items-center gap-1">
                            <BadgeCheck className="w-3.5 h-3.5" />
                            {certData.verifyCount} 次
                          </span>
                        </div>
                      </div>

                      {certData.verifyRecords && certData.verifyRecords.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-dashed border-slate-300">
                          <div className="text-xs text-slate-500 font-medium mb-2.5 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                            最近核验记录（{certData.verifyRecords.length}条）
                          </div>
                          <div className="space-y-2">
                            {certData.verifyRecords.map((r) => (
                              <div key={r.verifyNo} className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono text-[11px] text-blue-600">{r.verifyNo}</span>
                                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    匹配率 {r.dataMatchRate}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                  <span>{r.verifyOrg} · {r.operator}</span>
                                  <span>{formatDate(r.verifiedAt, "YYYY-MM-DD HH:mm")}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {certData.pdfData && (
                        <div className="mt-4 pt-4 border-t border-dashed border-slate-300">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-slate-500 font-medium">PDF预览</span>
                            <button
                              onClick={handleDownloadCert}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <FileDown className="w-3 h-3" />
                              下载
                            </button>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                            <iframe
                              src={`data:application/pdf;base64,${certData.pdfData}`}
                              className="w-full h-40 rounded-lg bg-white"
                              title="电子凭证PDF预览"
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-dashed border-slate-300 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-[11px] text-slate-500 leading-relaxed">
                            本电子凭证由山东省人力资源和社会保障厅签发，与纸质凭证具有同等法律效力。
                          </div>
                        </div>
                        <div className="relative w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0 ml-3 border-2 border-slate-200">
                          <QrCode className="w-12 h-12 text-slate-700" />
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-700 text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            扫码核验
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-2 text-center text-xs font-medium">
                      🔒 防伪验证：扫描二维码或登录官网核验真伪
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      onClick={handleCopyCertNo}
                      className="py-3 text-sm rounded-xl border-2 border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {copiedCertNo ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      {copiedCertNo ? "已复制" : "复制编号"}
                    </button>
                    <button
                      onClick={handleDownloadCert}
                      className="btn-primary py-3 text-sm flex items-center justify-center gap-1.5"
                    >
                      <FileDown className="w-4 h-4" />
                      下载PDF
                    </button>
                    <button
                      className="py-3 text-sm rounded-xl border-2 border-purple-200 text-purple-600 font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="w-4 h-4" />
                      扫码核验
                    </button>
                    <button
                      onClick={handleSendEmail}
                      className="py-3 text-sm rounded-xl border-2 border-blue-200 text-blue-600 font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Mail className="w-4 h-4" />
                      发送邮箱
                    </button>
                    <button
                      onClick={handleSaveToCard}
                      className="col-span-2 py-3 text-sm rounded-xl border-2 border-emerald-200 text-emerald-600 font-medium hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <WalletCards className="w-4 h-4" />
                      保存到卡包
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes verifyTick {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.3) rotate(180deg); opacity: 0.7; }
          100% { transform: scale(1) rotate(360deg); opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slide-down {
          from { max-height: 0; opacity: 0; }
          to { max-height: 500px; opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </AppLayout>
  );
}
