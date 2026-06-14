import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  AlertTriangle,
  ChevronRight,
  Home,
  Shield,
  FileText,
  Building2,
  Briefcase,
  Car,
  Bus,
  Stethoscope,
  Lightbulb,
  Users,
  MessageSquare,
  BookOpen,
  GraduationCap,
  HeartHandshake,
  Wallet,
  AlertCircle,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import GradientCard from "@/components/ui/GradientCard";
import SkeletonCard from "@/components/ui/SkeletonCard";
import {
  weatherApi,
  trafficApi,
  servicesApi,
  policiesApi,
  socialSecurityApi,
  userApi,
} from "@/api";
import { useLocation } from "@/hooks/useLocation";
import { useAppStore } from "@/store/useAppStore";
import type {
  WeatherInfo,
  TrafficEvent,
  ServiceEntry,
  PolicyDocument,
  SocialSecurityAccount,
  UserProfile,
} from "../../shared/types";
import { formatDate, formatMoney } from "@/utils/format";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "🏠": Home,
  "📋": Shield,
  "💊": Stethoscope,
  "🪪": Building2,
  "🛂": Briefcase,
  "🚌": Bus,
  "🚇": Car,
  "🚓": AlertTriangle,
  "🅿️": Wallet,
  "🛣️": Car,
  "💡": Lightbulb,
  "☀️": Sun,
  "🏥": Stethoscope,
  "📦": Briefcase,
  "🏘️": Users,
  "🎉": HeartHandshake,
  "💬": MessageSquare,
  "📮": MessageSquare,
  "📖": BookOpen,
  "🎓": GraduationCap,
  "💼": Briefcase,
  "💰": Wallet,
};

function getWeatherIcon(condition: string) {
  if (condition.includes("雨")) return CloudRain;
  if (condition.includes("云")) return Cloud;
  return Sun;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "凌晨好";
  if (hour < 9) return "早上好";
  if (hour < 12) return "上午好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  if (hour < 22) return "晚上好";
  return "深夜好";
}

function getAqiBadge(aqi: number) {
  if (aqi <= 50) return { text: "优", className: "bg-emerald-100 text-emerald-700" };
  if (aqi <= 100) return { text: "良", className: "bg-lime-100 text-lime-700" };
  if (aqi <= 150) return { text: "轻度污染", className: "bg-amber-100 text-amber-700" };
  if (aqi <= 200) return { text: "中度污染", className: "bg-orange-100 text-orange-700" };
  return { text: "重度污染", className: "bg-red-100 text-red-700" };
}

function getSeverityStyle(severity: TrafficEvent["severity"]) {
  switch (severity) {
    case "danger":
      return "bg-red-50 text-red-700 border-red-200";
    case "warning":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const { location } = useLocation();
  const { user, setUser } = useAppStore();

  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [services, setServices] = useState<
    (ServiceEntry & { distance?: number; rankScore?: number })[]
  >([]);
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [socialSecurity, setSocialSecurity] = useState<SocialSecurityAccount | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [weatherData, eventsData, servicesData, policiesData, ssData, profileData] =
          await Promise.all([
            weatherApi.getCurrent(location),
            trafficApi.getEvents(),
            servicesApi.rank({ lat: location.lat, lng: location.lng }),
            policiesApi.getList({ pageSize: 3 }),
            socialSecurityApi.getAccount(),
            userApi.getProfile(),
          ]);
        setWeather(weatherData);
        setEvents(eventsData);
        setServices(servicesData.slice(0, 9));
        setPolicies(policiesData.slice(0, 3));
        setSocialSecurity(ssData);
        setProfile(profileData);
        setUser(profileData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [location.lat, location.lng, setUser]);

  const userName = profile?.name || "张三";

  return (
    <AppLayout showHeader={false}>
      <div className="relative -mx-4 md:-mx-6 lg:-mx-8">
        <div className="absolute inset-x-0 top-0 h-[340px] bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800" />
        <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-32 -left-20 w-56 h-56 rounded-full bg-accent-400/20 blur-3xl" />

        <div className="relative px-4 md:px-6 lg:px-8 pt-6 md:pt-8 pb-8 text-white">
          <div className="flex items-center gap-2 mb-1 text-white/80 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{location.district || "市南区"} · {location.address || "青岛市人民政府"}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight mb-5">
            {getGreeting()}，{userName}
          </h1>

          {weather ? (
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/15">
              <div className="flex items-center gap-4">
                {(() => {
                  const WeatherIcon = getWeatherIcon(weather.condition);
                  return <WeatherIcon className="w-12 h-12 text-yellow-200" />;
                })()}
                <div>
                  <div className="text-3xl md:text-4xl font-bold tracking-tight">
                    {weather.temperature}°
                  </div>
                  <div className="text-white/80 text-sm mt-0.5">{weather.condition}</div>
                </div>
              </div>
              <div className="text-right space-y-1.5">
                <div className="flex items-center justify-end gap-1.5">
                  <span
                    className={cn(
                      "chip",
                      getAqiBadge(weather.aqi).className.replace("bg-", "bg-white/20 text-white").replace("text-", "text-white")
                    )}
                  >
                    AQI {weather.aqi} {getAqiBadge(weather.aqi).text}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1 text-white/70 text-xs">
                  <Wind className="w-3.5 h-3.5" />
                  <span>{weather.wind}</span>
                  <span className="mx-1">·</span>
                  <span>湿度 {weather.humidity}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-24 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 animate-pulse-soft" />
          )}
        </div>
      </div>

      <div className="relative -mt-2">
        {events.length > 0 && (
          <div className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl overflow-hidden">
            <div className="flex items-stretch">
              <div className="flex-shrink-0 flex items-center gap-1.5 px-4 bg-amber-100/60 text-amber-700 border-r border-amber-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-semibold whitespace-nowrap">紧急通知</span>
              </div>
              <div className="flex-1 overflow-hidden py-3">
                <div className="flex gap-12 animate-[marquee_35s_linear_infinite] hover:[animation-play-state:paused] whitespace-nowrap">
                  {[...events, ...events].map((event, i) => (
                    <div key={`${event.id}-${i}`} className="flex items-center gap-2 inline-flex">
                      <span
                        className={cn(
                          "chip border",
                          getSeverityStyle(event.severity)
                        )}
                      >
                        {event.severity === "danger" ? "紧急" : event.severity === "warning" ? "预警" : "提示"}
                      </span>
                      <span className="text-sm text-slate-700">{event.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <GradientCard
            title="公积金余额"
            value={loading ? "—" : formatMoney(socialSecurity?.housingFund.balance || 0)}
            unit={loading ? "" : "元"}
            icon={<Home className="w-5 h-5" />}
            description={
              loading
                ? "加载中..."
                : `月缴 ¥${socialSecurity?.housingFund.monthlyContribution || 0} · 单位 ${socialSecurity?.housingFund.unit?.slice(0, 8) || "-"}...`
            }
            variant="blue"
            onClick={() => navigate("/social-security")}
            footer={
              <div className="flex items-center justify-between text-white/80 text-xs">
                <span>最后缴存：{socialSecurity?.housingFund.lastDepositDate || "-"}</span>
                <span className="flex items-center gap-0.5">
                  查看详情 <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            }
          />
          <GradientCard
            title="社保状态"
            value="正常缴费"
            icon={<Shield className="w-5 h-5" />}
            description={loading ? "加载中..." : "五险均处于正常缴费状态"}
            variant="teal"
            onClick={() => navigate("/social-security")}
            footer={
              <div className="flex items-center justify-between text-white/80 text-xs">
                <span>累计缴费 {socialSecurity?.socialInsurance.pension.months || 0} 个月</span>
                <span className="flex items-center gap-0.5">
                  查看详情 <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            }
          />
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">智慧服务</h3>
            <button
              onClick={() => {}}
              className="text-xs text-brand-600 font-medium flex items-center gap-0.5 hover:text-brand-700"
            >
              全部服务 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="card p-3 flex flex-col items-center gap-2">
                  <div className="skeleton w-12 h-12 rounded-xl" />
                  <div className="skeleton h-3 w-12" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {services.map((service, index) => {
                const Icon = iconMap[service.icon] || FileText;
                return (
                  <button
                    key={service.id}
                    onClick={() => service.path && navigate(service.path)}
                    className="card p-3 md:p-4 flex flex-col items-center gap-2 group animate-fade-in-up"
                    style={{ animationDelay: `${index * 60}ms`, opacity: 0 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center text-brand-600 group-hover:from-brand-500 group-hover:to-brand-600 group-hover:text-white transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-slate-700 text-center leading-tight">
                      {service.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">政策公告</h3>
            <button
              onClick={() => {}}
              className="text-xs text-brand-600 font-medium flex items-center gap-0.5 hover:text-brand-700"
            >
              更多 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <SkeletonCard variant="list" count={3} />
          ) : (
            <div className="space-y-2.5">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="card p-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => {}}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-amber-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-1 mb-1">
                        {policy.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate max-w-[160px]">{policy.department}</span>
                        </span>
                        <span>·</span>
                        <span>{formatDate(policy.publishedAt)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </AppLayout>
  );
}
