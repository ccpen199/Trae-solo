import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  TrendingUp,
  Store,
  Users,
  Star,
  AlertTriangle,
  Clock,
  Package,
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Hammer,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import { Card, Progress } from 'antd';

const monthlyData = [
  { month: '7月', amount: 1850, projects: 89 },
  { month: '8月', amount: 2120, projects: 102 },
  { month: '9月', amount: 1980, projects: 95 },
  { month: '10月', amount: 2450, projects: 118 },
  { month: '11月', amount: 2680, projects: 131 },
  { month: '12月', amount: 2890, projects: 142 },
  { month: '1月', amount: 2560, projects: 125 },
  { month: '2月', amount: 1780, projects: 87 },
  { month: '3月', amount: 3010, projects: 148 },
  { month: '4月', amount: 3240, projects: 159 },
  { month: '5月', amount: 3180, projects: 156 },
  { month: '6月', amount: 3260, projects: 162 },
];

const projectPhaseData = [
  { name: '规划中', value: 245, color: '#6B8E9F' },
  { name: '拆改阶段', value: 186, color: '#CBA356' },
  { name: '水电阶段', value: 298, color: '#9CB8C2' },
  { name: '泥瓦阶段', value: 312, color: '#DBBF85' },
  { name: '木工阶段', value: 178, color: '#7A9CA9' },
  { name: '油漆阶段', value: 134, color: '#DE8F69' },
  { name: '安装阶段', value: 189, color: '#B88537' },
  { name: '竣工交付', value: 412, color: '#6B5010' },
];

const cityRankData = [
  { city: '上海', count: 568 },
  { city: '北京', count: 489 },
  { city: '深圳', count: 412 },
  { city: '广州', count: 378 },
  { city: '杭州', count: 324 },
  { city: '成都', count: 289 },
  { city: '南京', count: 256 },
  { city: '武汉', count: 218 },
  { city: '苏州', count: 198 },
  { city: '西安', count: 167 },
];

const activityStream = [
  { time: '14:32', type: 'order', icon: FileText, title: '新订单提交', desc: '张先生 138㎡ 三室两厅', color: 'bg-terracotta-100 text-terracotta-600' },
  { time: '14:28', type: 'audit', icon: CheckCircle2, title: '资质审核通过', desc: '筑美装饰', color: 'bg-emerald-100 text-emerald-600' },
  { time: '14:15', type: 'complaint', icon: AlertCircle, title: '业主发起投诉工单', desc: '#20240612-0037', color: 'bg-rose-100 text-rose-600' },
  { time: '14:02', type: 'complete', icon: CheckCircle2, title: '竣工完成', desc: '和谐家园项目 🎉', color: 'bg-emerald-100 text-emerald-600' },
  { time: '13:58', type: 'warning', icon: Package, title: '库存预警', desc: '地板SKU-2048低于安全值', color: 'bg-amber-100 text-amber-600' },
  { time: '13:45', type: 'arbitration', icon: Hammer, title: '专家仲裁完成', desc: '业主获赔¥8,600', color: 'bg-haze-100 text-haze-600' },
];

const KPICard: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  subInfo: string;
  gradient: string;
  trend?: { value: string; positive: boolean };
}> = ({ icon: Icon, title, value, subInfo, gradient, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`relative overflow-hidden rounded-card p-5 shadow-card ${gradient} text-white`}
  >
    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-16" />
    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trend.positive ? 'bg-white/20' : 'bg-white/10'}`}>
            <TrendingUp className={`w-3 h-3 ${!trend.positive && 'rotate-180'}`} />
            <span>{trend.value}</span>
          </div>
        )}
      </div>
      <p className="text-white/80 text-sm mb-1">{title}</p>
      <p className="font-mono text-3xl font-bold mb-2 tracking-tight">{value}</p>
      <p className="text-white/70 text-xs">{subInfo}</p>
    </div>
  </motion.div>
);

const AdminDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-carbon-800">运营数据总览</h1>
          <p className="text-sm text-ivory-600 mt-1">实时监控平台核心指标 · {currentTime}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary text-sm">
            <Clock className="w-4 h-4" />
            今日
          </button>
          <button className="btn-secondary text-sm">本周</button>
          <button className="btn-primary text-sm">本月</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          icon={Building2}
          title="总项目数"
          value="1,247"
          subInfo="进行中328 · 本月新增46"
          gradient="bg-gradient-to-br from-wood-400 to-wood-600"
        />
        <KPICard
          icon={TrendingUp}
          title="平台交易额"
          value="¥2.84亿"
          subInfo="本月¥3,260万"
          gradient="bg-gradient-to-br from-terracotta-400 to-terracotta-600"
          trend={{ value: '+12.4%', positive: true }}
        />
        <KPICard
          icon={Store}
          title="入驻服务商"
          value="3,521"
          subInfo="本月新增42 · 待审核18"
          gradient="bg-gradient-to-br from-haze-400 to-haze-600"
        />
        <KPICard
          icon={Users}
          title="业主用户"
          value="18.6万"
          subInfo="本月新增2,847"
          gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
        />
        <KPICard
          icon={Star}
          title="满意度"
          value="98.6%"
          subInfo="近30天统计"
          gradient="bg-gradient-to-br from-amber-400 to-amber-600"
          trend={{ value: '+0.3%', positive: true }}
        />
        <KPICard
          icon={AlertTriangle}
          title="待处理纠纷"
          value="7"
          subInfo="紧急2 · 高优先级"
          gradient="bg-gradient-to-br from-rose-400 to-rose-600"
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5">
          <Card className="!rounded-card !shadow-card !border-ivory-200 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-carbon-800">交易趋势分析</h3>
                <p className="text-xs text-ivory-500">近12个月交易额与项目数对比</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-terracotta-400" />
                  <span className="text-ivory-600">交易额(万)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-haze-500" />
                  <span className="text-ivory-600">项目数</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DD" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#757064' }} axisLine={{ stroke: '#E8E4DD' }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#757064' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#757064' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E8E4DD',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(61, 58, 53, 0.12)',
                  }}
                  labelStyle={{ fontWeight: 600, color: '#2B2824' }}
                />
                <Bar yAxisId="left" dataKey="amount" radius={[6, 6, 0, 0]} barSize={24}>
                  {monthlyData.map((_, index) => (
                    <defs key={index}>
                      <linearGradient id={`barGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D47042" />
                        <stop offset="100%" stopColor="#C4623A" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="projects" stroke="#6B8E9F" strokeWidth={3} dot={{ r: 4, fill: '#6B8E9F', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="!rounded-card !shadow-card !border-ivory-200">
            <div className="mb-4">
              <h3 className="font-serif text-lg font-semibold text-carbon-800">各阶段项目分布</h3>
              <p className="text-xs text-ivory-500">当前进行中项目各阶段占比</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={projectPhaseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {projectPhaseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {projectPhaseData.slice(0, 4).map((item) => (
                <div key={item.name} className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] text-ivory-600">{item.name}</span>
                  </div>
                  <p className="font-mono text-sm font-semibold text-carbon-700">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="!rounded-card !shadow-card !border-ivory-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-carbon-800">服务商城市分布 TOP10</h3>
                <p className="text-xs text-ivory-500">按入驻服务商数量排序</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cityRankData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DD" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#757064' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="city" tick={{ fontSize: 11, fill: '#757064' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E8E4DD',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={12}>
                  {cityRankData.map((_, index) => (
                    <defs key={index}>
                      <linearGradient id={`cityGradient${index}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#9CB8C2" />
                        <stop offset="100%" stopColor="#6B8E9F" />
                      </linearGradient>
                    </defs>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-3">
          <Card className="!rounded-card !shadow-card !border-ivory-200 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-carbon-800">实时监控流</h3>
                <p className="text-xs text-ivory-500">平台关键事件动态</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-600 font-medium">实时</span>
              </div>
            </div>
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
              {activityStream.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="relative pl-8 pb-4 border-l-2 border-ivory-200 last:border-l-0 last:pb-0"
                  >
                    <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full ${item.color} flex items-center justify-center ring-4 ring-white`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-carbon-800">{item.title}</span>
                      <span className="text-[10px] font-mono text-ivory-500">{item.time}</span>
                    </div>
                    <p className="text-xs text-ivory-600">{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>
            <button className="w-full mt-4 py-2 text-sm text-terracotta-600 font-medium hover:bg-terracotta-50 rounded-btn transition-colors flex items-center justify-center gap-1">
              查看全部动态 <ChevronRight className="w-4 h-4" />
            </button>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-card p-6 bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200/60 shadow-card"
        >
          <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-rose-500/70" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-rose-700 font-medium">延期项目预警</p>
              <p className="text-xs text-rose-600/70">超过计划工期3天以上</p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-5xl font-bold text-rose-600 leading-none">12</p>
              <p className="text-sm text-rose-700 mt-2">个项目需要介入</p>
            </div>
            <button className="flex items-center gap-1 px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors shadow-sm">
              立即处理 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-5 pt-4 border-t border-rose-200/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-600">紧急延期</span>
              <span className="font-mono font-semibold text-rose-700">3 个</span>
            </div>
            <Progress percent={25} showInfo={false} strokeColor="#F43F5E" trailColor="#FECDD3" size="small" className="mt-2" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-card p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/60 shadow-card"
        >
          <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Package className="w-8 h-8 text-amber-500/70" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-amber-700 font-medium">库存不足SKU</p>
              <p className="text-xs text-amber-600/70">低于安全库存阈值</p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-5xl font-bold text-amber-600 leading-none">28</p>
              <p className="text-sm text-amber-700 mt-2">项需要补货</p>
            </div>
            <button className="flex items-center gap-1 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm">
              补货通知 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-5 pt-4 border-t border-amber-200/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-600">缺货级别</span>
              <span className="font-mono font-semibold text-amber-700">严重 8 / 一般 20</span>
            </div>
            <Progress percent={28.6} showInfo={false} strokeColor="#F59E0B" trailColor="#FDE68A" size="small" className="mt-2" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-card p-6 bg-gradient-to-br from-haze-50 to-haze-100/50 border border-haze-200/60 shadow-card"
        >
          <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-haze-500/10 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-haze-500/70" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-haze-500 text-white flex items-center justify-center shadow-lg shadow-haze-500/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-haze-700 font-medium">待回复咨询</p>
              <p className="text-xs text-haze-600/70">业主在线咨询未回复</p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-5xl font-bold text-haze-600 leading-none">56</p>
              <p className="text-sm text-haze-700 mt-2">条等待响应</p>
            </div>
            <button className="flex items-center gap-1 px-4 py-2 rounded-lg bg-haze-500 text-white text-sm font-medium hover:bg-haze-600 transition-colors shadow-sm">
              分配处理 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-5 pt-4 border-t border-haze-200/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-haze-600">响应及时率</span>
              <span className="font-mono font-semibold text-haze-700">92.4%</span>
            </div>
            <Progress percent={92.4} showInfo={false} strokeColor="#6B8E9F" trailColor="#C3D3D9" size="small" className="mt-2" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
