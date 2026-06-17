import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Shield,
  Users,
  Home,
  Wrench,
  MapPin,
  LogIn,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, getRoleLabel } from "@/utils";
import type { UserRole } from "@/types";

interface RoleOption {
  id: string;
  name: string;
  role: UserRole;
  roleCode: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  badgeVariant:
    | "primary"
    | "default"
    | "success"
    | "danger"
    | "warning"
    | "info";
}

const roleOptions: RoleOption[] = [
  {
    id: "u001",
    name: "张明华",
    role: "council_director",
    roleCode: "director",
    description: "业委会主任 · 全面负责业委会工作",
    icon: <Shield className="w-6 h-6" />,
    gradient: "from-primary-500 to-primary-600",
    badgeVariant: "primary",
  },
  {
    id: "u002",
    name: "李建国",
    role: "council_member",
    roleCode: "deputy_director",
    description: "业委会副主任 · 协助主任处理日常事务",
    icon: <Users className="w-6 h-6" />,
    gradient: "from-trust-500 to-trust-600",
    badgeVariant: "info",
  },
  {
    id: "u003",
    name: "王芳",
    role: "council_member",
    roleCode: "committee",
    description: "业委会委员 · 分管财务与档案",
    icon: <Building2 className="w-6 h-6" />,
    gradient: "from-emerald-500 to-emerald-600",
    badgeVariant: "success",
  },
  {
    id: "u004",
    name: "陈强",
    role: "property_admin",
    roleCode: "property_manager",
    description: "物业经理 · 负责物业服务统筹管理",
    icon: <Home className="w-6 h-6" />,
    gradient: "from-amber-500 to-amber-600",
    badgeVariant: "warning",
  },
  {
    id: "u005",
    name: "刘伟",
    role: "maintenance_staff",
    roleCode: "maintenance",
    description: "维修人员 · 负责设施设备维修保养",
    icon: <Wrench className="w-6 h-6" />,
    gradient: "from-orange-500 to-orange-600",
    badgeVariant: "danger",
  },
  {
    id: "u006",
    name: "赵丽",
    role: "street_officer",
    roleCode: "street_officer",
    description: "街道办 · 负责社区指导与监督",
    icon: <MapPin className="w-6 h-6" />,
    gradient: "from-slate-500 to-slate-600",
    badgeVariant: "default",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAppStore();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (option: RoleOption) => {
    login({
      id: option.id,
      name: option.name,
      role: option.role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${option.id}`,
      phone: "138****" + option.id.slice(-4),
    });
    navigate("/dashboard");
  };

  const handleDemoLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const account = username.trim().toLowerCase();
    const validAccounts = new Set(["admin", "platform", "ops", "u001"]);

    if (!validAccounts.has(account) || password.trim().length === 0) {
      setLoginError("请输入演示账号 admin / platform / ops 和任意密码");
      return;
    }

    setLoginError("");
    handleLogin(roleOptions[0]);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-trust-50">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&h=1080&fit=crop)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-trust-200 rounded-full filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-trust-500 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 font-display">
                社区治理数字化工作台
              </h1>
              <p className="text-sm text-slate-500">
                Community Governance Digital Platform
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <Badge variant="primary" size="md" className="mb-4">
                数字治理 · 智慧社区
              </Badge>
              <h2 className="text-4xl font-bold text-slate-800 font-display mb-4">
                欢迎登录
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                请选择您的身份角色进入系统，体验业委会数字化治理的全流程功能
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              onSubmit={handleDemoLogin}
              className="mb-8 mx-auto grid max-w-3xl grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]"
            >
              <label className="text-left">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  账号
                </span>
                <input
                  aria-label="账号"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="admin"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </label>
              <label className="text-left">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  密码
                </span>
                <input
                  aria-label="密码"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="admin123"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </label>
              <div className="flex items-end">
                <Button
                  type="submit"
                  variant="primary"
                  className="h-11 w-full whitespace-nowrap rounded-xl px-6"
                >
                  登录
                </Button>
              </div>
              {loginError && (
                <p className="md:col-span-3 text-left text-sm text-rose-600">
                  {loginError}
                </p>
              )}
            </motion.form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roleOptions.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                >
                  <Button
                    variant="default"
                    onClick={() => handleLogin(option)}
                    className={cn(
                      "w-full h-auto p-0 overflow-hidden group",
                      "bg-white border-2 border-slate-200 hover:border-primary-300",
                      "shadow-sm hover:shadow-xl transition-all duration-300",
                      "rounded-2xl"
                    )}
                  >
                    <div className="p-6 text-left">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg",
                            "bg-gradient-to-br",
                            option.gradient
                          )}
                        >
                          {option.icon}
                        </div>
                        <Badge
                          variant={option.badgeVariant}
                          size="sm"
                          className="font-medium"
                        >
                          {getRoleLabel(option.role)}
                        </Badge>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-xl font-semibold text-slate-800 mb-1 group-hover:text-primary-600 transition-colors">
                          {option.name}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {option.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {option.id}
                        </span>
                        <div
                          className={cn(
                            "flex items-center gap-1.5 text-sm font-medium",
                            "text-primary-600 group-hover:gap-2 transition-all"
                          )}
                        >
                          <span>登录</span>
                          <LogIn className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-12 text-center"
            >
              <p className="text-sm text-slate-400">
                © 2025 社区治理数字化工作台 · 基于区块链技术的信任治理体系
              </p>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
