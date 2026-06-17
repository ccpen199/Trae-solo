import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Syringe, Bug, ChevronRight, PawPrint, Calendar, Thermometer,
  AlertCircle, Stethoscope, MapPin, FileText, Pill, Activity,
  CheckCircle2, Clock, ArrowRight, ShoppingCart, ChevronDown,
  FileCheck, Package, UserCheck, XCircle, Plus, Filter,
  History, Link2, MessageSquare,
} from 'lucide-react';
import type { Pet } from '@shared/types';
import { cn } from '@/lib/utils';

interface TimelineUpdate {
  id: string;
  date: string;
  type: 'deworm' | 'prescription' | 'consultation' | 'followup';
  title: string;
  detail: string;
  status: 'completed';
}

interface PetCardProps {
  pet: Pet;
  compact?: boolean;
  updatedDewormingRecord?: { date: string; nextDate: string; completed: boolean };
  timelineUpdates?: TimelineUpdate[];
}

const speciesMap: Record<Pet['species'], string> = {
  dog: '狗狗',
  cat: '猫咪',
  rabbit: '兔子',
  bird: '鸟类',
  other: '其他',
};

const healthStatusMap = {
  healthy: { label: '健康', className: 'tag-green' },
  sick: { label: '患病中', className: 'tag-orange' },
  chronic: { label: '慢性病', className: 'bg-gray-100 text-gray-600' },
};

interface MedicalRecordData {
  visitTime: string;
  diagnosis: string;
  recordFileId: string;
  attendingDoctor: string;
  ownerConfirmed: boolean;
}

interface PrescriptionFlowData {
  prescriptionId: string;
  medicines: string[];
  doctorSignature: boolean;
  ownerAcknowledged: boolean;
  shippingStatus: 'pending' | 'shipped' | 'delivered';
}

interface ReviewHistory {
  id: string;
  action: string;
  time: string;
  note?: string;
  operator: string;
}

interface TimelineEntry {
  id: string;
  date: string;
  type: 'vaccine' | 'deworm' | 'checkup' | 'consultation' | 'prescription' | 'followup' | 'template' | 'medical_record' | 'prescription_flow' | 'medicine_delivery';
  title: string;
  detail: string;
  status: 'completed' | 'overdue' | 'scheduled' | 'active';
  processingStatus: 'pending' | 'processing' | 'completed' | 'overdue';
  linkedId?: string;
  linkedLabel?: string;
  linkedRoute?: string;
  createdAt: string;
  updatedAt: string;
  chainIds: string[];
  reviewStatus: 'pending' | 'reviewed';
  reviewTime?: string;
  reviewNote?: string;
  medicalRecord?: MedicalRecordData;
  prescriptionFlow?: PrescriptionFlowData;
  actionButtons?: Array<{ label: string; route: string; icon: string }>;
  reviewHistory: ReviewHistory[];
}

type FilterType = 'all' | 'medical' | 'health' | 'abnormal';

const petTimelines: Record<string, TimelineEntry[]> = {
  '1': [
    {
      id: 'tl-1-1', date: '2025-01-15', type: 'vaccine',
      title: '狂犬疫苗接种', detail: '接种狂犬疫苗（瑞比克）· 爱宠动物医院总院 · 医师王建国签名',
      status: 'completed', processingStatus: 'completed',
      linkedId: 'RX-20250115', linkedLabel: '查看处方', linkedRoute: '/products',
      createdAt: '2025-01-15 10:00', updatedAt: '2025-01-15 14:30',
      chainIds: ['tl-1-1'], reviewStatus: 'reviewed', reviewTime: '2025-01-15 14:30',
      reviewHistory: [
        { id: 'rh-1-1', action: '接种完成确认', time: '2025-01-15 14:30', operator: '宠主', note: '接种后无异常反应' }
      ]
    },
    {
      id: 'tl-1-2', date: '2025-03-01', type: 'deworm',
      title: '体内驱虫', detail: '拜宠清口服 · 体重28.2kg · 下次到期2025-06-01',
      status: 'completed', processingStatus: 'completed',
      linkedId: 'd1', linkedLabel: '购药记录', linkedRoute: '/products',
      createdAt: '2025-03-01 09:00', updatedAt: '2025-03-01 09:00',
      chainIds: ['tl-1-2'], reviewStatus: 'reviewed', reviewTime: '2025-03-01 09:00',
      reviewHistory: [
        { id: 'rh-1-2', action: '用药确认', time: '2025-03-01 09:00', operator: '宠主' }
      ]
    },
    {
      id: 'tl-1-3', date: '2025-06-01', type: 'deworm',
      title: '体内驱虫（已逾期381天）', detail: '拜宠清 · 到期日2025-06-01 · 长期未驱虫风险',
      status: 'overdue', processingStatus: 'overdue',
      linkedLabel: '立即购药', linkedRoute: '/products',
      createdAt: '2025-06-01 00:00', updatedAt: '2026-06-17 10:00',
      chainIds: ['tl-1-3'], reviewStatus: 'pending',
      actionButtons: [
        { label: '立即购药', route: '/products', icon: 'ShoppingCart' },
        { label: '预约服务', route: '/hospitals', icon: 'Calendar' }
      ],
      reviewHistory: [
        { id: 'rh-1-3', action: '逾期提醒发送', time: '2025-06-02 08:00', operator: '系统' },
        { id: 'rh-1-4', action: '再次提醒', time: '2025-06-15 08:00', operator: '系统' }
      ]
    },
    {
      id: 'tl-1-4', date: '2025-03-10', type: 'checkup',
      title: '年度健康体检', detail: '血常规/生化/DR胸部正位 · 体温38.6°C · 心率102/min · 体重28.5kg',
      status: 'completed', processingStatus: 'completed',
      linkedId: 'HT-000001', linkedLabel: '查看健康模板', linkedRoute: '/pets/1',
      createdAt: '2025-03-10 10:00', updatedAt: '2025-03-10 16:00',
      chainIds: ['tl-1-4'], reviewStatus: 'reviewed', reviewTime: '2025-03-10 16:00',
      reviewHistory: [
        { id: 'rh-1-5', action: '体检报告出具', time: '2025-03-10 15:30', operator: '医师王建国' },
        { id: 'rh-1-6', action: '报告确认', time: '2025-03-10 16:00', operator: '宠主', note: '各项指标正常' }
      ]
    },
    {
      id: 'tl-1-5', date: '2026-01-15', type: 'vaccine',
      title: '狂犬疫苗加强', detail: '年度加强免疫 · 到期接种',
      status: 'scheduled', processingStatus: 'pending',
      linkedLabel: '预约接种', linkedRoute: '/hospitals',
      createdAt: '2025-12-15 00:00', updatedAt: '2025-12-15 00:00',
      chainIds: ['tl-1-5'], reviewStatus: 'pending',
      actionButtons: [
        { label: '预约接种', route: '/hospitals', icon: 'Calendar' }
      ],
      reviewHistory: [
        { id: 'rh-1-7', action: '接种提醒', time: '2025-12-15 08:00', operator: '系统' }
      ]
    },
  ],
  '2': [
    {
      id: 'tl-2-1', date: '2025-06-10', type: 'checkup',
      title: '新宠入户体检', detail: '基础体检+猫瘟检测 · 体温38.8°C · 心率140/min · 体重4.2kg',
      status: 'completed', processingStatus: 'completed',
      linkedId: 'HT-000002', linkedLabel: '查看健康模板', linkedRoute: '/pets/2',
      createdAt: '2025-06-10 10:00', updatedAt: '2025-06-10 12:00',
      chainIds: ['tl-2-1'], reviewStatus: 'reviewed', reviewTime: '2025-06-10 12:00',
      reviewHistory: [
        { id: 'rh-2-1', action: '体检完成', time: '2025-06-10 11:30', operator: '医师' },
        { id: 'rh-2-2', action: '报告确认', time: '2025-06-10 12:00', operator: '宠主', note: '健康状况良好' }
      ]
    },
  ],
  '3': [
    {
      id: 'tl-3-1', date: '2026-06-10', type: 'consultation',
      title: '在线问诊 · 急性肠胃炎', detail: '主诉：腹泻、精神萎靡 · 诊断：急性肠胃炎 · 医师王建国签名 ✓ · 宠主确认 ✓',
      status: 'completed', processingStatus: 'completed',
      linkedId: 'CS-20260610-001', linkedLabel: '问诊详情', linkedRoute: '/hospitals',
      createdAt: '2026-06-10 09:30', updatedAt: '2026-06-10 10:15',
      chainIds: ['tl-3-1', 'tl-3-2', 'tl-3-3', 'tl-3-4', 'tl-3-5', 'tl-3-6'],
      reviewStatus: 'reviewed', reviewTime: '2026-06-10 10:15',
      reviewHistory: [
        { id: 'rh-3-1', action: '问诊发起', time: '2026-06-10 09:30', operator: '宠主' },
        { id: 'rh-3-2', action: '医生接诊', time: '2026-06-10 09:35', operator: '医师王建国' },
        { id: 'rh-3-3', action: '诊断完成', time: '2026-06-10 10:00', operator: '医师王建国', note: '急性肠胃炎，建议药物治疗' },
        { id: 'rh-3-4', action: '宠主确认', time: '2026-06-10 10:15', operator: '宠主', note: '同意治疗方案' }
      ]
    },
    {
      id: 'tl-3-2', date: '2026-06-10', type: 'prescription',
      title: '处方开具 · 肠胃炎用药', detail: '蒙脱石散+益生菌+消炎药 · 医生签名 ✓ · 宠主确认 ✓ · 已发货',
      status: 'completed', processingStatus: 'completed',
      linkedId: 'RX-20260610', linkedLabel: '查看处方', linkedRoute: '/products',
      createdAt: '2026-06-10 10:05', updatedAt: '2026-06-10 10:30',
      chainIds: ['tl-3-1', 'tl-3-2', 'tl-3-3', 'tl-3-4', 'tl-3-5', 'tl-3-6'],
      reviewStatus: 'reviewed', reviewTime: '2026-06-10 10:30',
      reviewHistory: [
        { id: 'rh-3-5', action: '处方开具', time: '2026-06-10 10:05', operator: '医师王建国' },
        { id: 'rh-3-6', action: '医生签名', time: '2026-06-10 10:08', operator: '医师王建国' },
        { id: 'rh-3-7', action: '宠主确认购药', time: '2026-06-10 10:30', operator: '宠主', note: '已支付，等待发货' }
      ]
    },
    {
      id: 'tl-3-3', date: '2026-06-10', type: 'medical_record',
      title: '电子病历 · 急性肠胃炎', detail: '就诊时间2026-06-10 · 诊断：急性肠胃炎 · 主治医师王建国 · 宠主已确认',
      status: 'completed', processingStatus: 'completed',
      createdAt: '2026-06-10 10:20', updatedAt: '2026-06-10 10:45',
      chainIds: ['tl-3-1', 'tl-3-2', 'tl-3-3', 'tl-3-4', 'tl-3-5', 'tl-3-6'],
      reviewStatus: 'reviewed', reviewTime: '2026-06-10 10:45',
      medicalRecord: {
        visitTime: '2026-06-10 09:30',
        diagnosis: '急性肠胃炎：因饮食不当引起的胃肠道感染，表现为腹泻、精神萎靡',
        recordFileId: 'MR-20260610-001',
        attendingDoctor: '王建国',
        ownerConfirmed: true
      },
      reviewHistory: [
        { id: 'rh-3-8', action: '病历生成', time: '2026-06-10 10:20', operator: '系统' },
        { id: 'rh-3-9', action: '医生签字', time: '2026-06-10 10:25', operator: '医师王建国' },
        { id: 'rh-3-10', action: '宠主确认', time: '2026-06-10 10:45', operator: '宠主', note: '已阅读并确认病历内容' }
      ]
    },
    {
      id: 'tl-3-4', date: '2026-06-10', type: 'prescription_flow',
      title: '处方流转 · 药品配送', detail: '处方ID: RX-20260610 · 蒙脱石散+益生菌+消炎药 · 已签收',
      status: 'completed', processingStatus: 'completed',
      createdAt: '2026-06-10 10:35', updatedAt: '2026-06-12 15:30',
      chainIds: ['tl-3-1', 'tl-3-2', 'tl-3-3', 'tl-3-4', 'tl-3-5', 'tl-3-6'],
      reviewStatus: 'reviewed', reviewTime: '2026-06-12 15:30',
      prescriptionFlow: {
        prescriptionId: 'RX-20260610',
        medicines: ['蒙脱石散 3g*10袋', '益生菌 5g*7袋', '消炎药 0.25g*12粒'],
        doctorSignature: true,
        ownerAcknowledged: true,
        shippingStatus: 'delivered'
      },
      reviewHistory: [
        { id: 'rh-3-11', action: '订单创建', time: '2026-06-10 10:35', operator: '系统' },
        { id: 'rh-3-12', action: '药房审核', time: '2026-06-10 11:00', operator: '药师' },
        { id: 'rh-3-13', action: '药品发货', time: '2026-06-10 14:00', operator: '物流' },
        { id: 'rh-3-14', action: '药品签收', time: '2026-06-12 15:30', operator: '宠主', note: '药品完好，已开始用药' }
      ]
    },
    {
      id: 'tl-3-5', date: '2026-06-12', type: 'medicine_delivery',
      title: '药品签收', detail: '肠胃炎用药已签收 · 宠主确认收货 · 开始用药',
      status: 'completed', processingStatus: 'completed',
      createdAt: '2026-06-12 15:30', updatedAt: '2026-06-12 15:30',
      chainIds: ['tl-3-1', 'tl-3-2', 'tl-3-3', 'tl-3-4', 'tl-3-5', 'tl-3-6'],
      reviewStatus: 'reviewed', reviewTime: '2026-06-12 15:30',
      reviewHistory: [
        { id: 'rh-3-15', action: '确认收货', time: '2026-06-12 15:30', operator: '宠主', note: '包装完好，药品齐全' }
      ]
    },
    {
      id: 'tl-3-6', date: '2026-06-22', type: 'followup',
      title: '复诊预约 · 肠胃炎复查', detail: '爱宠动物医院总院 · 医师王建国 · 已预约',
      status: 'scheduled', processingStatus: 'pending',
      linkedLabel: '查看预约', linkedRoute: '/calendar',
      createdAt: '2026-06-10 10:50', updatedAt: '2026-06-10 10:50',
      chainIds: ['tl-3-1', 'tl-3-2', 'tl-3-3', 'tl-3-4', 'tl-3-5', 'tl-3-6'],
      reviewStatus: 'pending',
      actionButtons: [
        { label: '立即处置', route: '/calendar', icon: 'Calendar' },
        { label: '修改预约', route: '/calendar', icon: 'Plus' }
      ],
      reviewHistory: [
        { id: 'rh-3-16', action: '复诊预约', time: '2026-06-10 10:50', operator: '宠主', note: '肠胃炎治疗后复查' },
        { id: 'rh-3-17', action: '预约确认', time: '2026-06-10 11:00', operator: '医院' }
      ]
    },
    {
      id: 'tl-3-7', date: '2026-06-10', type: 'template',
      title: '健康模板更新', detail: '体温39.5°C（发热）· 心率125/min（偏高）· 体重2.1kg · 体重趋势 -0.2kg',
      status: 'active', processingStatus: 'processing',
      linkedId: 'HT-000003', linkedLabel: '模板维护', linkedRoute: '/pets/3',
      createdAt: '2026-06-10 09:00', updatedAt: '2026-06-10 09:00',
      chainIds: ['tl-3-7'], reviewStatus: 'pending',
      reviewHistory: [
        { id: 'rh-3-18', action: '模板更新', time: '2026-06-10 09:00', operator: '系统' }
      ]
    },
  ],
};

const typeConfig: Record<TimelineEntry['type'], { color: string; bgColor: string; Icon: React.ComponentType<{ className?: string }>; label: string }> = {
  vaccine: { color: 'text-forest-600', bgColor: 'bg-forest-100', Icon: Syringe, label: '疫苗' },
  deworm: { color: 'text-warm-600', bgColor: 'bg-warm-100', Icon: Bug, label: '驱虫' },
  checkup: { color: 'text-blue-600', bgColor: 'bg-blue-100', Icon: Thermometer, label: '体检' },
  consultation: { color: 'text-purple-600', bgColor: 'bg-purple-100', Icon: Stethoscope, label: '问诊' },
  prescription: { color: 'text-rose-600', bgColor: 'bg-rose-100', Icon: Pill, label: '处方' },
  followup: { color: 'text-sky-600', bgColor: 'bg-sky-100', Icon: Calendar, label: '复诊' },
  template: { color: 'text-teal-600', bgColor: 'bg-teal-100', Icon: FileText, label: '健康模板' },
  medical_record: { color: 'text-indigo-600', bgColor: 'bg-indigo-100', Icon: FileCheck, label: '电子病历' },
  prescription_flow: { color: 'text-pink-600', bgColor: 'bg-pink-100', Icon: Package, label: '处方流转' },
  medicine_delivery: { color: 'text-amber-600', bgColor: 'bg-amber-100', Icon: ShoppingCart, label: '药品配送' },
};

const statusBadge: Record<TimelineEntry['status'], { label: string; className: string }> = {
  completed: { label: '已完成', className: 'bg-forest-100 text-forest-700' },
  overdue: { label: '已逾期', className: 'bg-red-100 text-red-700' },
  scheduled: { label: '已预约', className: 'bg-blue-100 text-blue-700' },
  active: { label: '进行中', className: 'bg-warm-100 text-warm-700' },
};

const processingBadge: Record<TimelineEntry['processingStatus'], { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: '待处理', className: 'bg-gray-100 text-gray-600', Icon: Clock },
  processing: { label: '处理中', className: 'bg-blue-100 text-blue-600', Icon: Activity },
  completed: { label: '已完成', className: 'bg-forest-100 text-forest-600', Icon: CheckCircle2 },
  overdue: { label: '已逾期', className: 'bg-red-100 text-red-600', Icon: XCircle },
};

const shippingStatusMap = {
  pending: { label: '待发货', className: 'bg-gray-100 text-gray-600' },
  shipped: { label: '运输中', className: 'bg-blue-100 text-blue-600' },
  delivered: { label: '已签收', className: 'bg-forest-100 text-forest-600' },
};

const actionIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingCart,
  Calendar,
  Plus,
};

const filterConfig: Record<FilterType, { label: string; className: string; types: TimelineEntry['type'][] }> = {
  all: { label: '全部', className: 'bg-gray-100 text-gray-700 hover:bg-gray-200', types: [] },
  medical: { label: '医疗', className: 'bg-purple-100 text-purple-700 hover:bg-purple-200', types: ['consultation', 'prescription', 'medical_record', 'prescription_flow', 'medicine_delivery'] },
  health: { label: '健康', className: 'bg-forest-100 text-forest-700 hover:bg-forest-200', types: ['vaccine', 'deworm', 'checkup', 'followup', 'template'] },
  abnormal: { label: '异常', className: 'bg-red-100 text-red-700 hover:bg-red-200', types: [] },
};

export default function PetCard({ pet, compact, updatedDewormingRecord, timelineUpdates = [] }: PetCardProps) {
  const navigate = useNavigate();
  const [showTimeline, setShowTimeline] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [showChainView, setShowChainView] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const baseTimeline = petTimelines[pet.id] || [];
  const now = new Date().toLocaleString('zh-CN', { hour12: false });
  const convertedUpdates: TimelineEntry[] = timelineUpdates.map(update => ({
    ...update,
    processingStatus: 'completed' as const,
    createdAt: now,
    updatedAt: now,
    chainIds: [update.id],
    reviewStatus: 'reviewed' as const,
    reviewTime: now,
    reviewHistory: [{ id: `rh-${update.id}`, action: '逾期处置完成', time: now, operator: '系统', note: '逾期驱虫处置流程完成，记录已自动更新' }],
  }));
  const [timelineData, setTimelineData] = useState<TimelineEntry[]>([...convertedUpdates, ...baseTimeline]);
  const status = healthStatusMap[pet.healthStatus];

  useEffect(() => {
    if (timelineUpdates.length > 0) {
      const now = new Date().toLocaleString('zh-CN', { hour12: false });
      const newConvertedUpdates: TimelineEntry[] = timelineUpdates.map(update => ({
        ...update,
        processingStatus: 'completed' as const,
        createdAt: now,
        updatedAt: now,
        chainIds: [update.id],
        reviewStatus: 'reviewed' as const,
        reviewTime: now,
        reviewHistory: [{ id: `rh-${update.id}`, action: '逾期处置完成', time: now, operator: '系统', note: '逾期驱虫处置流程完成，记录已自动更新' }],
      }));
      const existingIds = new Set(timelineData.map(e => e.id));
      const newEntries = newConvertedUpdates.filter(u => !existingIds.has(u.id));
      if (newEntries.length > 0) {
        setTimelineData([...newEntries, ...timelineData]);
      }
    }
  }, [timelineUpdates]);

  const handleAction = (entryId: string, route: string) => {
    setTimelineData(prev => prev.map(entry => {
      if (entry.id === entryId) {
        const now = new Date().toLocaleString('zh-CN', { hour12: false });
        return {
          ...entry,
          processingStatus: 'processing' as const,
          updatedAt: now,
          reviewHistory: [
            ...entry.reviewHistory,
            { id: `rh-action-${Date.now()}`, action: '发起处置', time: now, operator: '宠主', note: '正在前往处置流程' }
          ]
        };
      }
      return entry;
    }));
    navigate(route);
  };

  const handleToggleExpand = (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedEntryId(prev => prev === entryId ? null : entryId);
  };

  const handleToggleChainView = (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowChainView(prev => prev === entryId ? null : entryId);
  };

  const handleConfirmReview = (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    setTimelineData(prev => prev.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          reviewStatus: 'reviewed' as const,
          reviewTime: now,
          updatedAt: now,
          reviewHistory: [
            ...entry.reviewHistory,
            { id: `rh-review-${Date.now()}`, action: '档案复核', time: now, operator: '宠主', note: '已复核并确认记录准确' }
          ]
        };
      }
      return entry;
    }));
  };

  const getFilteredTimeline = () => {
    let filtered = timelineData;
    const filter = filterConfig[activeFilter];

    if (filter.types.length > 0) {
      filtered = filtered.filter(entry => filter.types.includes(entry.type));
    }

    if (activeFilter === 'abnormal') {
      filtered = filtered.filter(entry =>
        entry.processingStatus === 'overdue' || entry.status === 'overdue'
      );
    }

    return filtered;
  };

  const getEventStats = () => {
    const stats = {
      checkup: 0,
      consultation: 0,
      prescription: 0,
      vaccine: 0,
      deworm: 0,
    };

    timelineData.forEach(entry => {
      if (entry.type === 'checkup') stats.checkup++;
      if (entry.type === 'consultation') stats.consultation++;
      if (entry.type === 'prescription' || entry.type === 'prescription_flow') stats.prescription++;
      if (entry.type === 'vaccine') stats.vaccine++;
      if (entry.type === 'deworm') stats.deworm++;
    });

    return stats;
  };

  const getChainEntries = (chainIds: string[]) => {
    return timelineData.filter(entry => chainIds.includes(entry.id));
  };

  const filteredTimeline = getFilteredTimeline();
  const stats = getEventStats();

  if (compact) {
    return (
      <button
        onClick={() => navigate(`/pets/${pet.id}`)}
        className="flex items-center gap-3 p-3 rounded-2xl bg-cream-50 hover:bg-cream-100 transition-colors w-full text-left"
      >
        <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {pet.avatar ? (
            <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <PawPrint className="w-6 h-6 text-forest-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{pet.name}</p>
          <p className="text-xs text-gray-500">{speciesMap[pet.species]} · {pet.breed}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>
    );
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-forest-100 flex items-center justify-center overflow-hidden">
            {pet.avatar ? (
              <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              <PawPrint className="w-8 h-8 text-forest-500" />
            )}
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-gray-900">{pet.name}</h3>
            <p className="text-sm text-gray-500">
              {speciesMap[pet.species]} · {pet.breed}
            </p>
          </div>
        </div>
        <span className={cn('tag', status.className)}>{status.label}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="p-2 rounded-xl bg-cream-50">
          <p className="text-xs text-gray-500">年龄</p>
          <p className="font-semibold text-gray-900 text-sm">
            {Math.floor((Date.now() - new Date(pet.birthday).getTime()) / 31536000000)} 岁
          </p>
        </div>
        <div className="p-2 rounded-xl bg-cream-50">
          <p className="text-xs text-gray-500">体重</p>
          <p className="font-semibold text-gray-900 text-sm">{pet.weight} kg</p>
        </div>
        <div className="p-2 rounded-xl bg-cream-50">
          <p className="text-xs text-gray-500">性别</p>
          <p className="font-semibold text-gray-900 text-sm">
            {pet.gender === 'male' ? '公' : '母'}
          </p>
        </div>
      </div>

      <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-forest-50 to-cream-50 border border-forest-100 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-forest-700">
            <Thermometer className="w-3.5 h-3.5" /> 健康数据模板
          </div>
          <span className="text-[10px] text-forest-600">模板ID: HT-{pet.id.padStart(6, '0')}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="p-1.5 rounded-lg bg-white/70">
            <p className="text-[10px] text-gray-500">体温</p>
            <p className={cn('text-[11px] font-semibold', pet.healthStatus === 'sick' ? 'text-red-600' : 'text-gray-800')}>
              {pet.healthStatus === 'sick' ? '39.5°C' : '38.6°C'}
            </p>
          </div>
          <div className="p-1.5 rounded-lg bg-white/70">
            <p className="text-[10px] text-gray-500">心率</p>
            <p className={cn('text-[11px] font-semibold', pet.healthStatus === 'sick' ? 'text-warm-600' : 'text-gray-800')}>
              {pet.healthStatus === 'sick' ? '125/min' : '102/min'}
            </p>
          </div>
          <div className="p-1.5 rounded-lg bg-white/70">
            <p className="text-[10px] text-gray-500">体重趋势</p>
            <p className={cn('text-[11px] font-semibold', pet.healthStatus === 'sick' ? 'text-red-600' : 'text-forest-600')}>
              {pet.healthStatus === 'sick' ? '-0.2kg' : '+0.3kg'}
            </p>
          </div>
        </div>
      </div>

      {pet.healthStatus === 'sick' && (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-warm-50 to-orange-50 border border-warm-100 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-warm-700">
            <AlertCircle className="w-3.5 h-3.5" /> 病中状态跟踪
          </div>
          <div className="text-[11px] text-gray-700 space-y-0.5">
            <p className="flex items-center gap-1">
              <Stethoscope className="w-3 h-3 text-warm-600" />
              诊断：<span className="font-semibold">急性肠胃炎</span>
            </p>
            <p className="flex items-center gap-1">
              <Pill className="w-3 h-3 text-warm-600" />
              处方：<span className="font-semibold">蒙脱石散+益生菌+消炎药</span> · 双签 ✓
            </p>
            <p className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-warm-600" />
              复诊：<span className="font-semibold text-warm-700">2026-06-22</span> · 已预约
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-forest-50/60">
          <Syringe className="w-3.5 h-3.5 text-forest-500 shrink-0" />
          <span className="text-[11px] text-gray-700 flex-1">
            疫苗 {pet.vaccineRecords.length} 次 · 下次加强
            <span className="font-semibold text-forest-700 ml-1">2026-01-15</span>
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/hospitals'); }}
            className="px-2 py-0.5 rounded-md bg-forest-500 text-white text-[10px] font-semibold hover:bg-forest-600 transition-colors inline-flex items-center gap-1"
          >
            <MapPin className="w-3 h-3" /> 预约接种
          </button>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-warm-50/60">
          <Bug className="w-3.5 h-3.5 text-warm-500 shrink-0" />
          <span className="text-[11px] text-gray-700 flex-1">
            驱虫 {pet.dewormingRecords.length + (updatedDewormingRecord?.completed ? 1 : 0)} 次 · 下次驱虫
            {updatedDewormingRecord?.completed ? (
              <span className="font-semibold text-forest-600 ml-1">{updatedDewormingRecord.nextDate}</span>
            ) : (
              <span className="font-semibold text-red-600 ml-1">已逾期381天</span>
            )}
          </span>
          {!updatedDewormingRecord?.completed ? (
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/products'); }}
              className="px-2 py-0.5 rounded-md bg-warm-500 text-white text-[10px] font-semibold hover:bg-warm-600 transition-colors inline-flex items-center gap-1"
            >
              <ShoppingCart className="w-3 h-3" /> 去购药
            </button>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-forest-100 text-forest-600 text-[10px] font-semibold inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 已完成
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-pink-50/60">
          <Heart className="w-3.5 h-3.5 text-pink-500 shrink-0" />
          <span className="text-[11px] text-gray-700 flex-1">
            年度体检 · 上次
            <span className="font-semibold text-pink-700 ml-1">2025-03-10</span>
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/hospitals'); }}
            className="px-2 py-0.5 rounded-md bg-pink-500 text-white text-[10px] font-semibold hover:bg-pink-600 transition-colors inline-flex items-center gap-1"
          >
            <Calendar className="w-3 h-3" /> 预约体检
          </button>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); setShowTimeline(!showTimeline); }}
        className="w-full mb-3 py-2 rounded-xl bg-gradient-to-r from-forest-50 to-cream-50 hover:from-forest-100 hover:to-cream-100 border border-forest-100 transition-colors inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-forest-700"
      >
        <Activity className="w-3.5 h-3.5" />
        {showTimeline ? '收起生命周期记录' : `展开生命周期记录 (${timelineData.length}条)`}
        <ChevronRight className={cn('w-3 h-3 transition-transform', showTimeline && 'rotate-90')} />
      </button>

      {showTimeline && timelineData.length > 0 && (
        <div className="space-y-3 mb-3">
          <div className="grid grid-cols-5 gap-1 p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.checkup}</div>
              <div className="text-[9px] text-gray-500">健康检查</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{stats.consultation}</div>
              <div className="text-[9px] text-gray-500">问诊</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-rose-600">{stats.prescription}</div>
              <div className="text-[9px] text-gray-500">处方</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-forest-600">{stats.vaccine}</div>
              <div className="text-[9px] text-gray-500">疫苗</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-warm-600">{stats.deworm}</div>
              <div className="text-[9px] text-gray-500">驱虫</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            {(Object.keys(filterConfig) as FilterType[]).map(filterKey => {
              const filter = filterConfig[filterKey];
              const isActive = activeFilter === filterKey;
              return (
                <button
                  key={filterKey}
                  onClick={(e) => { e.stopPropagation(); setActiveFilter(filterKey); }}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors',
                    isActive ? filter.className : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-0">
            {filteredTimeline.map((entry, idx) => {
              const config = typeConfig[entry.type];
              const badge = statusBadge[entry.status];
              const processing = processingBadge[entry.processingStatus];
              const ProcessingIcon = processing.Icon;
              const isExpanded = expandedEntryId === entry.id;
              const showChain = showChainView === entry.id;
              const chainEntries = entry.chainIds.length > 1 ? getChainEntries(entry.chainIds) : [];

              return (
                <div key={entry.id}>
                  <div className="flex gap-2.5">
                    <div className="flex flex-col items-center">
                      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 relative', config.bgColor)}>
                        <config.Icon className={cn('w-3.5 h-3.5', config.color)} />
                        {entry.reviewStatus === 'reviewed' && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-forest-500 flex items-center justify-center">
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      {idx < filteredTimeline.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gradient-to-b from-gray-200 to-gray-100 my-0.5" />
                      )}
                    </div>
                    <div className={cn('flex-1 pb-3', idx === filteredTimeline.length - 1 && 'pb-0')}>
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-gray-900">{entry.title}</span>
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', badge.className)}>
                          {badge.label}
                        </span>
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5', processing.className)}>
                          <ProcessingIcon className="w-2 h-2" />
                          {processing.label}
                        </span>
                        {entry.reviewStatus === 'reviewed' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-forest-50 text-forest-600 inline-flex items-center gap-0.5">
                            <UserCheck className="w-2 h-2" />
                            已复核
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[10px] text-gray-500 font-mono">{entry.date}</p>
                        {entry.reviewStatus === 'reviewed' && entry.reviewTime && (
                          <p className="text-[9px] text-forest-600">✓ 复核于 {entry.reviewTime}</p>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-600 leading-relaxed">{entry.detail}</p>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {entry.linkedLabel && (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(entry.linkedRoute || '/'); }}
                            className={cn('text-[9px] font-bold inline-flex items-center gap-0.5 hover:underline', config.color)}
                          >
                            {entry.linkedLabel} <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                        {entry.chainIds.length > 1 && (
                          <button
                            onClick={(e) => handleToggleChainView(entry.id, e)}
                            className={cn('text-[9px] font-bold inline-flex items-center gap-0.5 hover:underline text-indigo-600')}
                          >
                            <Link2 className="w-2.5 h-2.5" />
                            {showChain ? '收起完整链路' : '查看完整链路'}
                            <ChevronDown className={cn('w-2.5 h-2.5 transition-transform', showChain && 'rotate-180')} />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleToggleExpand(entry.id, e)}
                          className="text-[9px] font-bold inline-flex items-center gap-0.5 hover:underline text-gray-600"
                        >
                          {isExpanded ? '收起详情' : '展开详情'}
                          <ChevronDown className={cn('w-2.5 h-2.5 transition-transform', isExpanded && 'rotate-180')} />
                        </button>
                        {entry.reviewStatus === 'pending' && (
                          <button
                            onClick={(e) => handleConfirmReview(entry.id, e)}
                            className="text-[9px] font-bold inline-flex items-center gap-0.5 hover:underline text-forest-600"
                          >
                            <UserCheck className="w-2.5 h-2.5" />
                            回写复核
                          </button>
                        )}
                      </div>

                      {entry.actionButtons && entry.processingStatus !== 'completed' && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {entry.actionButtons.map((action, actionIdx) => {
                            const ActionIcon = actionIconMap[action.icon] || Plus;
                            return (
                              <button
                                key={actionIdx}
                                onClick={(e) => { e.stopPropagation(); handleAction(entry.id, action.route); }}
                                className="px-2 py-1 rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[9px] font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all inline-flex items-center gap-0.5 shadow-sm"
                              >
                                <ActionIcon className="w-2.5 h-2.5" />
                                {action.label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {isExpanded && (
                        <div className="mt-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <p className="text-gray-500">创建时间</p>
                              <p className="font-medium text-gray-800">{entry.createdAt}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">最后更新</p>
                              <p className="font-medium text-gray-800">{entry.updatedAt}</p>
                            </div>
                          </div>

                          {entry.chainIds.length > 1 && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-700 mb-1 inline-flex items-center gap-1">
                                <Link2 className="w-2.5 h-2.5 text-indigo-500" />
                                关联事件 ({entry.chainIds.length}条)
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {entry.chainIds.map(chainId => {
                                  const chainEntry = timelineData.find(e => e.id === chainId);
                                  if (!chainEntry) return null;
                                  const chainConfig = typeConfig[chainEntry.type];
                                  return (
                                    <span key={chainId} className={cn('inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px]', chainConfig.bgColor, chainConfig.color)}>
                                      <chainConfig.Icon className="w-2 h-2" />
                                      {chainConfig.label}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {entry.medicalRecord && (
                            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 space-y-1">
                              <p className="text-[10px] font-semibold text-indigo-700 inline-flex items-center gap-1">
                                <FileCheck className="w-2.5 h-2.5" />
                                电子病历详情
                              </p>
                              <div className="grid grid-cols-2 gap-1 text-[9px]">
                                <div>
                                  <span className="text-gray-500">就诊时间：</span>
                                  <span className="text-gray-800">{entry.medicalRecord.visitTime}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">主治医师：</span>
                                  <span className="text-gray-800">{entry.medicalRecord.attendingDoctor}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-gray-500">病历文件：</span>
                                  <span className="text-gray-800 font-mono">{entry.medicalRecord.recordFileId}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-gray-500">诊断结论：</span>
                                  <span className="text-gray-800">{entry.medicalRecord.diagnosis}</span>
                                </div>
                                <div className="col-span-2 flex items-center gap-1">
                                  <span className="text-gray-500">宠主确认：</span>
                                  {entry.medicalRecord.ownerConfirmed ? (
                                    <span className="text-forest-600 inline-flex items-center gap-0.5">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> 已确认
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">待确认</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {entry.prescriptionFlow && (
                            <div className="p-2 rounded-lg bg-pink-50 border border-pink-100 space-y-1">
                              <p className="text-[10px] font-semibold text-pink-700 inline-flex items-center gap-1">
                                <Package className="w-2.5 h-2.5" />
                                处方流转详情
                              </p>
                              <div className="grid grid-cols-2 gap-1 text-[9px]">
                                <div>
                                  <span className="text-gray-500">处方ID：</span>
                                  <span className="text-gray-800 font-mono">{entry.prescriptionFlow.prescriptionId}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">发货状态：</span>
                                  <span className={cn('inline-flex items-center gap-0.5', shippingStatusMap[entry.prescriptionFlow.shippingStatus].className, 'px-1 rounded')}>
                                    {shippingStatusMap[entry.prescriptionFlow.shippingStatus].label}
                                  </span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-gray-500">药品明细：</span>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {entry.prescriptionFlow.medicines.map((med, i) => (
                                      <span key={i} className="bg-white px-1.5 py-0.5 rounded text-gray-700 border border-pink-100">
                                        {med}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">医生签名：</span>
                                  {entry.prescriptionFlow.doctorSignature ? (
                                    <span className="text-forest-600 inline-flex items-center gap-0.5">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> 已签名
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">待签名</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">宠主确认：</span>
                                  {entry.prescriptionFlow.ownerAcknowledged ? (
                                    <span className="text-forest-600 inline-flex items-center gap-0.5">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> 已确认
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">待确认</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {entry.reviewHistory.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-semibold text-gray-700 inline-flex items-center gap-1">
                                <History className="w-2.5 h-2.5 text-gray-500" />
                                复核历史
                              </p>
                              <div className="space-y-1">
                                {entry.reviewHistory.map((rh) => (
                                  <div key={rh.id} className="flex items-start gap-1.5 p-1.5 rounded-lg bg-white border border-gray-100">
                                    <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-medium text-gray-700">{rh.action}</span>
                                        <span className="text-[8px] text-gray-400">· {rh.operator}</span>
                                      </div>
                                      <p className="text-[8px] text-gray-500">{rh.time}</p>
                                      {rh.note && (
                                        <p className="text-[9px] text-gray-600 mt-0.5 flex items-center gap-0.5">
                                          <MessageSquare className="w-2 h-2 text-gray-400" />
                                          {rh.note}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {showChain && chainEntries.length > 1 && (
                    <div className="ml-9 mb-3 p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                      <p className="text-[10px] font-semibold text-indigo-700 mb-2 inline-flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        完整事件链路（{chainEntries.length}个关联事件）
                      </p>
                      <div className="relative">
                        {chainEntries.map((chainEntry, chainIdx) => {
                          const chainConfig = typeConfig[chainEntry.type];
                          const chainProcessing = processingBadge[chainEntry.processingStatus];
                          const ChainProcessingIcon = chainProcessing.Icon;
                          return (
                            <div key={chainEntry.id} className="flex gap-2.5">
                              <div className="flex flex-col items-center">
                                <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0', chainConfig.bgColor)}>
                                  <chainConfig.Icon className={cn('w-3 h-3', chainConfig.color)} />
                                </div>
                                {chainIdx < chainEntries.length - 1 && (
                                  <div className="w-0.5 flex-1 bg-gradient-to-b from-indigo-300 to-purple-300 my-0.5" style={{ minHeight: '24px' }} />
                                )}
                              </div>
                              <div className="flex-1 pb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-semibold text-gray-800">{chainEntry.title}</span>
                                  <span className={cn('text-[8px] font-bold px-1 py-0.5 rounded-full inline-flex items-center gap-0.5', chainProcessing.className)}>
                                    <ChainProcessingIcon className="w-1.5 h-1.5" />
                                    {chainProcessing.label}
                                  </span>
                                </div>
                                <p className="text-[9px] text-gray-500">{chainEntry.date}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredTimeline.length === 0 && (
            <div className="text-center py-6 text-[11px] text-gray-500">
              暂无符合筛选条件的记录
            </div>
          )}
        </div>
      )}

      {showTimeline && (
        <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 text-[10px] text-purple-700 space-y-1">
          <p className="font-bold flex items-center gap-1"><Activity className="w-3 h-3" /> 生命周期记录说明</p>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="p-1.5 rounded-lg bg-white/70">
              <p className="font-semibold text-forest-700">疫苗/驱虫</p>
              <p className="text-gray-500">接种/用药 → 下次到期 → 逾期追踪</p>
            </div>
            <div className="p-1.5 rounded-lg bg-white/70">
              <p className="font-semibold text-purple-700">问诊处方</p>
              <p className="text-gray-500">问诊 → 处方 → 双签确认 → 购药</p>
            </div>
            <div className="p-1.5 rounded-lg bg-white/70">
              <p className="font-semibold text-sky-700">复诊提醒</p>
              <p className="text-gray-500">复诊日 → 提醒推送 → 预约确认</p>
            </div>
            <div className="p-1.5 rounded-lg bg-white/70">
              <p className="font-semibold text-teal-700">健康模板</p>
              <p className="text-gray-500">体检数据 → 模板更新 → 趋势对比</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-forest-50">
        <div className="ml-auto flex items-center gap-1 text-forest-600 group-hover:text-forest-500 transition-colors cursor-pointer" onClick={() => navigate(`/pets/${pet.id}`)}>
          <Heart className="w-4 h-4" />
          <span className="text-xs font-medium">查看完整健康档案</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
