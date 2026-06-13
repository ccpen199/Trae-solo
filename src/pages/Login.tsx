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
  AlertTriangle,
  Sparkles,
  MapPin,
  BarChart3,
  FileText,
} from "lucide-react";
import { login as authLogin, roleAccounts, roleLabel } from "@/utils/auth";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const expressCompanies = [
  "顺丰速运", "京东物流", "中通快递", "圆通速递",
  "申通快递", "韵达速递", "极兔速递", "邮政EMS",
  "德邦快递", "菜鸟驿站", "丹鸟物流", "跨越速运",
];

type LoginStage = "idle" | "loading" | "success" | "error";

export default function Login() {
  const nav = useNavigate();
  const storeLogin = useAppStore((s) => s.login);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [remember, setRemember] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [showPwd, setShowPwd] = useState(false);
  const [stage, setStage] = useState<LoginStage>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const doLogin = (u: string, p: string) => {
    setStage("loading");
    setErrorMsg("");

    setTimeout(() => {
      const user = authLogin(u, p);
      storeLogin(u, p);
      if (user) {
        setStage("success");
        setTimeout(() => {
          nav("/dashboard", { replace: true });
        }, 400);
      } else {
        setStage("error");
        const valid = ["admin", "courier1", "courier2", "super"];
        if (valid.includes(u.trim().toLowerCase())) {
          setErrorMsg("登录校验失败，请清除浏览器缓存后重试，或更换其他测试账号");
        } else {
          setErrorMsg(
            `账号「${u}」不存在。请选择下方的角色卡片，查看对应的测试账号后再登录。`
          );
        }
      }
    }, 700);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setStage("error");
      setErrorMsg("请输入用户名");
      return;
    }
    doLogin(username.trim(), password);
  };

  const fillAccount = (u: string) => {
    setUsername(u);
    setStage("idle");
    setErrorMsg("");
  };

  const clearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
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
              <div className="text-sm text-ink-300">ExpressLink Pro · 物流协同工作台</div>
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
              面向快递员与末端网点经营者的一体化作业平台，覆盖揽收调度、面单云打印、客户关系、轨迹聚合、经营分析全流程。
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: MapPin, label: "2100+ 快递公司面单", color: "text-ember-400" },
                { icon: FileText, label: "批量录单 + OCR 识别", color: "text-mint-400" },
                { icon: BarChart3, label: "经营看板 · 区域热力", color: "text-ember-300" },
                { icon: ShieldCheck, label: "三级权限 · 合规审计", color: "text-mint-300" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-ink-700/50 bg-ink-800/40 p-3 backdrop-blur-sm">
                    <Icon className={cn("h-5 w-5", item.color)} />
                    <span className="text-sm text-ink-200">{item.label}</span>
                  </div>
                );
              })}
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
            © 2026 速驿通 ExpressLink Pro · 数据安全等保三级认证 · 邮政行业合规
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

            <div className="rounded-2xl border border-ink-700/50 bg-ink-900/70 p-7 shadow-card-hover backdrop-blur-xl">
              <div className="mb-5">
                <h2 className="mb-1 text-2xl font-bold text-white font-display">欢迎登录</h2>
                <p className="text-sm text-ink-400">
                  选择角色查看对应权限，使用测试账号进入工作台
                </p>
              </div>

              <div className="mb-5 space-y-2">
                {roleAccounts.map((r) => {
                  const Icon =
                    r.role === "branch_admin"
                      ? Building2
                      : r.role === "courier"
                      ? Package
                      : ShieldCheck;
                  const active = selectedRole === r.role;
                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setSelectedRole(active ? "all" : r.role)}
                      className={cn(
                        "w-full text-left rounded-xl border p-3.5 transition-all",
                        active
                          ? "border-ember-500/50 bg-ember-500/10"
                          : "border-ink-700/60 bg-ink-800/40 hover:border-ink-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg",
                            active
                              ? "bg-ember-500/20 text-ember-400"
                              : "bg-ink-800 text-ink-400"
                          )}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn("font-medium text-sm", active ? "text-ember-300" : "text-white")}>
                            {r.label}
                          </div>
                          <div className="text-xs text-ink-400">{r.desc}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-ink-500">测试账号</div>
                          <div className="text-xs font-mono text-ink-300">
                            {r.accounts.join(" / ")}
                          </div>
                        </div>
                      </div>
                      {active && (
                        <div className="mt-3 pt-3 border-t border-ember-500/20">
                          <div className="grid grid-cols-2 gap-1.5">
                            {r.features.map((f) => (
                              <div key={f} className="flex items-center gap-1.5 text-xs text-ink-300">
                                <CheckCircle2 size={12} className="text-mint-400 flex-shrink-0" />
                                <span className="truncate">{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (stage === "error") setStage("idle");
                      }}
                      placeholder="请输入用户名，如 admin"
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
                      placeholder="任意密码均可登录"
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

                {stage === "error" && errorMsg && (
                  <div className="animate-slideUp rounded-lg border border-alert-500/30 bg-alert-500/10 px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-alert-400" />
                      <div className="text-xs text-alert-300 leading-relaxed">{errorMsg}</div>
                    </div>
                    <button
                      type="button"
                      onClick={clearCache}
                      className="mt-2.5 w-full text-xs bg-alert-500/20 hover:bg-alert-500/30 text-alert-200 py-1.5 rounded-md transition font-medium"
                    >
                      清除缓存并重试
                    </button>
                  </div>
                )}

                {stage === "success" && (
                  <div className="animate-slideUp rounded-lg border border-mint-500/30 bg-mint-500/10 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-mint-400" />
                      <div className="text-xs text-mint-300">登录成功，正在进入工作台...</div>
                    </div>
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
                  disabled={stage === "loading" || stage === "success"}
                  className={cn(
                    "group flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white shadow-glow transition active:scale-[0.98] disabled:opacity-70",
                    stage === "success"
                      ? "bg-mint-500"
                      : "bg-ember-500 hover:bg-ember-600"
                  )}
                >
                  {stage === "loading" ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      正在登录...
                    </>
                  ) : stage === "success" ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      登录成功
                    </>
                  ) : (
                    <>
                      登 录 工作台
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 rounded-lg border border-ink-700/50 bg-ink-800/40 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-300">
                  <Info className="h-3.5 w-3.5 text-mint-400" />
                  快速体验 · 点击账号一键填入
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["admin", "courier1", "courier2", "super"].map((u) => {
                    const role =
                      u === "admin"
                        ? "branch_admin"
                        : u === "super"
                        ? "regional_supervisor"
                        : "courier";
                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => fillAccount(u)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition",
                          username === u
                            ? "border-ember-500/60 bg-ember-500/15 text-ember-300"
                            : "border-ink-700 bg-ink-800/60 text-ink-400 hover:border-ink-600 hover:text-ink-200"
                        )}
                      >
                        <span className="font-mono">{u}</span>
                        <span className="text-[10px] opacity-70">· {roleLabel(role)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-ink-500">
              登录即表示同意《服务协议》与《隐私政策》 · 数据符合邮政行业安全规范
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
