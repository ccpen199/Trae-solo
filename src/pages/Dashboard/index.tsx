import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import {
  Building2,
  Hammer,
  FileText,
  TrendingUp,
  PlusCircle,
  ClipboardList,
  ListTodo,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  CalendarDays,
  Ruler,
  Banknote,
  Palette,
  Calendar,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

type KPICardProps = {
  icon: LucideIcon;
  label: string;
  value: number;
  unit?: string;
  trend: number;
  delay: number;
};

function KPICard({ icon: Icon, label, value, unit, trend, delay }: KPICardProps) {
  const isUp = trend >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl p-6 shadow-card bg-primary-gradient"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600" />
      <div className="absolute right-0 top-0 h-40 w-40 -translate-y-20 translate-x-20 rounded-full bg-gold-400/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-32 w-32 translate-x-10 translate-y-16 rounded-full bg-gold-300/5 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <Icon className="h-5 w-5 text-gold-300" />
          </div>
          <span
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${
              isUp
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-red-500/20 text-red-300'
            }`}
          >
            <TrendingUp
              className={`h-3 w-3 ${isUp ? '' : 'rotate-180'}`}
            />
            {isUp ? '+' : ''}
            {trend}%
          </span>
        </div>

        <div className="mt-5">
          <p className="text-sm text-white/60">{label}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gold-200 via-gold-300 to-gold-400 bg-clip-text text-transparent shadow-gold-glow">
              {value.toLocaleString('zh-CN')}
            </span>
            {unit && (
              <span className="text-base font-semibold text-gold-300/80">
                {unit}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

type QuickActionProps = {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
  onClick?: () => void;
};

function QuickAction({ icon: Icon, title, desc, color, onClick }: QuickActionProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 4, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      className="group flex w-full items-center gap-4 rounded-xl border border-neutral-100 p-4 text-left transition-all hover:border-primary-200 hover:shadow-card"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md transition-transform group-hover:scale-110`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-primary-900">{title}</p>
        <p className="mt-0.5 text-xs text-neutral-500">{desc}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-neutral-300 transition-all group-hover:translate-x-1 group-hover:text-primary-500" />
    </motion.button>
  );
}

type WorkOrder = {
  id: string;
  title: string;
  type: string;
  status: 'processing' | 'pending' | 'completed';
  assignee: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
};

const workOrders: WorkOrder[] = [
  {
    id: 'WO-2026-0612-001',
    title: '万达广场A座装修方案确认',
    type: '方案确认',
    status: 'processing',
    assignee: '张伟',
    deadline: '2026-06-14',
    priority: 'high',
  },
  {
    id: 'WO-2026-0612-002',
    title: 'CBD核心区隐蔽工程验收',
    type: '工程验收',
    status: 'pending',
    assignee: '李娜',
    deadline: '2026-06-15',
    priority: 'high',
  },
  {
    id: 'WO-2026-0611-003',
    title: '科技园B栋材料采购',
    type: '采购申请',
    status: 'completed',
    assignee: '王强',
    deadline: '2026-06-13',
    priority: 'medium',
  },
  {
    id: 'WO-2026-0611-004',
    title: '金融街写字楼消防报审',
    type: '手续办理',
    status: 'processing',
    assignee: '刘洋',
    deadline: '2026-06-18',
    priority: 'medium',
  },
  {
    id: 'WO-2026-0610-005',
    title: '创意园3号楼施工交底',
    type: '施工交底',
    status: 'pending',
    assignee: '陈静',
    deadline: '2026-06-16',
    priority: 'low',
  },
];

const statusMap = {
  processing: { label: '进行中', color: 'bg-blue-100 text-blue-700' },
  pending: { label: '待处理', color: 'bg-amber-100 text-amber-700' },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
};

const priorityMap = {
  high: { label: '高', color: 'bg-red-100 text-red-700' },
  medium: { label: '中', color: 'bg-amber-100 text-amber-700' },
  low: { label: '低', color: 'bg-gray-100 text-gray-700' },
};

function Dashboard() {
  const navigate = useNavigate();
  const heatmapOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      legend: { data: ['浏览量', '咨询量'], top: 0, right: 0 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { color: '#64748B' },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#F1F5F9' } },
        axisLabel: { color: '#64748B' },
      },
      series: [
        {
          name: '浏览量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: { color: '#2E4A80' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(46, 74, 128, 0.4)' },
                { offset: 1, color: 'rgba(46, 74, 128, 0.05)' },
              ],
            },
          },
          data: [820, 932, 901, 934, 1290, 1330, 1520],
        },
        {
          name: '咨询量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: { color: '#D4A853' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(212, 168, 83, 0.4)' },
                { offset: 1, color: 'rgba(212, 168, 83, 0.05)' },
              ],
            },
          },
          data: [220, 282, 301, 334, 390, 530, 720],
        },
      ],
    }),
    [],
  );

  const barOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: ['量房', '方案设计', '方案确认', '材料采购', '主体施工', '隐蔽工程', '竣工验收'],
        axisLabel: { interval: 0, rotate: 0, color: '#64748B', fontSize: 12 },
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '天数',
        nameTextStyle: { color: '#64748B', fontSize: 12 },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
        axisLabel: { color: '#64748B' },
      },
      series: [
        {
          type: 'bar',
          barWidth: '50%',
          data: [
            { value: 2, itemStyle: { color: '#1E3A5F' } },
            { value: 7, itemStyle: { color: '#2E4A80' } },
            { value: 3, itemStyle: { color: '#3D5D97' } },
            { value: 5, itemStyle: { color: '#5A78A8' } },
            { value: 25, itemStyle: { color: '#D4A853' } },
            { value: 2, itemStyle: { color: '#B88F3E' } },
            { value: 3, itemStyle: { color: '#9A7431' } },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.15)',
            },
          },
        },
      ],
    }),
    [],
  );

  const pieOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '2%',
        top: 'center',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { color: '#475569', fontSize: 13 },
      },
      series: [
        {
          name: '匹配成功率',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false, position: 'center' },
          emphasis: {
            label: {
              show: true,
              fontSize: 18,
              fontWeight: 'bold',
              formatter: '{d}%',
              color: '#1E3A5F',
            },
            scaleSize: 6,
          },
          labelLine: { show: false },
          data: [
            {
              value: 108,
              name: '完美匹配',
              itemStyle: { color: '#1E3A5F' },
            },
            {
              value: 62,
              name: '条件匹配',
              itemStyle: { color: '#D4A853' },
            },
            {
              value: 30,
              name: '部分匹配',
              itemStyle: { color: '#5A78A8' },
            },
            {
              value: 15,
              name: '未匹配',
              itemStyle: { color: '#94A3B8' },
            },
          ],
        },
      ],
    }),
    [],
  );

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-primary-900">工作台</h1>
            <p className="mt-1 text-sm text-neutral-500">
              欢迎回来，今天是
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={Building2}
            label="房源总数"
            value={128}
            trend={+12.5}
            delay={0}
          />
          <KPICard
            icon={Hammer}
            label="在装修项目"
            value={47}
            trend={+8.3}
            delay={0.1}
          />
          <KPICard
            icon={FileText}
            label="待签合同"
            value={23}
            trend={-3.2}
            delay={0.2}
          />
          <KPICard
            icon={TrendingUp}
            label="本月营收"
            value={368.5}
            unit="万"
            trend={+24.7}
            delay={0.3}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl bg-white p-6 shadow-card lg:col-span-2"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-primary-900">
                房源热度趋势
              </h3>
              <span className="text-xs text-neutral-400">近7天</span>
            </div>
            <ReactECharts option={heatmapOption} style={{ height: 280 }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="rounded-2xl bg-white p-6 shadow-card"
          >
            <h3 className="mb-4 text-base font-semibold text-primary-900">
              匹配成功率
            </h3>
            <ReactECharts option={pieOption} style={{ height: 280 }} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-2xl bg-white p-6 shadow-card"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-primary-900">
              装修环节平均耗时
            </h3>
            <span className="text-xs text-neutral-400">单位：天</span>
          </div>
          <ReactECharts option={barOption} style={{ height: 260 }} />
        </motion.div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="space-y-4 rounded-2xl bg-white p-6 shadow-card lg:col-span-1"
          >
            <h3 className="text-base font-semibold text-primary-900">快捷操作</h3>
            <div className="space-y-3">
              <QuickAction
                icon={PlusCircle}
                title="发布房源"
                desc="新增房源信息上线"
                color="from-primary-700 to-primary-500"
                onClick={() => navigate('/properties/publish')}
              />
              <QuickAction
                icon={ClipboardList}
                title="发起工单"
                desc="创建新的工作流程"
                color="from-gold-600 to-gold-400"
                onClick={() => navigate('/orders/create')}
              />
              <QuickAction
                icon={ListTodo}
                title="查看待办"
                desc="处理待办事项清单"
                color="from-emerald-600 to-emerald-400"
                onClick={() => navigate('/orders')}
              />
            </div>

            <div className="pt-4 border-t border-neutral-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-primary-900">快速需求诊断</h4>
                <span className="text-[11px] text-neutral-400">热门房源</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate('/orders/create?propertyId=prop-001')}
                  className="group p-3 rounded-xl bg-gradient-to-br from-primary-50 to-white border border-primary-100 hover:border-gold-400/60 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center gap-1.5 text-xs text-gold-600 font-medium mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    环球金融中心
                  </div>
                  <p className="text-[11px] text-neutral-500">T3 座 28 层 · 586㎡</p>
                  <p className="text-[11px] text-primary-600 mt-1.5 group-hover:text-gold-600 font-medium">
                    一键发起装修 →
                  </p>
                </button>
                <button
                  onClick={() => navigate('/orders/create?propertyId=prop-002')}
                  className="group p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 hover:border-gold-400/60 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    虹桥万科中心
                  </div>
                  <p className="text-[11px] text-neutral-500">12 层 · 320㎡</p>
                  <p className="text-[11px] text-emerald-600 mt-1.5 group-hover:text-gold-600 font-medium">
                    一键发起装修 →
                  </p>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100">
              <h4 className="text-sm font-medium text-primary-900 mb-3">装修快速入口</h4>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => navigate('/orders/create')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-neutral-50 hover:bg-gold-50 border border-transparent hover:border-gold-300/50 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <Ruler className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[11px] text-neutral-600 font-medium">面积测算</span>
                </button>
                <button
                  onClick={() => navigate('/orders/create')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-neutral-50 hover:bg-gold-50 border border-transparent hover:border-gold-300/50 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <Banknote className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[11px] text-neutral-600 font-medium">预算估算</span>
                </button>
                <button
                  onClick={() => navigate('/orders/create')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-neutral-50 hover:bg-gold-50 border border-transparent hover:border-gold-300/50 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[11px] text-neutral-600 font-medium">工期规划</span>
                </button>
                <button
                  onClick={() => navigate('/matching')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-neutral-50 hover:bg-gold-50 border border-transparent hover:border-gold-300/50 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-rose-400 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <Palette className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[11px] text-neutral-600 font-medium">风格偏好</span>
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="rounded-2xl bg-white p-6 shadow-card lg:col-span-2"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-primary-900">最近工单</h3>
              <button
                onClick={() => navigate('/orders')}
                className="flex items-center gap-1 text-sm text-primary-600 transition-colors hover:text-primary-700"
              >
                查看全部
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {workOrders.map((order, idx) => {
                const StatusIcon =
                  order.status === 'completed'
                    ? CheckCircle2
                    : order.status === 'processing'
                      ? Clock
                      : AlertCircle;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.85 + idx * 0.05 }}
                    className="group flex items-center gap-4 rounded-xl border border-neutral-100 p-4 transition-all hover:border-primary-200 hover:bg-primary-50/50 hover:shadow-card"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        order.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600'
                          : order.status === 'processing'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-primary-900">
                          {order.title}
                        </p>
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                            priorityMap[order.priority].color
                          }`}
                        >
                          {priorityMap[order.priority].label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                        <span>{order.id}</span>
                        <span className="rounded-md bg-neutral-100 px-2 py-0.5">
                          {order.type}
                        </span>
                      </div>
                    </div>
                    <div className="hidden shrink-0 text-right md:block">
                      <span
                        className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${
                          statusMap[order.status].color
                        }`}
                      >
                        {statusMap[order.status].label}
                      </span>
                      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-neutral-400">
                        <User className="h-3 w-3" />
                        <span>{order.assignee}</span>
                        <span className="mx-1">·</span>
                        <CalendarDays className="h-3 w-3" />
                        <span>{order.deadline}</span>
                      </div>
                    </div>
                    <div className="hidden lg:flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => navigate(`/orders/${order.id}#material`)}
                        className="px-2.5 py-1.5 text-[11px] rounded-md bg-neutral-100 text-neutral-600 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                      >
                        材料进场
                      </button>
                      <button
                        onClick={() => navigate(`/orders/${order.id}#acceptance`)}
                        className="px-2.5 py-1.5 text-[11px] rounded-md bg-neutral-100 text-neutral-600 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                      >
                        竣工验收
                      </button>
                      <button
                        onClick={() => navigate(`/orders/${order.id}#bim`)}
                        className="px-2.5 py-1.5 text-[11px] rounded-md bg-neutral-100 text-neutral-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      >
                        BIM
                      </button>
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="ml-2 px-3 py-1.5 text-[11px] rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                      >
                        详情
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
