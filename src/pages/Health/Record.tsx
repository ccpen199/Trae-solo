import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Heart,
  Activity,
  Thermometer,
  Scale,
  FileText,
  TrendingUp,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { DesensitizeText } from '@/components/common/DesensitizeText';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

type FamilyMember = 'self' | 'spouse' | 'father' | 'mother' | 'child';

interface FamilyMemberInfo {
  id: string;
  name: string;
  relation: string;
  age: number;
  avatar?: string;
  healthScore: number;
}

interface HealthReport {
  id: string;
  title: string;
  date: string;
  hospital: string;
  type: string;
  abnormalCount: number;
}

interface HealthAdvice {
  id: string;
  title: string;
  content: string;
  type: 'exercise' | 'diet' | 'sleep' | 'checkup';
}

const familyMembers: { key: FamilyMember; label: string }[] = [
  { key: 'self', label: '本人' },
  { key: 'spouse', label: '配偶' },
  { key: 'father', label: '父亲' },
  { key: 'mother', label: '母亲' },
  { key: 'child', label: '子女' },
];

const familyMemberData: Record<FamilyMember, FamilyMemberInfo> = {
  self: {
    id: 'member_001',
    name: '张三',
    relation: '本人',
    age: 35,
    healthScore: 85,
  },
  spouse: {
    id: 'member_002',
    name: '李四',
    relation: '配偶',
    age: 33,
    healthScore: 92,
  },
  father: {
    id: 'member_003',
    name: '张大爷',
    relation: '父亲',
    age: 65,
    healthScore: 72,
  },
  mother: {
    id: 'member_004',
    name: '王大妈',
    relation: '母亲',
    age: 62,
    healthScore: 78,
  },
  child: {
    id: 'member_005',
    name: '张小宝',
    relation: '子女',
    age: 8,
    healthScore: 98,
  },
};

const mockHealthReports: HealthReport[] = [
  {
    id: 'report_001',
    title: '年度体检报告',
    date: '2024-05-15',
    hospital: '市第一人民医院',
    type: '年度体检',
    abnormalCount: 2,
  },
  {
    id: 'report_002',
    title: '常规体检报告',
    date: '2024-02-20',
    hospital: '社区卫生服务中心',
    type: '常规体检',
    abnormalCount: 0,
  },
  {
    id: 'report_003',
    title: '专项体检报告',
    date: '2023-11-10',
    hospital: '市第一人民医院',
    type: '心血管专项',
    abnormalCount: 1,
  },
];

const healthAdvices: HealthAdvice[] = [
  {
    id: 'advice_001',
    title: '运动建议',
    content: '建议每周进行至少150分钟中等强度有氧运动，如快走、慢跑、游泳等。',
    type: 'exercise',
  },
  {
    id: 'advice_002',
    title: '饮食建议',
    content: '减少高盐、高脂食物摄入，多吃新鲜蔬菜水果，每日饮水量保持在2000ml左右。',
    type: 'diet',
  },
  {
    id: 'advice_003',
    title: '作息建议',
    content: '保持规律作息，每天保证7-8小时睡眠，避免熬夜和过度劳累。',
    type: 'sleep',
  },
];

const trendData = Array.from({ length: 30 }, (_, i) => {
  const date = dayjs().subtract(29 - i, 'day').format('MM-DD');
  return {
    date,
    systolic: 115 + Math.floor(Math.random() * 25),
    diastolic: 75 + Math.floor(Math.random() * 15),
    bloodSugar: (5 + Math.random() * 2).toFixed(1),
    weight: (68 + Math.random() * 3).toFixed(1),
  };
});

const adviceTypeConfig: Record<string, { icon: typeof Heart; color: string; bg: string }> = {
  exercise: { icon: Activity, color: 'text-success-400', bg: 'bg-success-500/10' },
  diet: { icon: Scale, color: 'text-warning-400', bg: 'bg-warning-500/10' },
  sleep: { icon: Thermometer, color: 'text-info-400', bg: 'bg-info-500/10' },
  checkup: { icon: FileText, color: 'text-primary-400', bg: 'bg-primary-500/10' },
};

function HealthScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 90) return '#10B981';
    if (s >= 80) return '#3366FF';
    if (s >= 70) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-neutral-500">健康评分</span>
      </div>
    </div>
  );
}

function IndicatorCard({
  icon: Icon,
  label,
  value,
  unit,
  status,
  normalRange,
}: {
  icon: typeof Heart;
  label: string;
  value: string | number;
  unit: string;
  status: 'normal' | 'warning' | 'abnormal';
  normalRange?: string;
}) {
  const statusColors = {
    normal: 'text-success-400',
    warning: 'text-warning-400',
    abnormal: 'text-danger-400',
  };

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="glass-card-hover p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          status === 'normal' && 'bg-success-500/10',
          status === 'warning' && 'bg-warning-500/10',
          status === 'abnormal' && 'bg-danger-500/10',
        )}>
          <Icon className={cn('w-5 h-5', statusColors[status])} />
        </div>
        {status !== 'normal' && (
          <AlertTriangle className={cn('w-4 h-4', statusColors[status])} />
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className="text-xs text-neutral-500">{unit}</span>
      </div>
      <p className="text-sm text-neutral-400">{label}</p>
      {normalRange && (
        <p className="text-xs text-neutral-500 mt-1">正常范围：{normalRange}</p>
      )}
    </motion.div>
  );
}

function ReportCard({ report, onClick }: { report: HealthReport; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="glass-card-hover p-4 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
          <FileText className="w-6 h-6 text-primary-400" />
        </div>
        {report.abnormalCount > 0 ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-warning-500/10 text-warning-400">
            {report.abnormalCount}项异常
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success-500/10 text-success-400">
            全部正常
          </span>
        )}
      </div>
      <h4 className="text-base font-medium text-white mb-2">{report.title}</h4>
      <div className="space-y-1">
        <p className="text-xs text-neutral-500">医院：{report.hospital}</p>
        <p className="text-xs text-neutral-500">日期：{report.date}</p>
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <span className="text-xs text-neutral-500">{report.type}</span>
        <span className="text-xs text-primary-400 flex items-center gap-1">
          查看详情
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
}

function AdviceCard({ advice }: { advice: HealthAdvice }) {
  const config = adviceTypeConfig[advice.type];
  const Icon = config.icon;

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="glass-card-hover p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bg)}>
          <Icon className={cn('w-5 h-5', config.color)} />
        </div>
        <h4 className="text-sm font-medium text-white">{advice.title}</h4>
      </div>
      <p className="text-sm text-neutral-400 line-clamp-3">{advice.content}</p>
    </motion.div>
  );
}

export default function HealthRecord() {
  const [activeMember, setActiveMember] = useState<FamilyMember>('self');
  const [chartType, setChartType] = useState<'bloodPressure' | 'bloodSugar' | 'weight'>('bloodPressure');

  const currentMember = familyMemberData[activeMember];

  const healthIndicators = useMemo(() => {
    return [
      { icon: Activity, label: '血压', value: '125/82', unit: 'mmHg', status: 'normal' as const, normalRange: '90-140/60-90' },
      { icon: Thermometer, label: '血糖', value: '5.6', unit: 'mmol/L', status: 'normal' as const, normalRange: '3.9-6.1' },
      { icon: Heart, label: '心率', value: '72', unit: '次/分', status: 'normal' as const, normalRange: '60-100' },
      { icon: Scale, label: 'BMI', value: '22.8', unit: '', status: 'normal' as const, normalRange: '18.5-23.9' },
    ];
  }, []);

  const handleViewReport = (report: HealthReport) => {
    console.log('查看报告:', report.id);
  };

  const handleAddMember = () => {
    console.log('添加家庭成员');
  };

  const chartConfig = {
    bloodPressure: {
      keys: ['systolic', 'diastolic'],
      labels: ['收缩压', '舒张压'],
      colors: ['#3366FF', '#10B981'],
      yAxisLabel: 'mmHg',
    },
    bloodSugar: {
      keys: ['bloodSugar'],
      labels: ['血糖'],
      colors: ['#F59E0B'],
      yAxisLabel: 'mmol/L',
    },
    weight: {
      keys: ['weight'],
      labels: ['体重'],
      colors: ['#FF6B35'],
      yAxisLabel: 'kg',
    },
  };

  const currentChartConfig = chartConfig[chartType];

  return (
    <div className="p-6">
      <PageHeader
        title="健康档案"
        subtitle="管理您和家人的健康数据，关注健康每一天"
        breadcrumb={[{ title: '首页' }, { title: '健康档案' }]}
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-6 mb-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-success-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {familyMembers.map((member) => (
                <button
                  key={member.key}
                  onClick={() => setActiveMember(member.key)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                    activeMember === member.key
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {member.label}
                </button>
              ))}
              <button
                onClick={handleAddMember}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                添加
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500/20 to-success-500/20 flex items-center justify-center border border-white/10">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  <DesensitizeText value={currentMember.name} type="name" hasPermission />
                </h3>
                <p className="text-sm text-neutral-500">
                  {currentMember.relation} · {currentMember.age}岁
                </p>
              </div>
            </div>

            <HealthScoreRing score={currentMember.healthScore} />

            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              {healthIndicators.map((indicator, index) => (
                <motion.div
                  key={indicator.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <IndicatorCard {...indicator} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-400" />
              健康趋势
            </h3>
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {[
                { key: 'bloodPressure', label: '血压' },
                { key: 'bloodSugar', label: '血糖' },
                { key: 'weight', label: '体重' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setChartType(item.key as typeof chartType)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    chartType === item.key
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-neutral-400 hover:text-white'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#F1F5F9',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => <span className="text-neutral-400">{value}</span>}
                />
                {currentChartConfig.keys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={currentChartConfig.labels[index]}
                    stroke={currentChartConfig.colors[index]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-neutral-500 text-center mt-2">近30天数据趋势</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-400" />
              最近体检记录
            </h3>
            <button className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
              全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {mockHealthReports.length === 0 ? (
            <EmptyState type="default" size="sm" title="暂无体检报告" description="还没有体检报告记录" />
          ) : (
            <div className="space-y-3">
              {mockHealthReports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ReportCard report={report} onClick={() => handleViewReport(report)} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="section-title flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-warning-400" />
          AI健康建议
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {healthAdvices.map((advice, index) => (
            <motion.div
              key={advice.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <AdviceCard advice={advice} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
