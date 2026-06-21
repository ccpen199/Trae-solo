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
  Star,
  AlertTriangle,
  Clock,
  MapPin,
  Camera,
  FileCheck,
  Gavel,
  TrendingUp,
  Home,
  User,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Eye,
  Zap,
  Database,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatDate, getStatusColor, getStatusText, getCreditLevelColor } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { CreditLevel } from '@/types';
import Progress from '@/components/ui/Progress';
import CreditBadge from '@/components/ui/CreditBadge';
import LineChart from '@/components/charts/LineChart';
import RadarChart from '@/components/charts/RadarChart';

const businessPipeline = [
  { key: 'quote', label: 'AI报价', icon: Calculator, color: 'primary', count: 356, desc: '智能报价生成' },
  { key: 'design', label: '设计师匹配', icon: Users, color: 'info', count: 128, desc: '能力图谱推荐' },
  { key: 'construction', label: '施工监理', icon: HardHat, color: 'success', count: 42, desc: '数字工程管理' },
  { key: 'supply', label: '供应链溯源', icon: Package, color: 'gold', count: 256, desc: '品质全程追溯' },
  { key: 'dispute', label: '纠纷调解', icon: Scale, color: 'danger', count: 8, desc: '公正高效裁决' },
  { key: 'credit', label: '信用评价', icon: ShieldCheck, color: 'primary', count: 320, desc: '五级信用体系' },
];

const rolePermissions = [
  {
    role: 'owner',
    label: '业主',
    icon: Home,
    color: 'primary',
    todos: ['待确认报价 3', '待验收节点 2', '待评价项目 1'],
    permissions: ['发起AI报价', '选择设计师', '施工进度监督', '质量验收确认', '纠纷申诉'],
  },
  {
    role: 'designer',
    label: '设计师',
    icon: Users,
    color: 'info',
    todos: ['待出方案 5', '待业主确认 3', '待工地交底 2'],
    permissions: ['报价方案设计', '施工图纸交付', '材料选型推荐', '现场技术指导', '竣工效果确认'],
  },
  {
    role: 'contractor',
    label: '施工队',
    icon: HardHat,
    color: 'success',
    todos: ['待开工 2', '待节点验收 4', '待整改 1'],
    permissions: ['施工计划制定', '节点打卡上报', '质量自检记录', '隐蔽工程存档', '工期进度把控'],
  },
  {
    role: 'supplier',
    label: '供应商',
    icon: Package,
    color: 'gold',
    todos: ['待发货 6', '待签收 3', '质检报告待上传 2'],
    permissions: ['产品上架展示', '品牌资质认证', '质检报告上传', '物流轨迹同步', '售后响应处理'],
  },
];

const getProjectStatus = (progress: number): string => {
  if (progress >= 100) return 'completed';
  if (progress > 0) return 'in-progress';
  return 'pending';
};

export default function Dashboard() {
  const { dashboardStats, projects, designers, products, disputes, users } = useAppStore();
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const creditTrendData = dashboardStats.creditTrend.map((item) => ({
    name: item.date,
    value: item.score,
  }));

  const recentProjects = projects.slice(0, 3);

  const getDesignerById = (id: string) => designers.find((d) => d.id === id);

  const getProjectMaterials = (projectId: string) => {
    return products.slice(0, 2).map((p) => ({
      ...p,
      projectId,
    }));
  };

  const getProjectMilestones = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.milestones.slice(0, 4) || [];
  };

  const activeDisputes = disputes.filter((d) => d.status !== 'closed' && d.status !== 'resolved');

  const creditRankings: { rank: number; name: string; role: string; score: number; level: CreditLevel; change: string }[] = [
    { rank: 1, name: '李雨晴', role: '设计师', score: 945, level: 'S', change: '+15' },
    { rank: 2, name: '红星美凯龙', role: '供应商', score: 910, level: 'S', change: '+8' },
    { rank: 3, name: '陈建国', role: '施工队', score: 895, level: 'A', change: '+12' },
    { rank: 4, name: '王浩然', role: '设计师', score: 880, level: 'A', change: '-3' },
    { rank: 5, name: '张明远', role: '业主', score: 920, level: 'S', change: '+5' },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 font-display">数据总览</h1>
        <p className="text-gray-500 mt-1">家装信用服务平台 · 业务全链路监控中心</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-gold-500" />
              家装业务全链路
            </h3>
            <p className="text-sm text-gray-500 mt-1">AI报价 → 设计师匹配 → 施工监理 → 供应链溯源 → 纠纷调解 → 信用评价</p>
          </div>
          <span className="text-xs text-gold-600 bg-gold-50 px-3 py-1 rounded-full font-medium">
            闭环管理
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {businessPipeline.map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.08 }}
              className="relative group cursor-pointer"
            >
              <div className={cn(
                'p-4 rounded-xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                item.color === 'primary' && 'border-primary-100 hover:border-primary-300 bg-primary-50/50',
                item.color === 'info' && 'border-info-100 hover:border-info-300 bg-info-50/50',
                item.color === 'success' && 'border-success-100 hover:border-success-300 bg-success-50/50',
                item.color === 'gold' && 'border-gold-100 hover:border-gold-300 bg-gold-50/50',
                item.color === 'danger' && 'border-danger-100 hover:border-danger-300 bg-danger-50/50',
              )}>
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                  item.color === 'primary' && 'bg-primary-500 text-white',
                  item.color === 'info' && 'bg-info-500 text-white',
                  item.color === 'success' && 'bg-success-500 text-white',
                  item.color === 'gold' && 'bg-gold-500 text-white',
                  item.color === 'danger' && 'bg-danger-500 text-white',
                )}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{item.count}</div>
                <div className="text-sm font-medium text-gray-700 mt-1">{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
              </div>
              {index < businessPipeline.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              四类主体协同工作台
            </h3>
            <p className="text-sm text-gray-500 mt-1">各角色待办事项与权限边界</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedRole('all')}
              className={cn(
                'px-3 py-1.5 text-xs rounded-lg transition-all',
                selectedRole === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              全部
            </button>
            {rolePermissions.map((r) => (
              <button
                key={r.role}
                onClick={() => setSelectedRole(r.role)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-lg transition-all',
                  selectedRole === r.role
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="wait">
            {rolePermissions
              .filter((r) => selectedRole === 'all' || selectedRole === r.role)
              .map((role, index) => (
                <motion.div
                  key={role.role}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={cn(
                    'p-4 rounded-xl border',
                    role.color === 'primary' && 'border-primary-100 bg-primary-50/30',
                    role.color === 'info' && 'border-info-100 bg-info-50/30',
                    role.color === 'success' && 'border-success-100 bg-success-50/30',
                    role.color === 'gold' && 'border-gold-100 bg-gold-50/30',
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      role.color === 'primary' && 'bg-primary-500 text-white',
                      role.color === 'info' && 'bg-info-500 text-white',
                      role.color === 'success' && 'bg-success-500 text-white',
                      role.color === 'gold' && 'bg-gold-500 text-white',
                    )}>
                      <role.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{role.label}</div>
                      <div className="text-xs text-gray-500">{role.todos.length} 项待办</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-xs font-medium text-gray-500">待办事项</div>
                    {role.todos.map((todo, i) => (
                      <div key={i} className="text-sm text-gray-700 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" />
                        <span className="truncate">{todo}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-gray-200/50">
                    <div className="text-xs font-medium text-gray-500 mb-2">权限范围</div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((perm, i) => (
                        <span
                          key={i}
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            role.color === 'primary' && 'bg-primary-100 text-primary-700',
                            role.color === 'info' && 'bg-info-100 text-info-700',
                            role.color === 'success' && 'bg-success-100 text-success-700',
                            role.color === 'gold' && 'bg-gold-100 text-gold-700',
                          )}
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Home className="w-5 h-5 text-primary-500" />
            最近项目 · 全链路数据透视
          </h3>
          <span className="text-sm text-gray-500">点击展开查看报价/设计/施工/主材详细信息</span>
        </div>

        <div className="space-y-4">
          {recentProjects.map((project, index) => {
            const status = getProjectStatus(project.progress);
            const designer = getDesignerById(project.designerId);
            const milestones = getProjectMilestones(project.id);
            const materials = getProjectMaterials(project.id);
            const isExpanded = expandedProjectId === project.id;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className="card overflow-hidden"
              >
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900 text-lg">{project.name}</h4>
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getStatusColor(status)
                        )}>
                          {getStatusText(status)}
                        </span>
                        {designer && (
                          <CreditBadge
                            level={designer.averageRating >= 4.8 ? 'S' : 'A' as CreditLevel}
                            score={Math.round(designer.averageRating * 200 - 60)}
                            size="sm"
                            showIcon={false}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {project.address}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calculator className="w-4 h-4" />
                          {formatCurrency(project.totalBudget)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(project.startDate)} 开工
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-40">
                        <Progress value={project.progress} size="md" showLabel label="施工进度" />
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-gray-400"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </motion.div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-gray-100">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-5">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <Calculator className="w-4 h-4 text-primary-500" />
                              AI报价分项
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">人工费用</span>
                                <span className="font-medium">{formatCurrency(project.totalBudget * 0.3)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">辅料费用</span>
                                <span className="font-medium">{formatCurrency(project.totalBudget * 0.2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">主材费用</span>
                                <span className="font-medium">{formatCurrency(project.totalBudget * 0.35)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">管理费用</span>
                                <span className="font-medium">{formatCurrency(project.totalBudget * 0.1)}</span>
                              </div>
                              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                                <span className="text-gray-700 font-medium">报价总额</span>
                                <span className="font-bold text-primary-600">{formatCurrency(project.totalBudget)}</span>
                              </div>
                            </div>
                            <button className="w-full mt-2 text-xs text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              查看完整报价单
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <Users className="w-4 h-4 text-info-500" />
                              设计师信息
                            </div>
                            {designer ? (
                              <>
                                <div className="flex items-center gap-3">
                                  <img
                                    src={designer.avatar}
                                    alt={designer.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                  <div>
                                    <div className="font-medium text-gray-900">{designer.name}</div>
                                    <div className="text-xs text-gray-500">{designer.specializations[0]} · {designer.yearsExperience}年经验</div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="bg-gray-50 rounded-lg p-2">
                                    <div className="text-lg font-bold text-gold-600">{designer.averageRating}</div>
                                    <div className="text-xs text-gray-500">业主评分</div>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-2">
                                    <div className="text-lg font-bold text-primary-600">{designer.completedProjects}</div>
                                    <div className="text-xs text-gray-500">完工案例</div>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-2">
                                    <div className="text-lg font-bold text-danger-600">{(designer.complaintRate * 100).toFixed(1)}%</div>
                                    <div className="text-xs text-gray-500">投诉率</div>
                                  </div>
                                </div>
                                <RadarChart
                                  data={[
                                    { subject: '设计能力', score: designer.radarScores.designAbility, fullMark: 100 },
                                    { subject: '沟通协调', score: designer.radarScores.communication, fullMark: 100 },
                                    { subject: '成本控制', score: designer.radarScores.costControl, fullMark: 100 },
                                    { subject: '进度把控', score: designer.radarScores.scheduleAdherence, fullMark: 100 },
                                    { subject: '售后服务', score: designer.radarScores.afterSales, fullMark: 100 },
                                  ]}
                                  height={120}
                                  color="#3182ce"
                                />
                              </>
                            ) : (
                              <div className="text-sm text-gray-500">暂未匹配设计师</div>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <Camera className="w-4 h-4 text-success-500" />
                              施工关键节点
                            </div>
                            <div className="space-y-2">
                              {milestones.map((ms) => (
                                <div key={ms.id} className="flex items-center gap-3">
                                  <div className={cn(
                                    'w-2 h-2 rounded-full flex-shrink-0',
                                    ms.status === 'completed' && 'bg-success-500',
                                    ms.status === 'in-progress' && 'bg-gold-500 animate-pulse',
                                    ms.status === 'pending' && 'bg-gray-300',
                                  )} />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-700 flex items-center gap-2">
                                      {ms.name}
                                      {ms.photos.length > 0 && (
                                        <span className="text-xs text-primary-600 flex items-center gap-0.5">
                                          <Camera className="w-3 h-3" />
                                          {ms.photos.length}张
                                        </span>
                                      )}
                                      {ms.videos.length > 0 && (
                                        <span className="text-xs text-danger-600 flex items-center gap-0.5">
                                          <FileCheck className="w-3 h-3" />
                                          {ms.videos.length}个
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      计划: {formatDate(ms.plannedDate)}
                                    </div>
                                  </div>
                                  <span className={cn(
                                    'text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0',
                                    ms.status === 'completed' && 'bg-success-100 text-success-700',
                                    ms.status === 'in-progress' && 'bg-gold-100 text-gold-700',
                                    ms.status === 'pending' && 'bg-gray-100 text-gray-600',
                                  )}>
                                    {ms.status === 'completed' ? '已完成' : ms.status === 'in-progress' ? '进行中' : '待开始'}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <button className="w-full mt-2 text-xs text-success-600 hover:text-success-700 flex items-center justify-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              查看施工详情
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <Package className="w-4 h-4 text-gold-500" />
                              主材批次与质检
                            </div>
                            <div className="space-y-3">
                              {materials.map((material) => (
                                <div key={material.id} className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-start gap-2">
                                    <img
                                      src={material.image}
                                      alt={material.name}
                                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-medium text-gray-900 truncate">{material.name}</div>
                                      <div className="text-xs text-gray-500">{material.brand} · 批次 {material.qualityReports[0]?.batchNumber.slice(-8)}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200/50">
                                    {material.brandAuthorization.verified ? (
                                      <span className="text-xs text-success-600 flex items-center gap-0.5">
                                        <Shield className="w-3 h-3" />
                                        品牌授权
                                      </span>
                                    ) : (
                                      <span className="text-xs text-danger-600 flex items-center gap-0.5">
                                        <AlertTriangle className="w-3 h-3" />
                                        未认证
                                      </span>
                                    )}
                                    {material.qualityReports.length > 0 && (
                                      <span className="text-xs text-info-600 flex items-center gap-0.5">
                                        <FileCheck className="w-3 h-3" />
                                        质检报告
                                      </span>
                                    )}
                                    <span className="text-xs text-gold-600 flex items-center gap-0.5 ml-auto">
                                      <Database className="w-3 h-3" />
                                      可溯源
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button className="w-full text-xs text-gold-600 hover:text-gold-700 flex items-center justify-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              查看供应链详情
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="lg:col-span-2 card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-danger-500" />
              纠纷调解工作流
            </h3>
            <span className="text-xs text-danger-600 bg-danger-50 px-2 py-1 rounded-full">
              {activeDisputes.length} 件处理中
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-5">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600">8</div>
              <div className="text-xs text-gray-500">总纠纷数</div>
            </div>
            <div className="text-center p-3 bg-gold-50 rounded-lg">
              <div className="text-2xl font-bold text-gold-600">3</div>
              <div className="text-xs text-gray-500">证据收集中</div>
            </div>
            <div className="text-center p-3 bg-info-50 rounded-lg">
              <div className="text-2xl font-bold text-info-600">2</div>
              <div className="text-xs text-gray-500">第三方评估中</div>
            </div>
            <div className="text-center p-3 bg-success-50 rounded-lg">
              <div className="text-2xl font-bold text-success-600">92.5%</div>
              <div className="text-xs text-gray-500">调解成功率</div>
            </div>
          </div>

          <div className="space-y-3">
            {activeDisputes.slice(0, 2).map((dispute) => (
              <div key={dispute.id} className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-900">{dispute.projectName}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{dispute.type} · {dispute.plaintiffName} ↔ {dispute.defendantName}</div>
                  </div>
                  <span className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-medium',
                    dispute.status === 'evaluating' && 'bg-info-100 text-info-700',
                    dispute.status === 'mediating' && 'bg-gold-100 text-gold-700',
                    dispute.status === 'evidence-collecting' && 'bg-primary-100 text-primary-700',
                  )}>
                    {dispute.status === 'evaluating' ? '第三方评估中' :
                     dispute.status === 'mediating' ? '调解中' :
                     dispute.status === 'evidence-collecting' ? '证据收集中' : '处理中'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-primary-500" />
                    {dispute.evidenceChain.length} 份证据链存证
                  </span>
                  {dispute.thirdPartyEvaluator && (
                    <span className="flex items-center gap-1">
                      <Gavel className="w-3.5 h-3.5 text-info-500" />
                      {dispute.thirdPartyEvaluator}
                    </span>
                  )}
                  {dispute.compensationAmount && (
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-gold-500" />
                      预估赔付 {formatCurrency(dispute.compensationAmount)}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button className="flex-1 text-xs py-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors flex items-center justify-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    证据链
                  </button>
                  <button className="flex-1 text-xs py-1.5 rounded-lg bg-info-50 text-info-600 hover:bg-info-100 transition-colors flex items-center justify-center gap-1">
                    <Gavel className="w-3.5 h-3.5" />
                    评估进度
                  </button>
                  <button className="flex-1 text-xs py-1.5 rounded-lg bg-gold-50 text-gold-600 hover:bg-gold-100 transition-colors flex items-center justify-center gap-1">
                    <Calculator className="w-3.5 h-3.5" />
                    赔付计算
                  </button>
                  <button className="flex-1 text-xs py-1.5 rounded-lg bg-success-50 text-success-600 hover:bg-success-100 transition-colors flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    复查记录
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gold-500" />
              信用协同排行
            </h3>
          </div>

          <div className="flex gap-1 mb-4">
            {['all', 'designer', 'contractor', 'supplier'].map((role) => (
              <button
                key={role}
                className="flex-1 text-xs py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                {role === 'all' ? '全部' : role === 'designer' ? '设计师' : role === 'contractor' ? '施工队' : '供应商'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {creditRankings.map((item, index) => (
              <motion.div
                key={item.rank}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.8 + index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                  index === 0 && 'bg-gradient-gold text-white',
                  index === 1 && 'bg-gray-300 text-white',
                  index === 2 && 'bg-amber-600 text-white',
                  index > 2 && 'bg-gray-100 text-gray-500',
                )}>
                  {item.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                    <CreditBadge level={item.level} score={item.score} size="sm" showIcon={false} />
                  </div>
                  <div className="text-xs text-gray-500">{item.role}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary-600">{item.score}</div>
                  <div className={cn(
                    'text-xs',
                    item.change.startsWith('+') ? 'text-success-600' : 'text-danger-600'
                  )}>
                    {item.change}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="text-sm font-medium text-gray-700 mb-3">信用分趋势</div>
            <LineChart
              data={creditTrendData}
              color="#d69e2e"
              height={120}
              showArea
              showGrid={false}
              yAxisFormatter={(value) => value.toString()}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
