import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Scale,
  Shield,
  Check,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type RoleKey = "user" | "lawyer" | "admin";

interface Role {
  key: RoleKey;
  icon: typeof User;
  name: string;
  subtitle: string;
  description: string;
  features: string[];
  accentColor: string;
  accentBg: string;
  accentBorder: string;
}

const roles: Role[] = [
  {
    key: "user",
    icon: User,
    name: "咨询用户",
    subtitle: "寻求法律援助",
    description: "免费获取专业公益律师的法律咨询服务，保护您的合法权益",
    features: ["免费法律咨询", "智能匹配律师", "全程加密保护"],
    accentColor: "text-blue-600",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-200",
  },
  {
    key: "lawyer",
    icon: Scale,
    name: "公益律师",
    subtitle: "提供专业法律服务",
    description: "加入公益律师团队，用您的专业知识帮助更多需要法律援助的人",
    features: ["在线接受咨询", "管理案件档案", "服务数据统计"],
    accentColor: "text-amber-600",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
  },
  {
    key: "admin",
    icon: Shield,
    name: "平台管理员",
    subtitle: "运营和管理平台",
    description: "管理平台用户、律师和咨询案件，确保平台高效运转",
    features: ["用户权限管理", "咨询案件审核", "数据报表分析"],
    accentColor: "text-emerald-600",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-200",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<RoleKey | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = () => {
    if (!selectedRole) return;
    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
      if (selectedRole === "user") {
        navigate("/home");
      } else if (selectedRole === "lawyer") {
        navigate("/home");
      } else {
        navigate("/home");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-hero-gradient relative overflow-hidden flex items-center justify-center py-12 px-4">
      <div className="absolute inset-0 pattern-grid opacity-30" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-teal/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Scale className="w-4 h-4 text-accent-gold" />
            <span className="text-sm text-white/80">法律公益咨询协同平台</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3">
            欢迎使用 <span className="text-gradient-gold">法治阳光</span>
          </h1>
          <p className="text-white/60">请选择您的身份登录平台</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass rounded-2xl p-6 md:p-8 backdrop-blur-md"
        >
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.key;
              return (
                <motion.button
                  key={role.key}
                  type="button"
                  onClick={() => setSelectedRole(role.key)}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative text-left p-5 rounded-xl transition-all duration-300 border-2 ${
                    isSelected
                      ? "border-accent-gold bg-white/20 shadow-gold"
                      : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent-gold flex items-center justify-center shadow-gold"
                    >
                      <Check className="w-3.5 h-3.5 text-primary-900" />
                    </motion.div>
                  )}

                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                      isSelected ? "bg-gold-gradient" : role.accentBg
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 transition-colors ${
                        isSelected ? "text-primary-900" : role.accentColor
                      }`}
                    />
                  </div>

                  <h3 className="font-serif text-lg font-semibold text-white mb-1">
                    {role.name}
                  </h3>
                  <p className={`text-sm mb-3 ${isSelected ? "text-accent-gold" : "text-white/50"}`}>
                    {role.subtitle}
                  </p>
                  <p className="text-xs text-white/60 leading-relaxed mb-4">
                    {role.description}
                  </p>

                  <div className="space-y-1.5">
                    {role.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-xs text-white/70">
                        <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-accent-gold" : "bg-white/40"}`} />
                        {feature}
                      </div>
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <motion.div
            initial={false}
            animate={{ height: selectedRole ? "auto" : 0, opacity: selectedRole ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-6 border-t border-white/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center">
                    {selectedRole && (() => {
                      const role = roles.find((r) => r.key === selectedRole);
                      if (role) {
                        const Icon = role.icon;
                        return <Icon className="w-5 h-5 text-accent-gold" />;
                      }
                      return null;
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {selectedRole ? `已选择：${roles.find((r) => r.key === selectedRole)?.name}` : "请选择登录身份"}
                    </p>
                    <p className="text-xs text-white/50">
                      {selectedRole ? "点击下方按钮进入平台" : "选择您的角色以继续"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={!selectedRole || isLoggingIn}
                  className={`btn-gold px-8 py-3 min-w-[160px] ${
                    !selectedRole ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoggingIn ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-primary-900/30 border-t-primary-900 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span className="ml-2">登录中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      进入平台
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-white/40 text-sm mt-6"
        >
          登录即表示您同意我们的服务条款和隐私政策
        </motion.p>
      </div>
    </div>
  );
}
