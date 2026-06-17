import { useEffect, useState } from "react";
import { useAppStore, roleLabels } from "@/store/useAppStore";
import { api } from "@/lib/api";
import ServiceCard from "@/components/ServiceCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import StatusBadge from "@/components/StatusBadge";
import { MapPin, Clock, ArrowRight, Bus, Plane, FileText, Bell, Loader2 } from "lucide-react";

const categoryColors: Record<string, string> = {
  policy: "bg-primary-100 text-primary-700",
  transport: "bg-blue-100 text-blue-700",
  medical: "bg-emerald-100 text-emerald-700",
  culture: "bg-gold-100 text-gold-700",
  finance: "bg-purple-100 text-purple-700",
};

const categoryLabels: Record<string, string> = {
  policy: "政策",
  transport: "交通",
  medical: "医疗",
  culture: "文旅",
  finance: "金融",
};

const greetings: Record<string, string> = {
  morning: "早上好",
  afternoon: "下午好",
  evening: "晚上好",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return greetings.morning;
  if (h < 18) return greetings.afternoon;
  return greetings.evening;
}

export default function Home() {
  const { currentRole } = useAppStore();
  const [services, setServices] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [stats, setStats] = useState<{ totalUsers: number; totalServices: number; avgSLA: number; citiesCovered: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      api.services.list(currentRole),
      api.news.list(),
      api.stats(),
    ]).then(([s, n, st]) => {
      if (!alive) return;
      setServices(s);
      setNews(n);
      setStats(st);
      setLoading(false);
    }).catch((e) => {
      console.error("Failed to load home data:", e);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [currentRole]);

  const filteredServices = services;
  const quickServices = filteredServices.slice(0, 8);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="gradient-hero rounded-2xl p-8 mb-6 relative overflow-hidden animate-fade-in">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-400/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-gold-400/20 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-emerald-300" />
            <span className="text-emerald-200 text-sm">南宁市 · 青秀区</span>
            <Clock className="w-4 h-4 text-emerald-300 ml-4" />
            <span className="text-emerald-200 text-sm">{new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })}</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-1">
            {getGreeting()}，{roleLabels[currentRole]}
          </h2>
          <p className="text-primary-200 text-sm">一屏览八桂，一码通全域 · 今日已为您聚合 {filteredServices.length} 项专属服务</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="animate-slide-up stagger-1" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-gray-900">智能服务推荐</h3>
              <span className="text-xs text-gray-400">基于您的身份与位置</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickServices.map((service) => (
                <ServiceCard key={service.id} service={service} compact />
              ))}
            </div>
          </section>

          <section className="animate-slide-up stagger-2" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-gray-900">全部服务</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </section>

          <section className="animate-slide-up stagger-3" style={{ opacity: 0 }}>
            <h3 className="font-display font-bold text-lg text-gray-900 mb-4">跨域通办</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white border border-gray-100 p-5 hover-lift">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">异地就医备案</h4>
                    <p className="text-xs text-gray-500">自动同步全国医保平台</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status="active" />
                  <span className="text-xs text-gray-400">全区14市已开通</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">100%</span>
                </div>
              </div>
              <div className="rounded-xl bg-white border border-gray-100 p-5 hover-lift">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">跨市公交乘车码</h4>
                    <p className="text-xs text-gray-500">一码通行广西十四市</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status="active" />
                  <span className="text-xs text-gray-400">12市已互通</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: "85%" }} />
                  </div>
                  <span className="text-xs text-primary-600 font-medium">85%</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="animate-slide-up stagger-4" style={{ opacity: 0 }}>
            <h3 className="font-display font-bold text-lg text-gray-900 mb-4">平台概览</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white border border-gray-100 p-4 text-center">
                {stats ? (
                  <AnimatedNumber value={Math.round(stats.totalUsers / 10000)} suffix="万" className="text-xl font-bold text-primary-900" />
                ) : <div className="h-7 animate-pulse bg-gray-200 rounded w-20 mx-auto" />}
                <p className="text-xs text-gray-500 mt-1">注册用户</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-100 p-4 text-center">
                {stats ? (
                  <AnimatedNumber value={stats.totalServices} suffix="项" className="text-xl font-bold text-emerald-700" />
                ) : <div className="h-7 animate-pulse bg-gray-200 rounded w-20 mx-auto" />}
                <p className="text-xs text-gray-500 mt-1">在线服务</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-100 p-4 text-center">
                {stats ? (
                  <AnimatedNumber value={stats.avgSLA} suffix="%" decimals={1} className="text-xl font-bold text-gold-700" />
                ) : <div className="h-7 animate-pulse bg-gray-200 rounded w-20 mx-auto" />}
                <p className="text-xs text-gray-500 mt-1">SLA达标率</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-100 p-4 text-center">
                {stats ? (
                  <AnimatedNumber value={stats.citiesCovered} suffix="市" className="text-xl font-bold text-primary-700" />
                ) : <div className="h-7 animate-pulse bg-gray-200 rounded w-20 mx-auto" />}
                <p className="text-xs text-gray-500 mt-1">全域覆盖</p>
              </div>
            </div>
          </section>

          <section className="animate-slide-up stagger-5" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-gray-900">实时资讯</h3>
              <Bell className="w-4 h-4 text-gray-400" />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  </div>
                ))
              ) : news.length === 0 ? (
                <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4" />暂无资讯
                </div>
              ) : (
                news.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${categoryColors[item.category]}`}>
                        {categoryLabels[item.category]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 leading-snug">{item.title}</h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.summary}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 ml-[52px]">{item.time}</p>
                  </div>
                ))
              )}
              {!loading && news.length > 0 && (
                <div className="p-3 text-center">
                  <button className="text-xs text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1">
                    查看更多 <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="animate-slide-up stagger-6" style={{ opacity: 0 }}>
            <h3 className="font-display font-bold text-lg text-gray-900 mb-4">快捷入口</h3>
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg gradient-primary text-white hover-lift">
                <FileText className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-semibold">政策精准推送</p>
                  <p className="text-[10px] text-primary-200">3条新政策待查看</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg gradient-emerald text-white hover-lift">
                <Plane className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-semibold">异地就医备案</p>
                  <p className="text-[10px] text-emerald-200">备案状态：已激活</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
