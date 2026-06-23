import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  MapPin,
  Cloud,
  Sun,
  CloudRain,
  ShieldCheck,
  AlertTriangle,
  Train,
  Bus,
  Building2,
  Wallet,
  FileCheck,
  Receipt,
  Search,
  X,
  Zap,
  Droplets,
  Flame,
  Thermometer,
  Wifi,
  CreditCard,
  FileText,
  HardDrive,
  Download,
  CheckCircle,
  Users,
  Building,
  HandCoins,
  Activity,
  BadgeCheck,
  Landmark,
  Car,
  Home as HomeIcon,
  Stethoscope,
  Star,
  ChevronRight,
  Sparkles,
  QrCode,
  Eye,
  Radio,
  RefreshCw,
  Filter,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useLocation } from "@/hooks/useLocation";
import { useOfflineCache } from "@/hooks/useOfflineCache";
import { useAppStore } from "@/store/useAppStore";
import {
  weatherApi,
  trafficApi,
  servicesApi,
  socialSecurityApi,
  paymentApi,
  communityApi,
  poiApi,
  policiesApi,
  userApi,
} from "@/api";
import { formatMoney, formatDate, haversineDistance } from "@/utils/format";
import { cn } from "@/lib/utils";
import type {
  WeatherInfo,
  TrafficEvent,
  BusPrediction,
  ServiceEntry,
  SocialSecurityAccount,
  PaymentAccount,
  CommunityPost,
  PointOfInterest,
  PolicyDocument,
  UserProfile,
  PoiType,
  OpinionDashboard,
  TrafficOverview,
  TrafficDisposalStatus,
} from "../../shared/types";

interface RankedService extends ServiceEntry {
  distance: number;
  rankScore: number;
}

const SERVICE_DEPT_MAP: Record<string, string> = {
  "社保查询": "省人社厅",
  "公积金查询": "市住房公积金中心",
  "医保电子凭证": "市医保局",
  "身份证办理": "市公安局",
  "护照办理": "出入境管理局",
  "实时公交": "公交集团",
  "地铁出行": "青岛地铁",
  "交通违法处理": "交警支队",
  "停车缴费": "市南区缴费",
  "路况信息": "交通委",
  "水电燃气缴费": "市南区缴费",
  "天气预报": "市气象局",
  "医院挂号": "市卫健委",
  "快递查询": "邮政管理局",
  "社区办事": "市南区民政局",
  "社区活动": "市南区文旅局",
  "社区论坛": "青青岛社区",
  "投诉建议": "12345热线",
  "政策查询": "市政府办公厅",
  "人才政策": "市人社局",
  "创业扶持": "市人社局",
  "惠民补贴": "市民政局",
};

const POI_SOURCE_MAP: Record<string, string> = {
  scenic: "市文旅局",
  restaurant: "市监局",
  medical: "市卫健委",
};

const PAYMENT_CATEGORIES: Array<{
  key: PaymentAccount["category"];
  label: string;
  icon: typeof Zap;
  bgColor: string;
  district: string;
}> = [
  { key: "electric", label: "电力", icon: Zap, bgColor: "bg-amber-500", district: "市南区" },
  { key: "water", label: "水务", icon: Droplets, bgColor: "bg-sky-500", district: "市南区" },
  { key: "gas", label: "燃气", icon: Flame, bgColor: "bg-rose-500", district: "李沧区" },
  { key: "heating", label: "供暖", icon: Thermometer, bgColor: "bg-orange-500", district: "市北区" },
  { key: "broadband", label: "宽带", icon: Wifi, bgColor: "bg-indigo-500", district: "崂山区" },
];

const SERVICE_ICONS: Record<string, typeof Building2> = {
  "公积金查询": Wallet,
  "社保查询": ShieldCheck,
  "医保电子凭证": FileCheck,
  "水电燃气缴费": Receipt,
  "供暖费缴纳": Thermometer,
  "交通出行": Train,
  "违章查询": Car,
  "不动产登记": HomeIcon,
  "医院预约挂号": Stethoscope,
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#10b981",
  neutral: "#64748b",
  negative: "#ef4444",
};

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

function getWeatherIcon(condition: string) {
  if (condition.includes("雨")) return CloudRain;
  if (condition.includes("晴")) return Sun;
  return Cloud;
}

function getAqiColor(aqi: number): string {
  if (aqi <= 50) return "bg-emerald-500";
  if (aqi <= 100) return "bg-yellow-500";
  if (aqi <= 150) return "bg-orange-500";
  return "bg-red-500";
}

function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case "positive":
      return "bg-emerald-500";
    case "negative":
      return "bg-red-500";
    default:
      return "bg-slate-400";
  }
}

function getOpinionLevelColor(level: number): string {
  if (level >= 4) return "bg-red-100 text-red-700 border-red-200";
  if (level >= 3) return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function getOpinionLevelLabel(level: number): string {
  if (level >= 5) return "极高";
  if (level >= 4) return "较高";
  if (level >= 3) return "中等";
  if (level >= 2) return "较低";
  return "很低";
}

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <span key={i} className="font-bold text-blue-600">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { location } = useLocation();
  const { isCached, addPolicy, removePolicy, cacheSizeKB, cachedPolicies } = useOfflineCache();
  const { user, setUser, showToast } = useAppStore();

  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [trafficEvents, setTrafficEvents] = useState<TrafficEvent[]>([]);
  const [trafficOverview, setTrafficOverview] = useState<TrafficOverview | null>(null);
  const [busPredictions, setBusPredictions] = useState<BusPrediction[]>([]);
  const [rankedServices, setRankedServices] = useState<RankedService[]>([]);
  const [socialSecurity, setSocialSecurity] = useState<SocialSecurityAccount | null>(null);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [opinionDashboard, setOpinionDashboard] = useState<OpinionDashboard | null>(null);
  const [scenicPois, setScenicPois] = useState<PointOfInterest[]>([]);
  const [restaurantPois, setRestaurantPois] = useState<PointOfInterest[]>([]);
  const [medicalPois, setMedicalPois] = useState<PointOfInterest[]>([]);
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [loading, setLoading] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [showSearchHint, setShowSearchHint] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<PaymentAccount[]>([]);
  const [activePaymentTab, setActivePaymentTab] = useState<PaymentAccount["category"] | null>(null);
  const [paymentInputValues, setPaymentInputValues] = useState<Record<string, string>>({});
  const [paymentSearchResults, setPaymentSearchResults] = useState<PaymentAccount[]>([]);

  const [offlineMode, setOfflineMode] = useState(false);
  const [activePoiTab, setActivePoiTab] = useState<PoiType>("scenic");
  const [cachingIds, setCachingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [
          weatherRes,
          eventsRes,
          overviewRes,
          busRes,
          servicesRes,
          ssRes,
          paymentRes,
          postsRes,
          dashboardRes,
          scenicRes,
          restaurantRes,
          medicalRes,
          policiesRes,
          profileRes,
        ] = await Promise.all([
          weatherApi.getCurrent({ lat: location.lat, lng: location.lng }),
          trafficApi.getEvents(),
          trafficApi.getOverview(),
          trafficApi.getBusPredictions(),
          servicesApi.rank({ lat: location.lat, lng: location.lng, district: location.district }),
          socialSecurityApi.getAccount(),
          paymentApi.searchAccounts(""),
          communityApi.getPosts({ pageSize: 3 }),
          communityApi.getDashboard(),
          poiApi.getList({ type: "scenic", radius: 5000, lat: location.lat, lng: location.lng }),
          poiApi.getList({ type: "restaurant", radius: 5000, lat: location.lat, lng: location.lng }),
          poiApi.getList({ type: "medical", radius: 5000, lat: location.lat, lng: location.lng }),
          policiesApi.getList({ pageSize: 5 }),
          userApi.getProfile().catch(() => null),
        ]);
        setTrafficOverview(overviewRes);

        setWeather(weatherRes);
        setTrafficEvents(eventsRes);
        setBusPredictions(busRes);
        setRankedServices(servicesRes.slice(0, 9));
        setSocialSecurity(ssRes);
        setPaymentAccounts(paymentRes);
        setCommunityPosts(postsRes);
        setOpinionDashboard(dashboardRes);
        setScenicPois(scenicRes);
        setRestaurantPois(restaurantRes);
        setMedicalPois(medicalRes);
        const syncedPolicies = policiesRes.map((p) => ({
          ...p,
          cached: isCached(p.id),
        }));
        setPolicies(syncedPolicies);
        if (profileRes) {
          setProfile(profileRes);
          setUser(profileRes);
        }
      } catch (err) {
        console.error("加载首页数据失败:", err);
      } finally {
        setLoading(false);
        setTimeout(() => setContentVisible(true), 50);
      }
    };

    fetchAllData();
  }, [location.lat, location.lng, location.district, setUser]);

  const groupedEvents = useMemo(() => {
    const accidents = trafficEvents.filter((e) => e.type === "accident");
    const metroDelays = trafficEvents.filter((e) => e.type === "metro_delay");
    return { accidents, metroDelays };
  }, [trafficEvents]);

  const unreadTrafficCount = useMemo(() => {
    return trafficEvents.filter((e) => !e.read).length;
  }, [trafficEvents]);

  const getDisposalStatusInfo = (status?: TrafficDisposalStatus) => {
    const map: Record<TrafficDisposalStatus, { label: string; color: string; bg: string }> = {
      arrived: { label: "已到场", color: "text-blue-700", bg: "bg-blue-100 border-blue-200" },
      processing: { label: "处理中", color: "text-amber-700", bg: "bg-amber-100 border-amber-200" },
      cleared: { label: "已疏通", color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-200" },
      recovered: { label: "已恢复", color: "text-teal-700", bg: "bg-teal-100 border-teal-200" },
      delayed: { label: "延误中", color: "text-orange-700", bg: "bg-orange-100 border-orange-200" },
      pending: { label: "待处置", color: "text-slate-700", bg: "bg-slate-100 border-slate-200" },
    };
    return map[status || "pending"];
  };

  const handleMarkRead = useCallback(async (eventId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await trafficApi.markAsRead(eventId);
      setTrafficEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, read: true } : ev)));
      showToast("已标记为已读", "success");
    } catch (err) {
      console.error(err);
    }
  }, [showToast]);

  const handleSubscribe = useCallback(async (eventId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await trafficApi.subscribeEvent(eventId);
      setTrafficEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, subscribed: true } : ev)));
      showToast(res.message || "订阅成功", "success");
    } catch (err) {
      console.error(err);
    }
  }, [showToast]);

  const mostSevereAccident = useMemo(() => {
    const sorted = [...groupedEvents.accidents].sort((a, b) => {
      const severityOrder = { danger: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    return sorted[0] || null;
  }, [groupedEvents.accidents]);

  const metroDelayLines = useMemo(() => {
    return groupedEvents.metroDelays.map((e) => {
      const match = e.title.match(/地铁(\d+号线)/);
      return match ? match[1] : e.title;
    });
  }, [groupedEvents.metroDelays]);

  const favoriteBusPrediction = useMemo(() => {
    return busPredictions[0] || null;
  }, [busPredictions]);

  const nextBusMinutes = useMemo(() => {
    if (!favoriteBusPrediction || favoriteBusPrediction.predictions.length === 0) return null;
    return favoriteBusPrediction.predictions[0].minutes;
  }, [favoriteBusPrediction]);

  const totalUnpaidAmount = useMemo(
    () =>
      paymentAccounts
        .filter((a) => a.status === "unpaid" || a.status === "overdue")
        .reduce((sum, a) => sum + a.amountDue, 0),
    [paymentAccounts]
  );

  const totalUnpaidCount = useMemo(
    () => paymentAccounts.filter((a) => a.status === "unpaid" || a.status === "overdue").length,
    [paymentAccounts]
  );

  const sentimentData = useMemo(() => {
    if (!opinionDashboard) return [];
    return [
      { name: "正面", value: opinionDashboard.positiveCount, color: SENTIMENT_COLORS.positive },
      { name: "中性", value: opinionDashboard.neutralCount, color: SENTIMENT_COLORS.neutral },
      { name: "负面", value: opinionDashboard.negativeCount, color: SENTIMENT_COLORS.negative },
    ];
  }, [opinionDashboard]);

  const overallOpinionLevel = useMemo(() => {
    if (!opinionDashboard) return 1;
    const ratio = opinionDashboard.negativeCount / opinionDashboard.totalPosts;
    if (ratio > 0.35) return 5;
    if (ratio > 0.25) return 4;
    if (ratio > 0.15) return 3;
    if (ratio > 0.08) return 2;
    return 1;
  }, [opinionDashboard]);

  const currentPoiList = useMemo(() => {
    switch (activePoiTab) {
      case "scenic":
        return scenicPois;
      case "restaurant":
        return restaurantPois;
      case "medical":
        return medicalPois;
      default:
        return scenicPois;
    }
  }, [activePoiTab, scenicPois, restaurantPois, medicalPois]);

  const cachedCount = useMemo(
    () => policies.filter((p) => isCached(p.id)).length,
    [policies, isCached]
  );

  const filteredPolicies = useMemo(() => {
    if (offlineMode) {
      if (cachedCount === 0) {
        return [];
      }
      return policies.filter((p) => isCached(p.id));
    }
    return policies;
  }, [policies, offlineMode, isCached, cachedCount]);

  const handleSearchChange = useCallback(
    async (value: string) => {
      setSearchKeyword(value);
      if (value.trim().length > 0) {
        try {
          const results = await paymentApi.searchAccounts(value);
          setSearchSuggestions(results.slice(0, 5));
          setShowSearchHint(true);
        } catch {
          setSearchSuggestions([]);
        }
      } else {
        setSearchSuggestions([]);
        setShowSearchHint(false);
      }
    },
    []
  );

  const handleQuickFill = useCallback((account: PaymentAccount) => {
    setSearchKeyword(account.accountName);
    setPaymentInputValues((prev) => ({
      ...prev,
      [account.category]: account.accountNumber,
    }));
    setShowSearchHint(false);
  }, []);

  const handleDownloadPolicy = useCallback(
    async (policy: PolicyDocument) => {
      if (!isCached(policy.id) && !cachingIds.has(policy.id)) {
        setCachingIds((prev) => new Set(prev).add(policy.id));
        setPolicies((prev) =>
          prev.map((p) =>
            p.id === policy.id ? { ...p, isCaching: true } : p
          )
        );
        await new Promise((resolve) => setTimeout(resolve, 600));
        addPolicy(policy);
        setPolicies((prev) =>
          prev.map((p) =>
            p.id === policy.id ? { ...p, cached: true, isCaching: false } : p
          )
        );
        setCachingIds((prev) => {
          const next = new Set(prev);
          next.delete(policy.id);
          return next;
        });
        showToast(`已缓存「${policy.title}」`, "success");
      }
    },
    [isCached, addPolicy, showToast, cachingIds]
  );

  const handleRemovePolicyCache = useCallback(
    (policy: PolicyDocument) => {
      removePolicy(policy.id);
      setPolicies((prev) =>
        prev.map((p) =>
          p.id === policy.id ? { ...p, cached: false, isCaching: false } : p
        )
      );
      showToast(`已清除「${policy.title}」缓存`, "success");
    },
    [removePolicy, showToast]
  );

  const handlePaymentTabClick = (category: PaymentAccount["category"]) => {
    setActivePaymentTab((prev) => (prev === category ? null : category));
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 6) return "凌晨好";
    if (hour < 12) return "上午好";
    if (hour < 14) return "中午好";
    if (hour < 18) return "下午好";
    return "晚上好";
  };

  const WeatherIcon = weather ? getWeatherIcon(weather.condition) : Sun;

  const getServiceDept = (name: string): string => {
    return SERVICE_DEPT_MAP[name] || "市政府";
  };

  const calculatePoiDistance = (poi: PointOfInterest): number => {
    return haversineDistance(
      { lat: location.lat, lng: location.lng },
      { lat: poi.lat, lng: poi.lng }
    );
  };

  if (loading) {
    return (
      <AppLayout showHeader={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500">正在加载青岛市民生服务数据...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const staggerStyle = (index: number) => ({
    animationDelay: `${index * 80 + 100}ms`,
    opacity: contentVisible ? 1 : 0,
    transform: contentVisible ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 0.5s ease-out ${index * 80 + 100}ms, transform 0.5s ease-out ${index * 80 + 100}ms`,
  });

  return (
    <AppLayout showHeader={false}>
      <div className="space-y-5 pb-6">
        {/* 区块1：LBS定位Header + 天气 */}
        <div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white p-5 shadow-xl"
          style={staggerStyle(0)}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-24 translate-x-24 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/20 rounded-full translate-y-20 -translate-x-16 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative">
                    <MapPin className="w-5 h-5 text-blue-200" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full" />
                  </div>
                  <span className="text-sm text-blue-100 font-medium">
                    青岛市 · {location.district || "市南区"} · {location.address || "香港中路11号"}
                  </span>
                  <span className="flex items-center gap-1 text-xs bg-emerald-500/90 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    已定位
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {getGreeting()}，{profile?.name || "张三"}
                  </h1>
                  <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur px-2.5 py-1 rounded-full text-xs border border-white/20">
                    <BadgeCheck className="w-3.5 h-3.5 text-yellow-300" />
                    实名认证
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/admin/dashboard")}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition-colors hover:bg-white/25"
              >
                <ShieldCheck className="h-4 w-4" />
                管理后台
              </button>
            </div>

            <div className="flex items-center justify-between mb-5 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <WeatherIcon className="w-10 h-10 text-yellow-300" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold tracking-tighter">{weather?.temperature ?? "--"}</span>
                    <span className="text-xl text-blue-200">°C</span>
                  </div>
                  <p className="text-sm text-blue-100 mt-1">{weather?.condition ?? "晴"} · {weather?.city ?? "青岛"}</p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${weather ? getAqiColor(weather.aqi) : "bg-slate-500"}`}>
                  <Activity className="w-3 h-3" />
                  AQI {weather?.aqi ?? "--"} {weather?.aqiLevel ?? "良"}
                </div>
                <p className="text-xs text-blue-200">湿度 {weather?.humidity ?? "--"}% · {weather?.wind ?? "--"}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "山东省人社厅", icon: Landmark },
                { name: "青岛交警", icon: ShieldCheck },
                { name: "各区缴费系统", icon: CreditCard },
              ].map((dept) => {
                const Icon = dept.icon;
                return (
                  <div
                    key={dept.name}
                    className="flex items-center gap-2 bg-white/8 backdrop-blur rounded-lg px-3 py-2.5 border border-white/10 hover:bg-white/15 transition-all"
                  >
                    <Icon className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                    <span className="text-xs text-blue-50 truncate flex-1">{dept.name}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 区块2：交通三栏状态卡 - 横向滚动 */}
        <div style={staggerStyle(1)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg font-semibold text-slate-800 tracking-tight flex items-center gap-2">
              <Radio className="w-5 h-5 text-blue-600" />
              交通态势感知
              {unreadTrafficCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                  {unreadTrafficCount > 99 ? "99+" : unreadTrafficCount}
                </span>
              )}
            </h2>
            <button
              onClick={() => navigate("/traffic")}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              查看全部
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {/* 事故快报卡 */}
            <div
              onClick={() => navigate("/traffic?tab=accidents")}
              className="relative flex-shrink-0 w-[240px] group cursor-pointer rounded-xl bg-white border border-red-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            >
              {mostSevereAccident && !mostSevereAccident.read && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm animate-pulse z-10" />
              )}
              <div className="bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3 border-b border-red-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shadow-sm">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">事故快报</h3>
                      <p className="text-[11px] text-slate-500">今日 {groupedEvents.accidents.length} 起</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-red-500 text-white text-xs font-bold rounded-full shadow-sm">
                    {groupedEvents.accidents.length}
                  </span>
                </div>
              </div>
              <div className="p-3">
                {mostSevereAccident ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full border font-medium",
                        getDisposalStatusInfo(mostSevereAccident.disposalStatus).bg,
                        getDisposalStatusInfo(mostSevereAccident.disposalStatus).color
                      )}>
                        <Activity className="w-2.5 h-2.5" />
                        {getDisposalStatusInfo(mostSevereAccident.disposalStatus).label}
                      </span>
                      {mostSevereAccident.affectedRange && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500">
                          <MapPin className="w-2.5 h-2.5 text-red-500" />
                          {mostSevereAccident.affectedRange}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 font-medium line-clamp-2 group-hover:text-red-600 transition-colors">
                      {mostSevereAccident.title}
                    </p>
                    <p className="text-[11px] text-slate-400">{getTimeAgo(mostSevereAccident.timestamp)}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-500">来源：</span>
                      <span className="text-[11px] text-slate-600">{mostSevereAccident.source}</span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                      {!mostSevereAccident.read && (
                        <button
                          onClick={(e) => handleMarkRead(mostSevereAccident.id, e)}
                          className="flex-1 text-[11px] py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium border border-blue-100"
                        >
                          标记已读
                        </button>
                      )}
                      <button
                        onClick={(e) => handleSubscribe(mostSevereAccident.id, e)}
                        className={cn(
                          "flex-1 text-[11px] py-1.5 rounded-lg font-medium border transition-colors",
                          mostSevereAccident.subscribed
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                        )}
                      >
                        {mostSevereAccident.subscribed ? "✓ 已订阅" : "订阅提醒"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">今日无事故</p>
                  </div>
                )}
              </div>
            </div>

            {/* 地铁延误卡 */}
            {(() => {
              const topDelay = groupedEvents.metroDelays[0];
              return (
                <div
                  onClick={() => navigate("/traffic?tab=metro")}
                  className="relative flex-shrink-0 w-[240px] group cursor-pointer rounded-xl bg-white border border-orange-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                >
                  {topDelay && !topDelay.read && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm animate-pulse z-10" />
                  )}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 border-b border-orange-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                          <Train className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 text-sm">地铁延误</h3>
                          <p className="text-[11px] text-slate-500">
                            {groupedEvents.metroDelays.length > 0 ? `${groupedEvents.metroDelays.length} 条线路` : "运行正常"}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-white text-xs font-bold rounded-full shadow-sm ${groupedEvents.metroDelays.length > 0 ? "bg-orange-500" : "bg-emerald-500"}`}>
                        {groupedEvents.metroDelays.length}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    {groupedEvents.metroDelays.length > 0 && topDelay ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full border font-medium",
                            getDisposalStatusInfo(topDelay.disposalStatus).bg,
                            getDisposalStatusInfo(topDelay.disposalStatus).color
                          )}>
                            <Activity className="w-2.5 h-2.5" />
                            {getDisposalStatusInfo(topDelay.disposalStatus).label}
                          </span>
                          {topDelay.affectedRange && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500">
                              <Users className="w-2.5 h-2.5 text-orange-500" />
                              {topDelay.affectedRange}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {metroDelayLines.slice(0, 2).map((line, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-orange-100 text-orange-700">
                                {line}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400 pt-0.5">
                          {getTimeAgo(topDelay.timestamp)}发生
                        </p>
                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                          {!topDelay.read && (
                            <button
                              onClick={(e) => handleMarkRead(topDelay.id, e)}
                              className="flex-1 text-[11px] py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium border border-blue-100"
                            >
                              标记已读
                            </button>
                          )}
                          <button
                            onClick={(e) => handleSubscribe(topDelay.id, e)}
                            className={cn(
                              "flex-1 text-[11px] py-1.5 rounded-lg font-medium border transition-colors",
                              topDelay.subscribed
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                            )}
                          >
                            {topDelay.subscribed ? "✓ 已订阅" : "订阅提醒"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                        <p className="text-xs text-slate-400">全线正常运行</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 公交预测卡 */}
            <div
              onClick={() => navigate("/traffic?tab=bus")}
              className="flex-shrink-0 w-[220px] group cursor-pointer rounded-xl bg-white border border-blue-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-4 py-3 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                      <Bus className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">公交预测</h3>
                      <p className="text-[11px] text-slate-500">
                        {favoriteBusPrediction ? favoriteBusPrediction.routeName : "暂无数据"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {nextBusMinutes !== null ? (
                      <span className="text-xl font-bold text-blue-600">
                        {nextBusMinutes}
                        <span className="text-xs font-normal text-slate-500 ml-0.5">分钟</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">--</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-3">
                {favoriteBusPrediction ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-600">
                      <span className="text-slate-400">下一班：</span>
                      {favoriteBusPrediction.predictions[0]?.plateNumber || "--"}
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="text-slate-400">站点：</span>
                      {favoriteBusPrediction.stopName}
                    </p>
                    <div className="flex items-center gap-1 pt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-[11px] text-slate-500">已收藏线路</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <Bus className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">暂无收藏线路</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 区块3：公积金社保政务闭环入口 */}
        <div className="grid grid-cols-2 gap-3" style={staggerStyle(2)}>
          {/* 公积金 */}
          <div
            onClick={() => navigate("/social-security?tab=housing")}
            className="relative overflow-hidden rounded-2xl p-4 text-white shadow-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10" />
            <div className="absolute -right-12 top-4 w-24 h-24 rounded-full bg-white/5" />
            
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2 py-0.5 rounded-full text-[10px] border border-white/20">
                <QrCode className="w-3 h-3" />
                电子凭证
              </span>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-white/80 text-sm font-medium">住房公积金</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold tracking-tight">
                  {formatMoney(socialSecurity?.housingFund.balance || 0, { symbol: "¥" })}
                </span>
              </div>
              <p className="text-white/60 text-[11px] mb-3">
                月缴 {formatMoney(socialSecurity?.housingFund.monthlyContribution || 0, { symbol: "" })}
              </p>
              
              <div className="flex items-center justify-between pt-2.5 border-t border-white/15">
                <span className="inline-flex items-center gap-1 text-[11px] text-white/70">
                  <ShieldCheck className="w-3 h-3" />
                  明细核验
                </span>
                <span className="text-[10px] text-white/50">
                  数据来源：山东省人社厅
                </span>
              </div>
            </div>
          </div>

          {/* 社保 */}
          <div
            onClick={() => navigate("/social-security?tab=social")}
            className="relative overflow-hidden rounded-2xl p-4 text-white shadow-xl bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10" />
            <div className="absolute -right-12 top-4 w-24 h-24 rounded-full bg-white/5" />
            
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2 py-0.5 rounded-full text-[10px] border border-white/20">
                <QrCode className="w-3 h-3" />
                电子凭证
              </span>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-white/80 text-sm font-medium">社会保险</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold tracking-tight">
                  {socialSecurity?.socialInsurance.pension.months || 0}
                  <span className="text-sm font-normal text-white/70 ml-1">个月</span>
                </span>
              </div>
              <p className="text-white/60 text-[11px] mb-3">
                养老/医疗/失业/工伤/生育 五险
              </p>
              
              <div className="flex items-center justify-between pt-2.5 border-t border-white/15">
                <span className="inline-flex items-center gap-1 text-[11px] text-white/70">
                  <Eye className="w-3 h-3" />
                  明细核验
                </span>
                <span className="text-[10px] text-white/50">
                  实时同步
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 区块4：LBS智能排序服务区 */}
        <div style={staggerStyle(3)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg font-semibold text-slate-800 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              便民服务矩阵
            </h2>
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[11px] text-slate-500">
                已为您按{location.district || "市南区"}位置智能排序
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {rankedServices.map((service) => {
              const Icon = SERVICE_ICONS[service.name] || Building2;
              const dept = getServiceDept(service.name);
              return (
                <div
                  key={service.id}
                  onClick={() => navigate(service.path)}
                  className="group relative bg-white rounded-xl border border-slate-100 p-3 cursor-pointer hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] text-slate-400 group-hover:text-blue-500 transition-colors">
                      距您 {service.distance.toFixed(1)}km
                    </span>
                  </div>
                  
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-2 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  
                  <h3 className="text-sm font-medium text-slate-800 mb-1 truncate pr-8">
                    {service.name}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-50 text-slate-500 border border-slate-100">
                      <Building className="w-2.5 h-2.5" />
                      {dept}
                    </span>
                    <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      {service.score.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 区块5：便民缴费快速入口 */}
        <div style={staggerStyle(4)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg font-semibold text-slate-800 tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-green-600" />
              便民缴费
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500">
                市南/市北/崂山等各区缴费系统直连
              </span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>

          {totalUnpaidCount > 0 && (
            <div
              onClick={() => navigate("/payment")}
              className="mb-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                    <HandCoins className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {totalUnpaidCount} 项账单待缴费
                    </p>
                    <p className="text-xs text-amber-600 font-semibold">
                      合计 {formatMoney(totalUnpaidAmount)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-100 p-3">
            {/* 搜索框 */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchKeyword && setShowSearchHint(true)}
                placeholder="输入户号/分户号/姓名/地址"
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchKeyword && (
                <button
                  onClick={() => {
                    setSearchKeyword("");
                    setShowSearchHint(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                </button>
              )}

              {showSearchHint && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                  {searchSuggestions.map((account) => {
                    const accountAny = account as any;
                    const matchDegree = accountAny.matchDegree || "";
                    const district = account.district;
                    const systemStatus = account.systemStatus;
                    return (
                      <div
                        key={account.id}
                        onClick={() => handleQuickFill(account)}
                        className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-b-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm text-slate-800 font-medium line-clamp-1">
                              <HighlightText text={account.accountName} keyword={searchKeyword} />
                            </p>
                            {matchDegree && (
                              <span className="text-[10px] px-1 py-0.5 rounded bg-blue-50 text-blue-600 flex-shrink-0">
                                {matchDegree}
                              </span>
                            )}
                            {district && (
                              <span className="text-[10px] px-1 py-0.5 rounded bg-slate-100 text-slate-600 flex-shrink-0">
                                {district}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-500">
                              {account.categoryName} · <HighlightText text={account.accountNumber} keyword={searchKeyword} />
                            </p>
                            {systemStatus && (
                              <span className={cn(
                                "text-[10px] flex items-center gap-0.5",
                                systemStatus === "online" ? "text-emerald-600" :
                                systemStatus === "maintenance" ? "text-amber-600" : "text-slate-400"
                              )}>
                                <span className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  systemStatus === "online" ? "bg-emerald-500" :
                                  systemStatus === "maintenance" ? "bg-amber-500" : "bg-slate-400"
                                )} />
                                {systemStatus === "online" ? "在线" : systemStatus === "maintenance" ? "维护中" : "离线"}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-amber-600 font-medium flex-shrink-0 ml-2">
                          {formatMoney(account.amountDue)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5个缴费类型入口 */}
            <div className="grid grid-cols-5 gap-2">
              {PAYMENT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activePaymentTab === cat.key;
                const account = paymentAccounts.find((a) => a.category === cat.key);
                return (
                  <div key={cat.key} className="text-center">
                    <button
                      onClick={() => handlePaymentTabClick(cat.key)}
                      className={cn(
                        "w-full flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-300",
                        isActive
                          ? "bg-blue-50 ring-2 ring-blue-500/30"
                          : "hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm",
                        cat.bgColor
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-slate-700 font-medium">{cat.label}</span>
                      {account && account.amountDue > 0 && (
                        <span className="text-[10px] text-amber-600 font-medium">
                          {formatMoney(account.amountDue, { symbol: "" })}
                        </span>
                      )}
                    </button>
                    
                    {isActive && (
                      <div className="mt-2 p-2 bg-slate-50 rounded-lg">
                        <input
                          type="text"
                          value={paymentInputValues[cat.key] || ""}
                          onChange={(e) =>
                            setPaymentInputValues((prev) => ({
                              ...prev,
                              [cat.key]: e.target.value,
                            }))
                          }
                          placeholder="请输入户号"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <p className="mt-1 text-[10px] text-slate-400 text-left">
                          {cat.district}缴费系统
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 区块6：社区舆情概览卡片 */}
        <div style={staggerStyle(5)}>
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-lg font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                青青岛社区舆情
              </h2>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                  getOpinionLevelColor(overallOpinionLevel)
                )}>
                  舆情等级 {overallOpinionLevel}级 · {getOpinionLevelLabel(overallOpinionLevel)}
                </span>
                <button
                  onClick={() => navigate("/community")}
                  className="flex items-center gap-0.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
                >
                  详情 <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              {/* 左侧：情感分布饼图 */}
              <div className="w-28 h-28 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={45}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-2 -mt-1">
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    正面
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    中性
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    负面
                  </span>
                </div>
              </div>

              {/* 右侧：今日热帖Top3 */}
              <div className="flex-1 space-y-3">
                <p className="text-xs text-slate-500 mb-1">今日热帖 Top3</p>
                {communityPosts.slice(0, 3).map((post) => {
                  const postAny = post as any;
                  const nlp = postAny.nlpAnalysis;
                  const reviewStatus = postAny.reviewStatus as string || "auto_analyzed";
                  const opinionLevelSource = postAny.opinionLevelSource as string || "";
                  return (
                    <div
                      key={post.id}
                      className="p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer group transition-colors"
                      onClick={() => navigate(`/community/${post.id}`)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs text-slate-700 truncate group-hover:text-blue-600 transition-colors font-medium">
                              {post.title}
                            </p>
                            <span className={cn(
                              "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border flex-shrink-0",
                              getOpinionLevelColor(post.opinionLevel)
                            )}>
                              L{post.opinionLevel}
                            </span>
                            {opinionLevelSource && opinionLevelSource.includes("NLP") && (
                              <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100 flex-shrink-0">
                                AI
                              </span>
                            )}
                            {opinionLevelSource && opinionLevelSource.includes("人工") && (
                              <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100 flex-shrink-0">
                                人工
                              </span>
                            )}
                            {reviewStatus === "auto_analyzed" && (
                              <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500 border border-slate-200 flex-shrink-0">
                                自动分析
                              </span>
                            )}
                            {reviewStatus === "pending_review" && (
                              <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0">
                                待复核
                              </span>
                            )}
                            {reviewStatus === "reviewed" && (
                              <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 flex-shrink-0">
                                已复核
                              </span>
                            )}
                            {reviewStatus === "escalated" && (
                              <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-red-50 text-red-600 border border-red-200 flex-shrink-0">
                                已升级
                              </span>
                            )}
                          </div>
                          {nlp && (
                            <div className="mt-1.5">
                              {nlp.sentimentConfidence !== undefined && (
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[9px] text-slate-500 flex-shrink-0 w-10">情感置信</span>
                                  <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-500 rounded-full transition-all"
                                      style={{ width: `${Math.round(nlp.sentimentConfidence)}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] text-slate-600 font-medium flex-shrink-0 w-8 text-right">
                                    {Math.round(nlp.sentimentConfidence)}%
                                  </span>
                                </div>
                              )}
                              {nlp.keywords && nlp.keywords.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  {nlp.keywords.slice(0, 3).map((kw: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className="text-[9px] px-1 py-0.5 rounded bg-purple-50 text-purple-600"
                                    >
                                      #{typeof kw === "string" ? kw : kw.word}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {nlp.opinionBasis && (
                                <p className="text-[9px] text-slate-400 mt-1 line-clamp-1">
                                  判定依据：{nlp.opinionBasis}
                                </p>
                              )}
                            </div>
                          )}
                          {reviewStatus === "reviewed" && postAny.reviewedBy && (
                            <div className="mt-1.5 p-1.5 bg-emerald-50/50 rounded border border-emerald-100">
                              <p className="text-[9px] text-emerald-600">
                                <span className="font-medium">{postAny.reviewedBy}</span>
                                <span className="text-slate-400"> · </span>
                                <span className="text-slate-500">{postAny.reviewedAt ? new Date(postAny.reviewedAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</span>
                              </p>
                              {postAny.reviewComment && (
                                <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-1">
                                  复核意见：{postAny.reviewComment}
                                </p>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400">
                              {post.board}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {post.viewCount} 阅读
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 区块7：本地生活POI图谱概览 */}
        <div style={staggerStyle(6)}>
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-serif text-lg font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  城市服务图谱
                </h2>
                <button
                  onClick={() => navigate("/poi")}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  更多
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tab 切换 */}
              <div className="flex gap-1 bg-slate-50 rounded-lg p-1">
                {(["scenic", "restaurant", "medical"] as PoiType[]).map((type) => {
                  const labels: Record<PoiType, string> = {
                    scenic: "景区",
                    restaurant: "餐饮",
                    medical: "医疗",
                  };
                  const icons: Record<PoiType, typeof MapPin> = {
                    scenic: MapPin,
                    restaurant: Building,
                    medical: Stethoscope,
                  };
                  const Icon = icons[type];
                  const isActive = activePoiTab === type;
                  const count = type === "scenic" ? scenicPois.length : type === "restaurant" ? restaurantPois.length : medicalPois.length;
                  return (
                    <button
                      key={type}
                      onClick={() => setActivePoiTab(type)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all",
                        isActive
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {labels[type]}
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[10px]",
                        isActive ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* POI 列表 */}
            <div className="px-4 pb-4 pt-2 space-y-2.5">
              {currentPoiList.slice(0, 3).map((poi, idx) => {
                const distance = calculatePoiDistance(poi);
                const sourceDept = POI_SOURCE_MAP[poi.type];
                return (
                  <div
                    key={poi.id}
                    onClick={() => navigate(`/poi/${poi.id}`)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-600">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                          {poi.name}
                        </h4>
                        <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                          {poi.level || poi.rating}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {sourceDept}
                        </span>
                        <span className="text-[11px] text-blue-600 font-medium flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {distance.toFixed(1)}km
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 区块8：政策公告 + 离线缓存 */}
        <div style={staggerStyle(7)}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                政策公告
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">离线模式</span>
              <button
                onClick={() => setOfflineMode(!offlineMode)}
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors duration-300",
                  offlineMode ? "bg-blue-600" : "bg-slate-300"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300",
                    offlineMode ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl border border-blue-100 px-3 py-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600 flex items-center gap-1.5">
                <HardDrive className="w-3 h-3 text-blue-600" />
                已缓存 <span className="font-semibold text-blue-700">{cachedCount}</span>/<span className="font-semibold">{policies.length}</span> 篇
              </span>
              <span className="text-[11px] text-slate-500">
                约占用 {cacheSizeKB} KB
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
            {offlineMode && cachedCount === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <HardDrive className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">暂无离线缓存政策</p>
                <p className="text-xs text-slate-400 mb-4">
                  关闭离线模式后可下载缓存政策
                </p>
                <button
                  onClick={() => setOfflineMode(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  去下载
                </button>
              </div>
            ) : filteredPolicies.length === 0 && !(offlineMode && cachedCount === 0) ? (
              <div className="p-6 text-center">
                <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">暂无政策公告</p>
              </div>
            ) : (
              filteredPolicies.slice(0, 4).map((policy) => {
                const cached = isCached(policy.id);
                const isCaching = policy.isCaching;
                return (
                  <div
                    key={policy.id}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors group"
                    onClick={() => navigate(`/policies/${policy.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {policy.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {policy.department}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(policy.publishedAt)}
                          </span>
                        </div>
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        {isCaching ? (
                          <div className="flex-shrink-0 h-8 px-2 rounded-lg flex items-center justify-center bg-blue-50 text-blue-500">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                            <span className="text-[11px]">缓存中...</span>
                          </div>
                        ) : cached ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePolicyCache(policy);
                            }}
                            className="flex-shrink-0 h-8 px-2 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 gap-1 hover:bg-emerald-100 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="text-[11px]">已缓存</span>
                            <span className="text-[10px] text-emerald-500 ml-0.5 hover:text-emerald-700">清除</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPolicy(policy);
                            }}
                            className="flex-shrink-0 h-8 px-2 rounded-lg flex items-center justify-center bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="text-[11px]">下载缓存</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => navigate("/policies")}
            className="w-full mt-2 text-center py-2 text-xs text-slate-500 hover:text-blue-600 transition-colors"
          >
            查看全部政策 →
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
