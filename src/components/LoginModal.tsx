import { useState, useEffect } from "react";
import { X, Eye, EyeOff, Mail, Lock, Loader2, Shield, Users, Building2, UserCheck, ClipboardCheck, Settings, Zap } from "lucide-react";
import { useAppStore, ROLE_LABELS, DEMO_ACCOUNTS } from "@/store";
import { cn } from "@/lib/utils";
import BilingualText from "./BilingualText";
import type { UserRole } from "@/types";

const roleIcons: Record<UserRole, typeof Shield> = {
  government: Building2,
  culture: Users,
  public: UserCheck,
  translator: Zap,
  reviewer: ClipboardCheck,
  admin: Settings,
};

export default function LoginModal() {
  const { isLoginModalOpen, setLoginModalOpen, login, loginError, lang } = useAppStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>("public");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  useEffect(() => {
    if (!isLoginModalOpen) {
      setEmail("");
      setPassword("");
      setSelectedRole("public");
      setIsLoading(false);
      setShowDemoAccounts(false);
    }
  }, [isLoginModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    await login(email, password, selectedRole);
    setIsLoading(false);
  };

  const fillDemoAccount = (account: typeof DEMO_ACCOUNTS[number]) => {
    setSelectedRole(account.role);
    setEmail(account.email);
    setPassword(account.password);
    setShowDemoAccounts(false);
  };

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-charcoal-900/50 backdrop-blur-sm"
        onClick={() => !isLoading && setLoginModalOpen(false)}
      />

      <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="relative rounded-2xl bg-white shadow-2xl overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-cnit" />

          <button
            onClick={() => !isLoading && setLoginModalOpen(false)}
            disabled={isLoading}
            className={cn(
              "absolute top-4 right-4 p-2 rounded-lg transition-all duration-200",
              "text-charcoal-400 hover:text-charcoal-600 hover:bg-charcoal-500/5",
              "focus:outline-none focus:ring-2 focus:ring-warm-gold-500/30",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 md:p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center">
                  <span className="text-3xl">🇨🇳</span>
                  <div className="w-1 h-8 mx-1 bg-gradient-to-b from-cn-red-500 via-warm-gold-500 to-it-green-500 rounded-full" />
                  <span className="text-3xl">🇮🇹</span>
                </div>
              </div>
              <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-text-gradient-cnit mb-1">
                <BilingualText zh="欢迎登录中意桥" it="Benvenuti su Ponte Cina-Italia" />
              </h2>
              <p className="text-charcoal-400 text-sm">
                <BilingualText zh="请选择您的身份，开启中意文化交流之旅" it="Seleziona il tuo ruolo per iniziare il tuo viaggio culturale" />
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-2.5">
                  <BilingualText zh="选择您的身份角色" it="Seleziona il tuo ruolo" />
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(Object.entries(ROLE_LABELS) as [UserRole, typeof ROLE_LABELS[UserRole]][]).map(([role, label]) => {
                    const Icon = roleIcons[role];
                    const isActive = selectedRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        disabled={isLoading}
                        className={cn(
                          "relative p-3 rounded-xl text-left transition-all duration-200 border",
                          "focus:outline-none focus:ring-2 focus:ring-warm-gold-500/30",
                          isActive
                            ? "border-transparent bg-gradient-cnit/10 shadow-elegant"
                            : "border-charcoal-500/10 bg-white hover:border-charcoal-500/20 hover:bg-charcoal-500/5",
                          isLoading && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {isActive && (
                          <div className={cn("absolute inset-0 rounded-xl p-px bg-gradient-cnit opacity-100")} style={{
                            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude"
                          }} />
                        )}
                        <div className={cn("relative flex flex-col items-start gap-1.5", isActive && "translate-z-0")}>
                          <div className={cn(
                            "p-1.5 rounded-lg bg-gradient-to-br",
                            label.color,
                            "text-white shadow-sm"
                          )}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className={cn(
                            "text-xs font-semibold leading-tight",
                            isActive ? "text-charcoal-600" : "text-charcoal-500"
                          )}>
                            {lang === "zh" ? label.zh : label.it}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-charcoal-400">
                  {lang === "zh"
                    ? ROLE_LABELS[selectedRole].descZh
                    : ROLE_LABELS[selectedRole].descIt}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-2">
                  <BilingualText zh="邮箱地址" it="Indirizzo Email" />
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={lang === "zh" ? "请输入邮箱地址" : "Inserisci la tua email"}
                    disabled={isLoading}
                    className={cn(
                      "input-field pl-10",
                      isLoading && "opacity-60 cursor-not-allowed"
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-2">
                  <BilingualText zh="登录密码" it="Password" />
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={lang === "zh" ? "请输入密码" : "Inserisci la tua password"}
                    disabled={isLoading}
                    className={cn(
                      "input-field pl-10 pr-10",
                      isLoading && "opacity-60 cursor-not-allowed"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-charcoal-300 hover:text-charcoal-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-cn-red-50 border border-cn-red-500/20 text-cn-red-600 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                  <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className={cn(
                  "w-full btn-primary !py-3 text-base",
                  isLoading && "cursor-wait",
                  (!email || !password) && "opacity-60 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <BilingualText zh="登录中..." it="Accesso in corso..." />
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <BilingualText zh="立即登录" it="Accedi Ora" />
                  </>
                )}
              </button>

              <div className="relative">
                <div className="divider-gold" />
                <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 px-3 bg-white text-xs text-charcoal-400">
                  <BilingualText zh="或使用演示账号" it="o usa un account demo" />
                </span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                  disabled={isLoading}
                  className={cn(
                    "w-full btn-secondary !py-2.5 text-sm",
                    isLoading && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <Users className="w-4 h-4" />
                  {showDemoAccounts ? (
                    <BilingualText zh="收起演示账号列表" it="Nascondi lista account demo" />
                  ) : (
                    <BilingualText zh="快速使用演示账号登录" it="Accedi rapidamente con account demo" />
                  )}
                </button>

                {showDemoAccounts && (
                  <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-charcoal-500/10 divide-y divide-charcoal-500/5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {DEMO_ACCOUNTS.map((account, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => fillDemoAccount(account)}
                        disabled={isLoading}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 text-left transition-colors",
                          "hover:bg-warm-gold-500/10",
                          "first:rounded-t-xl last:rounded-b-xl",
                          isLoading && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-lg bg-gradient-to-br text-white shadow-sm flex-shrink-0",
                          ROLE_LABELS[account.role].color
                        )}>
                          {(() => {
                            const Icon = roleIcons[account.role];
                            return <Icon className="w-3.5 h-3.5" />;
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-charcoal-600 truncate">
                            {lang === "zh" ? account.labelZh : account.labelIt}
                          </p>
                          <p className="text-xs text-charcoal-400 mt-0.5 font-mono truncate">
                            {account.email} · {account.password}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>
          </div>

          <div className="px-6 md:px-8 py-4 bg-ivory-50/50 border-t border-charcoal-500/5 text-xs text-charcoal-400 text-center">
            <BilingualText
              zh="登录即表示您同意《服务条款》和《隐私政策》"
              it="Accedendo, accetti i Termini di Servizio e l'Informativa sulla Privacy"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
