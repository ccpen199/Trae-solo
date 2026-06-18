import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  User,
  Lock,
  MapPin,
  BookOpen,
  Heart,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { mockUsers } from '@/mock/users';
import { cn } from '@/lib/utils';

type RoleTab = 'student' | 'admin' | 'base' | 'donor';

const roleTabs: { key: RoleTab; label: string }[] = [
  { key: 'student', label: '学生' },
  { key: 'admin', label: '管理员' },
  { key: 'base', label: '实践基地' },
  { key: 'donor', label: '捐赠方' },
];

const roleMockMap: Record<RoleTab, string> = {
  student: 'zhangming2023',
  admin: 'liwei_admin',
  base: 'huangshan_base',
  donor: 'zhaotech_foundation',
};

const demoAccounts: Record<RoleTab, { username: string; password: string; name: string }> = {
  student: { username: 'zhangming2023', password: '123456', name: '张明（学生）' },
  admin: { username: 'liwei_admin', password: '123456', name: '李伟（院系管理员）' },
  base: { username: 'huangshan_base', password: '123456', name: '黄山（实践基地）' },
  donor: { username: 'zhaotech_foundation', password: '123456', name: '赵科技（捐赠方）' },
};

const features = [
  { icon: Users, title: '三下乡管理', desc: '团队组建、轨迹打卡、日志记录' },
  { icon: Heart, title: '奖学金资助', desc: '项目发布、申请审核、受助故事' },
  { icon: MapPin, title: '实践基地', desc: '基地入驻、岗位发布、满意度评价' },
  { icon: BookOpen, title: '学分认证', desc: '实践学分、自动核算、电子证明' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [activeTab, setActiveTab] = useState<RoleTab>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const mockUser = mockUsers.find((u) => u.username === roleMockMap[activeTab]);
    if (!mockUser) {
      setError('登录失败，请重试');
      return;
    }

    login(mockUser);
    navigate('/');
  };

  const fillDemo = () => {
    const demo = demoAccounts[activeTab];
    setUsername(demo.username);
    setPassword(demo.password);
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

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-3/5 overflow-hidden bg-gradient-to-br from-primary-800 to-primary-600 lg:flex lg:items-center lg:justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-[10%] top-[15%] h-64 w-64 rounded-full border-2 border-white" />
          <div className="absolute right-[15%] top-[25%] h-96 w-96 rounded-full border border-white" />
          <div className="absolute bottom-[10%] left-[20%] h-48 w-48 rotate-45 border-2 border-white" />
          <div className="absolute bottom-[20%] right-[10%] h-32 w-32 rotate-12 border border-white" />
          <div className="absolute left-[50%] top-[60%] h-80 w-80 rounded-full border border-white" />
          <div className="absolute left-[5%] top-[50%] h-20 w-20 rotate-45 border-2 border-white" />
        </div>

        <div className="relative z-10 max-w-lg px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <GraduationCap className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">高校社会实践</h1>
                <p className="text-sm text-white/70">协同管理平台</p>
              </div>
            </div>

            <h2 className="mb-3 text-3xl font-bold leading-tight">
              连接高校与社会<br />让实践更有价值
            </h2>
            <p className="mb-10 text-white/70">
              一站式管理三下乡社会实践、奖学金资助、实践基地与学分认证，助力高校社会实践高质量发展。
            </p>

            <div className="grid grid-cols-2 gap-4">
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  whileHover={{ scale: 1.03 }}
                  className="rounded-xl bg-white/10 p-4 backdrop-blur-sm"
                >
                  <feature.icon className="mb-2 h-6 w-6 text-white/90" />
                  <h3 className="text-sm font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-xs text-white/60">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 lg:px-16">
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <motion.div variants={itemVariants} className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-surface-800">高校社会实践协同管理平台</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-surface-900">欢迎登录</h2>
            <p className="mt-1 text-sm text-surface-500">请选择角色并输入账号信息</p>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-6">
            <div className="flex rounded-xl bg-surface-100 p-1">
              {roleTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setUsername('');
                    setPassword('');
                    setError('');
                  }}
                  className="relative flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
                >
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-lg bg-white shadow-sm"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span
                    className={cn(
                      'relative z-10',
                      activeTab === tab.key ? 'text-primary-700' : 'text-surface-500'
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <motion.div variants={itemVariants}>
                  <div className="flex items-center rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 transition-colors focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100">
                    <User className="h-5 w-5 text-surface-400" />
                    <input
                      type="text"
                      placeholder="请输入用户名"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="ml-3 flex-1 bg-transparent text-sm outline-none placeholder:text-surface-400"
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <div className="flex items-center rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 transition-colors focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100">
                    <Lock className="h-5 w-5 text-surface-400" />
                    <input
                      type="password"
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="ml-3 flex-1 bg-transparent text-sm outline-none placeholder:text-surface-400"
                    />
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            <motion.div variants={itemVariants} className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-surface-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                记住我
              </label>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-danger-50 px-4 py-2 text-sm text-danger-600"
              >
                {error}
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-800 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:shadow-xl hover:shadow-primary-600/30 hover:brightness-110 active:scale-[0.98]"
              >
                登 录
              </button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-6 rounded-xl bg-surface-50 p-4">
            <p className="mb-2 text-xs font-medium text-surface-500">演示账号</p>
            <div className="space-y-1.5">
              {roleTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    const demo = demoAccounts[tab.key];
                    setUsername(demo.username);
                    setPassword(demo.password);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs transition-colors',
                    activeTab === tab.key
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-surface-600 hover:bg-surface-100'
                  )}
                >
                  <span>
                    {demoAccounts[tab.key].name}
                  </span>
                  <span className="text-surface-400">密码：{demoAccounts[tab.key].password}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
