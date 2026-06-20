import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Clock,
  ShoppingCart,
  Users,
  AlertTriangle,
  Calendar,
  Activity,
  ChevronRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { SlaCountdown } from '@/components/common/SlaCountdown';
import { StatusBadge } from '@/components/common/StatusBadge';
import { HeatmapChart } from '@/components/business/HeatmapChart';
import { useUserStore } from '@/store/userStore';
import { WORK_ORDER_TYPE } from '@/constants/enums';
import { cn } from '@/lib/utils';
import {
  workOrderTrendData,
  workOrderTypeData,
  slaWarningOrders,
  hotActivities,
  topProducts,
  heatmapData,
} from '@/mocks/data/dashboard';
import type { WorkOrder, Activity as ActivityEntity, Product, WorkOrderStatus } from '@/types/entity';

function convertWorkOrderStatus(status: WorkOrderStatus): 'pending' | 'assigned' | 'processing' | 'completed' | 'cancelled' {
  const map: Record<WorkOrderStatus, 'pending' | 'assigned' | 'processing' | 'completed' | 'cancelled'> = {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };
  return map[status];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

function WorkOrderTrendChart() {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-400" />
          工单趋势
        </h3>
        <span className="text-xs text-neutral-500">近7天</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={workOrderTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5889FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#5889FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F1F5F9',
              }}
              labelStyle={{ color: '#94A3B8', fontSize: '11px' }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#5889FF"
              strokeWidth={2.5}
              dot={{ fill: '#5889FF', strokeWidth: 2, r: 4, stroke: '#0F172A' }}
              activeDot={{ r: 6, fill: '#5889FF', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function WorkOrderTypePie() {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <PieChart className="w-5 h-5 text-accent-400" />
          工单类型分布
        </h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={workOrderTypeData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {workOrderTypeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F1F5F9',
              }}
              formatter={(value: number) => [`${value} 件`, '数量']}
            />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SlaWarningList({ orders }: { orders: WorkOrder[] }) {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning-400" />
          SLA预警工单
        </h3>
        <button className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-0.5 transition-colors">
          查看全部 <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{order.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{order.orderNo}</p>
              </div>
              <StatusBadge category="workorder" status={convertWorkOrderStatus(order.status)} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                {WORK_ORDER_TYPE[order.type]} · {order.submitterName}
              </span>
              <SlaCountdown deadline={order.slaDeadline} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HotActivities({ activities }: { activities: ActivityEntity[] }) {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <Calendar className="w-5 h-5 text-success-400" />
          热门活动
        </h3>
        <button className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-0.5 transition-colors">
          更多活动 <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => {
          const progress = activity.maxParticipants
            ? (activity.currentParticipants / activity.maxParticipants) * 100
            : 0;
          return (
            <div
              key={activity.id}
              className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300 cursor-pointer"
            >
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary-500/30 to-accent-500/20 flex-shrink-0 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary-400/60" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <h4 className="text-sm font-medium text-white truncate">{activity.title}</h4>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  {activity.description}
                </p>
                <div className="mt-auto pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-neutral-500">
                      {activity.currentParticipants}/{activity.maxParticipants || '不限'}人
                    </span>
                    <span className="text-xs text-primary-400">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopProducts({ products }: { products: Product[] }) {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-accent-400" />
          热销商品 Top5
        </h3>
      </div>
      <div className="space-y-3">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300 cursor-pointer"
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0',
                index === 0 && 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white',
                index === 1 && 'bg-gradient-to-br from-slate-300 to-slate-500 text-white',
                index === 2 && 'bg-gradient-to-br from-amber-600 to-amber-800 text-white',
                index > 2 && 'bg-white/10 text-neutral-400'
              )}
            >
              {index + 1}
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/10 flex-shrink-0 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary-400/50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{product.name}</p>
              <p className="text-xs text-neutral-500">{product.category}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-gradient-accent">
                ¥{product.price}
              </p>
              <p className="text-xs text-neutral-500">库存 {product.stock}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUserStore();

  const pageTitle = useMemo(() => {
    if (!user) return '工作台';
    switch (user.role) {
      case 'RESIDENT':
        return '业主工作台';
      case 'PROPERTY_STAFF':
        return '物业管家工作台';
      case 'COMMUNITY_ADMIN':
      case 'SUPER_ADMIN':
        return '管理工作台';
      case 'FINANCE_STAFF':
        return '财务工作台';
      case 'SECURITY_STAFF':
        return '安保工作台';
      default:
        return '工作台';
    }
  }, [user]);

  const sparklineData = [
    { name: '', value: 30 },
    { name: '', value: 45 },
    { name: '', value: 35 },
    { name: '', value: 60 },
    { name: '', value: 52 },
    { name: '', value: 70 },
    { name: '', value: 65 },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={pageTitle}
        subtitle={`欢迎回来，${user?.realName || '用户'}`}
        breadcrumb={[{ title: '首页' }, { title: '工作台' }]}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="物业费收缴率"
            value="92.5"
            unit="%"
            icon={DollarSign}
            variant="primary"
            trend={{ value: 3.2, direction: 'up', label: '同比' }}
            sparklineData={sparklineData}
          />
          <StatCard
            title="工单处理时效"
            value="28"
            unit="分钟"
            icon={Clock}
            variant="success"
            trend={{ value: 12, direction: 'down', label: '平均响应' }}
            sparklineData={[
              { name: '', value: 50 },
              { name: '', value: 42 },
              { name: '', value: 38 },
              { name: '', value: 35 },
              { name: '', value: 32 },
              { name: '', value: 30 },
              { name: '', value: 28 },
            ]}
          />
          <StatCard
            title="本月电商GMV"
            value="128,560"
            prefix="¥"
            icon={ShoppingCart}
            variant="accent"
            trend={{ value: 15.8, direction: 'up', label: '环比' }}
            sparklineData={[
              { name: '', value: 20 },
              { name: '', value: 35 },
              { name: '', value: 28 },
              { name: '', value: 45 },
              { name: '', value: 52 },
              { name: '', value: 48 },
              { name: '', value: 65 },
            ]}
          />
          <StatCard
            title="活动参与人次"
            value="3,256"
            icon={Users}
            variant="warning"
            trend={{ value: 25.3, direction: 'up', label: '同比' }}
            sparklineData={[
              { name: '', value: 15 },
              { name: '', value: 28 },
              { name: '', value: 32 },
              { name: '', value: 40 },
              { name: '', value: 48 },
              { name: '', value: 55 },
              { name: '', value: 62 },
            ]}
          />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <WorkOrderTrendChart />
          <WorkOrderTypePie />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <SlaWarningList orders={slaWarningOrders} />
          <HotActivities activities={hotActivities} />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 xl:grid-cols-2 gap-4"
        >
          <TopProducts products={topProducts} />
          <HeatmapChart
            data={heatmapData}
            title="活动参与热力图"
            height={380}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
