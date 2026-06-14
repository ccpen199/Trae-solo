import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Shield,
  ShieldCheck,
  UserCog,
  Wallet,
  Headphones,
  Eye,
  Edit,
  Trash2,
  Download,
  X,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  MapPin,
  Calendar,
  Search,
  MoreHorizontal,
  ThumbsDown,
  Zap,
  MessageCircleQuestion,
  ChevronDown,
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
  AreaChart,
  Area,
} from 'recharts';
import dayjs from 'dayjs';
import { Card, Progress, Modal, message, Tag, Select, Table, Button as AntButton, Drawer } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

type RoleType = 'super_admin' | 'operation' | 'auditor' | 'finance' | 'customer_service' | 'observer';
type DataScope = 'national' | 'city';
type DrillType = 'orders' | 'satisfaction' | 'providers' | 'sites' | null;

const ROLE_CONFIG: Record<RoleType, { name: string; desc: string; color: string; icon: React.ComponentType<any>; scope: DataScope }> = {
  super_admin: { name: '超级管理员', desc: '拥有所有模块完全权限，可管理全平台数据', color: 'from-rose-500 to-rose-600', icon: Shield, scope: 'national' },
  operation: { name: '运营管理员', desc: '运营数据查看与编辑，项目与纠纷管理', color: 'from-terracotta-500 to-terracotta-600', icon: UserCog, scope: 'national' },
  auditor: { name: '审核员', desc: '服务商资质审核与项目进度监督', color: 'from-wood-500 to-wood-600', icon: ShieldCheck, scope: 'city' },
  finance: { name: '财务', desc: '财务数据查看与导出，结算管理', color: 'from-haze-500 to-haze-600', icon: Wallet, scope: 'national' },
  customer_service: { name: '客服', desc: '纠纷工单处理，业主与服务商沟通', color: 'from-emerald-500 to-emerald-600', icon: Headphones, scope: 'city' },
  observer: { name: '只读观察员', desc: '查看运营数据，无任何编辑权限', color: 'from-carbon-500 to-carbon-600', icon: Eye, scope: 'city' },
};

const PERMISSION_MATRIX = [
  { module: '数据总览', super_admin: ['查看', '编辑', '导出'], operation: ['查看', '编辑', '导出'], auditor: ['查看'], finance: ['查看', '导出'], customer_service: ['查看'], observer: ['查看'] },
  { module: '服务商审核', super_admin: ['查看', '编辑', '审核', '删除'], operation: ['查看', '编辑', '审核'], auditor: ['查看', '编辑', '审核'], finance: ['查看'], customer_service: ['查看'], observer: ['查看'] },
  { module: '项目甘特图', super_admin: ['查看', '编辑', '导出'], operation: ['查看', '编辑', '导出'], auditor: ['查看', '编辑'], finance: ['查看'], customer_service: ['查看'], observer: ['查看'] },
  { module: '供应链API', super_admin: ['查看', '编辑', '删除'], operation: ['查看', '编辑'], auditor: ['查看'], finance: ['查看', '导出'], customer_service: [], observer: ['查看'] },
  { module: 'SKU管理', super_admin: ['查看', '编辑', '删除', '导出'], operation: ['查看', '编辑', '导出'], auditor: ['查看'], finance: ['查看', '导出'], customer_service: ['查看'], observer: ['查看'] },
  { module: '纠纷工单', super_admin: ['查看', '编辑', '删除', '导出'], operation: ['查看', '编辑', '导出'], auditor: ['查看'], finance: ['查看'], customer_service: ['查看', '编辑', '导出'], observer: ['查看'] },
  { module: '角色权限', super_admin: ['查看', '编辑', '删除'], operation: [], auditor: [], finance: [], customer_service: [], observer: ['查看'] },
];

const monthlyData = [
  { month: '7月', amount: 1850, projects: 89, orders: 156 },
  { month: '8月', amount: 2120, projects: 102, orders: 178 },
  { month: '9月', amount: 1980, projects: 95, orders: 162 },
  { month: '10月', amount: 2450, projects: 118, orders: 205 },
  { month: '11月', amount: 2680, projects: 131, orders: 234 },
  { month: '12月', amount: 2890, projects: 142, orders: 256 },
  { month: '1月', amount: 2560, projects: 125, orders: 218 },
  { month: '2月', amount: 1780, projects: 87, orders: 142 },
  { month: '3月', amount: 3010, projects: 148, orders: 278 },
  { month: '4月', amount: 3240, projects: 159, orders: 298 },
  { month: '5月', amount: 3180, projects: 156, orders: 289 },
  { month: '6月', amount: 3260, projects: 162, orders: 305 },
];

const dailyOrderData = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1}日`,
  orders: Math.floor(Math.random() * 40) + 60,
  amount: Math.floor(Math.random() * 500) + 800,
}));

const weeklyOrderData = [
  { period: '第1周', orders: 456, amount: 7820 },
  { period: '第2周', orders: 512, amount: 8940 },
  { period: '第3周', orders: 478, amount: 8230 },
  { period: '第4周', orders: 602, amount: 10450 },
];

const monthlyOrderData = [
  { period: '1月', orders: 2180, amount: 35600 },
  { period: '2月', orders: 1420, amount: 23400 },
  { period: '3月', orders: 2780, amount: 45200 },
  { period: '4月', orders: 2980, amount: 48700 },
  { period: '5月', orders: 2890, amount: 46800 },
  { period: '6月', orders: 3050, amount: 49500 },
];

const cityDistribution = [
  { city: '上海', orders: 1256, amount: 4580 },
  { city: '北京', orders: 1089, amount: 4120 },
  { city: '深圳', orders: 876, amount: 3450 },
  { city: '广州', orders: 765, amount: 2980 },
  { city: '杭州', orders: 654, amount: 2560 },
  { city: '成都', orders: 543, amount: 2120 },
  { city: '南京', orders: 432, amount: 1680 },
  { city: '武汉', orders: 378, amount: 1450 },
  { city: '苏州', orders: 312, amount: 1230 },
  { city: '西安', orders: 267, amount: 980 },
];

const cityRankData = [
  { city: '北京', count: 486 },
  { city: '上海', count: 432 },
  { city: '深圳', count: 378 },
  { city: '广州', count: 325 },
  { city: '杭州', count: 289 },
  { city: '成都', count: 256 },
  { city: '武汉', count: 218 },
  { city: '西安', count: 192 },
  { city: '南京', count: 176 },
  { city: '苏州', count: 158 },
];

const projectPhaseData = [
  { name: '规划中', value: 245, color: '#6B8E9F' },
  { name: '拆改阶段', value: 186, color: '#EF4444' },
  { name: '水电阶段', value: 298, color: '#F97316' },
  { name: '泥瓦阶段', value: 312, color: '#EAB308' },
  { name: '木工阶段', value: 178, color: '#22C55E' },
  { name: '油漆阶段', value: 134, color: '#3B82F6' },
  { name: '安装阶段', value: 189, color: '#8B6914' },
  { name: '竣工交付', value: 412, color: '#8B5CF6' },
];

const styleDistribution = [
  { name: '现代简约', value: 892, color: '#C4623A' },
  { name: '北欧', value: 567, color: '#6B8E9F' },
  { name: '新中式', value: 423, color: '#8B6914' },
  { name: '轻奢', value: 389, color: '#CBA356' },
  { name: '美式', value: 234, color: '#DE8F69' },
  { name: '日式', value: 178, color: '#9CB8C2' },
  { name: '其他', value: 156, color: '#B8B0A0' },
];

const satisfactionDistribution = [
  { name: '5星', value: 2456, percent: 68.2 },
  { name: '4星', value: 892, percent: 24.8 },
  { name: '3星', value: 178, percent: 4.9 },
  { name: '2星', value: 56, percent: 1.6 },
  { name: '1星', value: 18, percent: 0.5 },
];

const lowScoreOrders = [
  { key: '1', orderId: 'ORD-20240610-0234', project: '和谐家园·张府', owner: '张先生', score: 2, reason: '工期延误15天', handler: '王工', date: '2024-06-10' },
  { key: '2', orderId: 'ORD-20240608-0189', project: '翠湖天地·李宅', owner: '李女士', score: 1, reason: '瓷砖空鼓质量问题', handler: '李工', date: '2024-06-08' },
  { key: '3', orderId: 'ORD-20240605-0145', project: '万科翡翠·王府', owner: '王先生', score: 3, reason: '增项费用争议', handler: '张工', date: '2024-06-05' },
  { key: '4', orderId: 'ORD-20240603-0098', project: '保利天汇·陈宅', owner: '陈先生', score: 2, reason: '现场管理混乱', handler: '赵工', date: '2024-06-03' },
  { key: '5', orderId: 'ORD-20240601-0056', project: '融创壹号院·刘宅', owner: '刘女士', score: 3, reason: '材料与合同不符', handler: '孙工', date: '2024-06-01' },
];

const auditPassRate = [
  { month: '1月', passRate: 82.5, total: 45, passed: 37 },
  { month: '2月', passRate: 78.3, total: 38, passed: 30 },
  { month: '3月', passRate: 85.7, total: 52, passed: 45 },
  { month: '4月', passRate: 89.2, total: 61, passed: 54 },
  { month: '5月', passRate: 87.5, total: 58, passed: 51 },
  { month: '6月', passRate: 91.3, total: 46, passed: 42 },
];

const pendingAuditQueue = [
  { key: '1', companyId: 'CMP-20240612-001', name: '筑美装饰设计工程有限公司', level: 'A', submitTime: '2024-06-12 09:15', materials: 4, ocrPass: 4, city: '上海' },
  { key: '2', companyId: 'CMP-20240611-028', name: '和盛建筑装饰集团', level: 'A', submitTime: '2024-06-11 16:42', materials: 4, ocrPass: 2, city: '北京' },
  { key: '3', companyId: 'CMP-20240612-007', name: '优家精品装饰', level: 'B', submitTime: '2024-06-12 11:28', materials: 4, ocrPass: 2, city: '深圳' },
  { key: '4', companyId: 'CMP-20240610-015', name: '匠心营造装饰', level: 'B', submitTime: '2024-06-10 14:05', materials: 4, ocrPass: 4, city: '杭州' },
];

const delayedSites = [
  { key: '1', projectId: 'P001', name: '和谐家园·张府', owner: '张先生', delayDays: 7, phase: '泥瓦阶段', manager: '王工', city: '上海' },
  { key: '2', projectId: 'P003', name: '万科翡翠·王府', owner: '王先生', delayDays: 15, phase: '木工阶段', manager: '李工', city: '北京' },
  { key: '3', projectId: 'P006', name: '绿地中央·赵宅', owner: '赵女士', delayDays: 4, phase: '水电阶段', manager: '张工', city: '广州' },
  { key: '4', projectId: 'P008', name: '龙湖天街·孙府', owner: '孙先生', delayDays: 10, phase: '油漆阶段', manager: '赵工', city: '成都' },
];

const operationLogs = [
  { time: '14:58:32', user: '超级管理员·admin', action: '通过服务商审核', target: '筑美装饰设计工程有限公司', type: 'audit', icon: ShieldCheck, color: 'bg-emerald-100 text-emerald-600' },
  { time: '14:45:18', user: '运营·李运营', action: '调整项目工期', target: 'P001 和谐家园·张府', type: 'edit', icon: Edit, color: 'bg-haze-100 text-haze-600' },
  { time: '14:32:05', user: '审核员·王审核', action: '驳回资质申请', target: '宜居空间设计（材料不全）', type: 'reject', icon: XCircle, color: 'bg-rose-100 text-rose-600' },
  { time: '14:18:42', user: '客服·张客服', action: '受理纠纷工单', target: 'DSP-20240612-0037', type: 'handle', icon: Headphones, color: 'bg-emerald-100 text-emerald-600' },
  { time: '14:05:16', user: '超级管理员·admin', action: '修改角色权限', target: '新增「项目主管」角色', type: 'role', icon: Shield, color: 'bg-amber-100 text-amber-600' },
  { time: '13:52:38', user: '财务·赵财务', action: '导出结算报表', target: '2024年5月服务商结算', type: 'export', icon: Download, color: 'bg-haze-100 text-haze-600' },
  { time: '13:40:22', user: '运营·李运营', action: '更新SKU价格', target: 'SKU-TILE-00128 上调5.2%', type: 'edit', icon: Edit, color: 'bg-wood-100 text-wood-600' },
  { time: '13:28:10', user: '审核员·王审核', action: '标记里程碑完成', target: 'P002 水电验收通过', type: 'complete', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
];

const COLORS_SATISFACTION = ['#22C55E', '#84CC16', '#EAB308', '#F97316', '#EF4444'];

const KPICard: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  subInfo: string;
  gradient: string;
  trend?: { value: string; positive: boolean };
  onClick?: () => void;
  drillable?: boolean;
}> = ({ icon: Icon, title, value, subInfo, gradient, trend, onClick, drillable = true }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    onClick={onClick}
    className={`relative overflow-hidden rounded-card p-5 shadow-card ${gradient} text-white ${drillable ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 group' : ''}`}
  >
    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-16" />
    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
    {drillable && (
      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4" />
      </div>
    )}
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
  const [currentRole, setCurrentRole] = useState<RoleType>('super_admin');
  const [drillModal, setDrillModal] = useState<DrillType>(null);
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const [orderTimeMode, setOrderTimeMode] = useState<'day' | 'week' | 'month'>('day');
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const roleCfg = ROLE_CONFIG[currentRole];
  const RoleIcon = roleCfg.icon;

  const checkPermission = (module: string, action: string): boolean => {
    const row = PERMISSION_MATRIX.find(r => r.module === module);
    if (!row) return false;
    return (row as any)[currentRole]?.includes(action) ?? false;
  };

  const handleDrill = (type: DrillType) => {
    if (!checkPermission('数据总览', '查看')) {
      messageApi.warning('当前角色无此权限，请联系管理员');
      return;
    }
    setDrillModal(type);
    messageApi.info(`正在钻取${type === 'orders' ? '成交单数' : type === 'satisfaction' ? '满意度' : type === 'providers' ? '服务商' : '施工地'}详情数据...`);
  };

  const currentOrderData = useMemo(() => {
    switch (orderTimeMode) {
      case 'day': return dailyOrderData;
      case 'week': return weeklyOrderData;
      case 'month': return monthlyOrderData;
      default: return dailyOrderData;
    }
  }, [orderTimeMode]);

  const renderDrillModal = () => {
    if (!drillModal) return null;

    const modalTitles: Record<Exclude<DrillType, null>, string> = {
      orders: '成交单数深度分析',
      satisfaction: '满意度数据钻取',
      providers: '服务商审核统计',
      sites: '在施工地进度总览',
    };

    return (
      <Modal
        open={!!drillModal}
        onCancel={() => setDrillModal(null)}
        footer={null}
        width={1200}
        destroyOnClose
        title={
          <div className="flex items-center gap-3 pr-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta-100 to-wood-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-terracotta-600" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-carbon-800">{modalTitles[drillModal]}</h3>
              <p className="text-xs text-ivory-500 mt-0.5">数据更新于 {currentTime}</p>
            </div>
          </div>
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={drillModal}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="pt-2 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin space-y-6"
          >
            {drillModal === 'orders' && (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-semibold text-carbon-800 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-terracotta-500" />
                    成交趋势分析
                  </h4>
                  <div className="flex items-center gap-1 p-1 bg-ivory-100 rounded-lg">
                    {(['day', 'week', 'month'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setOrderTimeMode(t)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          orderTimeMode === t ? 'bg-white text-terracotta-700 shadow-sm' : 'text-ivory-600 hover:text-carbon-800'
                        }`}
                      >
                        {t === 'day' ? '按日' : t === 'week' ? '按周' : '按月'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-card border border-ivory-200 p-4 bg-ivory-50/50">
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={currentOrderData}>
                      <defs>
                        <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#C4623A" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#C4623A" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DD" vertical={false} />
                      <XAxis dataKey={orderTimeMode === 'day' ? 'date' : 'period'} tick={{ fontSize: 11, fill: '#757064' }} axisLine={{ stroke: '#E8E4DD' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#757064' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E4DD', borderRadius: 12, boxShadow: '0 8px 32px rgba(61,58,53,0.12)' }} />
                      <Legend />
                      <Area type="monotone" dataKey="orders" name="成交单数" stroke="#C4623A" strokeWidth={2.5} fill="url(#orderGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <h4 className="font-serif font-semibold text-carbon-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-haze-500" />
                  城市成交分布 TOP10
                </h4>
                <div className="rounded-card border border-ivory-200 p-4 bg-ivory-50/50">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={cityDistribution} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DD" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#757064' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="city" tick={{ fontSize: 11, fill: '#757064' }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E4DD', borderRadius: 12 }} />
                      <Bar dataKey="orders" name="成交单" radius={[0, 6, 6, 0]} barSize={14}>
                        {cityDistribution.map((_, i) => (
                          <defs key={i}>
                            <linearGradient id={`cityOrdGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#9CB8C2" />
                              <stop offset="100%" stopColor="#6B8E9F" />
                            </linearGradient>
                          </defs>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {drillModal === 'satisfaction' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {satisfactionDistribution.map((s, i) => (
                    <div key={s.name} className="rounded-card border border-ivory-200 p-4 text-center">
                      <div className="flex items-center justify-center gap-0.5 mb-2">
                        {Array.from({ length: Number(s.name[0]) }).map((_, si) => (
                          <Star key={si} className={`w-4 h-4 fill-current`} style={{ color: COLORS_SATISFACTION[i] }} />
                        ))}
                      </div>
                      <p className="font-mono text-2xl font-bold text-carbon-800">{s.value}</p>
                      <p className="text-xs text-ivory-500 mt-1">{s.percent}%</p>
                    </div>
                  ))}
                </div>

                <h4 className="font-serif font-semibold text-carbon-800 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-wood-500" />
                  评分分布
                </h4>
                <div className="rounded-card border border-ivory-200 p-4 bg-ivory-50/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={satisfactionDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 1).toFixed(1)}%`}>
                        {satisfactionDistribution.map((entry, index) => (
                          <Cell key={index} fill={COLORS_SATISFACTION[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col justify-center space-y-3">
                    {satisfactionDistribution.map((s, i) => (
                      <div key={s.name}>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_SATISFACTION[i] }} />
                            <span className="text-carbon-700 font-medium">{s.name}评价</span>
                          </div>
                          <span className="font-mono text-carbon-800 font-semibold">{s.value} ({s.percent}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-ivory-200 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${s.percent * 1.4}%`, backgroundColor: COLORS_SATISFACTION[i] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <h4 className="font-serif font-semibold text-carbon-800 flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-rose-500" />
                  低分满意度工单 TOP5
                </h4>
                <div className="rounded-card border border-rose-200 overflow-hidden">
                  <Table
                    size="small"
                    dataSource={lowScoreOrders}
                    pagination={false}
                    rowClassName={(r) => (r.score <= 2 ? '!bg-rose-50/40' : '')}
                    columns={[
                      { title: '工单号', dataIndex: 'orderId', render: v => <span className="font-mono text-xs text-terracotta-600">{v}</span> },
                      { title: '项目', dataIndex: 'project', render: v => <span className="text-sm font-medium text-carbon-700">{v}</span> },
                      { title: '业主', dataIndex: 'owner', width: 80 },
                      { title: '评分', dataIndex: 'score', width: 120, render: (s) => (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: s }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />)}
                          <span className="font-mono text-sm font-bold text-rose-600 ml-1">{s}.0</span>
                        </div>
                      )},
                      { title: '原因', dataIndex: 'reason', render: v => <span className="text-xs text-rose-700">{v}</span> },
                      { title: '跟进人', dataIndex: 'handler', width: 70 },
                      { title: '日期', dataIndex: 'date', width: 100, render: v => <span className="font-mono text-xs">{v}</span> },
                      { title: '操作', width: 120, key: 'act', render: () => (
                        <div className="flex gap-1">
                          <AntButton type="link" size="small" icon={<Eye className="w-3 h-3" />}>查看</AntButton>
                          <AntButton type="link" size="small" icon={<MessageCircle className="w-3 h-3" />} style={{ color: '#C4623A' }}>介入</AntButton>
                        </div>
                      )},
                    ] as ColumnsType<any>}
                  />
                </div>
              </>
            )}

            {drillModal === 'providers' && (
              <>
                <h4 className="font-serif font-semibold text-carbon-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  月度审核通过率趋势
                </h4>
                <div className="rounded-card border border-ivory-200 p-4 bg-ivory-50/50">
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={auditPassRate}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DD" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#757064' }} axisLine={{ stroke: '#E8E4DD' }} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#757064' }} axisLine={false} tickLine={false} domain={[70, 100]} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#757064' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E4DD', borderRadius: 12 }} />
                      <Legend />
                      <Bar yAxisId="right" dataKey="total" name="申请数" fill="#6B8E9F" radius={[4, 4, 0, 0]} barSize={18} />
                      <Line yAxisId="left" type="monotone" dataKey="passRate" name="通过率(%)" stroke="#22C55E" strokeWidth={3} dot={{ r: 5, fill: '#22C55E', stroke: '#fff', strokeWidth: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <h4 className="font-serif font-semibold text-carbon-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  待审核队列（优先级从高到低）
                </h4>
                <div className="rounded-card border border-amber-200 overflow-hidden">
                  <Table
                    size="small"
                    dataSource={pendingAuditQueue}
                    pagination={false}
                    columns={[
                      { title: '申请编号', dataIndex: 'companyId', render: v => <span className="font-mono text-xs text-terracotta-600">{v}</span> },
                      { title: '公司名称', dataIndex: 'name', render: v => <span className="text-sm font-medium text-carbon-700">{v}</span> },
                      { title: '资质等级', dataIndex: 'level', width: 80, render: l => (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${l === 'A' ? 'bg-amber-50 text-amber-700 border border-amber-200' : l === 'B' ? 'bg-haze-50 text-haze-700 border border-haze-200' : 'bg-wood-50 text-wood-700 border border-wood-200'}`}>
                          一级资质
                        </span>
                      )},
                      { title: '所在城市', dataIndex: 'city', width: 70 },
                      { title: '提交时间', dataIndex: 'submitTime', width: 140, render: v => <span className="font-mono text-xs">{v}</span> },
                      { title: 'OCR核验', dataIndex: 'ocrPass', width: 100, render: (p, r) => `${p}/${r.materials} 通过` },
                      { title: '操作', width: 180, key: 'act', render: () => (
                        <div className="flex gap-1">
                          <AntButton size="small" type="primary" icon={<CheckCircle2 className="w-3 h-3" />} style={{ background: 'linear-gradient(to right, #D47042, #C4623A)', borderColor: '#C4623A' }}>审核</AntButton>
                          <AntButton size="small" icon={<Eye className="w-3 h-3" />}>查看</AntButton>
                        </div>
                      )},
                    ] as ColumnsType<any>}
                  />
                </div>
              </>
            )}

            {drillModal === 'sites' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: '总施工地', value: 328, color: 'from-haze-400 to-haze-600' },
                    { label: '正常进度', value: 256, color: 'from-emerald-400 to-emerald-600' },
                    { label: '延期预警', value: 58, color: 'from-amber-400 to-amber-600' },
                    { label: '严重延期', value: 14, color: 'from-rose-400 to-rose-600' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-card p-4 bg-gradient-to-br ${s.color} text-white`}>
                      <p className="text-white/80 text-xs mb-1">{s.label}</p>
                      <p className="font-mono text-3xl font-bold">{s.value}</p>
                    </div>
                  ))}
                </div>

                <h4 className="font-serif font-semibold text-carbon-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  延期预警工地列表（需立即介入）
                </h4>
                <div className="rounded-card border border-rose-200 overflow-hidden">
                  <Table
                    size="small"
                    dataSource={delayedSites}
                    pagination={false}
                    rowClassName={(r) => (r.delayDays >= 10 ? '!bg-rose-50/40' : r.delayDays >= 5 ? '!bg-amber-50/30' : '')}
                    columns={[
                      { title: '项目编号', dataIndex: 'projectId', render: v => <span className="font-mono text-xs text-haze-600">{v}</span> },
                      { title: '项目名称', dataIndex: 'name', render: v => <span className="text-sm font-medium text-carbon-700">{v}</span> },
                      { title: '业主', dataIndex: 'owner', width: 70 },
                      { title: '城市', dataIndex: 'city', width: 60 },
                      { title: '当前阶段', dataIndex: 'phase', width: 90, render: v => <Tag color="orange">{v}</Tag> },
                      { title: '延期天数', dataIndex: 'delayDays', width: 100, render: d => (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold ${d >= 10 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          <AlertCircle className="w-3 h-3" />{d}天
                        </span>
                      )},
                      { title: '项目经理', dataIndex: 'manager', width: 70 },
                      { title: '操作', width: 200, key: 'act', render: () => (
                        <div className="flex gap-1">
                          <AntButton size="small" type="primary" icon={<Calendar className="w-3 h-3" />} style={{ background: '#8B6914', borderColor: '#8B6914' }}>调工期</AntButton>
                          <AntButton size="small" icon={<Eye className="w-3 h-3" />} style={{ color: '#6B8E9F', borderColor: '#6B8E9F' }}>甘特图</AntButton>
                          <AntButton size="small" danger icon={<AlertTriangle className="w-3 h-3" />}>升级</AntButton>
                        </div>
                      )},
                    ] as ColumnsType<any>}
                  />
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </Modal>
    );
  };

  const renderRoleDrawer = () => (
    <Drawer
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wood-500 to-wood-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-carbon-800">角色权限中心</h3>
            <p className="text-xs text-ivory-500 mt-0.5">切换角色模拟不同权限视角</p>
          </div>
        </div>
      }
      placement="right"
      width={880}
      onClose={() => setRoleDrawerOpen(false)}
      open={roleDrawerOpen}
      extra={
        <AntButton type="primary" onClick={() => setRoleDrawerOpen(false)} style={{ background: '#8B6914', borderColor: '#8B6914' }}>
          关闭
        </AntButton>
      }
    >
      <div className="space-y-6">
        <div>
          <h4 className="font-serif font-semibold text-carbon-800 mb-3 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-terracotta-500" />
            角色切换
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(Object.keys(ROLE_CONFIG) as RoleType[]).map(key => {
              const cfg = ROLE_CONFIG[key];
              const Icon = cfg.icon;
              const isActive = currentRole === key;
              return (
                <div
                  key={key}
                  onClick={() => {
                    setCurrentRole(key);
                    messageApi.success(`已切换到「${cfg.name}」角色`);
                  }}
                  className={`relative p-4 rounded-card cursor-pointer transition-all border-2 ${
                    isActive
                      ? 'border-terracotta-400 shadow-card-hover scale-[1.02]'
                      : 'border-transparent hover:border-ivory-200 hover:shadow-card bg-ivory-50/60'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-terracotta-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cfg.color} text-white flex items-center justify-center shadow-md mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-carbon-800 text-sm">{cfg.name}</p>
                  <p className="text-xs text-ivory-500 mt-1 leading-relaxed">{cfg.desc}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <Tag color={cfg.scope === 'national' ? 'blue' : 'green'} className="!text-[10px] !mx-0">
                      {cfg.scope === 'national' ? '全国数据' : '本市数据'}
                    </Tag>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="font-serif font-semibold text-carbon-800 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-wood-600" />
            权限矩阵（{ROLE_CONFIG[currentRole].name}）
          </h4>
          <div className="rounded-card border border-ivory-200 overflow-hidden">
            <Table
              size="small"
              dataSource={PERMISSION_MATRIX}
              pagination={false}
              rowKey="module"
              columns={[
                { title: '功能模块', dataIndex: 'module', width: 120, fixed: 'left', render: v => <span className="text-sm font-semibold text-carbon-700">{v}</span> },
                {
                  title: (
                    <div className="text-center">
                      <Eye className="w-3.5 h-3.5 mx-auto mb-0.5 text-haze-600" />
                      <span className="text-xs">查看</span>
                    </div>
                  ),
                  width: 80,
                  align: 'center',
                  render: (_, r) => {
                    const has = (r as any)[currentRole]?.includes('查看');
                    return has
                      ? <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500" />
                      : <XCircle className="w-5 h-5 mx-auto text-rose-300" />;
                  },
                },
                {
                  title: (
                    <div className="text-center">
                      <Edit className="w-3.5 h-3.5 mx-auto mb-0.5 text-wood-600" />
                      <span className="text-xs">编辑</span>
                    </div>
                  ),
                  width: 80,
                  align: 'center',
                  render: (_, r) => {
                    const has = (r as any)[currentRole]?.includes('编辑');
                    return has
                      ? <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500" />
                      : <XCircle className="w-5 h-5 mx-auto text-rose-300" />;
                  },
                },
                {
                  title: (
                    <div className="text-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mx-auto mb-0.5 text-terracotta-600" />
                      <span className="text-xs">审核</span>
                    </div>
                  ),
                  width: 80,
                  align: 'center',
                  render: (_, r) => {
                    const has = (r as any)[currentRole]?.includes('审核');
                    return has
                      ? <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500" />
                      : <XCircle className="w-5 h-5 mx-auto text-rose-300" />;
                  },
                },
                {
                  title: (
                    <div className="text-center">
                      <Trash2 className="w-3.5 h-3.5 mx-auto mb-0.5 text-rose-500" />
                      <span className="text-xs">删除</span>
                    </div>
                  ),
                  width: 80,
                  align: 'center',
                  render: (_, r) => {
                    const has = (r as any)[currentRole]?.includes('删除');
                    return has
                      ? <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500" />
                      : <XCircle className="w-5 h-5 mx-auto text-rose-300" />;
                  },
                },
                {
                  title: (
                    <div className="text-center">
                      <Download className="w-3.5 h-3.5 mx-auto mb-0.5 text-haze-600" />
                      <span className="text-xs">导出</span>
                    </div>
                  ),
                  width: 80,
                  align: 'center',
                  render: (_, r) => {
                    const has = (r as any)[currentRole]?.includes('导出');
                    return has
                      ? <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-500" />
                      : <XCircle className="w-5 h-5 mx-auto text-rose-300" />;
                  },
                },
              ]}
            />
          </div>
        </div>

        <div className="rounded-card p-4 bg-gradient-to-r from-haze-50 to-ivory-50 border border-haze-200/60">
          <h4 className="font-serif font-semibold text-carbon-800 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-haze-600" />
            当前角色权限边界说明
          </h4>
          <p className="text-sm text-carbon-700 leading-relaxed">
            <span className="font-semibold text-terracotta-700">{ROLE_CONFIG[currentRole].name}：</span>
            {ROLE_CONFIG[currentRole].desc}。
            数据范围：<span className="font-semibold">{ROLE_CONFIG[currentRole].scope === 'national' ? '全国所有城市' : '仅本市'}</span>。
            系统将基于此角色进行数据过滤和操作鉴权，所有行为均记录审计日志。
          </p>
        </div>
      </div>
    </Drawer>
  );

  return (
    <div className="space-y-6">
      {contextHolder}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-carbon-800">运营数据总览</h1>
          <p className="text-sm text-ivory-600 mt-1">实时监控平台核心指标 · {currentTime}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div
            onClick={() => setRoleDrawerOpen(true)}
            className={`flex items-center gap-3 pl-3 pr-4 py-2 rounded-xl cursor-pointer transition-all hover:shadow-card-hover border-2 border-transparent hover:border-ivory-200 bg-gradient-to-r ${roleCfg.color} text-white`}
          >
            <div className="w-8 h-8 rounded-lg bg-white/25 backdrop-blur flex items-center justify-center">
              <RoleIcon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium leading-tight">{roleCfg.name}</p>
              <p className="text-[10px] text-white/80 leading-tight">{roleCfg.scope === 'national' ? '全国数据权限' : '本市数据权限'}</p>
            </div>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </div>

          <div className="flex items-center gap-1 p-1 bg-ivory-100 rounded-xl">
            {[{ k: 'day', l: '今日' }, { k: 'week', l: '本周' }, { k: 'month', l: '本月' }].map(t => (
              <button
                key={t.k}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  t.k === 'month' ? 'bg-white text-terracotta-700 shadow-sm' : 'text-carbon-600 hover:text-carbon-800'
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-card p-4 bg-gradient-to-r from-wood-50 via-ivory-50 to-haze-50 border border-ivory-200"
      >
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-wood-500 to-wood-600 flex items-center justify-center shadow-lg shadow-wood-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-carbon-800 flex items-center gap-2">
                权限边界说明 · 当前角色：{roleCfg.name}
              </h3>
              <p className="text-xs text-ivory-600 mt-0.5">{roleCfg.desc}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-wrap items-center gap-2 min-w-[300px]">
            {PERMISSION_MATRIX.slice(0, 5).map(pm => {
              const perms = (pm as any)[currentRole] as string[];
              if (!perms || perms.length === 0) return null;
              return (
                <div key={pm.module} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 border border-ivory-200">
                  <span className="text-xs font-medium text-carbon-700">{pm.module}：</span>
                  {perms.map(p => (
                    <span
                      key={p}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        p === '删除' ? 'bg-rose-50 text-rose-600' :
                        p === '审核' ? 'bg-emerald-50 text-emerald-600' :
                        p === '编辑' ? 'bg-haze-50 text-haze-600' :
                        p === '导出' ? 'bg-wood-50 text-wood-600' :
                        'bg-ivory-100 text-carbon-600'
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setRoleDrawerOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs bg-white text-terracotta-700 border border-terracotta-200 font-medium hover:bg-terracotta-50 transition-colors flex items-center gap-1 shrink-0"
          >
            <UserCog className="w-3.5 h-3.5" />
            切换角色
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Building2}
          title="成交单数"
          value="3,052"
          subInfo="本月累计 · 点击钻取详情"
          gradient="bg-gradient-to-br from-wood-400 to-wood-600"
          trend={{ value: '+18.4%', positive: true }}
          onClick={() => handleDrill('orders')}
        />
        <KPICard
          icon={Star}
          title="平均满意度"
          value="98.6%"
          subInfo="5星率68.2% · 点击看评分分布"
          gradient="bg-gradient-to-br from-terracotta-400 to-terracotta-600"
          trend={{ value: '+0.3%', positive: true }}
          onClick={() => handleDrill('satisfaction')}
        />
        <KPICard
          icon={Store}
          title="服务商总数"
          value="3,521"
          subInfo="待审核18家 · 通过率91.3%"
          gradient="bg-gradient-to-br from-haze-400 to-haze-600"
          trend={{ value: '+42月增', positive: true }}
          onClick={() => handleDrill('providers')}
        />
        <KPICard
          icon={Hammer}
          title="在施工地"
          value="328"
          subInfo="延期14个 · 点击甘特图总览"
          gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
          trend={{ value: '-5较上月', positive: true }}
          onClick={() => handleDrill('sites')}
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5">
          <Card className="!rounded-card !shadow-card !border-ivory-200 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-carbon-800">近30日成交额趋势</h3>
                <p className="text-xs text-ivory-500">平台累计成交与项目数对比</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-terracotta-400" />
                  <span className="text-ivory-600">成交额(万)</span>
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
                <Bar yAxisId="left" dataKey="amount" name="成交额" radius={[6, 6, 0, 0]} barSize={24}>
                  {monthlyData.map((_, index) => (
                    <defs key={index}>
                      <linearGradient id={`barGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D47042" />
                        <stop offset="100%" stopColor="#C4623A" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="projects" name="项目数" stroke="#6B8E9F" strokeWidth={3} dot={{ r: 4, fill: '#6B8E9F', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="!rounded-card !shadow-card !border-ivory-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-carbon-800">装修风格分布</h3>
                <p className="text-xs text-ivory-500">累计成交项目风格占比</p>
              </div>
              <button className="text-xs text-terracotta-600 font-medium hover:underline flex items-center gap-1">
                查看详情 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={styleDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                  {styleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {styleDistribution.slice(0, 4).map((item) => (
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
                <h3 className="font-serif text-lg font-semibold text-carbon-800">城市项目数 TOP10</h3>
                <p className="text-xs text-ivory-500">按累计项目数排序</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cityRankData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DD" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#757064' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="city" tick={{ fontSize: 11, fill: '#757064' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8E4DD', borderRadius: '12px' }} />
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
                <h3 className="font-serif text-lg font-semibold text-carbon-800">操作日志·数据留痕</h3>
                <p className="text-xs text-ivory-500">最近24小时关键操作记录</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-600 font-medium">实时</span>
              </div>
            </div>
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
              {operationLogs.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="relative pl-9 pb-4 border-l-2 border-ivory-200 last:border-l-0 last:pb-0"
                  >
                    <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full ${item.color} flex items-center justify-center ring-4 ring-white shadow-sm`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-carbon-800">{item.user}</span>
                      <span className="text-[10px] font-mono text-ivory-500">{item.time}</span>
                    </div>
                    <p className="text-xs text-carbon-700 font-medium">{item.action}</p>
                    <p className="text-[11px] text-ivory-500 mt-0.5 truncate">对象：{item.target}</p>
                  </motion.div>
                );
              })}
            </div>
            <button className="w-full mt-4 py-2 text-sm text-terracotta-600 font-medium hover:bg-terracotta-50 rounded-btn transition-colors flex items-center justify-center gap-1">
              查看全部日志 <ChevronRight className="w-4 h-4" />
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
              <p className="font-mono text-5xl font-bold text-rose-600 leading-none">14</p>
              <p className="text-sm text-rose-700 mt-2">个项目需要介入</p>
            </div>
            <button
              onClick={() => handleDrill('sites')}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors shadow-sm"
            >
              立即处理 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-5 pt-4 border-t border-rose-200/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-600">严重延期(≥10天)</span>
              <span className="font-mono font-semibold text-rose-700">3 个</span>
            </div>
            <Progress percent={21.4} showInfo={false} strokeColor="#F43F5E" trailColor="#FECDD3" size="small" className="mt-2" />
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
            <button
              onClick={() => message.info('正在跳转到建材SKU管理...')}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm"
            >
              去补货 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-5 pt-4 border-t border-amber-200/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-600">瓷砖/板材类占比</span>
              <span className="font-mono font-semibold text-amber-700">64%</span>
            </div>
            <Progress percent={64} showInfo={false} strokeColor="#F59E0B" trailColor="#FDE68A" size="small" className="mt-2" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative overflow-hidden rounded-card p-6 bg-gradient-to-br from-haze-50 to-haze-100/50 border border-haze-200/60 shadow-card"
        >
          <div className="absolute top-4 right-4 w-16 h-16 rounded-2xl bg-haze-500/10 flex items-center justify-center">
            <MessageCircleQuestion className="w-8 h-8 text-haze-500/70" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-haze-500 text-white flex items-center justify-center shadow-lg shadow-haze-500/20">
              <MessageCircleQuestion className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-haze-700 font-medium">待回复咨询</p>
              <p className="text-xs text-haze-600/70">业主提交的未回复消息</p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-5xl font-bold text-haze-600 leading-none">57</p>
              <p className="text-sm text-haze-700 mt-2">条等待处理</p>
            </div>
            <button
              onClick={() => message.info('正在跳转到客服工作台...')}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-haze-500 text-white text-sm font-medium hover:bg-haze-600 transition-colors shadow-sm"
            >
              去回复 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-5 pt-4 border-t border-haze-200/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-haze-600">超时未回复(＞2h)</span>
              <span className="font-mono font-semibold text-haze-700">9 条</span>
            </div>
            <Progress percent={15.8} showInfo={false} strokeColor="#6B8E9F" trailColor="#CBD5E1" size="small" className="mt-2" />
          </div>
        </motion.div>
      </div>

      {renderDrillModal()}
      {renderRoleDrawer()}
    </div>
  );
};

export default AdminDashboard;