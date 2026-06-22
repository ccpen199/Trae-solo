import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  Bike,
  Award,
  CheckCircle2,
  ChevronRight,
  User,
  IdCard,
  Settings,
  LogOut,
  Edit3,
  MessageSquare,
  TrendingUp,
  ThumbsUp,
  ToggleLeft,
  ToggleRight,
  Crown,
  BadgeCheck,
  MapPin,
  Clock,
  MoreHorizontal,
} from 'lucide-react';

import { useAppStore } from '@/stores/appStore';
import { generateMockRiders } from '../../utils/mockData';
import { cn, formatDateTime } from '../../utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { RiderProfile } from '../../types';

interface RiderReview {
  id: string;
  orderId: string;
  userName: string;
  rating: number;
  content: string;
  tags: string[];
  createdAt: Date;
  orderTitle: string;
}

function generateMockReviews(count = 8): RiderReview[] {
  const names = ['小王', '李女士', '张先生', '陈先生', '刘女士', '赵女士', '周先生', '吴女士'];
  const contents = [
    '骑手非常专业，提前到达取货点，配送速度很快，物品完好无损，下次还会选择！',
    '非常准时，下雨天也能按时送到，服务态度很好，沟通顺畅，推荐！',
    '配送过程中会实时沟通位置，非常让人放心，包装也很仔细，五星好评！',
    '骑手小哥人特别好，帮我把东西搬到楼上了，超出预期的服务，点赞！',
    '取货和送达都会电话通知，流程规范，效率很高，非常满意的一次体验。',
    '接单快、配送快，全程不到40分钟就到了，价格也很合理，强烈推荐。',
    '虽然天气不好，但骑手依然准时送到，而且东西完全没淋湿，太靠谱了！',
    '骑手非常有礼貌，沟通非常顺畅，配送的食品还是热的，太惊喜了！',
  ];
  const allTags = ['准时送达', '态度好', '包装完整', '沟通顺畅', '速度快', '服务周到', '物品完好'];

  return Array.from({ length: count }, (_, i) => {
    const rating = 4 + Math.floor(Math.random() * 2);
    const tagCount = 2 + Math.floor(Math.random() * 2);
    const shuffledTags = [...allTags].sort(() => Math.random() - 0.5).slice(0, tagCount);
    const date = new Date(Date.now() - i * 86400000 * (1 + Math.random() * 3));
    return {
      id: `rvw_${Date.now()}_${i}`,
      orderId: `ord_${(1000 + i).toString(36)}`,
      userName: names[i % names.length],
      rating,
      content: contents[i % contents.length],
      tags: shuffledTags,
      createdAt: date,
      orderTitle: ['代买咖啡', '送文件', '代取快递', '送午餐', '买鲜花', '代买药品'][i % 6],
    };
  });
}

function CreditRing({ score, size = 130, stroke = 12 }: { score: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, score / 100));
  const offset = circumference * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="creditGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E40FF" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#00C48C" />
          </linearGradient>
          <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#creditGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          filter="url(#ringGlow)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] text-white/40 mb-0.5">信用分</div>
        <motion.div
          key={score}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-3xl font-black tabular-nums bg-gradient-to-br from-primary via-violet-400 to-success bg-clip-text text-transparent leading-none"
        >
          {score}
        </motion.div>
        <div className="text-[9px] text-white/30 mt-1">满分 100</div>
      </div>
    </div>
  );
}

function RatingStarsRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.floor(rating);
        const half = !filled && i - rating < 1 && i - rating > 0;
        return (
          <Star
            key={i}
            size={size}
            className={cn(filled || half ? 'text-yellow-400' : 'text-white/15')}
            fill={filled ? '#FACC15' : half ? 'url(#halfFill)' : 'transparent'}
          />
        );
      })}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="halfFill">
            <stop offset="50%" stopColor="#FACC15" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function RiderProfilePage() {
  const addToast = useAppStore((s) => s.addToast);
  const setRole = useAppStore((s) => s.setRole);

  const mockRider = useMemo(() => generateMockRiders(1)[0], []);
  const [rider] = useState<RiderProfile>(mockRider);
  const [onlineStatus, setOnlineStatus] = useState(rider.status !== 'offline');
  const reviews = useMemo(() => generateMockReviews(8), []);

  const ratingDistribution = useMemo(() => [
    { star: 5, count: 286, pct: 82 },
    { star: 4, count: 48, pct: 14 },
    { star: 3, count: 10, pct: 3 },
    { star: 2, count: 3, pct: 1 },
    { star: 1, count: 1, pct: 0.3 },
  ], []);

  const settingItems = [
    {
      icon: <User size={18} />,
      label: '个人资料',
      sub: '头像、昵称、联系方式',
      tint: 'from-sky-500 to-blue-500',
      onClick: () => addToast({ type: 'info', message: '打开个人资料设置', duration: 1500 }),
    },
    {
      icon: <IdCard size={18} />,
      label: '身份认证',
      sub: rider.isVerified !== false ? '已完成实名认证' : '待完成实名认证',
      tint: 'from-emerald-500 to-teal-500',
      right: rider.isVerified !== false ? <BadgeCheck size={18} className="text-success" /> : undefined,
      onClick: () => addToast({ type: 'info', message: '打开身份认证', duration: 1500 }),
    },
    {
      icon: <Bike size={18} />,
      label: '车辆信息',
      sub: `${rider.vehicleType} · 沪A****88`,
      tint: 'from-violet-500 to-indigo-500',
      onClick: () => addToast({ type: 'info', message: '打开车辆信息管理', duration: 1500 }),
    },
    {
      icon: <MessageSquare size={18} />,
      label: '意见反馈',
      sub: '问题咨询、建议反馈',
      tint: 'from-orange-500 to-amber-500',
      onClick: () => addToast({ type: 'info', message: '打开意见反馈', duration: 1500 }),
    },
  ];

  const handleLogout = () => {
    addToast({ type: 'info', message: '已退出登录，返回首页', duration: 2000 });
    setOnlineStatus(false);
    setTimeout(() => setRole('user'), 800);
  };

  const renderAvatarCard = () => (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-5">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative">
        <div className="flex items-start gap-4 mb-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-accent p-[3px] shadow-2xl shadow-primary/20">
              <div className="w-full h-full rounded-[14px] bg-dark overflow-hidden flex items-center justify-center">
                <span className="text-3xl font-black bg-gradient-to-br from-primary/60 to-accent/60 bg-clip-text text-transparent">
                  张
                </span>
              </div>
            </div>
            {rider.status === 'idle' && (
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-success flex items-center justify-center border-4 border-dark shadow-lg shadow-success/40">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-xl font-bold truncate">骑手小张</h2>
              <Badge variant="success" className="text-[10px] py-0 px-1.5">
                <ShieldCheck size={10} className="mr-0.5" />
                已认证
              </Badge>
              <Badge variant="warning" className="text-[10px] py-0 px-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30">
                <Crown size={10} className="mr-0.5 text-yellow-400" />
                金牌骑手
              </Badge>
            </div>

            <div className="flex items-center gap-2 mb-2 text-xs text-white/55">
              <div className="flex items-center gap-1">
                <Bike size={12} />
                {rider.vehicleType}
              </div>
              <span>·</span>
              <div className="flex items-center gap-1">
                <MapPin size={12} />
                黄浦区
              </div>
              <span>·</span>
              <div className="flex items-center gap-1">
                <Award size={12} />
                LV.8
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-primary via-violet-400 to-accent" />
              </div>
              <span className="text-[10px] text-white/40 tabular-nums shrink-0">
                1320 / 2000 经验
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/8 p-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
              <Clock size={18} className="text-success" />
            </div>
            <div>
              <div className="text-[11px] text-white/45 mb-0.5">接单状态</div>
              <div className="text-sm font-semibold flex items-center gap-1.5">
                {onlineStatus ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                    </span>
                    <span className="text-success">在线接单中</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-gray-500" />
                    <span className="text-white/50">已下线</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setOnlineStatus((s) => !s)}
            className="transition-transform active:scale-95"
          >
            {onlineStatus ? (
              <ToggleRight size={34} className="text-success" strokeWidth={2.2} />
            ) : (
              <ToggleLeft size={34} className="text-white/25" strokeWidth={2.2} />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderScoreCard = () => (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="px-5 pt-5 pb-4 flex items-center gap-5 border-b border-white/5">
        <CreditRing score={rider.creditScore} />
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-white/40 mb-1">近30天平均评分</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-yellow-400 tabular-nums">{rider.avgRating.toFixed(1)}</span>
                <span className="text-[11px] text-white/35">/ 5.0</span>
              </div>
            </div>
            <RatingStarsRow rating={rider.avgRating} size={13} />
          </div>
          <div className="space-y-1.5">
            {ratingDistribution.map((d) => (
              <div key={d.star} className="flex items-center gap-2">
                <span className="w-4 text-[10px] text-white/45 tabular-nums text-right">{d.star}</span>
                <Star size={10} className="text-yellow-400 shrink-0" fill="#FACC15" />
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-400"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <span className="w-10 text-[10px] text-white/35 tabular-nums text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/5">
        {[
          {
            icon: <CheckCircle2 size={16} />,
            tint: 'text-success',
            label: '履约率',
            value: `${Math.round(rider.fulfillRate * 100)}%`,
            sub: '近30天',
          },
          {
            icon: <Award size={16} />,
            tint: 'text-violet-400',
            label: '完成单数',
            value: rider.completedOrders.toLocaleString(),
            sub: '累计',
          },
          {
            icon: <TrendingUp size={16} />,
            tint: 'text-accent',
            label: '服务时长',
            value: '1,286',
            sub: '小时',
          },
        ].map((stat) => (
          <div key={stat.label} className="px-3 py-4 text-center">
            <div className={cn('inline-flex mb-2', stat.tint)}>{stat.icon}</div>
            <div className="text-[11px] text-white/45 mb-0.5">{stat.label}</div>
            <div className={cn('text-lg font-black tabular-nums', stat.tint)}>{stat.value}</div>
            <div className="text-[9px] text-white/25 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-yellow-500/15 flex items-center justify-center">
            <ThumbsUp size={15} className="text-yellow-400" />
          </div>
          <div>
            <div className="text-sm font-bold">近30天评价</div>
            <div className="text-[11px] text-white/40">共 348 条有效评价</div>
          </div>
        </div>
        <button className="text-[11px] text-primary hover:text-primary/80 font-semibold flex items-center gap-0.5 transition-colors">
          全部
          <ChevronRight size={12} />
        </button>
      </div>

      <div className="divide-y divide-white/5">
        <AnimatePresence>
          {reviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="px-5 py-4 hover:bg-white/[0.015] transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-violet-500/30 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white/85">{review.userName.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white/85 truncate">{review.userName}</div>
                    <div className="text-[10px] text-white/35 flex items-center gap-1.5 mt-0.5">
                      <Badge variant="default" className="bg-white/5 text-white/45 text-[9px] py-0 px-1 border-0">
                        {review.orderTitle}
                      </Badge>
                      <span>·</span>
                      <span className="tabular-nums">{formatDateTime(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <RatingStarsRow rating={review.rating} size={11} />
                </div>
              </div>

              <p className="text-xs text-white/65 leading-relaxed mb-2.5 pl-10.5" style={{ paddingLeft: 42 }}>
                {review.content}
              </p>

              <div className="flex flex-wrap gap-1.5" style={{ paddingLeft: 42 }}>
                {review.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-success/10 text-success border border-success/15"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gray-500/15 flex items-center justify-center">
          <Settings size={15} className="text-white/60" />
        </div>
        <div>
          <div className="text-sm font-bold">设置中心</div>
          <div className="text-[11px] text-white/40">账号、车辆与认证管理</div>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {settingItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="w-full px-5 py-4 flex items-center gap-3.5 hover:bg-white/[0.015] transition-colors text-left"
          >
            <div
              className={cn(
                'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-md shrink-0',
                item.tint,
              )}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">{item.label}</div>
              <div className="text-[11px] text-white/45 truncate">{item.sub}</div>
            </div>
            {item.right}
            <ChevronRight size={16} className="text-white/20 shrink-0" />
          </button>
        ))}

        <div className="p-4">
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={handleLogout}
            className="text-danger hover:text-danger hover:bg-danger/10 border border-white/5"
          >
            <LogOut size={18} />
            退出登录
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="px-4 pt-4 pb-3 space-y-4">
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors shrink-0">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold flex-1">个人中心</h1>
          <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors shrink-0">
            <Edit3 size={16} className="text-white/70" />
          </button>
          <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors shrink-0">
            <MoreHorizontal size={16} className="text-white/70" />
          </button>
        </div>

        {renderAvatarCard()}
        {renderScoreCard()}
        {renderReviews()}
        {renderSettings()}
        <div className="h-8" />
      </div>
    </div>
  );
}
