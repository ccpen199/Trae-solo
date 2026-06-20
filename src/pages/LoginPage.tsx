import * as React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Phone, ShieldCheck, Recycle, Sparkles,
  UserRound, Shield, Settings2, Eye, EyeOff,
  CheckCircle2, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import type { UserRole } from '@/types';

const roleTabs = [
  { id: 'customer', label: 'C端用户', icon: <UserRound className="w-4 h-4" /> },
  { id: 'inspector', label: '检测师', icon: <Shield className="w-4 h-4" /> },
  { id: 'admin', label: '管理员', icon: <Settings2 className="w-4 h-4" /> },
];

const features = [
  { icon: ShieldCheck, title: '隐私加密', desc: '全链路SSL加密，数据安全无忧' },
  { icon: Sparkles, title: 'AI智能估价', desc: '基于千万级成交数据精准定价' },
  { icon: Recycle, title: '绿色循环', desc: '每笔订单贡献环保积分' },
];

const LoginPage: React.FC = () => {
  const [role, setRole] = React.useState<UserRole>('customer');
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [showCode, setShowCode] = React.useState(false);
  const [agree, setAgree] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);

  const handleSendCode = () => {
    if (!phone || countdown > 0) return;
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #06261D 0%, #0A382C 35%, #0F4C3A 60%, #06261D 100%)',
          }}
        />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-gold-500/15 blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-forest-400/15 blur-[120px]" />

        <div className="relative z-10 p-12 xl:p-16 flex flex-col h-full justify-between w-full">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-gold-sm">
              <Recycle className="w-6 h-6 text-ink-950" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-display text-2xl font-bold gold-text">臻回收</span>
              <p className="text-[10px] text-forest-200/60 tracking-[0.2em] uppercase">Luxury Recycle</p>
            </div>
          </Link>

          <div className="space-y-8 max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <Badge variant="gold">品牌故事</Badge>
              <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
                <span className="text-ink-50">让闲置奢品</span>
                <br />
                <span className="gold-text">焕发新生</span>
              </h1>
              <p className="text-forest-100/70 text-lg leading-relaxed">
                创立于2018年，臻回收已服务 200万+ 用户，累计回收奢侈品超过
                <span className="text-gold-400 font-semibold"> 500,000 </span>
                件，节省碳排放
                <span className="text-jade-400 font-semibold"> 12,000 </span>
                吨。
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-forest-400/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gold-700/40 via-forest-700/30 to-forest-900/60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-[10rem] font-bold text-white/10 leading-none">
                  臻
                </span>
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,169,98,0.25),transparent_50%)]" />
              <div className="absolute bottom-6 left-6 right-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="success" dot>2025年度</Badge>
                  <Badge variant="gold">行业Top3</Badge>
                </div>
                <p className="text-forest-50 font-semibold">值得信赖的奢侈品回收平台</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-3"
            >
              {features.map((f) => (
                <div
                  key={f.title}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm"
                >
                  <f.icon className="w-5 h-5 text-gold-400 mb-2" />
                  <p className="text-sm font-semibold text-ink-50">{f.title}</p>
                  <p className="text-xs text-forest-200/60 mt-1">{f.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-forest-200/50"
          >
            © 2025 臻回收 ZhenHuiShou. All rights reserved.
          </motion.p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-ink-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-gold-sm">
              <Recycle className="w-5 h-5 text-ink-950" />
            </div>
            <span className="font-display text-xl font-bold gold-text">臻回收</span>
          </div>

          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink-50 tracking-tight">
              欢迎回来 👋
            </h2>
            <p className="text-ink-300 mt-2">登录后即可开始您的回收之旅</p>
          </div>

          <Tabs variant="pills" tabs={roleTabs} activeTab={role} onChange={(r) => setRole(r as UserRole)} />

          <Card className="p-0 overflow-hidden">
            <CardContent className="p-6 sm:p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink-200 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gold-400" />
                  手机号码
                </label>
                <div className="flex items-stretch gap-2">
                  <div className="w-20 h-12 shrink-0 rounded-2xl bg-ink-800/80 border border-white/[0.06] flex items-center justify-center text-sm font-semibold text-ink-200">
                    +86
                  </div>
                  <div className="flex-1 flex items-center h-12 px-4 rounded-2xl bg-ink-800/80 border border-white/[0.06] focus-within:border-gold-500/50 transition-colors">
                    <input
                      type="tel"
                      placeholder="请输入手机号"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      className="w-full h-full bg-transparent text-base text-ink-100 placeholder:text-ink-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ink-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gold-400" />
                  验证码
                </label>
                <div className="flex items-stretch gap-2">
                  <div className="flex-1 flex items-center h-12 px-4 rounded-2xl bg-ink-800/80 border border-white/[0.06] focus-within:border-gold-500/50 transition-colors">
                    <input
                      type={showCode ? 'text' : 'password'}
                      placeholder="6位验证码"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="flex-1 h-full bg-transparent text-base text-ink-100 placeholder:text-ink-400 focus:outline-none tracking-[0.3em] font-mono"
                    />
                    <button
                      onClick={() => setShowCode((v) => !v)}
                      className="text-ink-400 hover:text-ink-200 transition-colors"
                    >
                      {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={handleSendCode}
                    disabled={countdown > 0 || phone.length < 11}
                    className="h-12 px-5 shrink-0 rounded-2xl text-sm font-semibold transition-all duration-300 border-2
                      disabled:opacity-50 disabled:cursor-not-allowed
                      border-forest-600 text-forest-300 hover:bg-forest-600/15 hover:border-forest-500 hover:text-forest-200"
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <button
                  onClick={() => setAgree((v) => !v)}
                  className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                    agree
                      ? 'bg-gold-gradient border-gold-500 shadow-gold-sm'
                      : 'border-ink-500 group-hover:border-gold-500/50'
                  }`}
                >
                  {agree && <CheckCircle2 className="w-3.5 h-3.5 text-ink-950" strokeWidth={4} />}
                </button>
                <span className="text-sm text-ink-300 leading-relaxed">
                  我已阅读并同意
                  <a href="#" className="text-gold-400 hover:underline mx-1">《用户服务协议》</a>
                  和
                  <a href="#" className="text-gold-400 hover:underline mx-1">《隐私政策》</a>
                  ，授权臻回收获取必要的身份信息用于交易核验。
                </span>
              </label>

              <Button size="lg" className="w-full" disabled={!agree || phone.length < 11 || code.length < 6}>
                登录 / 注册
                <ArrowRight className="w-5 h-5" />
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-ink-850 text-ink-400">其他登录方式</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '微信', color: 'from-jade-500/20 to-jade-500/10' },
                  { label: '支付宝', color: 'from-blue-500/20 to-blue-500/10' },
                  { label: 'Apple', color: 'from-grey-500/20 to-grey-500/10' },
                ].map((p) => (
                  <button
                    key={p.label}
                    className={`h-12 rounded-2xl bg-gradient-to-br ${p.color} border border-white/[0.06] text-sm font-medium text-ink-200 hover:border-gold-500/30 hover:text-gold-400 transition-all duration-300`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-ink-400">
            首次使用手机号验证将自动注册账号
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export { LoginPage };
export default LoginPage;
