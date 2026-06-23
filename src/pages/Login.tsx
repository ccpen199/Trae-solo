import { useState, useEffect } from "react";
import {
  Truck,
  Building2,
  User,
  Shield,
  ArrowRight,
  Phone,
  AlertCircle,
  CheckCircle2,
  Package,
  MapPin,
  CreditCard,
  Gift,
  BarChart3,
  DollarSign,
  ShieldAlert,
  Trophy,
  ChevronRight,
  Loader2,
  Zap,
} from "lucide-react";
import { apiClient } from "@/api/client";
import { useAuthStore } from "@/store";
import type { UserRole } from "@shared/types";

const roles: Array<{
  value: UserRole;
  label: string;
  icon: any;
  desc: string;
  color: string;
  bgColor: string;
  phone: string;
  features: Array<{ icon: any; label: string }>;
}> = [
  {
    value: "shipper",
    label: "货主登录",
    icon: Building2,
    desc: "发布货源，智能匹配司机",
    color: "from-orange-500 to-amber-600",
    bgColor: "bg-orange-50",
    phone: "13800138001",
    features: [
      { icon: Package, label: "发布货源" },
      { icon: Zap, label: "智能匹配司机" },
      { icon: MapPin, label: "在途追踪" },
      { icon: CreditCard, label: "信用中心" },
    ],
  },
  {
    value: "driver",
    label: "司机登录",
    icon: User,
    desc: "空车上报，智能抢单",
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-blue-50",
    phone: "13900139001",
    features: [
      { icon: Truck, label: "空车上报" },
      { icon: Package, label: "货源大厅" },
      { icon: BarChart3, label: "议价留痕" },
      { icon: Gift, label: "积分商城" },
    ],
  },
  {
    value: "admin",
    label: "管理后台",
    icon: Shield,
    desc: "运营监控，数据分析",
    color: "from-slate-700 to-slate-900",
    bgColor: "bg-slate-50",
    phone: "13000130001",
    features: [
      { icon: BarChart3, label: "数据看板" },
      { icon: DollarSign, label: "运价模型" },
      { icon: ShieldAlert, label: "风控监控" },
      { icon: Trophy, label: "司机成长" },
    ],
  },
];

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const [selectedRole, setSelectedRole] = useState<UserRole>("shipper");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const currentRole = roles.find((r) => r.value === selectedRole)!;

  useEffect(() => {
    if (user) {
      const redirectMap: Record<UserRole, string> = {
        shipper: "/shipper/dashboard",
        driver: "/driver/dashboard",
        admin: "/admin/dashboard",
      };
      window.location.href = redirectMap[user.role];
    }
  }, [user]);

  const validatePhone = (value: string): string => {
    if (!value.trim()) return "请输入手机号";
    if (!/^1[3-9]\d{9}$/.test(value)) return "请输入正确的11位手机号";
    return "";
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setError("");
    setSuccess(false);
  };

  const handleQuickLogin = (rolePhone: string) => {
    setPhone(rolePhone);
    setError("");
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient.post<any>("/auth/login", {
        phone,
        role: selectedRole,
      });

      if (!data || !data.token || !data.user) {
        throw new Error("登录数据异常，请重试");
      }

      login(data);
      setSuccess(true);

      const redirectMap: Record<UserRole, string> = {
        shipper: "/shipper/dashboard",
        driver: "/driver/dashboard",
        admin: "/admin/dashboard",
      };

      setTimeout(() => {
        window.location.href = redirectMap[selectedRole];
      }, 600);
    } catch (err) {
      const message = (err as Error).message || "登录失败，请重试";
      if (message.includes("401") || message.includes("登录失败")) {
        setError(`账号与身份不匹配：该手机号不属于${currentRole.label.replace("登录", "")}身份，请检查手机号或切换角色`);
      } else if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
        setError("网络连接失败：请确保后端服务已启动，或刷新页面重试");
      } else if (message.includes("数据异常")) {
        setError(message);
      } else {
        setError(`登录失败：${message}`);
      }
      setLoading(false);
    }
  };

  const RoleIcon = currentRole.icon;

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-400 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative z-10 text-white max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display">智运匹配</h1>
              <p className="text-white/60 text-sm">货运供需智能匹配平台</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold mb-6 leading-tight font-display">
            让每一趟货运
            <br />
            都精准匹配
          </h2>

          <div className="space-y-3 mb-8">
            {[
              "智能算法匹配车型、资质、履约分>95%司机",
              "内置风控引擎，轨迹异常实时检测",
              "电子运单区块链存证，交易全程可追溯",
              "司机成长体系，安全积分兑换ETC/油卡",
            ].map((item, idx) => (
              <p key={idx} className="flex items-center gap-3 text-white/70">
                <span className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-primary-400" />
                </span>
                {item}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {roles.map((role) => {
              const Icon = role.icon;
              const isActive = selectedRole === role.value;
              return (
                <button
                  key={role.value}
                  onClick={() => handleRoleChange(role.value)}
                  className={`p-4 rounded-2xl transition-all duration-300 text-left ${
                    isActive
                      ? `bg-white/15 backdrop-blur-sm border-2 border-white/30 scale-105`
                      : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-2 ${isActive ? "text-primary-400" : "text-white/50"}`} />
                  <p className={`text-sm font-medium ${isActive ? "text-white" : "text-white/70"}`}>
                    {role.label.replace("登录", "")}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">{role.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-white/5 backdrop-blur-sm">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800 font-display">
                智运匹配
              </span>
            </div>

            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${currentRole.bgColor} mb-4`}>
              <RoleIcon className={`w-4 h-4 ${
                selectedRole === "shipper" ? "text-orange-600" :
                selectedRole === "driver" ? "text-blue-600" : "text-slate-600"
              }`} />
              <span className={`text-sm font-medium ${
                selectedRole === "shipper" ? "text-orange-700" :
                selectedRole === "driver" ? "text-blue-700" : "text-slate-700"
              }`}>
                {currentRole.label}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-1 font-display">
              欢迎登录
            </h2>
            <p className="text-slate-500 text-sm mb-6">选择您的身份，开始智能货运之旅</p>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {roles.map((role) => {
                const Icon = role.icon;
                const isActive = selectedRole === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleRoleChange(role.value)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                      isActive
                        ? `border-transparent bg-gradient-to-br ${role.color} text-white shadow-lg scale-[1.02]`
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1.5" />
                    <p className="text-xs font-medium">{role.label.replace("登录", "")}</p>
                  </button>
                );
              })}
            </div>

            <div className="mb-5">
              <p className="text-sm text-slate-500 mb-2.5">进入后可使用：</p>
              <div className="grid grid-cols-2 gap-2">
                {currentRole.features.map((feature, idx) => {
                  const FeatIcon = feature.icon;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${currentRole.bgColor}`}
                    >
                      <FeatIcon className={`w-4 h-4 ${
                        selectedRole === "shipper" ? "text-orange-600" :
                        selectedRole === "driver" ? "text-blue-600" : "text-slate-600"
                      }`} />
                      <span className={`text-sm font-medium ${
                        selectedRole === "shipper" ? "text-orange-700" :
                        selectedRole === "driver" ? "text-blue-700" : "text-slate-700"
                      }`}>
                        {feature.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">手机号</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
                      if (error) setError("");
                      if (success) setSuccess(false);
                    }}
                    placeholder="请输入11位手机号"
                    className={`input-field pl-10 ${
                      error
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : success
                        ? "border-green-300 focus:border-green-400 focus:ring-green-100"
                        : ""
                    }`}
                    maxLength={11}
                  />
                </div>
                {success && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    登录成功！正在跳转到{currentRole.label.replace("登录", "")}工作台...
                  </p>
                )}
                {error && (
                  <p className="mt-2 text-sm text-red-600 flex items-start gap-1.5 animate-fade-in">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2">演示账号（点击快速填充）：</p>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleQuickLogin(role.phone)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        phone === role.phone
                          ? "bg-primary-50 text-primary-600 border border-primary-200 ring-2 ring-primary-100"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                      }`}
                    >
                      {role.label.replace("登录", "")} · {role.phone.slice(-4)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className={`w-full py-3 text-base rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-white shadow-lg ${
                  loading || success
                    ? "bg-slate-400 cursor-not-allowed"
                    : `bg-gradient-to-r ${currentRole.color} hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0`
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    登录验证中...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    登录成功，跳转中...
                  </>
                ) : (
                  <>
                    立即登录
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                <span>
                  演示环境可直接点击下方演示账号快速登录，体验各角色完整功能
                </span>
              </p>
            </div>

            <p className="text-center text-xs text-slate-400 mt-6">
              登录即表示您同意《服务协议》和《隐私政策》
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
