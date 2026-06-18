import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  User,
  Lock,
  MapPin,
  BookOpen,
  Heart,
  Users,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { mockUsers } from '@/mock/users';
import { cn } from '@/lib/utils';

type RoleTab = 'student' | 'admin' | 'base' | 'donor';

const roleTabs: { key: RoleTab; label: string; icon: string }[] = [
  { key: 'student', label: '学生', icon: '🎓' },
  { key: 'admin', label: '管理员', icon: '👔' },
  { key: 'base', label: '实践基地', icon: '🏛️' },
  { key: 'donor', label: '捐赠方', icon: '💝' },
];

const roleToUserRole: Record<RoleTab, string[]> = {
  student: ['student'],
  admin: ['department_admin', 'school_admin'],
  base: ['base'],
  donor: ['donor'],
};

const demoAccounts: Record<RoleTab, { username: string; password: string; name: string; desc: string }> = {
  student: {
    username: 'zhangming2023',
    password: '123456',
    name: '张明',
    desc: '计算机学院 · 2023级',
  },
  admin: {
    username: 'liwei_admin',
    password: '123456',
    name: '李伟',
    desc: '院系管理员 · 计科院',
  },
  base: {
    username: 'huangshan_base',
    password: '123456',
    name: '黄山',
    desc: '宏村镇 · 乡村实践基地',
  },
  donor: {
    username: 'zhaotech_foundation',
    password: '123456',
    name: '赵科技',
    desc: '赵科技基金会',
  },
};

const features = [
  { icon: Users, title: '三下乡管理', desc: '团队组建、轨迹打卡、日志记录' },
  { icon: Heart, title: '奖学金资助', desc: '项目发布、申请审核、受助故事' },
  { icon: MapPin, title: '实践基地', desc: '基地入驻、岗位发布、满意度评价' },
  { icon: BookOpen, title: '学分认证', desc: '实践学分、自动核算、电子证明' },
];

type LoginError = {
  type: 'empty_username' | 'empty_password' | 'not_found' | 'role_mismatch' | 'password_wrong';
  message: string;
  field?: 'username' | 'password';
};

const roleLabelZh: Record<string, string> = {
  student: '学生',
  department_admin: '院系管理员',
  school_admin: '校级管理员',
  base: '实践基地',
  donor: '捐赠方',
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [activeTab, setActiveTab] = useState<RoleTab>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const doLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);

    if (!username.trim()) {
      setError({ type: 'empty_username', message: '请输入用户名', field: 'username' });
      return;
    }
    if (!password.trim()) {
      setError({ type: 'empty_password', message: '请输入密码', field: 'password' });
      return;
    }

    const trimmedUser = username.trim();
    const trimmedPwd = password.trim();
    const foundUser = mockUsers.find((u) => u.username === trimmedUser);

    if (!foundUser) {
      setError({
        type: 'not_found',
        message: `账号 "${trimmedUser}" 不存在。请点击下方"快速登录"选择演示账号。`,
        field: 'username',
      });
      return;
    }

    const allowedRoles = roleToUserRole[activeTab];
    if (!allowedRoles.includes(foundUser.role)) {
      const selectedLabel = roleTabs.find((t) => t.key === activeTab)?.label || '';
      const userLabel = roleLabelZh[foundUser.role] || foundUser.role;
      setError({
        type: 'role_mismatch',
        message: `该账号角色为「${userLabel}」，与当前选择的「${selectedLabel}」身份不匹配。请切换上方身份标签，或点击下方对应角色的"快速登录"。`,
        field: 'username',
      });
      return;
    }

    if (trimmedPwd !== '123456') {
      setError({
        type: 'password_wrong',
        message: '密码错误。演示账号统一密码为 123456（点击下方"快速登录"自动填充）。',
        field: 'password',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      flushSync(() => {
        login(foundUser);
      });
    } catch {
      login(foundUser);
    }

    setIsSuccess(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        navigate('/', { replace: true });
      });
    });
  };

  const fillDemo = (tab: RoleTab, autoSubmit = false) => {
    const demo = demoAccounts[tab];
    setActiveTab(tab);
    setUsername(demo.username);
    setPassword(demo.password);
    setError(null);
    setIsSuccess(false);

    if (autoSubmit) {
      const user = mockUsers.find((u) => u.username === demo.username);
      if (user) {
        setIsSubmitting(true);
        try {
          flushSync(() => login(user));
        } catch {
          login(user);
        }
        setIsSuccess(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => navigate('/', { replace: true }));
        });
      }
    }
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  const usernameBorder =
    error?.field === 'username'
      ? 'border-danger-400 ring-2 ring-danger-100'
      : 'border-surface-200 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100';

  const passwordBorder =
    error?.field === 'password'
      ? 'border-danger-400 ring-2 ring-danger-100'
      : 'border-surface-200 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100';

  return (
    <div className="flex min-h-screen bg-surface-50">
      <div className="relative hidden w-3/5 overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-[10%] top-[15%] h-64 w-64 rounded-full border-2 border-white" />
          <div className="absolute right-[15%] top-[25%] h-96 w-96 rounded-full border border-white" />
          <div className="absolute bottom-[10%] left-[20%] h-48 w-48 rotate-45 border-2 border-white" />
          <div className="absolute bottom-[20%] right-[10%] h-32 w-32 rotate-12 border border-white" />
          <div className="absolute left-[50%] top-[60%] h-80 w-80 rounded-full border border-white" />
          <div className="absolute left-[5%] top-[50%] h-20 w-20 rotate-45 border-2 border-white" />
        </div>

        <div className="relative z-10 max-w-xl px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                <GraduationCap className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">高校社会实践</h1>
                <p className="text-sm text-white/70">协同管理平台</p>
              </div>
            </div>

            <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight">
              连接高校与社会
              <br />
              <span className="text-accent-300">让实践更有价值</span>
            </h2>
            <p className="mb-10 text-white/80 leading-relaxed">
              一站式管理三下乡社会实践、奖学金资助、实践基地与学分认证，
              对接教育部实践学分标准，助力高校社会实践高质量发展。
            </p>

            <div className="grid grid-cols-2 gap-3">
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  whileHover={{ scale: 1.03 }}
                  className="rounded-xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/10"
                >
                  <feature.icon className="mb-2 h-6 w-6 text-accent-300" />
                  <h3 className="text-sm font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-xs text-white/60 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-10 lg:px-16">
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <motion.div variants={itemVariants} className="mb-6 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-surface-800">高校社会实践协同管理平台</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-surface-900">欢迎登录</h2>
            <p className="mt-1 text-sm text-surface-500">选择身份 → 填写账号 → 进入工作台</p>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-5">
            <p className="mb-2 text-xs font-medium text-surface-500">请选择您的身份</p>
            <div className="grid grid-cols-4 gap-2">
              {roleTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => fillDemo(tab.key)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl p-3 text-xs font-medium transition-all ring-1',
                    activeTab === tab.key
                      ? 'bg-primary-600 text-white ring-primary-600 shadow-lg shadow-primary-600/25'
                      : 'bg-surface-50 text-surface-600 ring-surface-200 hover:bg-surface-100 hover:ring-surface-300'
                  )}
                >
                  <span className="text-xl leading-none">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          <form onSubmit={doLogin} className="mt-5 space-y-3.5" noValidate>
            <motion.div variants={itemVariants}>
              <label className="mb-1 block text-xs font-medium text-surface-600">用户名</label>
              <div className={cn(
                'flex items-center rounded-xl border bg-surface-50 px-4 py-2.5 transition-colors',
                usernameBorder
              )}>
                <User className="h-4.5 w-4.5 text-surface-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(null); }}
                  placeholder="请输入用户名"
                  className="ml-3 flex-1 bg-transparent text-sm outline-none placeholder:text-surface-400"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="mb-1 block text-xs font-medium text-surface-600">密码</label>
              <div className={cn(
                'flex items-center rounded-xl border bg-surface-50 px-4 py-2.5 transition-colors',
                passwordBorder
              )}>
                <Lock className="h-4.5 w-4.5 text-surface-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="请输入密码（演示账号：123456）"
                  className="ml-3 flex-1 bg-transparent text-sm outline-none placeholder:text-surface-400"
                  autoComplete="current-password"
                />
              </div>
            </motion.div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-surface-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                记住登录状态
              </label>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-start gap-2.5 rounded-xl bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700"
                >
                  <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{error.type === 'role_mismatch' ? '身份不匹配' : error.type === 'password_wrong' ? '密码错误' : error.type === 'not_found' ? '账号不存在' : '请输入账号'}</p>
                    <p className="text-danger-600 mt-0.5 leading-relaxed">{error.message}</p>
                  </div>
                </motion.div>
              )}
              {isSuccess && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  className="flex items-center gap-2.5 rounded-xl bg-success-50 border border-success-200 px-4 py-3 text-sm text-success-700"
                >
                  <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">登录成功</p>
                    <p className="text-success-600 mt-0.5">正在跳转工作台...</p>
                  </div>
                  <ArrowRight className="w-4.5 h-4.5 animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants}>
              <button
                type="submit"
                disabled={isSubmitting && !isSuccess}
                className={cn(
                  'w-full rounded-xl py-3 font-semibold text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2',
                  isSuccess
                    ? 'bg-success-500 shadow-success-500/25'
                    : 'bg-gradient-to-r from-primary-600 to-primary-800 shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/30 hover:brightness-110',
                  isSubmitting && !isSuccess && 'opacity-70 cursor-wait'
                )}
              >
                {isSubmitting && !isSuccess ? '验证中...' : isSuccess ? '✓ 登录成功，跳转中' : '登 录'}
              </button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-5 rounded-2xl border border-primary-100 bg-primary-50/60 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-primary-700">
              <span>⚡</span> 快速登录（点击直接进入工作台）
            </p>
            <div className="space-y-2">
              {roleTabs.map((tab) => {
                const demo = demoAccounts[tab.key];
                const active = activeTab === tab.key && username === demo.username;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => fillDemo(tab.key, true)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all border',
                      active
                        ? 'bg-primary-100 border-primary-300 text-primary-800 shadow-sm'
                        : 'bg-white border-surface-200 text-surface-700 hover:bg-primary-50 hover:border-primary-200'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg shrink-0">{tab.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-tight">{demo.name}</p>
                        <p className="text-xs opacity-70 mt-0.5 truncate">{demo.desc}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 shrink-0 text-[11px] opacity-70 ml-2">
                      <span>点击进入</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-primary-600/80 text-center">
              演示账号统一密码：<span className="font-mono font-bold">123456</span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
