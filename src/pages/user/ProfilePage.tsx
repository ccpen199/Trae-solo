import { useState, useEffect, useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  TicketPercent,
  Bell,
  HelpCircle,
  Settings,
  LogOut,
  ChevronRight,
  Package,
  Clock,
  Wallet,
  ShieldCheck,
  Camera,
  Edit3,
  Crown,
  Star,
  Phone,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { generateMockOrders, generateMockUsers } from '../../utils/mockData';
import type { User, Order } from '../../types';

const menuItems = [
  {
    icon: <MapPin size={20} />,
    label: '地址管理',
    desc: '管理常用地址',
    path: '/user/profile',
    tint: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    icon: <TicketPercent size={20} />,
    label: '优惠券',
    desc: '8 张可用',
    path: '/user/profile',
    badge: '8',
    tint: 'from-orange-500/20 to-amber-500/20',
    iconColor: 'text-accent',
  },
  {
    icon: <Bell size={20} />,
    label: '消息通知',
    desc: '订单与系统消息',
    path: '/user/profile',
    badge: '3',
    tint: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-primary',
  },
  {
    icon: <HelpCircle size={20} />,
    label: '帮助中心',
    desc: '常见问题解答',
    path: '/user/profile',
    tint: 'from-violet-500/20 to-indigo-500/20',
    iconColor: 'text-violet-400',
  },
  {
    icon: <Settings size={20} />,
    label: '设置',
    desc: '账户与隐私设置',
    path: '/user/profile',
    tint: 'from-gray-500/20 to-slate-500/20',
    iconColor: 'text-white/60',
  },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { addToast, currentRole, setRole } = useAppStore();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const users = generateMockUsers(10);
    const mockOrders = generateMockOrders(30, [], users);
    const currentUser = users.find((u) => u.role === currentRole) || users[0];
    setUser(currentUser);
    setOrders(mockOrders.filter((o) => o.userId === currentUser.id));
  }, [currentRole]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'completed').length;
    const totalSpent = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((s, o) => s + o.totalAmount, 0);
    const timeSaved = completedOrders * 32;
    return { totalOrders, completedOrders, totalSpent, timeSaved };
  }, [orders]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoggingOut(false);
    setLogoutModalOpen(false);
    addToast({ type: 'success', message: '已安全退出登录', duration: 2500 });
    setTimeout(() => {
      setRole('user');
      navigate('/user/home');
    }, 800);
  };

  const phoneMasked = user?.phone
    ? `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}`
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen bg-gradient-to-b from-dark via-dark to-dark/95 pb-8"
    >
      <div className="sticky top-0 z-30 bg-dark/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">个人中心</h1>
          <button
            onClick={() => addToast({ type: 'info', message: '设置入口', duration: 1500 })}
            className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl p-6 border border-white/10 shadow-2xl"
          style={{
            background:
              'linear-gradient(135deg, #1E40FF 0%, #312E81 35%, #4C1D95 65%, #701A75 100%)',
          }}
        >
          <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-accent/25 blur-3xl" />
          <div className="absolute -bottom-16 -left-12 w-40 h-40 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.08]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-white/30 to-white/10 p-[3px] backdrop-blur-sm shadow-2xl">
                <div className="w-full h-full rounded-[22px] bg-gradient-to-br from-accent to-rose-500 flex items-center justify-center text-white text-3xl font-black overflow-hidden relative">
                  {user?.nickname?.charAt(0) || 'U'}
                  {user?.avatarUrl && (
                    <img
                      src={user.avatarUrl}
                      alt="avatar"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-2xl bg-accent flex items-center justify-center shadow-xl shadow-accent/40 border-2 border-[#1a1033] text-white hover:scale-105 transition-transform">
                <Camera size={13} />
              </button>
              {user?.isVerified && (
                <div className="absolute -top-1 -left-1 w-8 h-8 rounded-2xl bg-success flex items-center justify-center shadow-xl shadow-success/30 border-2 border-[#1a1033]">
                  <ShieldCheck size={14} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white truncate">
                  {user?.nickname || '闪跑侠用户'}
                </h2>
                {user?.isVerified && (
                  <Badge variant="success">
                    <span className="flex items-center gap-1">
                      <UserCheck size={10} />
                      已实名认证
                    </span>
                  </Badge>
                )}
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-yellow-400 to-amber-500 text-[10px] font-black text-dark">
                  <Crown size={10} />
                  VIP 3
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-white/70 mb-3">
                <Phone size={13} />
                <span className="font-mono">{phoneMasked}</span>
                <button
                  onClick={() => addToast({ type: 'info', message: '编辑资料', duration: 1500 })}
                  className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs transition-colors"
                >
                  <Edit3 size={12} />
                  编辑
                </button>
              </div>

              <div className="flex items-center gap-1 text-xs text-white/50">
                <Sparkles size={12} className="text-yellow-400" />
                <span>距离 VIP 4 还差 128 成长值</span>
                <div className="flex-1 h-1.5 mx-2 rounded-full bg-white/10 overflow-hidden min-w-[80px]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
                    style={{ width: '62%' }}
                  />
                </div>
                <span className="text-yellow-400 font-bold">62%</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            {
              label: '累计下单',
              value: stats.totalOrders,
              unit: '单',
              icon: <Package size={18} />,
              tint: 'from-primary/25 to-violet-500/25',
              accent: 'text-primary',
              ring: 'ring-primary/20',
            },
            {
              label: '节省时间',
              value: stats.timeSaved,
              unit: '分钟',
              icon: <Clock size={18} />,
              tint: 'from-accent/25 to-orange-500/25',
              accent: 'text-accent',
              ring: 'ring-accent/20',
            },
            {
              label: '累计花费',
              value: Math.round(stats.totalSpent),
              unit: '元',
              icon: <Wallet size={18} />,
              tint: 'from-success/25 to-emerald-500/25',
              accent: 'text-success',
              ring: 'ring-success/20',
            },
          ].map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.22 + idx * 0.05 }}
              className="relative rounded-2xl bg-white/5 border border-white/10 p-4 overflow-hidden hover:bg-white/[0.07] transition-colors group"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${s.tint} opacity-0 group-hover:opacity-100 transition-opacity`}
              />
              <div className="relative">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.tint} flex items-center justify-center ring-1 ${s.ring} ${s.accent} mb-3`}>
                  {s.icon}
                </div>
                <div className="flex items-baseline gap-1 mb-0.5">
                  <span className="text-2xl font-black text-white tabular-nums">
                    {s.value}
                  </span>
                  <span className={`text-xs font-semibold ${s.accent}`}>{s.unit}</span>
                </div>
                <div className="text-xs text-white/45">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="rounded-3xl bg-white/5 border border-white/10 p-2 overflow-hidden"
        >
          <div className="grid grid-cols-4 gap-1 p-1">
            {[
              { to: '/user/orders', icon: <Package size={18} />, label: '全部订单', tint: 'text-primary' },
              { to: '/user/wallet', icon: <Wallet size={18} />, label: '我的钱包', tint: 'text-accent' },
              { to: '/user/profile', icon: <Star size={18} />, label: '我的收藏', tint: 'text-yellow-400' },
              { to: '/user/profile', icon: <TicketPercent size={18} />, label: '优惠券', tint: 'text-violet-400' },
            ].map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl hover:bg-white/5 transition-all group"
              >
                <div className={`w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors ${item.tint}`}>
                  {item.icon}
                </div>
                <span className="text-[11px] font-medium text-white/70 group-hover:text-white transition-colors">
                  {item.label}
                </span>
              </NavLink>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.5 }}
          className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">常用功能</h3>
          </div>

          <div className="divide-y divide-white/5">
            {menuItems.map((item, idx) => (
              <NavLink
                key={item.label}
                to={item.path}
                className="group relative flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] transition-colors"
              >
                <div
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.tint} flex items-center justify-center ring-1 ring-white/10 ${item.iconColor} shrink-0`}
                >
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-white text-sm">{item.label}</div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-md bg-danger text-white text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">{item.desc}</div>
                </div>

                <ChevronRight
                  size={16}
                  className="text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all shrink-0"
                />
                <span className="hidden">{idx}</span>
              </NavLink>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => setLogoutModalOpen(true)}
            className="!rounded-2xl !h-12 !border-danger/25 !text-danger hover:!bg-danger/10"
          >
            <LogOut size={18} className="mr-2" />
            退出登录
          </Button>
        </motion.div>

        <div className="text-center pt-2 pb-4">
          <div className="text-xs text-white/25">
            闪跑侠 v1.0.0 · 极速同城配送
          </div>
        </div>
      </div>

      <Modal
        isOpen={logoutModalOpen}
        onClose={() => !loggingOut && setLogoutModalOpen(false)}
        size="sm"
      >
        <div className="text-center py-2 space-y-5">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-danger/15 flex items-center justify-center">
            <LogOut size={28} className="text-danger" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">确认退出登录？</h3>
            <p className="text-sm text-gray-500">
              退出后需要重新登录才能使用完整功能
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => setLogoutModalOpen(false)}
              disabled={loggingOut}
              className="!rounded-xl"
            >
              取消
            </Button>
            <Button
              variant="danger"
              size="lg"
              fullWidth
              onClick={handleLogout}
              loading={loggingOut}
              className="!rounded-xl shadow-lg shadow-danger/25"
            >
              确认退出
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
