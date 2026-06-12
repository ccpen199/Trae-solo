import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Star, DollarSign, Zap, TrendingUp, TrendingDown,
  Calendar, MapPin, CheckCircle2, Clock, AlertTriangle,
  Phone, FileText, Award, ChevronRight, Package, Eye,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Progress, Badge as AntBadge, Avatar, Tabs } from 'antd';

const revenueData = [
  { month: '1月', orderIncome: 52000, serviceIncome: 12000 },
  { month: '2月', orderIncome: 48000, serviceIncome: 15000 },
  { month: '3月', orderIncome: 68000, serviceIncome: 18000 },
  { month: '4月', orderIncome: 72000, serviceIncome: 22000 },
  { month: '5月', orderIncome: 78000, serviceIncome: 26000 },
  { month: '6月', orderIncome: 86400, serviceIncome: 30000 },
];

const projects = [
  {
    id: 1,
    name: '阳光花园3栋全屋整装',
    address: '阳光花园·3栋·2301',
    progress: 75,
    status: '进行中',
    manager: '张工',
    days: 60,
    owner: '张女士',
  },
  {
    id: 2,
    name: '滨江壹号大平层装修',
    address: '滨江壹号·5栋·1202',
    progress: 100,
    status: '待验收',
    manager: '李工',
    days: 90,
    owner: '王先生',
  },
  {
    id: 3,
    name: '绿城春江月三居室',
    address: '绿城春江月·7栋·803',
    progress: 35,
    status: '进行中',
    manager: '王工',
    days: 75,
    owner: '李先生',
  },
  {
    id: 4,
    name: '万科城六期精装修',
    address: '万科城六期·2栋·1501',
    progress: 100,
    status: '已完成',
    manager: '张工',
    days: 45,
    owner: '赵女士',
  },
];

const todoItems = [
  {
    id: 1,
    time: '10:30',
    icon: Calendar,
    color: 'amber',
    title: '量房预约确认',
    subtitle: '阳光花园3栋-张女士',
    status: '待处理',
  },
  {
    id: 2,
    time: '14:00',
    icon: Package,
    color: 'haze',
    title: '工地巡检',
    subtitle: '滨江壹号5栋-水电阶段',
    status: '待处理',
  },
  {
    id: 3,
    time: '明日',
    icon: FileText,
    color: 'wood',
    title: '提交方案报价',
    subtitle: '业主王先生-三室两厅',
    status: '待处理',
  },
  {
    id: 4,
    time: '3日内',
    icon: Award,
    color: 'terracotta',
    title: '上传巡检报告',
    subtitle: '本周共3份待上传',
    status: '待处理',
  },
  {
    id: 5,
    time: '7日内',
    icon: AlertTriangle,
    color: 'rose',
    title: '到期合同续签提醒',
    subtitle: '阳光花园项目合同到期',
    status: '警告',
  },
  {
    id: 6,
    time: '本月底',
    icon: CheckCircle2,
    color: 'emerald',
    title: '资质年审提醒',
    subtitle: '建筑业企业资质年审',
    status: '待准备',
  },
];

const orderActivities = [
  { id: 1, time: '09:42', content: '新订单：绿城春江月·业主李先生预约量房', type: 'new' },
  { id: 2, time: '09:28', content: '订单已完成：万科城六期2栋·业主确认验收', type: 'complete' },
  { id: 3, time: '08:55', content: '业主评价：滨江壹号·王先生五星好评', type: 'review' },
  { id: 4, time: '昨日 18:30', content: '新订单：阳光花园·张女士提交方案需求', type: 'new' },
  { id: 5, time: '昨日 16:12', content: '报价已确认：江南府·刘女士确认18.6万报价', type: 'quote' },
  { id: 6, time: '昨日 14:05', content: '施工预警：春风十里3栋·泥瓦阶段延期2天', type: 'warning' },
  { id: 7, time: '昨日 10:20', content: '新订单：保利时光印象·业主预约周末量房', type: 'new' },
  { id: 8, time: '昨日 09:00', content: '合同签署：紫金台·赵女士签署正式装修合同', type: 'contract' },
];

const colorMap: Record<string, string> = {
  amber: 'text-amber-600 bg-amber-50 border-amber-200',
  haze: 'text-haze-600 bg-haze-50 border-haze-200',
  wood: 'text-wood-600 bg-wood-50 border-wood-200',
  terracotta: 'text-terracotta-600 bg-terracotta-50 border-terracotta-200',
  rose: 'text-rose-600 bg-rose-50 border-rose-200',
  emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
};

const iconBgMap: Record<string, string> = {
  amber: 'bg-gradient-to-br from-amber-400 to-amber-500',
  haze: 'bg-gradient-to-br from-haze-400 to-haze-500',
  wood: 'bg-gradient-to-br from-wood-400 to-wood-500',
  terracotta: 'bg-gradient-to-br from-terracotta-400 to-terracotta-500',
  rose: 'bg-gradient-to-br from-rose-400 to-rose-500',
  emerald: 'bg-gradient-to-br from-emerald-400 to-emerald-500',
};

const StatCard = ({
  icon: Icon,
  title,
  value,
  suffix,
  trend,
  trendValue,
  gradient,
  iconBg,
  extra,
}: {
  icon: typeof BarChart3;
  title: string;
  value: string | number;
  suffix?: string;
  trend: 'up' | 'down';
  trendValue: string;
  gradient: string;
  iconBg: string;
  extra?: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`relative overflow-hidden rounded-2xl p-6 ${gradient} shadow-card border border-white/40`}
  >
    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <p className="text-white/80 text-sm font-medium mb-3">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-4xl font-bold text-white">{value}</span>
          {suffix && <span className="text-white/80 text-lg">{suffix}</span>}
        </div>
        <div className="mt-3 flex items-center gap-2">
          {trend === 'up' ? (
            <span className="inline-flex items-center gap-1 text-white/90 text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
              <TrendingUp className="w-3 h-3" />
              +{trendValue}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-white/90 text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
              <TrendingDown className="w-3 h-3" />
              -{trendValue}
            </span>
          )}
          {extra}
        </div>
      </div>
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/30`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

const ProviderWorkspace = () => {
  const [activeTab, setActiveTab] = useState('activities');

  useEffect(() => {
    const el = document.getElementById('activity-scroll');
    if (el) {
      let pos = 0;
      const interval = setInterval(() => {
        pos += 0.5;
        if (pos >= el.scrollHeight / 2) pos = 0;
        el.scrollTop = pos;
      }, 60);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="section-title">服务商工作台</h1>
        <p className="text-ivory-600">今日预约 4 单 · 活跃工地 12 个 · 待办事项 6 项</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={BarChart3}
          title="本月订单数"
          value="32"
          suffix="单"
          trend="up"
          trendValue="12.5%"
          gradient="bg-gradient-to-br from-wood-400 via-wood-500 to-wood-600"
          iconBg="bg-white/25"
        />
        <StatCard
          icon={Star}
          title="综合评分"
          value="4.86"
          suffix="分"
          trend="up"
          trendValue="0.05"
          gradient="bg-gradient-to-br from-haze-400 via-haze-500 to-haze-600"
          iconBg="bg-white/25"
          extra={<span className="text-white/70 text-xs">近30天</span>}
        />
        <StatCard
          icon={DollarSign}
          title="本月收入"
          value="¥86.4"
          suffix="万"
          trend="up"
          trendValue="8.3%"
          gradient="bg-gradient-to-br from-terracotta-400 via-terracotta-500 to-terracotta-600"
          iconBg="bg-white/25"
        />
        <StatCard
          icon={Zap}
          title="完成率"
          value="97.2"
          suffix="%"
          trend="up"
          trendValue="1.2%"
          gradient="bg-gradient-to-br from-ivory-500 via-ivory-600 to-ivory-700"
          iconBg="bg-white/25"
          extra={
            <span className="inline-flex items-center gap-1 text-rose-100 text-xs bg-rose-500/30 px-2 py-1 rounded-full backdrop-blur-sm">
              <AlertTriangle className="w-3 h-3" />
              2个逾期
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-12 gap-5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="col-span-12 lg:col-span-4 card-base p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-serif text-lg text-carbon-800">收入趋势</h3>
            <div className="flex gap-2 text-xs">
              <button className="px-3 py-1 rounded-full bg-wood-100 text-wood-700 border border-wood-200">近6个月</button>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrder" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C4623A" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#C4623A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorService" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6B8E9F" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6B8E9F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DD" vertical={false} />
                <XAxis dataKey="month" stroke="#9A9489" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="#9A9489" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 10000}万`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E8E4DD',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    fontSize: '13px',
                  }}
                  formatter={(value: number, name: string) => [
                    <span className="font-mono">¥{(value / 10000).toFixed(1)}万</span>,
                    name === 'orderIncome' ? '订单收入' : '增值服务收入',
                  ]}
                />
                <Legend
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-carbon-600 text-xs">
                      {value === 'orderIncome' ? '订单收入' : '增值服务收入'}
                    </span>
                  )}
                />
                <Area type="monotone" dataKey="orderIncome" stroke="#C4623A" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOrder)" />
                <Area type="monotone" dataKey="serviceIncome" stroke="#6B8E9F" strokeWidth={2.5} fillOpacity={1} fill="url(#colorService)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="col-span-12 lg:col-span-4 card-base p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-serif text-lg text-carbon-800">项目进度看板</h3>
            <button className="text-sm text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1">
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4 max-h-[420px] overflow-y-auto scrollbar-thin pr-2">
            {projects.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="p-4 rounded-xl bg-ivory-50/60 border border-ivory-200/70 hover:bg-ivory-100/60 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-carbon-800 text-sm truncate">{p.name}</h4>
                    <p className="text-xs text-ivory-600 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {p.address}
                    </p>
                  </div>
                  <AntBadge
                    color={p.status === '进行中' ? 'blue' : p.status === '待验收' ? 'orange' : 'green'}
                    text={
                      <span className={`text-xs ${
                        p.status === '进行中' ? 'text-haze-700' : p.status === '待验收' ? 'text-amber-700' : 'text-emerald-700'
                      }`}>
                        {p.status}
                      </span>
                    }
                  />
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-ivory-600">施工进度</span>
                    <span className="font-mono font-semibold text-carbon-700">{p.progress}%</span>
                  </div>
                  <Progress
                    percent={p.progress}
                    showInfo={false}
                    size="small"
                    strokeColor={
                      p.status === '已完成'
                        ? '#10B981'
                        : p.status === '待验收'
                        ? '#F59E0B'
                        : '#C4623A'
                    }
                    trailColor="#E8E4DD"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-ivory-600">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Avatar size={16} className="!bg-wood-400 !text-white !text-[10px]">
                        {p.manager[0]}
                      </Avatar>
                      {p.manager}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      工期{p.days}天
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="col-span-12 lg:col-span-4 card-base p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-serif text-lg text-carbon-800">待办任务</h3>
            <span className="badge-terracotta">6 项待办</span>
          </div>
          <div className="relative">
            <div className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-wood-300 via-haze-300 to-terracotta-300" />
            <div className="space-y-5 max-h-[420px] overflow-y-auto scrollbar-thin pr-2">
              {todoItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.08 }}
                    className="relative flex gap-4"
                  >
                    <div className={`relative z-10 w-12 h-12 rounded-xl ${iconBgMap[item.color]} flex items-center justify-center flex-shrink-0 shadow-md border border-white/30`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 pb-5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-medium text-carbon-500">{item.time}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${colorMap[item.color]}`}>
                          {item.status}
                        </span>
                      </div>
                      <h4 className="font-medium text-carbon-800 text-sm mt-1">{item.title}</h4>
                      <p className="text-xs text-ivory-600 mt-0.5">{item.subtitle}</p>
                      <div className="mt-2 flex gap-2">
                        <button className="text-[11px] px-3 py-1 rounded-md bg-terracotta-50 text-terracotta-600 border border-terracotta-200 hover:bg-terracotta-100 transition-colors">
                          立即处理
                        </button>
                        <button className="text-[11px] px-3 py-1 rounded-md bg-white text-carbon-600 border border-ivory-300 hover:bg-ivory-100 transition-colors">
                          稍后
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="card-base overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="!px-6 !pt-4"
          items={[
            {
              key: 'activities',
              label: (
                <span className="flex items-center gap-2 py-1">
                  <Eye className="w-4 h-4" />
                  最新订单动态
                </span>
              ),
            },
          ]}
        />
        <div className="px-6 pb-6">
          <div
            id="activity-scroll"
            className="h-64 overflow-y-auto scrollbar-thin relative mask-fade-b"
          >
            <div className="space-y-2 py-1">
              {[...orderActivities, ...orderActivities].map((item, idx) => (
                <motion.div
                  key={`${item.id}-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-ivory-50/80 transition-colors group"
                >
                  <span className="font-mono text-xs text-ivory-500 w-24 flex-shrink-0">{item.time}</span>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.type === 'new' ? 'bg-terracotta-500'
                    : item.type === 'complete' ? 'bg-emerald-500'
                    : item.type === 'review' ? 'bg-wood-500'
                    : item.type === 'warning' ? 'bg-amber-500'
                    : 'bg-haze-500'
                  }`} />
                  <p className="text-sm text-carbon-700 flex-1 group-hover:text-carbon-800 transition-colors">
                    {item.content}
                  </p>
                  {item.type === 'new' && (
                    <span className="badge-terracotta flex-shrink-0">新订单</span>
                  )}
                  {item.type === 'warning' && (
                    <span className="badge-warning flex-shrink-0">预警</span>
                  )}
                  {item.type === 'complete' && (
                    <span className="badge-success flex-shrink-0">已完成</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderWorkspace;
