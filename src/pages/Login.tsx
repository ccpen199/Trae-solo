import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, Building2, User, Shield, ArrowRight, Phone } from "lucide-react";
import { apiClient } from "@/api/client";
import { useAuthStore } from "@/store";
import type { UserRole } from "@shared/types";

const roles: Array<{
  value: UserRole;
  label: string;
  icon: any;
  desc: string;
  color: string;
}> = [
  {
    value: "shipper",
    label: "货主登录",
    icon: Building2,
    desc: "发布货源，智能匹配司机",
    color: "from-orange-500 to-amber-600",
  },
  {
    value: "driver",
    label: "司机登录",
    icon: User,
    desc: "空车上报，智能抢单",
    color: "from-blue-500 to-cyan-600",
  },
  {
    value: "admin",
    label: "管理后台",
    icon: Shield,
    desc: "运营监控，数据分析",
    color: "from-slate-700 to-slate-900",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [selectedRole, setSelectedRole] = useState<UserRole>("shipper");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiClient.post<any>("/auth/login", {
        phone: phone || "13800138001",
        role: selectedRole,
      });
      login(data);
      const redirectMap: Record<UserRole, string> = {
        shipper: "/shipper/dashboard",
        driver: "/driver/dashboard",
        admin: "/admin/dashboard",
      };
      navigate(redirectMap[selectedRole], { replace: true });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-secondary-500 via-secondary-600 to-secondary-800">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-600 rounded-full blur-3xl" />
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
          <div className="space-y-4 text-white/70">
            <p className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary-400" />
              智能算法匹配车型、资质、履约分&gt;95%司机
            </p>
            <p className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary-400" />
              内置风控引擎，轨迹异常实时检测
            </p>
            <p className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary-400" />
              电子运单区块链存证，交易全程可追溯
            </p>
            <p className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary-400" />
              司机成长体系，安全积分兑换ETC/油卡
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-white/5 backdrop-blur-sm">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800 font-display">
                智运匹配
              </span>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2 font-display">
              欢迎登录
            </h2>
            <p className="text-slate-500 text-sm mb-6">请选择您的身份并登录</p>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {roles.map((role) => {
                const Icon = role.icon;
                const isActive = selectedRole === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                      isActive
                        ? `border-transparent bg-gradient-to-br ${role.color} text-white shadow-lg`
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1.5" />
                    <p className="text-xs font-medium">{role.label}</p>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">手机号</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号（演示留空即可）"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? "登录中..." : "立即登录"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              登录即表示您同意《服务协议》和《隐私政策》
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
