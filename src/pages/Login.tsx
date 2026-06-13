import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  User,
  Lock,
  ShieldCheck,
  Package,
  Building2,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const roles: { value: UserRole | "all"; label: string; icon: typeof Package; desc: string }[] = [
  { value: "branch_admin", label: "网点管理员", icon: Building2, desc: "网点运营管理" },
  { value: "courier", label: "快递员", icon: Package, desc: "揽收派送作业" },
  { value: "regional_supervisor", label: "区域主管", icon: ShieldCheck, desc: "区域经营分析" },
];

const expressCompanies = [
  "顺丰速运", "京东物流", "中通快递", "圆通速递",
  "申通快递", "韵达速递", "极兔速递", "邮政EMS",
  "德邦快递", "菜鸟驿站", "丹鸟物流", "跨越速运",
];

export default function Login() {
  const nav = useNavigate();
  const login = useAppStore((s) => s.login);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [remember, setRemember] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) {
      setError("请输入用户名");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const ok = login(username.trim(), password);
      setLoading(false);
      if (ok) {
        nav("/dashboard", { replace: true });
      } else {
        setError("用户名不存在，请检查测试账号");
      }
    }, 600);
  };

  const fillAccount = (u: string) => {
    setUsername(u);
    setError("");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-hero-grad">
      <div className="absolute inset-0 bg-grid-ink bg-grid opacity-[0.35]" />
      <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-ember-500/20 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-mint-500/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-ink-400/20 blur-3xl" />

      <div className="relative z-10 flex min-h-screen">
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ember-500 shadow-glow">
              <Truck className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-wide font-display">速驿通</div>
              <div className="text-sm text-ink-300">ExpressLink Pro</div>
            </div>
          </div>

          <div className="space-y-8">
            <h1 className="text-5xl font-bold leading-tight font-display">
              让每一件包裹
              <br />
              <span className="bg-gradient-to-r from-ember-400 to-mint-400 bg-clip-text text-transparent">
                准时抵达目的地
              </span>
            </h1>
            <p className="max-w-md text-lg text-ink-200 leading-relaxed">
              专业的快递网点一体化管理平台，覆盖揽收、打单、轨迹、分账全流程，助力网点降本增效。
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-ink-300">
                <CheckCircle2 className="h-4 w-4 text-mint-400" />
                已支持全国 2100+ 快递公司面单模板
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-300">
                <CheckCircle2 className="h-4 w-4 text-mint-400" />
                实时轨迹追踪 + 异常件智能预警
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-300">
                <CheckCircle2 className="h-4 w-4 text-mint-400" />
                多级分账结算，数据合规可审计
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-ink-400">已接入主流快递品牌</div>
              <div className="grid grid-cols-6 gap-2">
                {expressCompanies.map((c) => (
                  <div
                    key={c}
                    className="flex h-10 items-center justify-center rounded-lg border border-ink-700/60 bg-ink-800/40 text-xs text-ink-300 backdrop-blur-sm transition hover:border-ember-500/40 hover:text-white"
                  >
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-ink-500">
            © 2026 速驿通 ExpressLink Pro · 数据安全等保三级认证
          </div>
        </div>

        <div className="flex w-full lg:w-1/2 items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember-500 shadow-glow">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-white font-display">速驿通</div>
                <div className="text-xs text-ink-400">ExpressLink Pro</div>
              </div>
            </div>

            <div className="rounded-2xl border border-ink-700/50 bg-ink-900/70 p-8 shadow-card-hover backdrop-blur-xl">
              <h2 className="mb-1 text-2xl font-bold text-white font-display">欢迎登录</h2>
              <p className="mb-6 text-sm text-ink-400">请选择角色并使用测试账号登录</p>

              <div className="mb-5 grid grid-cols-3 gap-2">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const active = selectedRole === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setSelectedRole(r.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                        active
                          ? "border-ember-500/60 bg-ember-500/10 text-ember-400"
                          : "border-ink-700/60 bg-ink-800/40 text-ink-400 hover:border-ink-600 hover:text-ink-200"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{r.label}</span>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-300">
                    用户名
                  </label>
                  <div className="group relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500 group-focus-within:text-ember-400" />
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="请输入用户名"
                      className="w-full rounded-lg border border-ink-700/60 bg-ink-800/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-ink-500 outline-none transition focus:border-ember-500 focus:bg-ink-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-300">
                    密码
                  </label>
                  <div className="group relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500 group-focus-within:text-ember-400" />
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码（任意）"
                      className="w-full rounded-lg border border-ink-700/60 bg-ink-800/60 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-ink-500 outline-none transition focus:border-ember-500 focus:bg-ink-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-alert-500/30 bg-alert-500/10 px-3 py-2 text-xs text-alert-400">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-ink-300">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-ink-600 bg-ink-800 text-ember-500 focus:ring-ember-500"
                    />
                    记住登录状态
                  </label>
                  <a className="text-xs text-ember-400 hover:text-ember-300" href="#">
                    忘记密码？
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-ember-500 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-ember-600 active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      登 录
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 rounded-lg border border-ink-700/50 bg-ink-800/40 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-300">
                  <Info className="h-3.5 w-3.5 text-mint-400" />
                  测试账号（密码任意）
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["admin", "courier1", "courier2", "super"].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => fillAccount(u)}
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs transition",
                        username === u
                          ? "border-ember-500/60 bg-ember-500/15 text-ember-300"
                          : "border-ink-700 bg-ink-800/60 text-ink-400 hover:border-ink-600 hover:text-ink-200"
                      )}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-ink-500">
              登录即表示同意《服务协议》与《隐私政策》
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
