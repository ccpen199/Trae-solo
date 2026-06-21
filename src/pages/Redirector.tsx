import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car,
  Building2,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  UserCircle,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import {
  useAppStore,
  getDefaultRouteByRole,
  getRoleLabel,
  UserRole,
  getAllRoles,
} from "@/store/appStore";

interface RoleCard {
  role: UserRole;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  accent: string;
  highlights: string[];
}

const roleCards: RoleCard[] = [
  {
    role: "driver",
    title: "司机端",
    subtitle: "Driver App",
    description: "抢单、运单管理、油站导航、钱包结算",
    icon: Car,
    gradient: "from-orange-500 via-orange-400 to-amber-400",
    accent: "text-primary-orange",
    highlights: ["实时抢单", "运费秒结", "专属油站"],
  },
  {
    role: "shipper",
    title: "货主端",
    subtitle: "Shipper Console",
    description: "发布货源、智能匹配、运单追踪、信用管理",
    icon: Building2,
    gradient: "from-blue-600 via-blue-500 to-indigo-500",
    accent: "text-deep-blue",
    highlights: ["车货匹配", "全程可视化", "账期灵活"],
  },
  {
    role: "admin",
    title: "运营端",
    subtitle: "Admin Dashboard",
    description: "全局监控、风控管理、资金调度、用户运营",
    icon: LayoutDashboard,
    gradient: "from-deep-blue via-blue-800 to-indigo-700",
    accent: "text-white",
    highlights: ["风控预警", "BI大屏", "多租户管理"],
  },
];

export default function Redirector() {
  const navigate = useNavigate();
  const { user, switchRole, isAuthenticated } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleSelectRole = (role: UserRole) => {
    switchRole(role);
    const route = getDefaultRouteByRole(role);
    navigate(route);
  };

  const currentRole = user?.role;
  const hasAuth = isAuthenticated();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(255,107,26,0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 30%, rgba(59,130,246,0.10) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(10,35,66,0.08) 0%, transparent 50%)
          `,
        }}
      />

      <div
        className="absolute top-0 left-0 right-0 h-[380px] opacity-100 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)",
        }}
      />

      <div className="relative min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-soft-orange">
              <Car size={22} className="text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-deep-blue-900 leading-tight">
                运力金融平台
              </div>
              <div className="text-xs text-gray-500">
                Freight Matching & Finance Platform
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasAuth && user ? (
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-100">
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    currentRole === "driver"
                      ? "bg-orange-50 text-primary-orange"
                      : currentRole === "shipper"
                      ? "bg-blue-50 text-deep-blue"
                      : "bg-deep-blue text-white"
                  }`}
                >
                  {currentRole && (
                    <>
                      <CheckCircle2 size={12} />
                      {getRoleLabel(currentRole)}
                    </>
                  )}
                </div>
                <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-white">
                  {user.nickname.charAt(0)}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-100">
                <UserCircle size={16} className="text-gray-400" />
                <span className="text-xs text-gray-500">演示模式</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
          <div
            className={`w-full max-w-5xl transition-all duration-700 ease-out ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white shadow-sm border border-gray-100 mb-6">
                <Sparkles size={14} className="text-primary-orange" />
                <span className="text-xs font-medium text-gray-600">
                  选择入口 · 立即体验全链路业务
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                <span className="bg-gradient-to-r from-deep-blue via-blue-600 to-deep-blue bg-clip-text text-transparent">
                  货运撮合
                </span>
                <span className="mx-3 text-gray-300">+</span>
                <span className="bg-gradient-to-r from-primary-orange via-orange-500 to-primary-orange bg-clip-text text-transparent">
                  运力金融
                </span>
              </h1>

              <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                一站式物流科技平台 · 连接司机、货主与运营方
                <br className="hidden md:block" />
                通过智能化撮合与金融服务，让每一次运输更高效、更安全
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {roleCards.map((card, idx) => {
                const Icon = card.icon;
                const isCurrent = currentRole === card.role;

                return (
                  <div
                    key={card.role}
                    className={`group relative rounded-3xl overflow-hidden bg-white border transition-all duration-500 hover:-translate-y-2 cursor-pointer shadow-sm ${
                      isCurrent
                        ? "border-primary-orange ring-2 ring-primary-orange/20"
                        : "border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-200/50"
                    }`}
                    style={{ transitionDelay: `${idx * 80}ms` }}
                    onClick={() => handleSelectRole(card.role)}
                  >
                    <div
                      className={`relative h-32 bg-gradient-to-br ${card.gradient} overflow-hidden`}
                    >
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{
                          backgroundImage: `radial-gradient(circle at 70% 30%, rgba(255,255,255,0.4) 0%, transparent 40%)`,
                        }}
                      />
                      <div className="absolute inset-0 p-6 flex items-start justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                          <Icon
                            size={28}
                            className={
                              card.role === "admin" ? "text-white" : "text-white"
                            }
                          />
                        </div>

                        {isCurrent && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-semibold text-primary-orange shadow-sm">
                            <CheckCircle2 size={12} />
                            当前
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-4 left-6 right-6 text-white">
                        <div className="text-xs font-medium opacity-80 mb-0.5">
                          {card.subtitle}
                        </div>
                        <div className="text-xl font-bold tracking-wide">
                          {card.title}
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed min-h-[44px]">
                        {card.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {card.highlights.map((h) => (
                          <span
                            key={h}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              card.role === "admin"
                                ? "bg-deep-blue/5 text-deep-blue"
                                : "bg-gray-50 text-gray-600"
                            }`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full ${card.accent}`}
                              style={{ background: "currentColor" }}
                            />
                            {h}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        className={`w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm transition-all duration-300 group-hover:gap-3 ${
                          isCurrent
                            ? "bg-gradient-primary text-white shadow-soft-orange"
                            : card.role === "admin"
                            ? "bg-deep-blue text-white hover:bg-deep-blue-600"
                            : `bg-gray-50 ${card.accent} hover:bg-gray-100`
                        }`}
                      >
                        {isCurrent ? "继续使用" : "进入系统"}
                        <ArrowRight
                          size={16}
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 text-center">
              <div className="inline-flex items-center gap-4 px-5 py-3 rounded-2xl bg-white/60 backdrop-blur border border-gray-100 shadow-sm">
                {getAllRoles().map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleSelectRole(r)}
                    className={`text-xs font-medium transition-colors ${
                      currentRole === r
                        ? "text-primary-orange"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    快速切换 · {getRoleLabel(r)}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-xs text-gray-400">
                Tip: 点击卡片或底部按钮即可切换角色 · 数据通过 localStorage 持久化
              </p>
            </div>
          </div>
        </main>

        <footer className="py-6 text-center text-xs text-gray-400">
          © 2025 运力金融平台 · Freight Matching & Finance Platform v1.0
        </footer>
      </div>
    </div>
  );
}
