import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Banknote,
  AlertTriangle,
  User,
  Phone,
  FileText,
  Download,
  Check,
  X,
  ChevronDown,
  Clock,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Layers,
  Eye,
  EyeOff,
  Maximize2,
  Home,
  HardHat,
  ClipboardList,
  Package,
  Hammer,
  Award,
  Box,
  CheckCircle2,
  Circle,
  Coffee,
  Server,
  VolumeX,
  Leaf,
  Calculator,
  Star,
  PenTool,
  Palette,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import type {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderTimeline,
  DemandDiagnosis,
  Quotation,
  ScheduleTask,
  MaterialItem,
  AcceptanceRecord,
  BimModel,
  DesignStyle,
} from '@/types';
import { mockWorkOrders } from '@/mock';
import { cn } from '@/lib/utils';

const statusList: WorkOrderStatus[] = [
  '需求诊断',
  '方案报价',
  '施工排期',
  '材料进场',
  '施工执行',
  '竣工验收',
  '质保跟踪',
];

type DetailTab = WorkOrderStatus | 'BIM模型';

const statusTabIcons: Record<WorkOrderStatus, LucideIcon> = {
  '需求诊断': ClipboardList,
  '方案报价': FileText,
  '施工排期': CalendarDays,
  '材料进场': Package,
  '施工执行': Hammer,
  '竣工验收': Award,
  '质保跟踪': HardHat,
};

const statusColorMap: Record<WorkOrderStatus, string> = {
  '需求诊断': 'bg-sky-500',
  '方案报价': 'bg-violet-500',
  '施工排期': 'bg-pink-500',
  '材料进场': 'bg-orange-500',
  '施工执行': 'bg-emerald-500',
  '竣工验收': 'bg-indigo-500',
  '质保跟踪': 'bg-neutral-500',
};

const getStatusIndex = (status: WorkOrderStatus): number => statusList.indexOf(status);

const functionAreas = [
  { key: 'receptionArea', label: '接待区', icon: Home },
  { key: 'pantry', label: '茶水间', icon: Coffee },
  { key: 'serverRoom', label: '机房', icon: Server },
  { key: 'soundproofRoom', label: '隔音室', icon: VolumeX },
  { key: 'greening', label: '绿化', icon: Leaf },
] as const;

const formatMoney = (n: number): string => {
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString()}`;
};

const formatMoneyRaw = (n: number): string => `¥${n.toLocaleString()}`;

const qualityColorMap: Record<MaterialItem['qualityStatus'], string> = {
  合格: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  待验收: 'bg-neutral-500/20 text-neutral-300 border-neutral-500/40',
  不合格: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  部分合格: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
};

const resultColorMap: Record<string, string> = {
  合格: 'text-emerald-400',
  不合格: 'text-rose-400',
  待整改: 'text-orange-400',
  通过: 'text-emerald-400',
  '待整改后验收': 'text-orange-400',
  不通过: 'text-rose-400',
};

const rectificationColorMap: Record<string, string> = {
  未整改: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  整改中: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  已整改: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const taskCategoryColor: Record<string, string> = {
  设计阶段: 'bg-sky-500',
  前期手续: 'bg-violet-500',
  硬装施工: 'bg-emerald-500',
  机电工程: 'bg-indigo-500',
  专项工程: 'bg-pink-500',
  家具软装: 'bg-orange-500',
  验收阶段: 'bg-gold-500',
};

function DemandDiagnosisSection({ demand }: { demand: DemandDiagnosis }) {
  const infoGrid = [
    { label: '装修面积', value: `${demand.area} ㎡`, icon: Maximize2 },
    { label: '预算范围', value: `${formatMoneyRaw(demand.budgetRange[0])} ~ ${formatMoneyRaw(demand.budgetRange[1])}`, icon: Banknote },
    { label: '期望工期', value: `${demand.duration} 天`, icon: CalendarDays },
    { label: '员工数量', value: `${demand.staffCount} 人`, icon: User },
    { label: '会议室数', value: `${demand.meetingRoomCount} 间`, icon: Building2 },
    { label: '问卷填写', value: demand.questionnaireFilledAt.slice(0, 10), icon: Clock },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="card-base p-5">
        <h3 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />需求问卷信息
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {infoGrid.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg bg-primary-900/40 border border-gold-500/10 p-3.5">
                <div className="flex items-center gap-2 text-[11px] text-neutral-500 mb-1.5">
                  <Icon className="w-3.5 h-3.5 text-gold-400/60" />{item.label}
                </div>
                <p className="text-sm font-semibold text-neutral-100">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-base p-5">
        <h3 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4" />功能区域需求
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {functionAreas.map((fa) => {
            const Icon = fa.icon;
            const checked = (demand as unknown as Record<string, boolean>)[fa.key];
            return (
              <div key={fa.key} className={cn(
                'rounded-lg p-4 text-center border transition-all cursor-pointer',
                checked ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-primary-900/40 border-neutral-600/30 opacity-60'
              )}>
                <Icon className={cn('w-6 h-6 mx-auto mb-2', checked ? 'text-emerald-400' : 'text-neutral-500')} />
                <p className={cn('text-sm font-medium', checked ? 'text-emerald-300' : 'text-neutral-500')}>{fa.label}</p>
                <p className="mt-1.5">
                  {checked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <Check className="w-3 h-3" />已勾选
                    </span>
                  ) : <span className="text-[11px] text-neutral-600">—</span>}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-base p-5">
        <h3 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4" />设计风格 & 偏好
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-neutral-500 mb-2">设计风格</p>
            <div className="flex flex-wrap gap-2">
              {demand.designStyles.map((style: DesignStyle) => (
                <span key={style} className="chip chip-gold">{style}</span>
              ))}
            </div>
          </div>
          <div className="divider-gold" />
          <div>
            <p className="text-xs text-neutral-500 mb-2">颜色偏好</p>
            <div className="flex flex-wrap gap-3">
              {demand.colorPreference.map((color) => (
                <div key={color} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md border border-gold-500/30 shadow-inner"
                    style={{
                      background:
                        color === '深蓝' ? '#1E3A5F'
                        : color === '米白' ? '#F5F5DC'
                        : color === '金属灰' ? '#808080'
                        : color === '白色' ? '#FFFFFF'
                        : color === '科技蓝' ? '#0EA5E9'
                        : color === '木色' ? '#A0522D' : '#333333',
                    }}
                  />
                  <span className="text-xs text-neutral-300">{color}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="divider-gold" />
          <div>
            <p className="text-xs text-neutral-500 mb-2">照明要求</p>
            <span className="chip"><Sun className="w-3 h-3 text-gold-400/70" />{demand.lightingRequirement}</span>
          </div>
        </div>
      </div>

      <div className="card-base p-5">
        <h3 className="text-sm font-semibold text-gold-300 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />特殊要求
        </h3>
        <div className="rounded-lg bg-primary-900/40 border border-gold-500/10 p-4 text-sm text-neutral-300 leading-relaxed">
          {demand.specialRequirements || '—'}
        </div>
      </div>
    </motion.div>
  );
}

function QuotationSection({ quotations, selectedId }: { quotations: Quotation[]; selectedId?: string }) {
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>(selectedId ?? quotations[0]?.id ?? '');
  const selectedQuotation = quotations.find((q) => q.id === selectedQuotationId);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quotations.map((q) => {
          const isSelected = q.id === selectedQuotationId;
          return (
            <div
              key={q.id}
              onClick={() => setSelectedQuotationId(q.id)}
              className={cn('card-base p-5 cursor-pointer relative transition-all', isSelected && 'ring-2 ring-gold-500/60 gold-border')}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gold-500 text-primary-900">
                  SELECTED
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-base font-bold text-neutral-100">{q.planName}</h4>
              </div>
              <div className="mb-2">
                <span className="text-xs text-neutral-500">方案总价</span>
                <div className="mt-0.5">
                  <span className="text-2xl font-bold glow-text-gold">{formatMoneyRaw(q.totalPrice)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="inline-flex items-center gap-1">
                  <User className="w-3 h-3 text-gold-400/60" />{q.providerName.slice(0, 8)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gold-400/60" />有效期至 {q.validUntil}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedQuotation && (
        <>
          <div className="card-base p-5">
            <h3 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />分项报价明细 — {selectedQuotation.planName}
            </h3>
            <div className="overflow-x-auto rounded-lg border border-gold-500/10">
              <table className="w-full text-sm">
                <thead className="bg-primary-800/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">类目</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">名称</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300">数量</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300">单位</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300">单价</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300">小计</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedQuotation.items.map((item) => (
                    <tr key={item.id} className="border-t border-gold-500/10 hover:bg-primary-800/30 transition-colors">
                      <td className="px-4 py-2.5"><span className="chip !py-0 !text-[11px]">{item.category}</span></td>
                      <td className="px-4 py-2.5 text-neutral-200">{item.name}</td>
                      <td className="px-4 py-2.5 text-right text-neutral-300">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-center text-neutral-400">{item.unit}</td>
                      <td className="px-4 py-2.5 text-right text-neutral-300">{formatMoneyRaw(item.unitPrice)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gold-300">{formatMoneyRaw(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-base p-5">
            <h3 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4" />费用汇总
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: '材料费', value: selectedQuotation.totalMaterials, color: 'text-sky-300' },
                { label: '人工费', value: selectedQuotation.totalLabor, color: 'text-violet-300' },
                { label: '管理费', value: selectedQuotation.totalManagement, color: 'text-pink-300' },
                { label: '设计费', value: selectedQuotation.totalDesign, color: 'text-emerald-300' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-primary-900/40 border border-gold-500/10 p-4 text-center">
                  <p className="text-xs text-neutral-500 mb-1">{item.label}</p>
                  <p className={cn('text-lg font-bold', item.color)}>{formatMoney(item.value)}</p>
                </div>
              ))}
            </div>
            <div className="divider-gold mb-4" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span className="text-sm text-neutral-400">折扣：</span>
                <span className="text-base font-semibold text-rose-400">-{formatMoneyRaw(selectedQuotation.discount)}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-sm text-neutral-400">最终价：</span>
                <span className="text-3xl font-bold glow-text-gold">{formatMoneyRaw(selectedQuotation.finalPrice)}</span>
              </div>
            </div>
          </div>

          <div className="card-base p-5">
            <h3 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2">
              <Download className="w-4 h-4" />附件下载
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {selectedQuotation.attachments.map((att) => (
                <div key={att.id} className="rounded-lg bg-primary-900/40 border border-gold-500/10 p-4 flex items-center gap-3 hover:border-gold-500/30 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-gold-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-200 truncate group-hover:text-gold-300 transition-colors">{att.name}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">点击下载</p>
                  </div>
                  <Download className="w-4 h-4 text-neutral-500 group-hover:text-gold-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function ScheduleSection({ schedule }: { schedule: ScheduleTask[] }) {
  const allStart = schedule[0]?.startDate ?? '';
  const allEnd = schedule[schedule.length - 1]?.endDate ?? '';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="card-base p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gold-300 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />施工甘特图 — {allStart} 至 {allEnd}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[768px]">
            {schedule.map((task) => (
              <div key={task.id} className="flex items-center py-2.5 border-b border-gold-500/10 last:border-0">
                <div className="w-56 shrink-0 pr-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', taskCategoryColor[task.category] ?? 'bg-neutral-500')} />
                    <p className="text-sm text-neutral-200 truncate">{task.name}</p>
                    {task.milestone && <span className="text-xs">🏆</span>}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 ml-3.5">{task.category} · {task.assignee}</p>
                </div>
                <div className="flex-1 relative h-8 bg-primary-900/60 rounded-md overflow-hidden">
                  <div
                    className={cn('absolute top-1 bottom-1 rounded-md transition-all flex items-center justify-end pr-2', taskCategoryColor[task.category] ?? 'bg-neutral-500')}
                    style={{ left: '0%', width: `${Math.max(task.progress, 3)}%`, opacity: 0.85 }}
                  >
                    {task.progress >= 15 && <span className="text-[10px] font-bold text-white drop-shadow">{task.progress}%</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-base p-5">
        <h3 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />任务详情
        </h3>
        <div className="overflow-x-auto rounded-lg border border-gold-500/10">
          <table className="w-full text-sm">
            <thead className="bg-primary-800/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">任务名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">类别</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300">起止日期</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300">工期</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300">进度</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">负责人</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300">里程碑</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300">状态</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((task) => (
                <tr key={task.id} className="border-t border-gold-500/10 hover:bg-primary-800/30">
                  <td className="px-4 py-2.5 text-neutral-200">{task.name}</td>
                  <td className="px-4 py-2.5"><span className="chip !py-0 !text-[11px]">{task.category}</span></td>
                  <td className="px-4 py-2.5 text-center text-xs text-neutral-400 whitespace-nowrap">{task.startDate.slice(5)} ~ {task.endDate.slice(5)}</td>
                  <td className="px-4 py-2.5 text-center text-neutral-300">{task.duration}天</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-primary-900/60 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-gold-600 to-gold-400" style={{ width: `${task.progress}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gold-300 w-10 text-right">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div>
                      <p className="text-sm text-neutral-200">{task.assignee}</p>
                      <p className="text-[11px] text-neutral-500">{task.assigneePhone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center text-lg">{task.milestone ? '🏆' : '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn(
                      'chip !py-0 !text-[11px]',
                      task.status === '已完成' && 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                      task.status === '进行中' && 'bg-gold-500/20 text-gold-300 border-gold-500/30',
                      task.status === '未开始' && 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30',
                      task.status === '逾期' && 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    )}>{task.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function MaterialsSection({ materials }: { materials: MaterialItem[] }) {
  const stats = useMemo(() => {
    const accepted = materials.filter((m) => m.qualityStatus === '合格').length;
    const pending = materials.filter((m) => m.qualityStatus === '待验收').length;
    const issues = materials.filter((m) => m.qualityStatus === '不合格' || m.qualityStatus === '部分合格').length;
    return { accepted, pending, issues, total: materials.length };
  }, [materials]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '已验收', value: stats.accepted, total: stats.total, color: 'emerald', icon: CheckCircle2 },
          { label: '待验收', value: stats.pending, total: stats.total, color: 'neutral', icon: Clock },
          { label: '有问题', value: stats.issues, total: stats.total, color: 'rose', icon: AlertTriangle },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="card-base p-4 flex items-center gap-4">
              <div className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                item.color === 'emerald' && 'bg-emerald-500/15 text-emerald-400',
                item.color === 'neutral' && 'bg-neutral-500/15 text-neutral-400',
                item.color === 'rose' && 'bg-rose-500/15 text-rose-400'
              )}><Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-neutral-500">{item.label}</p>
                <p className="text-xl font-bold text-neutral-100">
                  {item.value}<span className="text-xs font-normal text-neutral-500 ml-1">/ {item.total}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-base p-5">
        <h3 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4" />材料清单与验收
        </h3>
        <div className="overflow-x-auto rounded-lg border border-gold-500/10">
          <table className="w-full text-sm">
            <thead className="bg-primary-800/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">分类</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">名称/规格/品牌</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300">数量</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300">预计到货</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300">实际到货</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300">质量状态</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300">验收信息</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300">签字确认</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id} className="border-t border-gold-500/10 hover:bg-primary-800/30">
                  <td className="px-4 py-3"><span className="chip !py-0 !text-[11px]">{m.category}</span></td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-neutral-200">{m.name}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{m.specification} · {m.brand}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-300 whitespace-nowrap">{m.quantity} {m.unit}</td>
                  <td className="px-4 py-3 text-center text-xs text-neutral-400">{m.expectedArrivalDate}</td>
                  <td className="px-4 py-3 text-center text-xs text-neutral-300">{m.actualArrivalDate ?? <span className="text-neutral-600">—</span>}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('chip !py-0 !text-[11px]', qualityColorMap[m.qualityStatus])}>{m.qualityStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.inspector ? (
                      <div>
                        <p className="text-xs text-neutral-300">{m.inspector}</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{m.inspectionDate}</p>
                      </div>
                    ) : <span className="text-neutral-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.signedBy ? (
                      <div className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                        <Check className="w-3.5 h-3.5" />已签
                      </div>
                    ) : <span className="text-[11px] text-neutral-600">待签</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function AcceptanceSection({ acceptance }: { acceptance?: AcceptanceRecord }) {
  const [npsScore, setNpsScore] = useState<number>(acceptance?.npsScore ?? 8);
  const mockAcceptance: AcceptanceRecord = acceptance ?? {
    id: 'AC001',
    items: [
      { id: 'AI001', category: '硬装工程', name: '墙面平整度', standard: '≤2mm/2m靠尺', result: '合格', inspector: '甲方王工', inspectionDate: '2026-09-10', rectificationPhotos: [] },
      { id: 'AI002', category: '硬装工程', name: '地面空鼓率', standard: '≤5%', result: '待整改', defectDescription: '茶水间门口有3块地砖空鼓', rectificationDeadline: '2026-09-15', rectificationStatus: '整改中', inspector: '甲方王工', inspectionDate: '2026-09-10', rectificationPhotos: [] },
      { id: 'AI003', category: '机电工程', name: '照明系统通电测试', standard: '100%点亮，无频闪', result: '合格', inspector: '甲方王工', inspectionDate: '2026-09-10', rectificationPhotos: [] },
      { id: 'AI004', category: '消防工程', name: '喷淋烟感测试', standard: '100%通过联动测试', result: '不合格', defectDescription: '机房区域1个烟感未联动', rectificationDeadline: '2026-09-12', rectificationStatus: '未整改', inspector: '消防第三方', inspectionDate: '2026-09-10', rectificationPhotos: [] },
      { id: 'AI005', category: '专项工程', name: '机房B级验收', standard: 'GB50174 B级标准', result: '合格', inspector: '机房专项小组', inspectionDate: '2026-09-10', rectificationPhotos: [] },
    ],
    totalQualified: 3, totalUnqualified: 2, overallResult: '待整改后验收', rectificationPhotos: [],
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="card-base p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gold-300 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4" />竣工验收结果
            </h3>
            <div className="flex items-center gap-4 text-xs text-neutral-400">
              <span>合格：<span className="text-emerald-400 font-semibold">{mockAcceptance.totalQualified}</span>项</span>
              <span>待处理：<span className="text-rose-400 font-semibold">{mockAcceptance.totalUnqualified}</span>项</span>
            </div>
          </div>
          <span className={cn(
            'inline-flex items-center px-4 py-2 rounded-xl text-base font-bold border',
            mockAcceptance.overallResult === '通过' && 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
            mockAcceptance.overallResult === '待整改后验收' && 'bg-orange-500/15 border-orange-500/40 text-orange-300',
            mockAcceptance.overallResult === '不通过' && 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          )}>
            {mockAcceptance.overallResult === '通过' && <Check className="w-5 h-5 mr-1.5" />}
            {mockAcceptance.overallResult === '不通过' && <X className="w-5 h-5 mr-1.5" />}
            {mockAcceptance.overallResult}
          </span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gold-500/10">
          <table className="w-full text-sm">
            <thead className="bg-primary-800/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">分类</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">验收项</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">验收标准</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300">结果</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300">缺陷描述</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300">整改状态</th>
              </tr>
            </thead>
            <tbody>
              {mockAcceptance.items.map((item) => (
                <tr key={item.id} className="border-t border-gold-500/10 hover:bg-primary-800/30">
                  <td className="px-4 py-2.5"><span className="chip !py-0 !text-[11px]">{item.category}</span></td>
                  <td className="px-4 py-2.5 text-neutral-200">{item.name}</td>
                  <td className="px-4 py-2.5 text-xs text-neutral-400">{item.standard}</td>
                  <td className="px-4 py-2.5 text-center"><span className={cn('font-semibold text-sm', resultColorMap[item.result])}>{item.result}</span></td>
                  <td className="px-4 py-2.5 text-xs text-rose-300 max-w-[220px]">{item.defectDescription ?? <span className="text-neutral-600">—</span>}</td>
                  <td className="px-4 py-2.5 text-center">
                    {item.rectificationStatus ? (
                      <span className={cn('chip !py-0 !text-[11px]', rectificationColorMap[item.rectificationStatus])}>{item.rectificationStatus}</span>
                    ) : <span className="text-neutral-600 text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-base p-5">
        <h3 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2">
          <Star className="w-4 h-4" />NPS 满意度评分
        </h3>
        <div className="text-center py-4">
          <p className="text-xs text-neutral-500 mb-4">请对本次装修服务打分（0-10分）</p>
          <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
            {Array.from({ length: 11 }, (_, i) => i).map((score) => {
              const isSelected = score === npsScore;
              return (
                <button
                  key={score}
                  onClick={() => setNpsScore(score)}
                  className={cn(
                    'w-10 h-10 rounded-full text-sm font-bold transition-all border',
                    isSelected
                      ? 'bg-gold-500 border-gold-400 text-primary-900 scale-110 animate-glow-pulse'
                      : 'bg-primary-900/60 border-neutral-600 text-neutral-400 hover:border-gold-500/40 hover:text-gold-300'
                  )}
                >{score}</button>
              );
            })}
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold glow-text-gold">{npsScore}</span>
            <span className="text-neutral-500 text-sm ml-1">/ 10 · {npsScore >= 9 ? '推荐者' : npsScore >= 7 ? '中立者' : '贬损者'}</span>
          </div>
        </div>
      </div>

      <div className="card-base p-5">
        <h3 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2">
          <PenTool className="w-4 h-4" />电子签字确认
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: '张宏伟', role: '甲方签字', signee: 'Zhang Wei', date: '2026-09-10 16:42' },
            { name: '李经理', role: '乙方签字', signee: 'Li Manager', date: '2026-09-10 16:45' },
          ].map((sign, idx) => (
            <div key={idx} className="rounded-xl bg-gradient-to-br from-primary-900/80 to-primary-800/60 border-2 border-dashed border-gold-500/30 p-6 min-h-[180px] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="tech-grid-bg absolute inset-0 opacity-40" />
              <div className="relative text-center">
                <div className="text-5xl font-serif italic text-gold-400/70 mb-2" style={{ fontFamily: 'cursive' }}>{sign.signee}</div>
                <div className="text-[11px] text-neutral-500">{sign.name} · {sign.role}</div>
                <div className="text-[10px] text-neutral-600 mt-1">{sign.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function BimSection({ bimModels }: { bimModels: BimModel[] }) {
  const model = bimModels[0] ?? {
    id: 'BIM000', name: '默认BIM模型', version: 'V1.0', size: '100MB', uploadDate: '2026-01-01',
    layers: [
      { id: 'L1', name: '建筑结构', visible: true },
      { id: 'L2', name: '机电管线', visible: true },
      { id: 'L3', name: '装饰面', visible: true },
      { id: 'L4', name: '家具布置', visible: true },
      { id: 'L5', name: '机房专项', visible: false },
      { id: 'L6', name: '消防喷淋', visible: true },
    ],
    changes: [{ id: 'C1', version: 'V1.0', description: '初始版本', date: '2026-01-01', author: '系统' }],
    modelUrl: '', viewUrl: '',
  };

  const [layers, setLayers] = useState(model.layers);
  const [selectedVersion, setSelectedVersion] = useState(model.version);
  const toggleLayer = (id: string) => setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 card-base p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gold-300 flex items-center gap-2"><Box className="w-4 h-4" />{model.name}</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">版本 {selectedVersion} · {model.size} · 上传于 {model.uploadDate}</p>
          </div>
          <div className="relative">
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="input-tech !py-1.5 !text-xs !pl-3 !pr-8 appearance-none cursor-pointer"
            >
              {model.changes.map((c) => <option key={c.version} value={c.version}>{c.version}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
          </div>
        </div>
        <div
          className="relative rounded-xl overflow-hidden tech-grid-bg border border-gold-500/10"
          style={{ background: 'linear-gradient(135deg, #162C48 0%, #0F1E31 100%)', aspectRatio: '16 / 10' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative animate-float-slow">
              <div className="w-40 h-40 relative" style={{ transform: 'rotateX(-15deg) rotateY(30deg)', transformStyle: 'preserve-3d' }}>
                <div className="absolute inset-0 border-2 border-gold-400/60 bg-gold-400/10 backdrop-blur-sm rounded-md" style={{ transform: 'translateZ(80px)' }} />
                <div className="absolute inset-0 border-2 border-gold-400/40 bg-gold-400/05 rounded-md" style={{ transform: 'translateZ(40px)' }} />
                <div className="absolute inset-0 border-2 border-gold-400/20 rounded-md" style={{ transform: 'translateZ(0px)' }} />
                <div className="absolute h-40 w-[160px] border-2 border-gold-400/30 bg-gold-400/05 rounded-sm" style={{ transformOrigin: 'bottom', transform: 'rotateX(90deg) translateZ(-80px) translateY(-80px)' }} />
                <div className="absolute h-40 w-[160px] border-2 border-gold-400/30 bg-gold-400/05 rounded-sm" style={{ transformOrigin: 'left', transform: 'rotateY(90deg) translateZ(-80px) translateX(0px)' }} />
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-mono">
                <div className="flex items-center gap-1 text-red-400"><div className="w-6 h-px bg-red-400/50" /> X</div>
                <div className="flex items-center gap-1 text-emerald-400 mt-1"><div className="w-6 h-px bg-emerald-400/50" /> Y</div>
                <div className="flex items-center gap-1 text-sky-400 mt-1"><div className="w-6 h-px bg-sky-400/50" /> Z</div>
              </div>
            </div>
          </div>
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="chip chip-gold !text-[10px] !py-0.5 !px-2.5"><Layers className="w-3 h-3" />3D BIM 视图</span>
            <div className="flex gap-1.5">
              {[ZoomIn, ZoomOut, RotateCw, Maximize2].map((Icon, idx) => (
                <button key={idx} className="w-8 h-8 rounded-lg bg-primary-900/70 border border-gold-500/20 flex items-center justify-center text-neutral-300 hover:text-gold-300 hover:border-gold-500/40 transition-colors">
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="absolute bottom-3 left-3 chip !text-[10px] !py-0.5 !px-2.5">
            <RotateCw className="w-3 h-3 text-gold-400/70" />可拖拽旋转 · 滚轮缩放
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="card-base p-5">
          <h3 className="text-sm font-semibold text-gold-300 mb-3 flex items-center gap-2"><Layers className="w-4 h-4" />图层控制</h3>
          <div className="space-y-2">
            {layers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-all',
                  layer.visible ? 'bg-gold-500/10 border-gold-500/25' : 'bg-primary-900/40 border-neutral-600/20 opacity-60'
                )}
              >
                <span className={cn('text-sm', layer.visible ? 'text-neutral-200' : 'text-neutral-500')}>{layer.name}</span>
                {layer.visible ? <Eye className="w-4 h-4 text-gold-400" /> : <EyeOff className="w-4 h-4 text-neutral-600" />}
              </div>
            ))}
          </div>
        </div>
        <div className="card-base p-5">
          <h3 className="text-sm font-semibold text-gold-300 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" />变更日志</h3>
          <div className="space-y-0">
            {model.changes.map((change, idx) => (
              <div key={change.id} className="relative pl-6 pb-4 last:pb-0">
                {idx < model.changes.length - 1 && <div className="absolute left-2.5 top-5 bottom-0 w-px bg-neutral-700/50" />}
                <div className={cn(
                  'absolute left-0 top-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2',
                  idx === 0 ? 'bg-gold-500 border-gold-400' : 'bg-primary-900 border-neutral-600'
                )}>
                  <div className={cn('w-1.5 h-1.5 rounded-full', idx === 0 ? 'bg-primary-900' : 'bg-neutral-500')} />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('chip !py-0 !text-[10px]', idx === 0 ? 'chip-gold' : '')}>{change.version}</span>
                  <span className="text-[11px] text-neutral-500">{change.date}</span>
                </div>
                <p className="text-xs text-neutral-300">{change.description}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">作者：{change.author}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TimelineSidebar({ timeline }: { timeline: WorkOrderTimeline[] }) {
  const timelineStatusIcon: Record<WorkOrderTimeline['status'], LucideIcon> = {
    '已完成': CheckCircle2, '进行中': Clock, '未开始': Circle, 逾期: AlertTriangle,
  };
  const timelineStatusColor: Record<WorkOrderTimeline['status'], string> = {
    '已完成': 'text-emerald-400 border-emerald-500/50 bg-emerald-500/15',
    '进行中': 'text-gold-400 border-gold-500/50 bg-gold-500/15 animate-glow-pulse',
    '未开始': 'text-neutral-500 border-neutral-600/50 bg-neutral-800/40',
    逾期: 'text-rose-400 border-rose-500/50 bg-rose-500/15',
  };
  return (
    <div className="card-base p-5">
      <h3 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2"><Clock className="w-4 h-4" />工单时间线</h3>
      <div className="space-y-0">
        {timeline.map((t, idx) => {
          const Icon = timelineStatusIcon[t.status];
          const lastIdx = timeline.length - 1;
          return (
            <div key={t.node} className="relative pl-10 pb-5 last:pb-0">
              {idx < lastIdx && (
                <div
                  className={cn(
                    'absolute left-[14px] top-8 bottom-0 w-px',
                    t.status === '已完成' ? 'bg-emerald-500/40'
                      : t.status === '进行中' ? 'bg-gradient-to-b from-gold-500/40 to-neutral-700/30'
                      : 'bg-neutral-700/30'
                  )}
                />
              )}
              <div className={cn('absolute left-0 top-0 w-7 h-7 rounded-lg flex items-center justify-center border-2', timelineStatusColor[t.status])}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="rounded-lg bg-primary-900/40 border border-gold-500/10 p-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-neutral-100">{t.node}</span>
                  <span className={cn(
                    'chip !py-0 !text-[10px]',
                    t.status === '已完成' && 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                    t.status === '进行中' && 'bg-gold-500/20 text-gold-300 border-gold-500/30',
                    t.status === '未开始' && 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30',
                    t.status === '逾期' && 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  )}>{t.status}</span>
                </div>
                <div className="text-[11px] text-neutral-500 space-y-0.5">
                  {t.startAt && <div className="flex items-center gap-1.5"><span>开始：</span><span className="text-neutral-400">{t.startAt}</span></div>}
                  {t.completedAt && <div className="flex items-center gap-1.5"><span>完成：</span><span className="text-emerald-400">{t.completedAt}</span></div>}
                  {t.operatorName && <div className="flex items-center gap-1.5"><User className="w-2.5 h-2.5 text-gold-400/60" /><span className="text-neutral-400">{t.operatorName}</span></div>}
                  {t.remark && <div className="pt-1 mt-1 border-t border-gold-500/10 text-gold-300/80">备注：{t.remark}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContactSidebar({ order }: { order: WorkOrder }) {
  const contacts = [
    { title: '发起人', name: order.initiatorName, role: order.initiatorRole, phone: order.initiatorPhone, icon: User, color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
    { title: '供应商联系人', name: order.providerName?.slice(0, 10) ?? '暂无', role: '服务商', phone: order.providerId ? '138****1234' : '—', icon: Building2, color: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
    { title: '项目经理', name: '李经理', role: '现场负责人', phone: '136****9012', icon: HardHat, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  ];
  return (
    <div className="card-base p-5">
      <h3 className="text-sm font-semibold text-gold-300 mb-4 flex items-center gap-2"><Phone className="w-4 h-4" />联系方式</h3>
      <div className="space-y-3">
        {contacts.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="rounded-lg bg-primary-900/40 border border-gold-500/10 p-3.5">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-lg border flex items-center justify-center shrink-0', c.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-neutral-500">{c.title}</span>
                    <span className="chip !py-0 !text-[9px]">{c.role}</span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-100 mt-0.5">{c.name}</p>
                  <p className="text-[11px] text-gold-300 mt-0.5 flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" />{c.phone}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const order: WorkOrder = useMemo(() => {
    return mockWorkOrders.find((o) => o.id === id) ?? mockWorkOrders[0];
  }, [id]);

  const currentStatusIndex = getStatusIndex(order.status);
  const defaultTab: DetailTab = order.status;
  const [activeTab, setActiveTab] = useState<DetailTab>(defaultTab);

  const actualCostPercent = order.actualCost ? (order.actualCost / order.totalBudget) * 100 : 0;

  return (
    <div className="min-h-screen bg-mesh-tech p-6">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <button onClick={() => navigate('/workorders')} className="btn-primary !py-2 !px-3">
            <ArrowLeft className="w-4 h-4" />返回
          </button>
          <div className="flex-1">
            <p className="text-xs text-neutral-500">工单详情</p>
            <h1 className="text-xl font-bold text-neutral-100 truncate">{order.title}</h1>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card-base p-5">
          <div className="flex flex-col xl:flex-row gap-5 items-start xl:items-center">
            <div className="flex flex-wrap items-center gap-4 flex-1 min-w-0">
              <div>
                <p className="text-[11px] text-neutral-500">工单编号</p>
                <p className="font-mono text-base glow-text-gold">{order.orderNo}</p>
              </div>
              <div className="w-px h-8 bg-gold-500/15" />
              <div>
                <p className="text-[11px] text-neutral-500">关联房源</p>
                <button
                  onClick={() => navigate(`/properties/${order.propertyId}`)}
                  className="text-sm text-neutral-200 hover:text-gold-300 transition-colors flex items-center gap-1"
                >
                  <Building2 className="w-3.5 h-3.5 text-gold-400/60" />
                  {order.propertyName}
                </button>
              </div>
              <div className="w-px h-8 bg-gold-500/15" />
              <div>
                <p className="text-[11px] text-neutral-500">总工期</p>
                <p className="text-sm text-neutral-200">{order.expectedStartDate.slice(5)} ~ {order.expectedEndDate.slice(5)}</p>
              </div>
              {order.overdueWarning && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-500/15 border border-rose-500/30 text-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5" />存在逾期风险
                </span>
              )}
            </div>
            <span
              className={cn(
                'inline-flex items-center px-4 py-2 rounded-xl text-base font-bold border',
                order.priority === '紧急' ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : order.priority === '高' ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                  : order.priority === '中' ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                  : 'bg-neutral-500/15 border-neutral-500/40 text-neutral-300'
              )}
            >
              <span className={cn('w-2 h-2 rounded-full mr-2', statusColorMap[order.status])} />
              {order.status}
            </span>
          </div>

          <div className="divider-gold my-5" />

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-400">总体进度</span>
                <span className="text-xs font-bold text-gold-300">{order.progress}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-primary-900/60 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 transition-all duration-700" style={{ width: `${order.progress}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-400">预算 vs 实际支出</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-neutral-400">预算：<span className="text-gold-300 font-semibold">{formatMoney(order.totalBudget)}</span></span>
                  <span className="text-neutral-400">已支出：<span className="text-emerald-400 font-semibold">{order.actualCost ? formatMoney(order.actualCost) : '—'}</span></span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-primary-900/60 overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-600 to-sky-400 rounded-full" style={{ width: '100%' }} />
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" style={{ width: `${actualCostPercent}%` }} />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-10 gap-5">
          <div className="xl:col-span-7 space-y-5">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card-base p-2">
              <div className="flex flex-wrap gap-1">
                {statusList.map((s, idx) => {
                  const Icon = statusTabIcons[s];
                  const statusIdx = idx;
                  const isCompleted = statusIdx < currentStatusIndex;
                  const isCurrent = statusIdx === currentStatusIndex;
                  const isActive = activeTab === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setActiveTab(s)}
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all border',
                        isActive
                          ? 'bg-gold-500/15 border-gold-500/40 text-gold-300'
                          : 'bg-transparent border-transparent text-neutral-400 hover:bg-primary-900/40 hover:text-neutral-200'
                      )}
                    >
                      <span
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border',
                          isCompleted ? 'bg-emerald-500 border-emerald-400 text-white'
                            : isCurrent ? 'bg-gold-500 border-gold-400 text-primary-900 animate-glow-pulse'
                            : 'bg-primary-900 border-neutral-600 text-neutral-500'
                        )}
                      >
                        {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                      </span>
                      <Icon className="w-3.5 h-3.5" />
                      {s}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                {activeTab === '需求诊断' && <DemandDiagnosisSection demand={order.demand} />}
                {activeTab === '方案报价' && <QuotationSection quotations={order.quotations} selectedId={order.selectedQuotationId} />}
                {activeTab === '施工排期' && <ScheduleSection schedule={order.schedule} />}
                {activeTab === '材料进场' && <MaterialsSection materials={order.materials} />}
                {activeTab === '竣工验收' && <AcceptanceSection acceptance={order.acceptance} />}
                {activeTab === '施工执行' && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    <div className="card-base p-8 text-center">
                      <Hammer className="w-16 h-16 mx-auto text-gold-400/40 mb-4" />
                      <h3 className="text-lg font-bold text-neutral-100 mb-2">施工执行中</h3>
                      <p className="text-sm text-neutral-400 max-w-md mx-auto mb-4">
                        本阶段由项目经理负责现场管理，可查看施工排期了解进度，或在材料进场中查看材料验收情况。
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => setActiveTab('施工排期')} className="btn-primary">
                          <CalendarDays className="w-4 h-4" />查看排期
                        </button>
                        <button onClick={() => setActiveTab('材料进场')} className="btn-gold">
                          <Package className="w-4 h-4" />材料管理
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeTab === '质保跟踪' && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    <div className="card-base p-8 text-center">
                      <HardHat className="w-16 h-16 mx-auto text-neutral-500/40 mb-4" />
                      <h3 className="text-lg font-bold text-neutral-100 mb-2">质保跟踪阶段</h3>
                      <p className="text-sm text-neutral-400 max-w-md mx-auto">
                        竣工验收通过后将进入为期2年的质保跟踪期，期间如有质量问题可在此登记并联系供应商处理。
                      </p>
                    </div>
                  </motion.div>
                )}
                {activeTab === 'BIM模型' && <BimSection bimModels={order.bimModels} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="xl:col-span-3 space-y-5">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <TimelineSidebar timeline={order.timeline} />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <ContactSidebar order={order} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

