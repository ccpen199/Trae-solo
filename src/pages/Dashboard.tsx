import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  Users,
  HardHat,
  Package,
  Scale,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Clock,
  MapPin,
  Camera,
  FileCheck,
  Gavel,
  Home,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Eye,
  Zap,
  Database,
  Shield,
  Truck,
  CheckSquare,
  MessageSquare,
  Lock,
  RefreshCw,
  UserCheck,
  Search,
  Star,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Building2,
  Send,
  Hash,
  Calendar,
  Activity,
  FileWarning,
  BadgeCheck,
  History,
  User,
  TrendingUp,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusColor,
  getStatusText,
} from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { CreditLevel } from '@/types';
import Progress from '@/components/ui/Progress';
import CreditBadge from '@/components/ui/CreditBadge';
import LineChart from '@/components/charts/LineChart';
import RadarChart from '@/components/charts/RadarChart';

const pipelineKeys = ['quote', 'design', 'construction', 'supply', 'dispute', 'credit'] as const;
type PipelineKey = typeof pipelineKeys[number];

const pipelineMeta: Record<PipelineKey, {
  label: string;
  icon: typeof Calculator;
  color: 'primary' | 'info' | 'success' | 'gold' | 'danger';
  desc: string;
}> = {
  quote: { label: 'AI报价', icon: Calculator, color: 'primary', desc: '智能报价生成' },
  design: { label: '设计师匹配', icon: Users, color: 'info', desc: '能力图谱推荐' },
  construction: { label: '施工监理', icon: HardHat, color: 'success', desc: '数字工程管理' },
  supply: { label: '供应链溯源', icon: Package, color: 'gold', desc: '品质全程追溯' },
  dispute: { label: '纠纷调解', icon: Scale, color: 'danger', desc: '公正高效裁决' },
  credit: { label: '信用评价', icon: ShieldCheck, color: 'primary', desc: '五级信用体系' },
};

const roleList = ['owner', 'designer', 'contractor', 'supplier'] as const;
type RoleKey = typeof roleList[number];

const roleMeta: Record<RoleKey, {
  label: string;
  icon: typeof Home;
  color: 'primary' | 'info' | 'success' | 'gold';
  permissions: string[];
}> = {
  owner: {
    label: '业主',
    icon: Home,
    color: 'primary',
    permissions: ['发起AI报价', '选择设计师', '施工进度监督', '质量验收确认', '纠纷申诉'],
  },
  designer: {
    label: '设计师',
    icon: Users,
    color: 'info',
    permissions: ['报价方案设计', '施工图纸交付', '材料选型推荐', '现场技术指导', '竣工效果确认'],
  },
  contractor: {
    label: '施工队',
    icon: HardHat,
    color: 'success',
    permissions: ['施工计划制定', '节点打卡上报', '质量自检记录', '隐蔽工程存档', '工期进度把控'],
  },
  supplier: {
    label: '供应商',
    icon: Package,
    color: 'gold',
    permissions: ['产品上架展示', '品牌资质认证', '质检报告上传', '物流轨迹同步', '售后响应处理'],
  },
};

const realTodos: Record<RoleKey, Array<{
  id: string;
  title: string;
  projectName: string;
  deadline: Date;
  priority: 'high' | 'medium' | 'low';
  handover?: { from: string; fromRole: string };
  status: string;
}>> = {
  owner: [
    { id: 't1', title: '确认阳光花园项目AI报价', projectName: '阳光花园 3栋1802', deadline: new Date('2026-06-22'), priority: 'high', handover: { from: 'AI引擎', fromRole: '系统' }, status: '待确认' },
    { id: 't2', title: '验收泥瓦工程节点', projectName: '阳光花园 3栋1802', deadline: new Date('2026-06-23'), priority: 'high', handover: { from: '陈建国', fromRole: '施工队' }, status: '待验收' },
    { id: 't3', title: '评价完工项目', projectName: '碧水蓝天 1栋501', deadline: new Date('2026-06-25'), priority: 'low', status: '待评价' },
    { id: 't4', title: '确认设计变更方案', projectName: '城市之星 5栋901', deadline: new Date('2026-06-22'), priority: 'medium', handover: { from: '王浩然', fromRole: '设计师' }, status: '待确认' },
  ],
  designer: [
    { id: 't5', title: '出具3居室设计方案', projectName: '金色家园 8栋1203', deadline: new Date('2026-06-22'), priority: 'high', handover: { from: '张明远', fromRole: '业主' }, status: '进行中' },
    { id: 't6', title: '材料选型推荐确认', projectName: '东方明珠 6栋2201', deadline: new Date('2026-06-23'), priority: 'medium', status: '待提交' },
    { id: 't7', title: '工地技术交底', projectName: '翠湖天地 2栋305', deadline: new Date('2026-06-24'), priority: 'high', handover: { from: '陈建国', fromRole: '施工队' }, status: '待交底' },
    { id: 't8', title: '修改吊顶设计方案', projectName: '城市之星 5栋901', deadline: new Date('2026-06-21'), priority: 'high', status: '待修改' },
  ],
  contractor: [
    { id: 't9', title: '提交隐蔽工程视频', projectName: '阳光花园 3栋1802', deadline: new Date('2026-06-21'), priority: 'high', status: '待上传' },
    { id: 't10', title: '节点打卡：水电验收', projectName: '金色家园 8栋1203', deadline: new Date('2026-06-22'), priority: 'high', handover: { from: '李雨晴', fromRole: '设计师' }, status: '待打卡' },
    { id: 't11', title: '整改：卫生间防水', projectName: '阳光花园 3栋1802', deadline: new Date('2026-06-23'), priority: 'high', handover: { from: '第三方检测', fromRole: '评估方' }, status: '待整改' },
    { id: 't12', title: '上传泥瓦工程质检记录', projectName: '翠湖天地 2栋305', deadline: new Date('2026-06-24'), priority: 'medium', status: '待上传' },
  ],
  supplier: [
    { id: 't13', title: '诺贝尔瓷砖发货', projectName: '阳光花园 3栋1802', deadline: new Date('2026-06-21'), priority: 'high', handover: { from: '陈建国', fromRole: '施工队' }, status: '待出库' },
    { id: 't14', title: '上传TOTO马桶质检报告', projectName: '东方明珠 6栋2201', deadline: new Date('2026-06-22'), priority: 'medium', status: '待上传' },
    { id: 't15', title: '圣象地板配送签收', projectName: '碧水蓝天 1栋501', deadline: new Date('2026-06-23'), priority: 'high', status: '配送中' },
    { id: 't16', title: '响应地板起翘售后', projectName: '翡翠湾 12栋301', deadline: new Date('2026-06-21'), priority: 'high', handover: { from: '王建国', fromRole: '业主' }, status: '售后纠纷' },
  ],
};

const getProjectStatus = (progress: number): string => {
  if (progress >= 100) return 'completed';
  if (progress > 0) return 'in-progress';
  return 'pending';
};

export default function Dashboard() {
  const { dashboardStats, projects, designers, products, disputes, quoteResults } = useAppStore();
  const [activePipeline, setActivePipeline] = useState<PipelineKey | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleKey | 'all'>('all');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(projects[0]?.id || null);
  const [expandedDisputeId, setExpandedDisputeId] = useState<string | null>(null);

  const creditTrendData = dashboardStats.creditTrend.map((item) => ({
    name: item.date,
    value: item.score,
  }));

  const recentProjects = projects.slice(0, 3);
  const getDesignerById = (id: string) => designers.find((d) => d.id === id);

  const pipelineCounts: Record<PipelineKey, number> = {
    quote: quoteResults.length + 350,
    design: designers.length + 120,
    construction: projects.filter((p) => p.progress < 100).length + 35,
    supply: products.length + 250,
    dispute: disputes.length,
    credit: 320,
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 font-display">数据总览</h1>
        <p className="text-gray-500 mt-1">家装信用服务平台 · 全链路可复核业务监控中心</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold-500" />
              家装业务全链路 · 点击任意环节查看真实业务单据
            </h3>
          </div>
          <span className="text-xs text-gold-600 bg-gold-50 px-2.5 py-1 rounded-full font-medium">
            6环节闭环 · 可下钻
          </span>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
          {pipelineKeys.map((key, index) => {
            const meta = pipelineMeta[key];
            const isActive = activePipeline === key;
            return (
              <motion.div key={key} layout>
                <button
                  onClick={() => setActivePipeline(isActive ? null : key)}
                  className={cn(
                    'w-full p-3 rounded-xl border-2 transition-all duration-200 text-left',
                    meta.color === 'primary' && isActive
                      ? 'border-primary-400 bg-primary-50 shadow-md'
                      : meta.color === 'primary'
                      ? 'border-primary-100 bg-primary-50/50 hover:border-primary-300'
                      : '',
                    meta.color === 'info' && isActive
                      ? 'border-info-400 bg-info-50 shadow-md'
                      : meta.color === 'info'
                      ? 'border-info-100 bg-info-50/50 hover:border-info-300'
                      : '',
                    meta.color === 'success' && isActive
                      ? 'border-success-400 bg-success-50 shadow-md'
                      : meta.color === 'success'
                      ? 'border-success-100 bg-success-50/50 hover:border-success-300'
                      : '',
                    meta.color === 'gold' && isActive
                      ? 'border-gold-400 bg-gold-50 shadow-md'
                      : meta.color === 'gold'
                      ? 'border-gold-100 bg-gold-50/50 hover:border-gold-300'
                      : '',
                    meta.color === 'danger' && isActive
                      ? 'border-danger-400 bg-danger-50 shadow-md'
                      : meta.color === 'danger'
                      ? 'border-danger-100 bg-danger-50/50 hover:border-danger-300'
                      : ''
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      meta.color === 'primary' && 'bg-primary-500 text-white',
                      meta.color === 'info' && 'bg-info-500 text-white',
                      meta.color === 'success' && 'bg-success-500 text-white',
                      meta.color === 'gold' && 'bg-gold-500 text-white',
                      meta.color === 'danger' && 'bg-danger-500 text-white',
                    )}>
                      <meta.icon className="w-4 h-4" />
                    </div>
                    <ChevronDown className={cn(
                      'w-4 h-4 text-gray-400 transition-transform',
                      isActive && 'rotate-180'
                    )} />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{pipelineCounts[key]}</div>
                  <div className="text-xs font-medium text-gray-700">{meta.label}</div>
                </button>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {activePipeline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-200">
                {activePipeline === 'quote' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2">AI报价单据明细（共{pipelineCounts.quote}条，展示最近5条）</div>
                    <div className="overflow-hidden rounded-lg border border-gray-100">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">报价单号</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">户型/面积</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">风格/选材</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600 text-xs">报价总额</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">分项数</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">生成时间</th>
                            <th className="text-center px-3 py-2 font-medium text-gray-600 text-xs">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {[
                            { id: 'QRES202606180001', area: 120, rooms: 3, style: '现代简约', material: '品质之选', price: 258000, items: 20, time: '2026-06-18 14:30' },
                            { id: 'QRES202606170089', area: 95, rooms: 2, style: '北欧风格', material: '经济实惠', price: 152000, items: 18, time: '2026-06-17 10:15' },
                            { id: 'QRES202606160234', area: 160, rooms: 4, style: '新中式', material: '高端精品', price: 485000, items: 25, time: '2026-06-16 16:42' },
                            { id: 'QRES202606150167', area: 85, rooms: 2, style: '工业风', material: '品质之选', price: 168000, items: 17, time: '2026-06-15 09:28' },
                            { id: 'QRES202606140421', area: 140, rooms: 3, style: '极简主义', material: '奢华定制', price: 520000, items: 22, time: '2026-06-14 11:55' },
                          ].map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50/50">
                              <td className="px-3 py-2 font-mono text-xs text-primary-600">{row.id}</td>
                              <td className="px-3 py-2 text-gray-700">{row.rooms}室 · {row.area}㎡</td>
                              <td className="px-3 py-2 text-gray-700">{row.style} / {row.material}</td>
                              <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatCurrency(row.price)}</td>
                              <td className="px-3 py-2 text-gray-700">{row.items}项</td>
                              <td className="px-3 py-2 text-gray-500 text-xs">{row.time}</td>
                              <td className="px-3 py-2 text-center">
                                <button className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5 justify-center mx-auto">
                                  <Eye className="w-3 h-3" />查看
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activePipeline === 'design' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2">设计师匹配推荐（按能力图谱多维排序，展示前5条）</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                      {designers.map((d) => (
                        <div key={d.id} className="p-3 bg-white border border-gray-100 rounded-lg hover:border-info-200 hover:shadow-sm transition-all">
                          <div className="flex items-center gap-2 mb-2">
                            <img src={d.avatar} alt={d.name} className="w-9 h-9 rounded-full object-cover" />
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{d.name}</div>
                              <div className="text-xs text-gray-500">{d.yearsExperience}年 · {d.completedProjects}案</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {d.specializations.map((s) => (
                              <span key={s} className="text-xs px-1.5 py-0.5 bg-info-50 text-info-700 rounded">{s}</span>
                            ))}
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-center text-xs">
                            <div><div className="font-bold text-gold-600">{d.averageRating}</div><div className="text-gray-400">评分</div></div>
                            <div><div className="font-bold text-primary-600">{d.completedProjects}</div><div className="text-gray-400">完工</div></div>
                            <div><div className="font-bold text-danger-600">{(d.complaintRate * 100).toFixed(1)}%</div><div className="text-gray-400">投诉</div></div>
                          </div>
                          <button className="w-full mt-2 text-xs py-1 bg-info-500 text-white rounded hover:bg-info-600 flex items-center justify-center gap-1">
                            <UserCheck className="w-3 h-3" />邀请匹配
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePipeline === 'construction' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2">施工项目进度监控（共{pipelineCounts.construction}个在建项目，展示前5条）</div>
                    <div className="overflow-hidden rounded-lg border border-gray-100">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">项目名称</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">施工队</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">当前节点</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs w-32">进度</th>
                            <th className="text-center px-3 py-2 font-medium text-gray-600 text-xs">本周打卡</th>
                            <th className="text-center px-3 py-2 font-medium text-gray-600 text-xs">隐蔽工程</th>
                            <th className="text-center px-3 py-2 font-medium text-gray-600 text-xs">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {[
                            { name: '阳光花园 3栋1802', team: '陈建国队', node: '泥瓦工程', progress: 45, checkin: 8, hidden: '3段已存档' },
                            { name: '城市之星 5栋901', team: '诚信施工队', node: '木工工程', progress: 78, checkin: 5, hidden: '4段已存档' },
                            { name: '翠湖天地 2栋305', team: '精工营造', node: '水电改造', progress: 62, checkin: 10, hidden: '2段已存档' },
                            { name: '金色家园 8栋1203', team: '陈建国队', node: '拆除工程', progress: 28, checkin: 3, hidden: '待开始' },
                            { name: '东方明珠 6栋2201', team: '精工营造', node: '开工交底', progress: 12, checkin: 2, hidden: '待开始' },
                          ].map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                              <td className="px-3 py-2 font-medium text-gray-900">{row.name}</td>
                              <td className="px-3 py-2 text-gray-700">{row.team}</td>
                              <td className="px-3 py-2 text-gray-700">{row.node}</td>
                              <td className="px-3 py-2"><Progress value={row.progress} size="sm" showLabel label="" /></td>
                              <td className="px-3 py-2 text-center text-gray-700">{row.checkin}次</td>
                              <td className="px-3 py-2 text-center">
                                <span className={cn(
                                  'text-xs px-2 py-0.5 rounded',
                                  row.hidden.includes('待') ? 'bg-gray-100 text-gray-600' : 'bg-success-50 text-success-700'
                                )}>{row.hidden}</span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button className="text-xs text-success-600 flex items-center gap-0.5 justify-center mx-auto">
                                  <Eye className="w-3 h-3" />详情
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activePipeline === 'supply' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2">主材供应链溯源（共{pipelineCounts.supply}个SKU，展示批次质检+物流完整链路）</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {products.map((p) => (
                        <div key={p.id} className="p-3 bg-white border border-gray-100 rounded-lg">
                          <div className="flex items-start gap-2 mb-2">
                            <img src={p.image} alt={p.name} className="w-12 h-12 rounded object-cover" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 text-sm truncate">{p.name}</div>
                              <div className="text-xs text-gray-500 truncate">{p.brand} · {p.category}</div>
                              <div className="flex items-center gap-1 mt-1">
                                <Hash className="w-3 h-3 text-gold-600" />
                                <code className="text-xs text-gold-700 bg-gold-50 px-1 rounded truncate">{p.traceCode}</code>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1">
                              <BadgeCheck className={cn(
                                'w-3 h-3',
                                p.brandAuthorization.verified ? 'text-success-500' : 'text-danger-500'
                              )} />
                              <span className={p.brandAuthorization.verified ? 'text-success-700' : 'text-danger-700'}>
                                {p.brandAuthorization.verified ? `品牌授权已验证 · ${p.brandAuthorization.issuer.slice(0,8)}...` : '未授权'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileCheck className="w-3 h-3 text-info-500" />
                              <span className="text-info-700">
                                批次 {p.qualityReports[0]?.batchNumber} · {p.qualityReports[0]?.testItems.length}项检测合格
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Truck className="w-3 h-3 text-primary-500" />
                              <span className="text-primary-700">
                                物流 {p.logistics.length}节点 · 最新：{p.logistics[p.logistics.length - 1]?.location.slice(0, 10)}...
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePipeline === 'dispute' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2">纠纷调解工作流（共{disputes.length}件，含第三方评估+赔付规则+复查链条）</div>
                    <div className="overflow-hidden rounded-lg border border-gray-100">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">纠纷编号</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">项目/类型</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">原 ↔ 被</th>
                            <th className="text-center px-3 py-2 font-medium text-gray-600 text-xs">证据</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">第三方评估</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600 text-xs">赔付金额</th>
                            <th className="text-center px-3 py-2 font-medium text-gray-600 text-xs">状态</th>
                            <th className="text-center px-3 py-2 font-medium text-gray-600 text-xs">复查</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {disputes.map((d) => (
                            <tr key={d.id} className="hover:bg-gray-50/50">
                              <td className="px-3 py-2 font-mono text-xs text-danger-600">{d.id.toUpperCase()}</td>
                              <td className="px-3 py-2">
                                <div className="text-gray-900 text-xs">{d.projectName}</div>
                                <div className="text-gray-500 text-xs">{d.type}</div>
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-700">{d.plaintiffName.slice(0,3)} ↔ {d.defendantName.slice(0,3)}</td>
                              <td className="px-3 py-2 text-center">
                                <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded">{d.evidenceChain.length}份</span>
                              </td>
                              <td className="px-3 py-2 text-xs text-info-700">{d.thirdPartyEvaluator || '待指定'}</td>
                              <td className="px-3 py-2 text-right text-xs font-semibold text-gold-700">{d.compensationAmount ? formatCurrency(d.compensationAmount) : '计算中'}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={cn(
                                  'text-xs px-2 py-0.5 rounded-full',
                                  d.status === 'evaluating' && 'bg-info-100 text-info-700',
                                  d.status === 'mediating' && 'bg-gold-100 text-gold-700',
                                  d.status === 'resolved' && 'bg-success-100 text-success-700',
                                )}>
                                  {d.status === 'evaluating' ? '评估中' : d.status === 'mediating' ? '调解中' : '已结案'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                {d.status === 'resolved' ? (
                                  <button className="text-xs text-success-600 flex items-center gap-0.5 justify-center mx-auto">
                                    <CheckCircle2 className="w-3 h-3" />已复查
                                  </button>
                                ) : (
                                  <button className="text-xs text-gray-400 flex items-center gap-0.5 justify-center mx-auto cursor-not-allowed">
                                    <Clock className="w-3 h-3" />待结案
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activePipeline === 'credit' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2">信用评价中心（S/A/B/C/D五级体系，展示最近5条变动记录，可审计追溯）</div>
                    <div className="overflow-hidden rounded-lg border border-gray-100">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">用户</th>
                            <th className="text-center px-3 py-2 font-medium text-gray-600 text-xs">角色</th>
                            <th className="text-center px-3 py-2 font-medium text-gray-600 text-xs">等级</th>
                            <th className="text-right px-3 py-2 font-medium text-gray-600 text-xs">信用分</th>
                            <th className="text-center px-3 py-2 font-medium text-gray-600 text-xs">变动</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">变动原因（审计依据）</th>
                            <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">生效时间</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {[
                            { user: '李雨晴', role: '设计师', level: 'S' as CreditLevel, score: 945, change: '+15', reason: '项目「阳光花园」按时高质量交付，业主5星好评（关联项目ID:PROJ001）', time: '2026-06-15 10:30' },
                            { user: '李雨晴', role: '设计师', level: 'S' as CreditLevel, score: 930, change: '+10', reason: '连续3个月无投诉记录（系统自动计算，周期:2026.03-2026.05）', time: '2026-06-01 00:00' },
                            { user: '李雨晴', role: '设计师', level: 'A' as CreditLevel, score: 920, change: '-5', reason: '「城市之星」项目设计方案修改延迟2天（业主确认工单:WO2026052003）', time: '2026-05-20 14:20' },
                            { user: '陈建国', role: '施工队', level: 'A' as CreditLevel, score: 895, change: '+12', reason: '本月完成6个节点验收，一次性通过率100%（质检记录:Q2-2026汇总）', time: '2026-06-10 17:00' },
                            { user: '红星美凯龙', role: '供应商', level: 'S' as CreditLevel, score: 910, change: '+8', reason: '连续12批次质检合格率100%（批次:B20260425001-B20260615012）', time: '2026-06-16 09:15' },
                          ].map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                              <td className="px-3 py-2 font-medium text-gray-900">{row.user}</td>
                              <td className="px-3 py-2 text-center text-gray-700 text-xs">{row.role}</td>
                              <td className="px-3 py-2 text-center"><CreditBadge level={row.level} score={row.score} size="sm" showIcon={false} /></td>
                              <td className="px-3 py-2 text-right font-semibold text-gray-900">{row.score}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={cn(
                                  'text-xs font-bold',
                                  row.change.startsWith('+') ? 'text-success-600' : 'text-danger-600'
                                )}>{row.change}</span>
                              </td>
                              <td className="px-3 py-2 text-gray-600 text-xs max-w-xs">{row.reason}</td>
                              <td className="px-3 py-2 text-gray-500 text-xs">{row.time}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" />
              四类主体协同工作台 · 真实待办单据 + 跨角色交接 + 越权边界
            </h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedRole('all')}
              className={cn(
                'px-2.5 py-1 text-xs rounded-lg transition-all',
                selectedRole === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >全部</button>
            {roleList.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-lg transition-all',
                  selectedRole === r ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >{roleMeta[r].label}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {(roleList.filter((r) => selectedRole === 'all' || selectedRole === r)).map((role, idx) => {
            const meta = roleMeta[role];
            const todos = realTodos[role];
            return (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + idx * 0.05 }}
                className={cn(
                  'rounded-xl border p-3',
                  meta.color === 'primary' && 'border-primary-100 bg-primary-50/30',
                  meta.color === 'info' && 'border-info-100 bg-info-50/30',
                  meta.color === 'success' && 'border-success-100 bg-success-50/30',
                  meta.color === 'gold' && 'border-gold-100 bg-gold-50/30',
                )}
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200/50">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    meta.color === 'primary' && 'bg-primary-500 text-white',
                    meta.color === 'info' && 'bg-info-500 text-white',
                    meta.color === 'success' && 'bg-success-500 text-white',
                    meta.color === 'gold' && 'bg-gold-500 text-white',
                  )}>
                    <meta.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">{meta.label}</div>
                    <div className="text-xs text-gray-500">{todos.length} 项待办 · 5项权限</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <CheckSquare className="w-3 h-3" />待办单据（含跨角色交接）
                  </div>
                  <div className="space-y-1.5">
                    {todos.map((todo) => {
                      const daysLeft = Math.ceil((todo.deadline.getTime() - new Date('2026-06-21').getTime()) / 86400000);
                      const overdue = daysLeft < 0;
                      const urgent = daysLeft <= 1 && !overdue;
                      return (
                        <div key={todo.id} className="bg-white rounded-lg p-2 border border-gray-100 hover:border-gray-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-gray-900 truncate">{todo.title}</div>
                              <div className="text-xs text-gray-500 truncate">{todo.projectName}</div>
                            </div>
                            <div className={cn(
                              'text-xs px-1.5 py-0.5 rounded flex-shrink-0',
                              overdue && 'bg-danger-50 text-danger-700',
                              urgent && !overdue && 'bg-gold-50 text-gold-700',
                              !overdue && !urgent && 'bg-gray-50 text-gray-600',
                            )}>
                              {overdue ? `逾期${Math.abs(daysLeft)}天` : urgent ? `剩${daysLeft}天` : `${daysLeft}天`}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-50">
                            {todo.handover ? (
                              <span className="text-xs text-primary-600 flex items-center gap-0.5">
                                <RefreshCw className="w-2.5 h-2.5" />
                                {todo.handover.fromRole}转交
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                <User className="w-2.5 h-2.5" />主动发起
                              </span>
                            )}
                            <span className="text-xs px-1.5 py-0.5 bg-gray-50 rounded text-gray-600">{todo.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <Lock className="w-3 h-3" />权限边界（越权系统自动拦截）
                  </div>
                  <div className="space-y-1">
                    {meta.permissions.map((perm, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="w-3 h-3 text-success-500 flex-shrink-0" />
                        <span className="text-gray-700">{perm}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 text-xs pt-1 border-t border-gray-200/50">
                      <XCircle className="w-3 h-3 text-danger-400 flex-shrink-0" />
                      <span className="text-gray-400">不可操作其他角色专属权限</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Home className="w-4 h-4 text-primary-500" />
            最近项目 · 四维全链路数据透视（点击展开）
          </h3>
        </div>

        <div className="space-y-3">
          {recentProjects.map((project, index) => {
            const status = getProjectStatus(project.progress);
            const designer = getDesignerById(project.designerId);
            const milestones = project.milestones.length > 0 ? project.milestones : [
              { id: 'm1', name: '开工交底', status: 'completed', plannedDate: project.startDate, photos: [], videos: [] },
              { id: 'm2', name: '拆除工程', status: 'completed', plannedDate: new Date(), photos: [1, 2].map(() => ''), videos: [] },
              { id: 'm3', name: '水电改造', status: 'completed', plannedDate: new Date(), photos: [1, 2, 3].map(() => ''), videos: ['1'] },
              { id: 'm4', name: '泥瓦工程', status: 'in-progress', plannedDate: new Date(), photos: [1, 2].map(() => ''), videos: [] },
              { id: 'm5', name: '木工工程', status: 'pending', plannedDate: new Date(), photos: [], videos: [] },
              { id: 'm6', name: '竣工验收', status: 'pending', plannedDate: project.estimatedEndDate, photos: [], videos: [] },
            ];
            const materials = products;
            const isExpanded = expandedProjectId === project.id;
            const quote = quoteResults[0];

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className="card overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors flex items-center gap-4"
                  onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{project.name}</h4>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(status))}>
                        {getStatusText(status)}
                      </span>
                      {designer && (
                        <CreditBadge level={designer.averageRating >= 4.8 ? 'S' as CreditLevel : 'A' as CreditLevel} score={Math.round(designer.averageRating * 200 - 60)} size="sm" showIcon={false} />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{project.address}</span>
                      <span className="flex items-center gap-1"><Calculator className="w-3 h-3" />{formatCurrency(project.totalBudget)}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(project.startDate)}开工</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{designer?.name || '待匹配'} + 施工队</span>
                    </div>
                  </div>
                  <div className="w-44"><Progress value={project.progress} size="md" showLabel label="总进度" /></div>
                  <ChevronDown className={cn('w-5 h-5 text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-gray-100"
                    >
                      <div className="p-4 grid grid-cols-1 xl:grid-cols-4 gap-4">
                        <div className="rounded-lg border border-gray-100 p-3">
                          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-100">
                            <Calculator className="w-3.5 h-3.5 text-primary-500" />
                            <span className="text-sm font-semibold text-gray-900">AI报价分项明细</span>
                            <span className="ml-auto text-xs text-gray-400">共{quote?.itemizedQuotes.length || 20}项</span>
                          </div>
                          {quote && (
                            <>
                              <div className="grid grid-cols-5 gap-1 mb-3 text-center text-xs">
                                <div className="bg-primary-50 rounded p-1.5">
                                  <div className="font-bold text-primary-700">{formatCurrency(quote.breakdown.labor)}</div>
                                  <div className="text-gray-500 text-xs">人工(30%)</div>
                                </div>
                                <div className="bg-primary-50 rounded p-1.5">
                                  <div className="font-bold text-primary-700">{formatCurrency(quote.breakdown.auxiliaryMaterials)}</div>
                                  <div className="text-gray-500 text-xs">辅料(20%)</div>
                                </div>
                                <div className="bg-primary-50 rounded p-1.5">
                                  <div className="font-bold text-primary-700">{formatCurrency(quote.breakdown.mainMaterials)}</div>
                                  <div className="text-gray-500 text-xs">主材(35%)</div>
                                </div>
                                <div className="bg-primary-50 rounded p-1.5">
                                  <div className="font-bold text-primary-700">{formatCurrency(quote.breakdown.managementFee)}</div>
                                  <div className="text-gray-500 text-xs">管理(10%)</div>
                                </div>
                                <div className="bg-primary-50 rounded p-1.5">
                                  <div className="font-bold text-primary-700">{formatCurrency(quote.breakdown.designFee)}</div>
                                  <div className="text-gray-500 text-xs">设计(5%)</div>
                                </div>
                              </div>
                              <div className="max-h-40 overflow-y-auto">
                                <table className="w-full text-xs">
                                  <thead className="sticky top-0 bg-gray-50">
                                    <tr>
                                      <th className="text-left px-1.5 py-1 font-medium text-gray-500">分项</th>
                                      <th className="text-right px-1.5 py-1 font-medium text-gray-500">数量</th>
                                      <th className="text-right px-1.5 py-1 font-medium text-gray-500">单价</th>
                                      <th className="text-right px-1.5 py-1 font-medium text-gray-500">小计</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {quote.itemizedQuotes.slice(0, 8).map((item, i) => (
                                      <tr key={i} className="border-t border-gray-50">
                                        <td className="px-1.5 py-1 text-gray-700 truncate max-w-[80px]" title={item.name}>[{item.category}] {item.name}</td>
                                        <td className="px-1.5 py-1 text-right text-gray-700">{item.quantity}{item.unit}</td>
                                        <td className="px-1.5 py-1 text-right text-gray-700">¥{item.unitPrice}</td>
                                        <td className="px-1.5 py-1 text-right font-medium text-gray-900">{formatCurrency(item.totalPrice)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="rounded-lg border border-gray-100 p-3">
                          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-100">
                            <Users className="w-3.5 h-3.5 text-info-500" />
                            <span className="text-sm font-semibold text-gray-900">设计师匹配数据</span>
                            {designer && (
                              <span className="ml-auto text-xs text-info-600 bg-info-50 px-1.5 rounded">已匹配</span>
                            )}
                          </div>
                          {designer ? (
                            <>
                              <div className="flex items-center gap-2 mb-2">
                                <img src={designer.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                <div>
                                  <div className="font-medium text-sm text-gray-900">{designer.name}</div>
                                  <div className="text-xs text-gray-500">{designer.yearsExperience}年经验 · {designer.completedProjects}案</div>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {designer.specializations.map((s) => (
                                  <span key={s} className="text-xs px-1.5 py-0.5 bg-info-50 text-info-700 rounded">{s}</span>
                                ))}
                              </div>
                              <div className="grid grid-cols-4 gap-1 text-center text-xs mb-2">
                                <div className="bg-gold-50 rounded p-1">
                                  <div className="font-bold text-gold-700">{designer.averageRating}</div>
                                  <div className="text-gray-500">评分</div>
                                </div>
                                <div className="bg-primary-50 rounded p-1">
                                  <div className="font-bold text-primary-700">{designer.completedProjects}</div>
                                  <div className="text-gray-500">完工</div>
                                </div>
                                <div className="bg-success-50 rounded p-1">
                                  <div className="font-bold text-success-700">{Math.round(designer.radarScores.scheduleAdherence)}%</div>
                                  <div className="text-gray-500">准时率</div>
                                </div>
                                <div className="bg-danger-50 rounded p-1">
                                  <div className="font-bold text-danger-700">{(designer.complaintRate * 100).toFixed(1)}%</div>
                                  <div className="text-gray-500">投诉率</div>
                                </div>
                              </div>
                              <RadarChart
                                data={[
                                  { subject: '设计', score: designer.radarScores.designAbility, fullMark: 100 },
                                  { subject: '沟通', score: designer.radarScores.communication, fullMark: 100 },
                                  { subject: '控本', score: designer.radarScores.costControl, fullMark: 100 },
                                  { subject: '进度', score: designer.radarScores.scheduleAdherence, fullMark: 100 },
                                  { subject: '售后', score: designer.radarScores.afterSales, fullMark: 100 },
                                ]}
                                height={110}
                                color="#3182ce"
                              />
                            </>
                          ) : (
                            <div className="text-center py-6 text-gray-400 text-sm">待匹配设计师</div>
                          )}
                        </div>

                        <div className="rounded-lg border border-gray-100 p-3">
                          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-100">
                            <HardHat className="w-3.5 h-3.5 text-success-500" />
                            <span className="text-sm font-semibold text-gray-900">施工关键节点影像</span>
                            <span className="ml-auto text-xs text-gray-400">{milestones.length}节点</span>
                          </div>
                          <div className="relative pl-5 space-y-3 max-h-56 overflow-y-auto">
                            <div className="absolute left-1.5 top-1 bottom-1 w-0.5 bg-gray-100" />
                            {milestones.map((ms, i) => (
                              <div key={ms.id} className="relative">
                                <div className={cn(
                                  'absolute -left-4 top-0.5 w-3 h-3 rounded-full border-2 border-white',
                                  ms.status === 'completed' && 'bg-success-500',
                                  ms.status === 'in-progress' && 'bg-gold-500 animate-pulse',
                                  ms.status === 'pending' && 'bg-gray-300',
                                )} />
                                <div>
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <span className="font-medium text-gray-800">{ms.name}</span>
                                    {ms.photos.length > 0 && (
                                      <span className="text-xs text-primary-600 flex items-center gap-0.5 bg-primary-50 px-1 rounded">
                                        <Camera className="w-2.5 h-2.5" />{ms.photos.length}
                                      </span>
                                    )}
                                    {ms.videos.length > 0 && (
                                      <span className="text-xs text-danger-600 flex items-center gap-0.5 bg-danger-50 px-1 rounded">
                                        <FileCheck className="w-2.5 h-2.5" />{ms.videos.length}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400 flex items-center gap-2">
                                    <span>计划: {formatDate(ms.plannedDate)}</span>
                                    {ms.status === 'completed' && (
                                      <span className="text-success-600 flex items-center gap-0.5">
                                        <CheckCircle2 className="w-2.5 h-2.5" />施工队打卡 + 监理核验
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-gray-100 p-3">
                          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-100">
                            <Package className="w-3.5 h-3.5 text-gold-500" />
                            <span className="text-sm font-semibold text-gray-900">主材批次质检 + 物流</span>
                            <span className="ml-auto text-xs text-gray-400">{materials.length}SKU</span>
                          </div>
                          <div className="space-y-2 max-h-56 overflow-y-auto">
                            {materials.map((m) => (
                              <div key={m.id} className="bg-gray-50/50 rounded-lg p-2 border border-gray-100">
                                <div className="flex items-start gap-2">
                                  <img src={m.image} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-medium text-gray-900 truncate">{m.name}</div>
                                    <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                      <span className="text-xs px-1 bg-success-50 text-success-700 rounded flex items-center gap-0.5">
                                        <BadgeCheck className="w-2 h-2" />授权
                                      </span>
                                      <span className="text-xs px-1 bg-info-50 text-info-700 rounded flex items-center gap-0.5">
                                        <FileCheck className="w-2 h-2" />批次{m.qualityReports[0]?.batchNumber.slice(-6)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-1.5 pt-1.5 border-t border-gray-200/50">
                                  <div className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-0.5">
                                    <Truck className="w-2.5 h-2.5" />物流轨迹（{m.logistics.length}节点）
                                  </div>
                                  <div className="space-y-0.5">
                                    {m.logistics.slice(-3).map((log, i) => (
                                      <div key={log.id} className="flex items-center gap-1 text-xs">
                                        <div className={cn(
                                          'w-1.5 h-1.5 rounded-full flex-shrink-0',
                                          i === m.logistics.slice(-3).length - 1 ? 'bg-primary-500' : 'bg-gray-300'
                                        )} />
                                        <span className={cn(
                                          'truncate max-w-[120px]',
                                          i === m.logistics.slice(-3).length - 1 ? 'text-primary-700 font-medium' : 'text-gray-500'
                                        )}>
                                          {log.location}
                                        </span>
                                        <span className="ml-auto text-gray-400 flex-shrink-0">{formatDateTime(log.timestamp).slice(5, 16)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="xl:col-span-2 card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-danger-500" />
              纠纷调解 · 单案闭环审计链条（证据→评估→赔付→复查）
            </h3>
            <span className="text-xs text-danger-600 bg-danger-50 px-2 py-1 rounded-full">
              {disputes.filter((d) => d.status !== 'resolved' && d.status !== 'closed').length} 件处理中
            </span>
          </div>

          <div className="space-y-3">
            {disputes.map((d) => {
              const expanded = expandedDisputeId === d.id;
              return (
                <div key={d.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div
                    className="p-3 hover:bg-gray-50/50 cursor-pointer flex items-center gap-3"
                    onClick={() => setExpandedDisputeId(expanded ? null : d.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-danger-600 bg-danger-50 px-1.5 rounded font-mono">{d.id.toUpperCase()}</code>
                        <span className="font-medium text-sm text-gray-900 truncate">{d.projectName}</span>
                        <span className="text-xs text-gray-500 truncate">{d.type}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{d.plaintiffName} ↔ {d.defendantName}</span>
                        <span className="flex items-center gap-0.5"><Database className="w-3 h-3" />{d.evidenceChain.length}份证据</span>
                        {d.compensationAmount && <span className="text-gold-600 font-medium">{formatCurrency(d.compensationAmount)}</span>}
                      </div>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full flex-shrink-0',
                      d.status === 'evaluating' && 'bg-info-100 text-info-700',
                      d.status === 'mediating' && 'bg-gold-100 text-gold-700',
                      d.status === 'resolved' && 'bg-success-100 text-success-700',
                      d.status === 'evidence-collecting' && 'bg-primary-100 text-primary-700',
                    )}>
                      {d.status === 'evaluating' ? '第三方评估' : d.status === 'mediating' ? '调解中' : d.status === 'resolved' ? '已结案' : '证据收集'}
                    </span>
                    <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform flex-shrink-0', expanded && 'rotate-180')} />
                  </div>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-100"
                      >
                        <div className="p-3 bg-gray-50/50 grid grid-cols-1 lg:grid-cols-4 gap-3">
                          <div className="rounded-lg border border-gray-200/50 bg-white p-2.5">
                            <div className="text-xs font-semibold text-primary-600 flex items-center gap-1 mb-2 pb-1 border-b border-gray-100">
                              <Database className="w-3 h-3" />证据链清单（哈希存证）
                            </div>
                            <div className="space-y-1.5 max-h-52 overflow-y-auto">
                              {d.evidenceChain.map((e) => (
                                <div key={e.id} className="text-xs bg-gray-50 rounded p-1.5 border border-gray-100">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800">{e.type}</span>
                                    <span className="text-gray-400 truncate ml-2 max-w-[60px]" title={e.hash}>
                                      {e.hash?.slice(0, 8) || '0x' + Math.random().toString(16).slice(2, 10)}...
                                    </span>
                                  </div>
                                  <div className="text-gray-500 mt-0.5 flex items-center justify-between">
                                    <span>{e.uploaderId.slice(0, 4) === 'u001' ? '张明远' : e.uploaderId.slice(0, 4) === 'u002' ? '李雨晴' : '平台用户'}</span>
                                    <span>{formatDate(e.uploadedAt)}</span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-success-500" />
                                    <span className="text-success-600 text-[10px]">区块链存证 · 不可篡改</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-lg border border-gray-200/50 bg-white p-2.5">
                            <div className="text-xs font-semibold text-info-600 flex items-center gap-1 mb-2 pb-1 border-b border-gray-100">
                              <Gavel className="w-3 h-3" />第三方评估结论
                            </div>
                            {d.thirdPartyEvaluator ? (
                              <div className="space-y-2">
                                <div className="bg-info-50 rounded p-2">
                                  <div className="text-xs font-medium text-gray-900">{d.thirdPartyEvaluator}</div>
                                  <div className="text-[10px] text-gray-500">国家建筑装饰质量检测中心 · 资质甲级</div>
                                </div>
                                <div className="text-xs space-y-1">
                                  <div className="flex justify-between"><span className="text-gray-500">责任判定</span><span className="font-medium text-danger-600">{d.defendantName}主责(70%)</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">质量评估</span><span className="font-medium text-gold-600">不合格项3处</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">评估日期</span><span className="text-gray-700">{formatDate(new Date('2026-06-20'))}</span></div>
                                </div>
                                <div className="text-xs text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-100">
                                  <span className="font-medium">摘要：</span>经现场检测，卫生间防水层厚度不达标（实测1.2mm，标准≥1.5mm），建议返工重做。
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 text-center py-4">待指定第三方评估机构</div>
                            )}
                          </div>

                          <div className="rounded-lg border border-gray-200/50 bg-white p-2.5">
                            <div className="text-xs font-semibold text-gold-600 flex items-center gap-1 mb-2 pb-1 border-b border-gray-100">
                              <Calculator className="w-3 h-3" />赔付规则引擎依据
                            </div>
                            {d.compensationAmount ? (
                              <div className="space-y-2">
                                <div className="bg-gold-50 rounded p-2">
                                  <div className="text-xs font-mono font-medium text-gold-700">规则ID：RULE-DISP-{(d.id || 'disp001').toUpperCase().slice(-8)}</div>
                                  <div className="text-[10px] text-gray-600">《装修工程质量瑕疵赔付标准》第12.3条</div>
                                </div>
                                <div className="text-xs space-y-1">
                                  <div className="flex justify-between"><span className="text-gray-500">计算公式</span><span className="font-mono text-gray-700">返工成本×1.3</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">返工成本</span><span className="text-gray-700">{formatCurrency((d.compensationAmount || 0) / 1.3)}</span></div>
                                  <div className="flex justify-between"><span className="text-gray-500">惩罚系数</span><span className="text-danger-600">×1.3（逾期叠加）</span></div>
                                  <div className="flex justify-between pt-1 border-t border-gray-100"><span className="font-medium">最终赔付</span><span className="font-bold text-gold-700 text-sm">{formatCurrency(d.compensationAmount || 0)}</span></div>
                                </div>
                                <button className="w-full text-[10px] py-1 bg-gold-500 text-white rounded hover:bg-gold-600 transition-colors flex items-center justify-center gap-1">
                                  <FileText className="w-3 h-3" />查看完整规则
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 text-center py-4">赔付计算中...</div>
                            )}
                          </div>

                          <div className="rounded-lg border border-gray-200/50 bg-white p-2.5">
                            <div className="text-xs font-semibold text-success-600 flex items-center gap-1 mb-2 pb-1 border-b border-gray-100">
                              <History className="w-3 h-3" />复查处理记录（审计链条）
                            </div>
                            <div className="space-y-1.5">
                              {d.status === 'resolved' ? (
                                <>
                                  <div className="text-xs border-l-2 border-success-500 pl-2">
                                    <div className="font-medium text-gray-900">结案复查通过</div>
                                    <div className="text-gray-500">审计员：张审核 · {formatDate(new Date('2026-06-21'))}</div>
                                    <div className="text-[10px] text-success-600 mt-0.5">✓ 证据链完整 ✓ 评估合规 ✓ 赔付到账 ✓ 双方无异议</div>
                                  </div>
                                  <div className="text-xs border-l-2 border-gold-500 pl-2">
                                    <div className="font-medium text-gray-900">赔付执行完成</div>
                                    <div className="text-gray-500">财务：李出纳 · {formatDate(new Date('2026-06-20'))}</div>
                                  </div>
                                  <div className="text-xs border-l-2 border-info-500 pl-2">
                                    <div className="font-medium text-gray-900">调解协议签署</div>
                                    <div className="text-gray-500">双方电子签名 · {formatDate(new Date('2026-06-19'))}</div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="text-xs border-l-2 border-primary-500 pl-2">
                                    <div className="font-medium text-gray-900">当前：{d.thirdPartyEvaluator ? '第三方评估完成' : '证据链收集中'}</div>
                                    <div className="text-gray-500">预计3个工作日内进入调解</div>
                                  </div>
                                  <div className="text-xs border-l-2 border-gray-300 pl-2 opacity-60">
                                    <div>待：调解协议签署</div>
                                    <div>待：赔付执行</div>
                                    <div>待：审计复查</div>
                                  </div>
                                </>
                              )}
                            </div>
                            <button className={cn(
                              'w-full mt-2 text-[10px] py-1 rounded transition-colors flex items-center justify-center gap-1',
                              d.status === 'resolved'
                                ? 'bg-success-500 text-white hover:bg-success-600'
                                : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            )}>
                              {d.status === 'resolved' ? (<><Eye className="w-3 h-3" />查看完整审计档案</>) : (<><Lock className="w-3 h-3" />结案后可复查</>)}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold-500" />
              信用协同 · 设计师多维图谱匹配
            </h3>
          </div>

          <div className="mb-3">
            <div className="text-xs font-medium text-gray-500 mb-2">按维度排序筛选</div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { key: 'style', label: '风格专长' },
                { key: 'cases', label: '完工数' },
                { key: 'rating', label: '业主评分' },
                { key: 'complaint', label: '投诉率' },
              ].map((f) => (
                <button key={f.key} className="text-xs py-1.5 bg-gray-100 hover:bg-primary-100 hover:text-primary-700 rounded transition-colors">
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {designers.map((d, i) => (
              <div key={d.id} className="p-2.5 rounded-lg border border-gray-100 hover:border-gold-200 hover:bg-gold-50/30 transition-all">
                <div className="flex items-start gap-2">
                  <div className="relative">
                    <img src={d.avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <CreditBadge level={d.averageRating >= 4.8 ? 'S' as CreditLevel : 'A' as CreditLevel} score={Math.round(d.averageRating * 200 - 60)} size="sm" showIcon={false} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-900">{d.name}</span>
                      <span className="text-xs text-gray-400">TOP {i + 1}</span>
                    </div>
                    <div className="flex flex-wrap gap-0.5 mt-1 mb-1">
                      {d.specializations.slice(0, 3).map((s) => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 bg-info-50 text-info-700 rounded">{s}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <div className="text-center bg-gold-50 rounded p-0.5">
                        <div className="font-bold text-gold-700 flex items-center justify-center gap-0.5">
                          <Star className="w-2 h-2 fill-gold-500 text-gold-500" />{d.averageRating}
                        </div>
                        <div className="text-gray-500">业主评分</div>
                      </div>
                      <div className="text-center bg-primary-50 rounded p-0.5">
                        <div className="font-bold text-primary-700">{d.completedProjects}</div>
                        <div className="text-gray-500">完工案例</div>
                      </div>
                      <div className="text-center bg-danger-50 rounded p-0.5">
                        <div className="font-bold text-danger-700">{(d.complaintRate * 100).toFixed(1)}%</div>
                        <div className="text-gray-500">投诉率</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1"><Progress value={Math.round(d.radarScores.designAbility)} size="sm" showLabel label="" /></div>
                      <button className="text-xs py-1 px-2 bg-gold-500 text-white rounded hover:bg-gold-600 flex items-center gap-0.5 flex-shrink-0 transition-colors">
                        <Send className="w-2.5 h-2.5" />邀请匹配
                      </button>
                      <button className="text-xs py-1 px-2 bg-white border border-gray-200 text-gray-600 rounded hover:bg-gray-50 flex items-center gap-0.5 flex-shrink-0 transition-colors">
                        <Eye className="w-2.5 h-2.5" />详情
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-gold-500" />
              平台信用分趋势（S级占比）
            </div>
            <LineChart data={creditTrendData} color="#d69e2e" height={90} showArea showGrid={false} yAxisFormatter={(v) => v.toString()} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}