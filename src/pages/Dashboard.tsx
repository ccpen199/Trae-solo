import { useState, useMemo } from 'react';
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
  Image as ImageIcon,
  Video,
  FileDiff,
  Ban,
  FileAxis3D,
  Undo2,
  FileX2,
  FileSearch,
  StickyNote,
  CheckCheck,
  ExternalLink,
  BarChart4,
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

interface TodoDocument {
  id: string;
  documentNo: string;
  title: string;
  projectName: string;
  deadline: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'received' | 'processing' | 'completed' | 'rejected' | 'overdue';
  handover?: {
    fromUser: string;
    fromRole: string;
    handoverTime: Date;
    document: string;
  };
  receipt?: {
    receivedBy: string;
    receivedTime: Date;
    signature: string;
  };
  rejection?: {
    rejectedBy: string;
    rejectedTime: Date;
    reason: string;
    suggestion: string;
  };
  processing?: {
    startedBy: string;
    startTime: Date;
    progress: number;
  };
  completion?: {
    completedBy: string;
    completedTime: Date;
    result: string;
    certificate: string;
  };
  interception?: {
    interceptedBy: string;
    interceptedTime: Date;
    reason: string;
    authority: string;
  };
}

const todoDocuments: Record<RoleKey, TodoDocument[]> = {
  owner: [
    {
      id: 't1',
      documentNo: 'QUOTE-20260618-0001',
      title: '确认阳光花园项目AI报价',
      projectName: '阳光花园 3栋1802',
      deadline: new Date('2026-06-22'),
      priority: 'high',
      status: 'pending',
      handover: {
        fromUser: 'AI报价引擎',
        fromRole: '系统',
        handoverTime: new Date('2026-06-18T14:30:00'),
        document: 'AI报价单第12版',
      },
    },
    {
      id: 't2',
      documentNo: 'INSPECTION-20260620-0035',
      title: '验收泥瓦工程节点',
      projectName: '阳光花园 3栋1802',
      deadline: new Date('2026-06-23'),
      priority: 'high',
      status: 'received',
      handover: {
        fromUser: '陈建国',
        fromRole: '施工队',
        handoverTime: new Date('2026-06-20T16:00:00'),
        document: '泥瓦工程报验单 JD-20260620',
      },
      receipt: {
        receivedBy: '张明远',
        receivedTime: new Date('2026-06-20T16:30:00'),
        signature: '电子签名 zhangmy_001',
      },
    },
    {
      id: 't3',
      documentNo: 'REVIEW-20260615-0089',
      title: '评价完工项目',
      projectName: '碧水蓝天 1栋501',
      deadline: new Date('2026-06-25'),
      priority: 'low',
      status: 'processing',
      processing: {
        startedBy: '张明远',
        startTime: new Date('2026-06-19T10:00:00'),
        progress: 60,
      },
    },
    {
      id: 't4',
      documentNo: 'DESIGN-CHG-20260619-0003',
      title: '确认设计变更方案',
      projectName: '城市之星 5栋901',
      deadline: new Date('2026-06-22'),
      priority: 'medium',
      status: 'rejected',
      handover: {
        fromUser: '王浩然',
        fromRole: '设计师',
        handoverTime: new Date('2026-06-18T09:00:00'),
        document: '吊顶设计变更方案 V2.1',
      },
      rejection: {
        rejectedBy: '张明远',
        rejectedTime: new Date('2026-06-19T14:00:00'),
        reason: '设计变更后费用超预算15%，不符合成本控制要求',
        suggestion: '建议采用简化方案，控制在预算±5%范围内',
      },
    },
  ],
  designer: [
    {
      id: 't5',
      documentNo: 'DESIGN-PLN-20260620-0012',
      title: '出具3居室设计方案',
      projectName: '金色家园 8栋1203',
      deadline: new Date('2026-06-22'),
      priority: 'high',
      status: 'processing',
      handover: {
        fromUser: '张明远',
        fromRole: '业主',
        handoverTime: new Date('2026-06-19T11:00:00'),
        document: '设计需求确认单 RQM-20260619',
      },
      processing: {
        startedBy: '李雨晴',
        startTime: new Date('2026-06-19T14:00:00'),
        progress: 75,
      },
    },
    {
      id: 't6',
      documentNo: 'MATERIAL-SEL-20260618-0045',
      title: '材料选型推荐确认',
      projectName: '东方明珠 6栋2201',
      deadline: new Date('2026-06-23'),
      priority: 'medium',
      status: 'pending',
      receipt: {
        receivedBy: '李雨晴',
        receivedTime: new Date('2026-06-18T10:00:00'),
        signature: '电子签名 liyq_002',
      },
    },
    {
      id: 't7',
      documentNo: 'SITE-BRIEF-20260621-0002',
      title: '工地技术交底',
      projectName: '翠湖天地 2栋305',
      deadline: new Date('2026-06-24'),
      priority: 'high',
      status: 'received',
      handover: {
        fromUser: '陈建国',
        fromRole: '施工队',
        handoverTime: new Date('2026-06-20T08:00:00'),
        document: '技术交底申请单 BRF-20260620',
      },
      receipt: {
        receivedBy: '李雨晴',
        receivedTime: new Date('2026-06-20T08:30:00'),
        signature: '电子签名 liyq_002',
      },
    },
    {
      id: 't8',
      documentNo: 'DESIGN-REV-20260615-0007',
      title: '修改吊顶设计方案',
      projectName: '城市之星 5栋901',
      deadline: new Date('2026-06-21'),
      priority: 'high',
      status: 'overdue',
      rejection: {
        rejectedBy: '张明远',
        rejectedTime: new Date('2026-06-19T14:00:00'),
        reason: '超预算',
        suggestion: '简化方案',
      },
    },
  ],
  contractor: [
    {
      id: 't9',
      documentNo: 'HIDDEN-VID-20260620-0018',
      title: '提交隐蔽工程视频',
      projectName: '阳光花园 3栋1802',
      deadline: new Date('2026-06-21'),
      priority: 'high',
      status: 'pending',
    },
    {
      id: 't10',
      documentNo: 'CHECKIN-20260621-0007',
      title: '节点打卡：水电验收',
      projectName: '金色家园 8栋1203',
      deadline: new Date('2026-06-22'),
      priority: 'high',
      status: 'received',
      handover: {
        fromUser: '李雨晴',
        fromRole: '设计师',
        handoverTime: new Date('2026-06-20T15:00:00'),
        document: '水电工程验收通知单 NTC-20260620',
      },
      receipt: {
        receivedBy: '陈建国',
        receivedTime: new Date('2026-06-20T15:30:00'),
        signature: '电子签名 chenjg_001',
      },
    },
    {
      id: 't11',
      documentNo: 'RECTIFY-20260619-0003',
      title: '整改：卫生间防水',
      projectName: '阳光花园 3栋1802',
      deadline: new Date('2026-06-23'),
      priority: 'high',
      status: 'processing',
      handover: {
        fromUser: '第三方检测中心',
        fromRole: '评估方',
        handoverTime: new Date('2026-06-18T17:00:00'),
        document: '质量整改通知书 RCT-20260618',
      },
      processing: {
        startedBy: '陈建国',
        startTime: new Date('2026-06-19T08:00:00'),
        progress: 40,
      },
    },
    {
      id: 't12',
      documentNo: 'INTERCEPT-20260620-0001',
      title: '上传泥瓦工程质检记录',
      projectName: '翠湖天地 2栋305',
      deadline: new Date('2026-06-24'),
      priority: 'medium',
      status: 'pending',
      interception: {
        interceptedBy: '系统权限引擎',
        interceptedTime: new Date('2026-06-20T09:00:00'),
        reason: '施工队无法直接签署验收文件，需业主确认',
        authority: '系统权限配置 v3.2 第7.1条',
      },
    },
  ],
  supplier: [
    {
      id: 't13',
      documentNo: 'DELIVERY-20260620-0089',
      title: '诺贝尔瓷砖发货',
      projectName: '阳光花园 3栋1802',
      deadline: new Date('2026-06-21'),
      priority: 'high',
      status: 'overdue',
      handover: {
        fromUser: '陈建国',
        fromRole: '施工队',
        handoverTime: new Date('2026-06-17T10:00:00'),
        document: '材料进场通知单 MAT-20260617',
      },
    },
    {
      id: 't14',
      documentNo: 'QUALITY-RPT-20260618-0015',
      title: '上传TOTO马桶质检报告',
      projectName: '东方明珠 6栋2201',
      deadline: new Date('2026-06-22'),
      priority: 'medium',
      status: 'pending',
    },
    {
      id: 't15',
      documentNo: 'LOGISTICS-20260618-0045',
      title: '圣象地板配送签收',
      projectName: '碧水蓝天 1栋501',
      deadline: new Date('2026-06-23'),
      priority: 'high',
      status: 'completed',
      completion: {
        completedBy: '红星美凯龙',
        completedTime: new Date('2026-06-20T14:30:00'),
        result: '业主已签收，数量规格无误，包装完好',
        certificate: '签收凭证 REC-20260620-0156',
      },
    },
    {
      id: 't16',
      documentNo: 'AFTERSALE-20260615-0007',
      title: '响应地板起翘售后',
      projectName: '翡翠湾 12栋301',
      deadline: new Date('2026-06-21'),
      priority: 'high',
      status: 'processing',
      handover: {
        fromUser: '王建国',
        fromRole: '业主',
        handoverTime: new Date('2026-06-15T09:00:00'),
        document: '售后申诉单 ASF-20260615',
      },
      processing: {
        startedBy: '红星美凯龙客服',
        startTime: new Date('2026-06-15T10:00:00'),
        progress: 80,
      },
    },
  ],
};

interface QuoteVersion {
  version: string;
  versionNo: string;
  generateTime: Date;
  floorPlanImage: string;
  area: number;
  areaSource: string;
  rooms: number;
  style: string;
  materialPreference: string;
  materialSource: string;
  labor: number;
  auxiliary: number;
  main: number;
  management: number;
  design: number;
  total: number;
  adjuster?: string;
  adjustReason?: string;
  comparePrev?: {
    laborDiff: number;
    auxiliaryDiff: number;
    mainDiff: number;
    managementDiff: number;
    designDiff: number;
    totalDiff: number;
  };
}

const projectQuoteVersions: Record<string, QuoteVersion[]> = {
  'proj001': [
    {
      version: 'V1.0',
      versionNo: 'QUOTE-20260610-0001',
      generateTime: new Date('2026-06-10T10:00:00'),
      floorPlanImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=floor%20plan%203%20bedroom%20apartment%20blueprint&image_size=square',
      area: 120,
      areaSource: '户型图AI解析（置信度98.5%）',
      rooms: 3,
      style: '现代简约',
      materialPreference: '品质之选',
      materialSource: '业主填写（2026-06-09调研问卷）',
      labor: 72000,
      auxiliary: 48000,
      main: 84000,
      management: 24000,
      design: 12000,
      total: 240000,
    },
    {
      version: 'V1.1',
      versionNo: 'QUOTE-20260612-0005',
      generateTime: new Date('2026-06-12T14:00:00'),
      floorPlanImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=floor%20plan%203%20bedroom%20apartment%20blueprint&image_size=square',
      area: 120,
      areaSource: '户型图AI解析（置信度98.5%）',
      rooms: 3,
      style: '现代简约',
      materialPreference: '品质之选',
      materialSource: '业主填写（2026-06-09调研问卷）',
      labor: 75400,
      auxiliary: 51600,
      main: 90300,
      management: 25800,
      design: 12900,
      total: 258000,
      adjuster: '李雨晴（设计师）',
      adjustReason: '根据业主需求增加吊顶设计和定制柜',
      comparePrev: {
        laborDiff: 3400,
        auxiliaryDiff: 3600,
        mainDiff: 6300,
        managementDiff: 1800,
        designDiff: 900,
        totalDiff: 18000,
      },
    },
    {
      version: 'V1.2（当前）',
      versionNo: 'QUOTE-20260618-0001',
      generateTime: new Date('2026-06-18T14:30:00'),
      floorPlanImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=floor%20plan%203%20bedroom%20apartment%20blueprint&image_size=square',
      area: 120,
      areaSource: '户型图AI解析（置信度98.5%）+ 现场复测确认',
      rooms: 3,
      style: '现代简约',
      materialPreference: '品质之选升级',
      materialSource: '设计师推荐 + 业主确认（2026-06-17沟通记录）',
      labor: 77400,
      auxiliary: 51600,
      main: 90300,
      management: 25800,
      design: 12900,
      total: 258000,
      adjuster: '张明远（业主）',
      adjustReason: '业主确认最终方案，人工费微调',
      comparePrev: {
        laborDiff: 2000,
        auxiliaryDiff: 0,
        mainDiff: 0,
        managementDiff: 0,
        designDiff: 0,
        totalDiff: 2000,
      },
    },
  ],
};

const getProjectStatus = (progress: number): string => {
  if (progress >= 100) return 'completed';
  if (progress > 0) return 'in-progress';
  return 'pending';
};

const getTodoStatusInfo = (status: TodoDocument['status']) => {
  const map = {
    pending: { label: '待处理', color: 'bg-gray-100 text-gray-600' },
    received: { label: '已接收', color: 'bg-info-100 text-info-700' },
    processing: { label: '处理中', color: 'bg-gold-100 text-gold-700' },
    completed: { label: '已完成', color: 'bg-success-100 text-success-700' },
    rejected: { label: '已驳回', color: 'bg-danger-100 text-danger-700' },
    overdue: { label: '已逾期', color: 'bg-red-100 text-red-700' },
  };
  return map[status];
};

type DesignerSortKey = 'style' | 'cases' | 'rating' | 'complaint';

export default function Dashboard() {
  const { dashboardStats, projects, designers, products, disputes, quoteResults } = useAppStore();
  const [activePipeline, setActivePipeline] = useState<PipelineKey | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleKey | 'all'>('all');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(projects[0]?.id || null);
  const [expandedDisputeId, setExpandedDisputeId] = useState<string | null>(null);
  const [expandedTodoId, setExpandedTodoId] = useState<string | null>(null);
  const [designerSortKey, setDesignerSortKey] = useState<DesignerSortKey>('rating');
  const [activeQuoteTab, setActiveQuoteTab] = useState<'current' | 'history'>('current');
  const [expandedConstructionTab, setExpandedConstructionTab] = useState<'video' | 'checkin' | 'rectification'>('video');
  const [expandedSupplyTab, setExpandedSupplyTab] = useState<'material' | 'inspection' | 'logistics'>('material');

  const creditTrendData = dashboardStats.creditTrend.map((item) => ({
    name: item.date,
    value: item.score,
  }));

  const recentProjects = projects.slice(0, 2);
  const getDesignerById = (id: string) => designers.find((d) => d.id === id);

  const pipelineCounts: Record<PipelineKey, number> = {
    quote: quoteResults.length + 350,
    design: designers.length + 120,
    construction: projects.filter((p) => p.progress < 100).length + 35,
    supply: products.length + 250,
    dispute: disputes.length,
    credit: 320,
  };

  const sortedDesigners = useMemo(() => {
    return [...designers].sort((a, b) => {
      switch (designerSortKey) {
        case 'cases':
          return b.completedProjects - a.completedProjects;
        case 'rating':
          return b.averageRating - a.averageRating;
        case 'complaint':
          return a.complaintRate - b.complaintRate;
        case 'style':
        default:
          return b.averageRating - a.averageRating;
      }
    });
  }, [designerSortKey, designers]);

  const projectMilestones = useMemo(() => [
    {
      id: 'm1',
      name: '开工交底',
      status: 'completed',
      plannedDate: new Date('2026-06-01'),
      actualDate: new Date('2026-06-01'),
      photos: [
        { url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=construction%20site%20interior%20before%20renovation&image_size=square', uploader: '陈建国', uploadTime: new Date('2026-06-01T09:00:00'), note: '现场原始照片' },
        { url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=interior%20design%20mood%20board%20modern%20style&image_size=square', uploader: '李雨晴', uploadTime: new Date('2026-06-01T10:00:00'), note: '设计交底图纸' },
      ],
      videos: [],
      checkinUser: '陈建国',
      checkinTime: new Date('2026-06-01T08:30:00'),
      inspector: '张明远',
      inspectTime: new Date('2026-06-01T15:00:00'),
      inspectResult: 'approved',
    },
    {
      id: 'm2',
      name: '拆除工程',
      status: 'completed',
      plannedDate: new Date('2026-06-02'),
      actualDate: new Date('2026-06-03'),
      photos: [
        { url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wall%20demolition%20construction%20site&image_size=square', uploader: '陈建国', uploadTime: new Date('2026-06-02T10:00:00'), note: '墙体拆除中' },
        { url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=construction%20site%20debris%20cleaning&image_size=square', uploader: '陈建国', uploadTime: new Date('2026-06-03T16:00:00'), note: '清理完成' },
      ],
      videos: [],
      checkinUser: '陈建国',
      checkinTime: new Date('2026-06-02T08:00:00'),
      inspector: '张明远',
      inspectTime: new Date('2026-06-03T17:00:00'),
      inspectResult: 'approved',
    },
    {
      id: 'm3',
      name: '水电改造',
      status: 'completed',
      plannedDate: new Date('2026-06-04'),
      actualDate: new Date('2026-06-06'),
      photos: [
        { url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=electrical%20wiring%20installation%20construction&image_size=square', uploader: '陈建国', uploadTime: new Date('2026-06-04T11:00:00'), note: '强电布线' },
        { url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=plumbing%20pipes%20installation%20bathroom&image_size=square', uploader: '陈建国', uploadTime: new Date('2026-06-05T14:00:00'), note: '给排水管道' },
        { url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pressure%20test%20plumbing%20construction&image_size=square', uploader: '陈建国', uploadTime: new Date('2026-06-06T09:00:00'), note: '水压测试 0.8MPa' },
      ],
      videos: [
        { url: '#', title: '卫生间防水闭水试验全过程', duration: '3分25秒', uploader: '陈建国', uploadTime: new Date('2026-06-06T10:00:00'), note: '48小时闭水，楼下无渗漏' },
        { url: '#', title: '强电回路绝缘测试', duration: '1分48秒', uploader: '陈建国', uploadTime: new Date('2026-06-06T11:00:00'), note: '所有回路绝缘电阻≥0.5MΩ' },
      ],
      checkinUser: '陈建国',
      checkinTime: new Date('2026-06-04T07:30:00'),
      inspector: '第三方监理 · 王工',
      inspectTime: new Date('2026-06-06T16:00:00'),
      inspectResult: 'approved',
    },
    {
      id: 'm4',
      name: '泥瓦工程',
      status: 'in-progress',
      plannedDate: new Date('2026-06-07'),
      actualDate: new Date('2026-06-08'),
      photos: [
        { url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wall%20tile%20installation%20bathroom&image_size=square', uploader: '陈建国', uploadTime: new Date('2026-06-09T10:00:00'), note: '墙面瓷砖铺贴' },
        { url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=floor%20heating%20installation%20construction&image_size=square', uploader: '陈建国', uploadTime: new Date('2026-06-10T14:00:00'), note: '地暖找平层施工' },
      ],
      videos: [],
      checkinUser: '陈建国',
      checkinTime: new Date('2026-06-07T08:00:00'),
      inspector: null,
      inspectTime: null,
      inspectResult: null,
      rectification: {
        beforePhoto: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=uneven%20tile%20floor%20defect&image_size=square',
        afterPhoto: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=perfect%20tile%20floor%20after%20repair&image_size=square',
        issue: '客厅地砖空鼓 3 处',
        rectifier: '陈建国',
        rectifyTime: new Date('2026-06-12T16:00:00'),
        result: '敲击检测无空鼓声，平整度 2mm/2m',
      },
    },
    {
      id: 'm5',
      name: '木工工程',
      status: 'pending',
      plannedDate: new Date('2026-06-15'),
      actualDate: null,
      photos: [],
      videos: [],
      checkinUser: null,
      checkinTime: null,
      inspector: null,
      inspectTime: null,
      inspectResult: null,
    },
    {
      id: 'm6',
      name: '竣工验收',
      status: 'pending',
      plannedDate: new Date('2026-07-10'),
      actualDate: null,
      photos: [],
      videos: [],
      checkinUser: null,
      checkinTime: null,
      inspector: null,
      inspectTime: null,
      inspectResult: null,
    },
  ], []);

  const supplyChainData = useMemo(() => [
    {
      id: 'mat001',
      name: '诺贝尔瓷砖 客厅地砖 800×800mm',
      brand: '诺贝尔',
      category: '瓷砖',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20ceramic%20floor%20tile%20marble%20pattern&image_size=square',
      traceCode: 'TRC-NBEL-20260610-00158',
      authorization: {
        verified: true,
        issuer: '杭州诺贝尔陶瓷有限公司',
        licenseNo: 'NBEL-AUTH-2026-JS-0042',
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2026-12-31'),
        verifyCode: 'AUTH-VER-7F3A9C2D',
      },
      batch: {
        batchNo: 'BATCH-NBEL-20260515-0892',
        productionDate: new Date('2026-05-15'),
        inspection: {
          reportNo: 'INS-NBEL-20260518-00892',
          testItems: [
            { name: '尺寸偏差', result: '合格', standard: '±0.5mm' },
            { name: '表面平整度', result: '合格', standard: '≤0.2%' },
            { name: '断裂模数', result: '合格', standard: '≥35MPa' },
            { name: '耐磨性', result: '合格', standard: '≤175mm³' },
            { name: '抗热震性', result: '合格', standard: '10次无裂纹' },
            { name: '放射性核素', result: '合格', standard: 'A类 ≤1.0' },
          ],
          testOrg: '国家建筑卫生陶瓷质量检验检测中心',
          testDate: new Date('2026-05-18'),
          conclusion: '所检项目符合 GB/T 4100-2015 标准要求',
        },
      },
      logistics: [
        { id: 'l1', location: '杭州诺贝尔陶瓷有限公司（原厂出库）', timestamp: new Date('2026-06-10T08:00:00'), operator: '仓库管理员 · 刘芳', operatorId: 'wh-nbl-003' },
        { id: 'l2', location: '杭州萧山物流中心（区域仓）', timestamp: new Date('2026-06-10T14:30:00'), operator: '物流 · 顺通速运', operatorId: 'SF-20260610-145' },
        { id: 'l3', location: '上海青浦分拨中心', timestamp: new Date('2026-06-11T06:20:00'), operator: '物流 · 顺通速运', operatorId: 'SF-20260611-089' },
        { id: 'l4', location: '上海浦东配送站', timestamp: new Date('2026-06-11T18:45:00'), operator: '配送站 · 张师傅', operatorId: 'PD-028' },
        { id: 'l5', location: '阳光花园 3栋1802（项目现场）', timestamp: new Date('2026-06-12T09:30:00'), operator: '业主签收 · 张明远', operatorId: 'u001' },
      ],
    },
    {
      id: 'mat002',
      name: 'TOTO 连体式马桶 CW886B',
      brand: 'TOTO',
      category: '卫浴洁具',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20white%20ceramic%20toilet%20bathroom&image_size=square',
      traceCode: 'TRC-TOTO-20260520-00892',
      authorization: {
        verified: true,
        issuer: '东陶（中国）有限公司',
        licenseNo: 'TOTO-AUTH-2026-SH-018',
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2026-12-31'),
        verifyCode: 'AUTH-VER-B5E81D4F',
      },
      batch: {
        batchNo: 'BATCH-TOTO-20260420-0451',
        productionDate: new Date('2026-04-20'),
        inspection: {
          reportNo: 'INS-TOTO-20260422-0451',
          testItems: [
            { name: '用水量', result: '合格', standard: '≤4.8L' },
            { name: '水封深度', result: '合格', standard: '≥50mm' },
            { name: '冲洗功能', result: '合格', standard: '≥85%' },
            { name: '耐荷重性', result: '合格', standard: '≥2.2kN' },
            { name: '放射性核素', result: '合格', standard: 'A类 ≤1.0' },
          ],
          testOrg: '国家建筑卫生陶瓷质量检验检测中心',
          testDate: new Date('2026-04-22'),
          conclusion: '所检项目符合 GB 6952-2015 标准要求',
        },
      },
      logistics: [
        { id: 'l1', location: 'TOTO 上海松江工厂', timestamp: new Date('2026-05-25T10:00:00'), operator: '工厂出货', operatorId: 'toto-sh-017' },
        { id: 'l2', location: 'TOTO 上海虹桥分销仓', timestamp: new Date('2026-05-26T09:00:00'), operator: '仓管 · 陈立', operatorId: 'wh-toto-042' },
        { id: 'l3', location: '配送途中', timestamp: new Date('2026-06-21T08:00:00'), operator: '配送 · 顺通速运', operatorId: 'SF-20260621-201' },
      ],
    },
  ], []);

  const disputeClosureData = useMemo(() => [
    {
      id: 'disp001',
      caseNo: 'DISP-20260610-0001',
      projectName: '阳光花园 3栋1802',
      disputeType: '工程质量纠纷',
      plaintiff: '张明远（业主）',
      plaintiffId: 'u001',
      defendant: '陈建国（施工队）',
      defendantId: 'u003',
      status: 'mediating',
      claimAmount: 15000,
      description: '卫生间防水层施工不达标，经第三方检测厚度仅1.2mm，低于国家标准≥1.5mm要求，业主申请返工及误工赔偿',
      thirdPartyEvaluation: {
        org: '国家建筑装饰工程质量检验检测中心',
        orgLevel: '国家级资质（甲级）',
        evaluator: '高级工程师 · 王建国',
        evaluatorLicense: 'GONG-CHENG-ZJ-2023-0481',
        evaluateDate: new Date('2026-06-15'),
        conclusion: '施工方主责（70%责任）',
        details: [
          { item: '卫生间防水层厚度', standard: 'GB 50208-2011 ≥1.5mm', measured: '实测1.2mm', result: '不达标' },
          { item: '防水层涂刷遍数', standard: '≥2遍交叉涂刷', measured: '仅涂刷1遍', result: '不达标' },
          { item: '闭水试验时长', standard: '≥48小时', measured: '仅24小时', result: '不规范' },
        ],
        suggestion: '建议返工重做防水层，并对业主造成的工期延误进行合理补偿',
      },
      compensationRule: {
        ruleId: 'RULE-DISP-12.3.2',
        ruleName: '《装修工程质量瑕疵赔付标准》第12.3.2条',
        ruleText: '因施工工艺不达标导致返工的，应按返工成本 × 1.3（含误工补偿系数）计算赔付金额，返工成本以AI报价引擎对应分项报价为准',
        formula: '赔付金额 = AI报价(防水分项) × 返工系数(1.0) × 责任比例(70%) × 误工补偿(1.3)',
        calculation: [
          { item: 'AI报价防水分项（人工费+辅料）', value: 8500 },
          { item: '返工系数', value: 1.0 },
          { item: '施工方责任比例', value: 0.7 },
          { item: '误工补偿系数（逾期3天）', value: 1.3 },
        ],
        finalAmount: 7735,
        payer: '施工队（陈建国）',
        payee: '业主（张明远）',
        payDeadline: new Date('2026-06-25'),
      },
      reviewRecords: [
        {
          id: 'r1',
          phase: '证据链审查',
          reviewer: '平台法务 · 李律师',
          reviewerTitle: '企业法律顾问 · 执业12年',
          reviewDate: new Date('2026-06-12T10:30:00'),
          result: 'pass',
          remark: '证据链完整：业主提供照片8张、视频2个；施工方确认施工记录；第三方检测报告有效。哈希存证验证通过。',
          verifyItems: [
            { name: '证据数量完整性', result: 'pass', detail: '12份证据全部链上存证' },
            { name: '哈希值校验', result: 'pass', detail: '链上哈希与文件哈希一致' },
            { name: '时间戳连续性', result: 'pass', detail: '上传时间与事件时间线吻合' },
          ],
        },
        {
          id: 'r2',
          phase: '第三方评估审查',
          reviewer: '平台工程顾问 · 赵总工程师',
          reviewerTitle: '一级注册建造师 · 高级工程师',
          reviewDate: new Date('2026-06-16T14:00:00'),
          result: 'pass',
          remark: '第三方机构资质有效，检测方法符合国标，结论客观可信，70%责任判定合理。',
          verifyItems: [
            { name: '评估机构资质', result: 'pass', detail: '国家建筑装饰质检中心（甲级）' },
            { name: '检测人员资质', result: 'pass', detail: '王建国 高工 执业证有效' },
            { name: '检测标准适用', result: 'pass', detail: '正确引用 GB 50208-2011' },
            { name: '责任比例判定', result: 'pass', detail: '70%主责符合行业惯例' },
          ],
        },
        {
          id: 'r3',
          phase: '赔付规则适用审查',
          reviewer: '平台规则审核委员会',
          reviewerTitle: '由5名行业专家组成',
          reviewDate: new Date('2026-06-18T09:00:00'),
          result: 'pending',
          remark: '规则适用RULE-DISP-12.3.2，计算公式正确，最终赔付金额 ¥7,735 待双方确认。',
          verifyItems: [
            { name: '规则匹配正确性', result: 'pass', detail: '质量瑕疵→RULE-DISP-12.3.2' },
            { name: '参数取值合理性', result: 'pass', detail: 'AI报价取数+责任比例70%' },
            { name: '计算结果准确性', result: 'pass', detail: '8500×1×0.7×1.3=7735 ✓' },
            { name: '双方确认签字', result: 'pending', detail: '业主已确认，待施工队确认' },
          ],
        },
      ],
      finalLiability: {
        liableParty: '施工队（陈建国）',
        liabilityRatio: '70%',
        finalAmount: 7735,
        implementationProgress: 40,
        implementationSteps: [
          { step: '赔付方案出具', status: 'completed', time: new Date('2026-06-18'), operator: '平台规则委员会' },
          { step: '业主确认', status: 'completed', time: new Date('2026-06-19'), operator: '张明远（电子签名）' },
          { step: '施工队确认', status: 'pending', time: null, operator: '陈建国' },
          { step: '赔付执行（质保金扣除）', status: 'pending', time: null, operator: '平台财务' },
          { step: '最终结案审计', status: 'pending', time: null, operator: '平台审计' },
        ],
      },
    },
    {
      id: 'disp002',
      caseNo: 'DISP-20260605-0002',
      projectName: '城市之星 5栋901',
      disputeType: '设计变更纠纷',
      plaintiff: '张明远（业主）',
      defendant: '王浩然（设计师）',
      status: 'evaluating',
      claimAmount: 12000,
      description: '设计师王浩然在未获业主书面确认情况下擅自修改吊顶方案，导致费用超预算15%',
      thirdPartyEvaluation: {
        org: '中国室内装饰协会行业争议调解中心',
        orgLevel: '行业一级',
        evaluator: '高级设计师 · 林静',
        evaluatorLicense: 'ZSHI-NEI-ZHUANG-2019-0892',
        evaluateDate: null,
        conclusion: '评估中',
        details: [],
        suggestion: '',
      },
      compensationRule: null,
      reviewRecords: [
        {
          id: 'r1',
          phase: '证据链审查',
          reviewer: '平台法务 · 李律师',
          reviewDate: new Date('2026-06-08'),
          result: 'pass',
          remark: '微信沟通记录、设计方案版本对比、报价差额计算已链上存证',
          verifyItems: [
            { name: '证据数量完整性', result: 'pass', detail: '8份证据已存证' },
            { name: '设计变更流程合规性', result: 'fail', detail: '缺少业主书面确认书' },
          ],
        },
      ],
      finalLiability: null,
    },
  ], []);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-gray-900 font-display">数据总览</h1>
        <p className="text-gray-500 mt-1">家装信用服务平台 · 业务单据全链路可复核闭环监控中心</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold-500" />
              家装业务全链路 · 点击环节下钻真实业务单据
            </h3>
          </div>
          <span className="text-xs text-gold-600 bg-gold-50 px-2.5 py-1 rounded-full font-medium">6环节闭环 · 单据级可追溯</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
          {pipelineKeys.map((key) => {
            const meta = pipelineMeta[key];
            const isActive = activePipeline === key;
            return (
              <motion.div key={key} layout>
                <button
                  onClick={() => setActivePipeline(isActive ? null : key)}
                  className={cn(
                    'w-full p-3 rounded-xl border-2 transition-all duration-200 text-left',
                    meta.color === 'primary' && (isActive ? 'border-primary-400 bg-primary-50 shadow-md' : 'border-primary-100 bg-primary-50/50 hover:border-primary-300'),
                    meta.color === 'info' && (isActive ? 'border-info-400 bg-info-50 shadow-md' : 'border-info-100 bg-info-50/50 hover:border-info-300'),
                    meta.color === 'success' && (isActive ? 'border-success-400 bg-success-50 shadow-md' : 'border-success-100 bg-success-50/50 hover:border-success-300'),
                    meta.color === 'gold' && (isActive ? 'border-gold-400 bg-gold-50 shadow-md' : 'border-gold-100 bg-gold-50/50 hover:border-gold-300'),
                    meta.color === 'danger' && (isActive ? 'border-danger-400 bg-danger-50 shadow-md' : 'border-danger-100 bg-danger-50/50 hover:border-danger-300'),
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
                    <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', isActive && 'rotate-180')} />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{pipelineCounts[key]}</div>
                  <div className="text-xs font-medium text-gray-700">{meta.label}</div>
                </button>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {activePipeline === 'quote' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-2">AI报价单据明细（展示真实报价单号、户型图来源、面积解析置信度、选材偏好来源）</div>
                <div className="overflow-hidden rounded-lg border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-2.5 py-1.5 font-medium text-gray-600 text-xs">报价单号</th>
                        <th className="text-left px-2.5 py-1.5 font-medium text-gray-600 text-xs">户型图解析</th>
                        <th className="text-left px-2.5 py-1.5 font-medium text-gray-600 text-xs">面积/来源</th>
                        <th className="text-left px-2.5 py-1.5 font-medium text-gray-600 text-xs">风格/选材/来源</th>
                        <th className="text-right px-2.5 py-1.5 font-medium text-gray-600 text-xs">总额</th>
                        <th className="text-center px-2.5 py-1.5 font-medium text-gray-600 text-xs">版本</th>
                        <th className="text-center px-2.5 py-1.5 font-medium text-gray-600 text-xs">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {projectQuoteVersions['proj001'].map((q) => (
                        <tr key={q.version} className="hover:bg-gray-50/50">
                          <td className="px-2.5 py-1.5 font-mono text-xs text-primary-600">{q.versionNo}</td>
                          <td className="px-2.5 py-1.5">
                            <div className="flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5 text-primary-500" />
                              <span className="text-xs text-gray-700">户型图AI解析</span>
                            </div>
                          </td>
                          <td className="px-2.5 py-1.5">
                            <div className="text-xs text-gray-700">{q.rooms}室 · {q.area}㎡</div>
                            <div className="text-[10px] text-gray-500">{q.areaSource}</div>
                          </td>
                          <td className="px-2.5 py-1.5">
                            <div className="text-xs text-gray-700">{q.style} / {q.materialPreference}</div>
                            <div className="text-[10px] text-gray-500">{q.materialSource}</div>
                          </td>
                          <td className="px-2.5 py-1.5 text-right font-semibold text-gray-900">{formatCurrency(q.total)}</td>
                          <td className="px-2.5 py-1.5 text-center">
                            <span className={cn(
                              'text-xs px-1.5 py-0.5 rounded',
                              q.version.includes('当前') ? 'bg-primary-100 text-primary-700 font-medium' : 'bg-gray-100 text-gray-600'
                            )}>{q.version}</span>
                          </td>
                          <td className="px-2.5 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button className="text-xs text-primary-600 flex items-center gap-0.5"><Eye className="w-3 h-3" />明细</button>
                              {q.comparePrev && <button className="text-xs text-info-600 flex items-center gap-0.5"><FileDiff className="w-3 h-3" />对比</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activePipeline === 'design' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-gray-500">设计师匹配推荐 · 按四维真实排序（当前排序维度：
                    {designerSortKey === 'style' && '风格专长匹配度'}
                    {designerSortKey === 'cases' && '完工案例数'}
                    {designerSortKey === 'rating' && '业主评分'}
                    {designerSortKey === 'complaint' && '投诉率（由低到高）'}
                  ）</div>
                  <div className="flex gap-1">
                    {([
                      { key: 'style' as DesignerSortKey, label: '风格匹配' },
                      { key: 'cases' as DesignerSortKey, label: '完工数' },
                      { key: 'rating' as DesignerSortKey, label: '评分' },
                      { key: 'complaint' as DesignerSortKey, label: '投诉率' },
                    ]).map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setDesignerSortKey(s.key)}
                        className={cn(
                          'text-xs px-2 py-1 rounded transition-colors',
                          designerSortKey === s.key ? 'bg-info-500 text-white font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >{s.label}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {sortedDesigners.map((d, i) => (
                    <div key={d.id} className="p-3 bg-white border border-gray-100 rounded-lg hover:border-info-200 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <img src={d.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                            <div className="absolute -bottom-0.5 -right-0.5">
                              <CreditBadge level={d.averageRating >= 4.8 ? 'S' as CreditLevel : 'A' as CreditLevel} score={Math.round(d.averageRating * 200 - 60)} size="sm" showIcon={false} />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{d.name}</div>
                            <div className="text-[10px] text-gray-500">{d.yearsExperience}年经验</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gold-600 bg-gold-50 px-1.5 rounded">TOP {i + 1}</span>
                      </div>
                      <div className="flex flex-wrap gap-0.5 mb-2">
                        {d.specializations.map((s) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 bg-info-50 text-info-700 rounded">{s}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[10px] text-center mb-2">
                        <div className="bg-gold-50 rounded p-1">
                          <div className="font-bold text-gold-700 flex items-center justify-center gap-0.5"><Star className="w-2 h-2 fill-gold-500 text-gold-500" />{d.averageRating}</div>
                          <div className="text-gray-500">业主评分</div>
                        </div>
                        <div className="bg-primary-50 rounded p-1">
                          <div className="font-bold text-primary-700">{d.completedProjects}</div>
                          <div className="text-gray-500">完工案例</div>
                        </div>
                        <div className="bg-danger-50 rounded p-1">
                          <div className="font-bold text-danger-700">{(d.complaintRate * 100).toFixed(1)}%</div>
                          <div className="text-gray-500">投诉率</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <button className="text-xs py-1 bg-info-500 text-white rounded hover:bg-info-600 flex items-center justify-center gap-0.5 transition-colors">
                          <Send className="w-3 h-3" />派单
                        </button>
                        <button className="text-xs py-1 bg-white border border-gray-200 text-gray-600 rounded hover:bg-gray-50 flex items-center justify-center gap-0.5 transition-colors">
                          <Eye className="w-3 h-3" />详情
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activePipeline === 'construction' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-2">施工项目监理详情（含节点打卡、隐蔽工程视频、整改对照）</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="text-xs font-semibold text-primary-600 flex items-center gap-1 mb-2"><Video className="w-3.5 h-3.5" />隐蔽工程视频归档清单</div>
                    <div className="space-y-2">
                      {projectMilestones.filter((m) => m.videos.length > 0).flatMap((m) => m.videos.map((v: any, i: number) => (
                        <div key={`${m.id}-v${i}`} className="bg-white rounded p-2 border border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center text-white flex-shrink-0">
                              <Video className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-gray-900 truncate">{v.title}</div>
                              <div className="text-[10px] text-gray-500">{m.name} · {v.duration} · {v.uploader}</div>
                            </div>
                            <span className="text-[10px] text-success-600 bg-success-50 px-1 rounded flex-shrink-0">已存证</span>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1 pl-10">备注：{v.note}</div>
                        </div>
                      )))}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="text-xs font-semibold text-success-600 flex items-center gap-1 mb-2"><CheckCheck className="w-3.5 h-3.5" />节点打卡归档清单</div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {projectMilestones.filter((m) => m.checkinUser).map((m) => (
                        <div key={m.id} className="bg-white rounded p-2 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-900">{m.name}</span>
                            <span className={cn(
                              'text-[10px] px-1.5 rounded',
                              m.status === 'completed' && 'bg-success-100 text-success-700',
                              m.status === 'in-progress' && 'bg-gold-100 text-gold-700',
                              m.status === 'pending' && 'bg-gray-100 text-gray-600',
                            )}>
                              {m.status === 'completed' ? '已完成' : m.status === 'in-progress' ? '进行中' : '待开始'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 mt-1 text-[10px]">
                            <div className="text-gray-500">施工打卡：{m.checkinUser} {formatDateTime(m.checkinTime!).slice(5, 16)}</div>
                            {m.inspector && <div className="text-gray-500">监理核验：{m.inspector} {formatDateTime(m.inspectTime!).slice(5, 16)}</div>}
                          </div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {m.photos.length > 0 && <span className="text-[10px] text-primary-600 bg-primary-50 px-1 rounded"><Camera className="w-2 h-2 inline" /> {m.photos.length}张照片</span>}
                            {m.videos.length > 0 && <span className="text-[10px] text-danger-600 bg-danger-50 px-1 rounded"><Video className="w-2 h-2 inline" /> {m.videos.length}个视频</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="text-xs font-semibold text-danger-600 flex items-center gap-1 mb-2"><Undo2 className="w-3.5 h-3.5" />整改前后对照</div>
                    {projectMilestones.filter((m: any) => m.rectification).map((m: any) => (
                      <div key={m.id} className="bg-white rounded p-2 border border-gray-200">
                        <div className="text-xs font-medium text-gray-900 mb-2">{m.name} · 整改记录</div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <div className="text-[10px] text-danger-600 mb-1">整改前</div>
                            <img src={m.rectification.beforePhoto} alt="" className="w-full h-16 object-cover rounded" />
                          </div>
                          <div>
                            <div className="text-[10px] text-success-600 mb-1">整改后</div>
                            <img src={m.rectification.afterPhoto} alt="" className="w-full h-16 object-cover rounded" />
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-600 space-y-0.5">
                          <div><span className="text-gray-500">问题：</span>{m.rectification.issue}</div>
                          <div><span className="text-gray-500">整改人：</span>{m.rectification.rectifier} · {formatDate(m.rectification.rectifyTime)}</div>
                          <div><span className="text-gray-500">结果：</span>{m.rectification.result}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activePipeline === 'supply' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-2">供应链溯源 · 品牌授权验证 + 批次质检报告 + 物流轨迹</div>
                <div className="space-y-3">
                  {supplyChainData.map((mat) => (
                    <div key={mat.id} className="bg-white border border-gray-100 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <img src={mat.image} alt="" className="w-14 h-14 rounded object-cover flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm text-gray-900 truncate">{mat.name}</div>
                            <code className="text-[10px] text-gold-700 bg-gold-50 px-1.5 rounded font-mono flex-shrink-0 ml-2">{mat.traceCode}</code>
                          </div>
                          <div className="text-xs text-gray-500">{mat.brand} · {mat.category}</div>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <div className="bg-success-50 rounded p-2 border border-success-100">
                              <div className="text-[10px] font-semibold text-success-700 flex items-center gap-0.5 mb-1"><BadgeCheck className="w-3 h-3" />品牌授权验证</div>
                              <div className="text-[10px] text-gray-700 space-y-0.5">
                                <div className="truncate">机构：{mat.authorization.issuer.slice(0, 10)}...</div>
                                <div>证书：{mat.authorization.licenseNo}</div>
                                <div>有效期：{formatDate(mat.authorization.validFrom)}~{formatDate(mat.authorization.validTo).slice(5)}</div>
                                <div className="text-success-700">验证码：{mat.authorization.verifyCode}</div>
                              </div>
                            </div>
                            <div className="bg-info-50 rounded p-2 border border-info-100">
                              <div className="text-[10px] font-semibold text-info-700 flex items-center gap-0.5 mb-1"><FileCheck className="w-3 h-3" />批次质检报告</div>
                              <div className="text-[10px] text-gray-700 space-y-0.5">
                                <div>批次：{mat.batch.batchNo.slice(-10)}</div>
                                <div>检测：{mat.batch.inspection.testItems.length}项全合格</div>
                                <div className="truncate">机构：{mat.batch.inspection.testOrg.slice(0, 10)}...</div>
                                <div>报告：{mat.batch.inspection.reportNo}</div>
                                <div className="text-info-700 truncate">结论：{mat.batch.inspection.conclusion.slice(0, 15)}...</div>
                              </div>
                            </div>
                            <div className="bg-primary-50 rounded p-2 border border-primary-100">
                              <div className="text-[10px] font-semibold text-primary-700 flex items-center gap-0.5 mb-1"><Truck className="w-3 h-3" />物流轨迹（{mat.logistics.length}节点）</div>
                              <div className="space-y-0.5 max-h-20 overflow-y-auto">
                                {mat.logistics.slice(-3).map((log) => (
                                  <div key={log.id} className="text-[10px] text-gray-600 flex items-start gap-0.5">
                                    <ChevronRight className="w-2 h-2 text-primary-500 flex-shrink-0 mt-0.5" />
                                    <span className="truncate max-w-[120px]" title={log.location}>{log.location.slice(0, 12)}...</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activePipeline === 'dispute' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-2">纠纷调解完整闭环 · 证据链 → 第三方评估 → 赔付规则 → 复查记录 → 最终责任归属（点击下方案件展开详情）</div>
                <div className="space-y-2">
                  {disputeClosureData.map((d) => {
                    const exp = expandedDisputeId === d.id;
                    return (
                      <div key={d.id} className="border border-gray-100 rounded-lg overflow-hidden">
                        <div className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50/50" onClick={() => setExpandedDisputeId(exp ? null : d.id)}>
                          <code className="text-xs text-danger-600 bg-danger-50 px-1.5 rounded font-mono">{d.caseNo}</code>
                          <span className="text-sm font-medium text-gray-900">{d.projectName}</span>
                          <span className="text-xs text-gray-500">{d.disputeType}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-0.5">
                            <Database className="w-3 h-3" />{(d as any).reviewRecords.reduce((s: number, r: any) => s + r.verifyItems.length, 0)}项核验
                          </span>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full ml-auto',
                            d.status === 'mediating' && 'bg-gold-100 text-gold-700',
                            d.status === 'evaluating' && 'bg-info-100 text-info-700',
                            d.status === 'resolved' && 'bg-success-100 text-success-700',
                          )}>
                            {d.status === 'mediating' ? '调解中' : d.status === 'evaluating' ? '评估中' : '已结案'}
                          </span>
                          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform flex-shrink-0', exp && 'rotate-180')} />
                        </div>
                        <AnimatePresence>
                          {exp && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100">
                              <div className="p-3 bg-gray-50/50">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 mb-3">
                                  <div className="bg-primary-50 rounded p-2 border border-primary-100">
                                    <div className="text-[10px] font-semibold text-primary-700 mb-1">当事人</div>
                                    <div className="text-xs text-gray-800"><span className="text-primary-700">原告：</span>{d.plaintiff}</div>
                                    <div className="text-xs text-gray-800 mt-0.5"><span className="text-danger-700">被告：</span>{d.defendant}</div>
                                    <div className="text-xs text-gold-700 mt-1">索赔：{formatCurrency(d.claimAmount)}</div>
                                  </div>
                                  <div className="bg-info-50 rounded p-2 border border-info-100">
                                    <div className="text-[10px] font-semibold text-info-700 mb-1 flex items-center gap-0.5"><Gavel className="w-3 h-3" />第三方评估结论</div>
                                    {d.thirdPartyEvaluation && d.thirdPartyEvaluation.evaluateDate ? (
                                      <div className="text-xs text-gray-800 space-y-0.5">
                                        <div className="truncate">{d.thirdPartyEvaluation.org.slice(0, 12)}...</div>
                                        <div className="text-info-700 font-medium">{d.thirdPartyEvaluation.conclusion}</div>
                                        <div className="text-[10px] text-gray-500">评估师：{d.thirdPartyEvaluation.evaluator}</div>
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-400">评估进行中...</div>
                                    )}
                                  </div>
                                  <div className="bg-gold-50 rounded p-2 border border-gold-100">
                                    <div className="text-[10px] font-semibold text-gold-700 mb-1 flex items-center gap-0.5"><Calculator className="w-3 h-3" />赔付规则依据</div>
                                    {d.compensationRule ? (
                                      <div className="text-xs text-gray-800 space-y-0.5">
                                        <div className="font-mono text-[10px]">{d.compensationRule.ruleId}</div>
                                        <div className="font-medium text-gold-700">赔付：{formatCurrency(d.compensationRule.finalAmount)}</div>
                                        <div className="text-[10px] text-gray-500">公式：{d.compensationRule.formula.slice(0, 20)}...</div>
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-400">待规则委员会判定</div>
                                    )}
                                  </div>
                                  <div className="bg-success-50 rounded p-2 border border-success-100">
                                    <div className="text-[10px] font-semibold text-success-700 mb-1 flex items-center gap-0.5"><History className="w-3 h-3" />复查处理记录</div>
                                    <div className="space-y-0.5">
                                      {d.reviewRecords.map((r: any) => (
                                        <div key={r.id} className="flex items-center gap-1 text-[10px]">
                                          {r.result === 'pass' ? <CheckCircle2 className="w-3 h-3 text-success-500 flex-shrink-0" /> : r.result === 'fail' ? <XCircle className="w-3 h-3 text-danger-500 flex-shrink-0" /> : <Clock className="w-3 h-3 text-gold-500 flex-shrink-0" />}
                                          <span className="truncate text-gray-700">{r.phase}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                {d.finalLiability && (
                                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-xs font-semibold text-danger-700 flex items-center gap-1"><Gavel className="w-3.5 h-3.5" />最终责任归属</div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-600">执行进度</span>
                                        <div className="w-32"><Progress value={d.finalLiability.implementationProgress} size="sm" showLabel label="" /></div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                      {d.finalLiability.implementationSteps.map((step: any, i: number) => (
                                        <div key={i} className={cn(
                                          'rounded p-2 border',
                                          step.status === 'completed' ? 'bg-success-50 border-success-200' : 'bg-gray-50 border-gray-200'
                                        )}>
                                          <div className="flex items-center gap-1 mb-0.5">
                                            {step.status === 'completed' ? <CheckCircle2 className="w-3 h-3 text-success-600 flex-shrink-0" /> : <Clock className="w-3 h-3 text-gold-500 flex-shrink-0" />}
                                            <span className={cn('text-xs font-medium', step.status === 'completed' ? 'text-success-700' : 'text-gray-600')}>{step.step}</span>
                                          </div>
                                          <div className="text-[10px] text-gray-500 truncate">{step.operator}</div>
                                          {step.time && <div className="text-[10px] text-gray-400">{formatDate(step.time).slice(5)}</div>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activePipeline === 'credit' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-2">信用变动审计记录 · 每条变动可追溯关联业务单据</div>
                <div className="overflow-hidden rounded-lg border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-2.5 py-1.5 font-medium text-gray-600 text-xs">用户</th>
                        <th className="text-center px-2.5 py-1.5 font-medium text-gray-600 text-xs">角色</th>
                        <th className="text-center px-2.5 py-1.5 font-medium text-gray-600 text-xs">等级</th>
                        <th className="text-right px-2.5 py-1.5 font-medium text-gray-600 text-xs">信用分</th>
                        <th className="text-center px-2.5 py-1.5 font-medium text-gray-600 text-xs">变动</th>
                        <th className="text-left px-2.5 py-1.5 font-medium text-gray-600 text-xs">变动原因（关联业务单据 · 审计依据）</th>
                        <th className="text-left px-2.5 py-1.5 font-medium text-gray-600 text-xs">生效时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[
                        { user: '李雨晴', role: '设计师', level: 'S' as CreditLevel, score: 945, change: '+15', reason: '项目「阳光花园」按时高质量交付，业主5星好评；关联单据：完工验收单 PROJ001-CMP-20260615', time: '2026-06-15 10:30' },
                        { user: '李雨晴', role: '设计师', level: 'S' as CreditLevel, score: 930, change: '+10', reason: '连续3个月无投诉；关联单据：Q2投诉统计报表 RPT-CMPL-2026-Q2', time: '2026-06-01 00:00' },
                        { user: '李雨晴', role: '设计师', level: 'A' as CreditLevel, score: 920, change: '-5', reason: '「城市之星」设计方案修改延迟2天；关联工单：WO2026052003（业主确认）', time: '2026-05-20 14:20' },
                        { user: '陈建国', role: '施工队', level: 'A' as CreditLevel, score: 895, change: '+12', reason: '本月完成6个节点验收一次性通过率100%；关联质检：QC-202606-汇总', time: '2026-06-10 17:00' },
                        { user: '红星美凯龙', role: '供应商', level: 'S' as CreditLevel, score: 910, change: '+8', reason: '连续12批次质检合格率100%；关联批次：B20260425001~B20260615012', time: '2026-06-16 09:15' },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="px-2.5 py-1.5 font-medium text-gray-900 text-xs">{row.user}</td>
                          <td className="px-2.5 py-1.5 text-center text-gray-700 text-xs">{row.role}</td>
                          <td className="px-2.5 py-1.5 text-center"><CreditBadge level={row.level} score={row.score} size="sm" showIcon={false} /></td>
                          <td className="px-2.5 py-1.5 text-right font-semibold text-gray-900 text-xs">{row.score}</td>
                          <td className="px-2.5 py-1.5 text-center">
                            <span className={cn('text-xs font-bold', row.change.startsWith('+') ? 'text-success-600' : 'text-danger-600')}>{row.change}</span>
                          </td>
                          <td className="px-2.5 py-1.5 text-gray-600 text-xs max-w-xs">{row.reason}</td>
                          <td className="px-2.5 py-1.5 text-gray-500 text-xs">{row.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" />
              四类主体协同工作台 · 真实待办单据（含交接来源/接收回执/驳回原因/处理结果/越权拦截）
            </h3>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setSelectedRole('all')} className={cn('px-2.5 py-1 text-xs rounded-lg transition-all', selectedRole === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>全部</button>
            {roleList.map((r) => (
              <button key={r} onClick={() => setSelectedRole(r)} className={cn('px-2.5 py-1 text-xs rounded-lg transition-all', selectedRole === r ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{roleMeta[r].label}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {(roleList.filter((r) => selectedRole === 'all' || selectedRole === r)).map((role, idx) => {
            const meta = roleMeta[role];
            const todos = todoDocuments[role];
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
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200/50">
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
                    <div className="text-[10px] text-gray-500">{todos.length} 项待办 · 5项权限边界</div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-[10px] font-medium text-gray-500 mb-1.5 flex items-center gap-0.5"><CheckSquare className="w-3 h-3" />真实待办单据（点击展开完整闭环）</div>
                  <div className="space-y-1.5">
                    {todos.map((todo) => {
                      const statusInfo = getTodoStatusInfo(todo.status);
                      const daysLeft = Math.ceil((todo.deadline.getTime() - new Date('2026-06-21').getTime()) / 86400000);
                      const overdue = daysLeft < 0;
                      const urgent = daysLeft <= 1 && !overdue;
                      const expanded = expandedTodoId === todo.id;
                      return (
                        <div key={todo.id} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                          <div className="p-2 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandedTodoId(expanded ? null : todo.id)}>
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <code className="text-[9px] text-gray-400 bg-gray-50 px-1 rounded font-mono flex-shrink-0">{todo.documentNo}</code>
                                  <span className={cn('text-[9px] px-1 rounded', statusInfo.color)}>{statusInfo.label}</span>
                                </div>
                                <div className="text-xs font-medium text-gray-900 truncate">{todo.title}</div>
                                <div className="text-[10px] text-gray-500 truncate">{todo.projectName}</div>
                              </div>
                              <div className={cn(
                                'text-[9px] px-1 py-0.5 rounded flex-shrink-0',
                                overdue && 'bg-danger-50 text-danger-700',
                                urgent && !overdue && 'bg-gold-50 text-gold-700',
                                !overdue && !urgent && 'bg-gray-50 text-gray-600',
                              )}>
                                {overdue ? `逾期${Math.abs(daysLeft)}天` : urgent ? `剩${daysLeft}天` : `${daysLeft}天`}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-50">
                              <div className="flex items-center gap-1">
                                {todo.handover ? (
                                  <span className="text-[10px] text-primary-600 flex items-center gap-0.5">
                                    <RefreshCw className="w-2.5 h-2.5" />{todo.handover.fromRole}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><User className="w-2.5 h-2.5" />主动</span>
                                )}
                              </div>
                              <ChevronDown className={cn('w-3 h-3 text-gray-400 transition-transform', expanded && 'rotate-180')} />
                            </div>
                          </div>
                          <AnimatePresence>
                            {expanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100 bg-gray-50/50">
                                <div className="p-2 space-y-1.5">
                                  {todo.handover && (
                                    <div className="bg-white rounded p-2 border border-primary-100">
                                      <div className="text-[10px] font-semibold text-primary-700 flex items-center gap-0.5 mb-1"><RefreshCw className="w-3 h-3" />跨角色交接凭证</div>
                                      <div className="text-[10px] text-gray-700 space-y-0.5">
                                        <div>来源：{todo.handover.fromUser}（{todo.handover.fromRole}）</div>
                                        <div>时间：{formatDateTime(todo.handover.handoverTime).slice(5, 16)}</div>
                                        <div>交接单据：{todo.handover.document}</div>
                                      </div>
                                    </div>
                                  )}
                                  {todo.receipt && (
                                    <div className="bg-white rounded p-2 border border-success-100">
                                      <div className="text-[10px] font-semibold text-success-700 flex items-center gap-0.5 mb-1"><CheckCheck className="w-3 h-3" />接收回执</div>
                                      <div className="text-[10px] text-gray-700 space-y-0.5">
                                        <div>接收人：{todo.receipt.receivedBy}</div>
                                        <div>接收时间：{formatDateTime(todo.receipt.receivedTime).slice(5, 16)}</div>
                                        <div>电子签名：{todo.receipt.signature}</div>
                                      </div>
                                    </div>
                                  )}
                                  {todo.processing && (
                                    <div className="bg-white rounded p-2 border border-gold-100">
                                      <div className="text-[10px] font-semibold text-gold-700 flex items-center gap-0.5 mb-1"><Activity className="w-3 h-3" />处理进度</div>
                                      <div className="text-[10px] text-gray-700 space-y-0.5">
                                        <div>处理人：{todo.processing.startedBy}</div>
                                        <div>开始时间：{formatDateTime(todo.processing.startTime).slice(5, 16)}</div>
                                        <div className="pt-1"><Progress value={todo.processing.progress} size="sm" showLabel label={`当前进度 ${todo.processing.progress}%`} /></div>
                                      </div>
                                    </div>
                                  )}
                                  {todo.rejection && (
                                    <div className="bg-white rounded p-2 border border-danger-100">
                                      <div className="text-[10px] font-semibold text-danger-700 flex items-center gap-0.5 mb-1"><ThumbsDown className="w-3 h-3" />驳回记录</div>
                                      <div className="text-[10px] text-gray-700 space-y-0.5">
                                        <div>驳回人：{todo.rejection.rejectedBy}</div>
                                        <div>驳回时间：{formatDateTime(todo.rejection.rejectedTime).slice(5, 16)}</div>
                                        <div className="text-danger-700">驳回原因：{todo.rejection.reason}</div>
                                        <div className="text-info-700">处理建议：{todo.rejection.suggestion}</div>
                                      </div>
                                    </div>
                                  )}
                                  {todo.completion && (
                                    <div className="bg-white rounded p-2 border border-success-100">
                                      <div className="text-[10px] font-semibold text-success-700 flex items-center gap-0.5 mb-1"><CheckCircle2 className="w-3 h-3" />处理结果</div>
                                      <div className="text-[10px] text-gray-700 space-y-0.5">
                                        <div>完成人：{todo.completion.completedBy}</div>
                                        <div>完成时间：{formatDateTime(todo.completion.completedTime).slice(5, 16)}</div>
                                        <div>处理结果：{todo.completion.result}</div>
                                        <div className="text-success-700 flex items-center gap-0.5"><FileCheck className="w-3 h-3" />闭环凭证：{todo.completion.certificate}</div>
                                      </div>
                                    </div>
                                  )}
                                  {todo.interception && (
                                    <div className="bg-white rounded p-2 border border-red-200 bg-red-50/30">
                                      <div className="text-[10px] font-semibold text-red-700 flex items-center gap-0.5 mb-1"><Ban className="w-3 h-3" />越权拦截记录</div>
                                      <div className="text-[10px] text-gray-700 space-y-0.5">
                                        <div>拦截方：{todo.interception.interceptedBy}</div>
                                        <div>拦截时间：{formatDateTime(todo.interception.interceptedTime).slice(5, 16)}</div>
                                        <div className="text-red-700">拦截原因：{todo.interception.reason}</div>
                                        <div className="text-gray-600">权限依据：{todo.interception.authority}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200/50">
                  <div className="text-[10px] font-medium text-gray-500 mb-1 flex items-center gap-0.5"><Lock className="w-3 h-3" />权限边界</div>
                  <div className="space-y-0.5">
                    {meta.permissions.map((perm, i) => (
                      <div key={i} className="flex items-center gap-1 text-[10px]">
                        <CheckCircle2 className="w-2.5 h-2.5 text-success-500 flex-shrink-0" />
                        <span className="text-gray-700">{perm}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1 text-[10px] pt-0.5 mt-0.5 border-t border-gray-200/50">
                      <XCircle className="w-2.5 h-2.5 text-danger-400 flex-shrink-0" />
                      <span className="text-gray-400">系统自动拦截越权操作（见拦截记录）</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }} className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold-500" />
              信用驱动协同排行榜 · 设计师多维匹配入口
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-600">多方信用排行（含业主/设计师/施工队/供应商）</div>
            </div>
            <div className="space-y-1.5">
              {[
                { rank: 1, name: '李雨晴', role: '设计师', level: 'S' as CreditLevel, score: 945, change: '+15', spec: '现代简约/新中式', cases: 36, rating: 4.9, complaint: 0.5 },
                { rank: 2, name: '红星美凯龙', role: '供应商', level: 'S' as CreditLevel, score: 910, change: '+8', spec: '瓷砖/卫浴/地板', cases: 156, rating: 4.8, complaint: 0.3 },
                { rank: 3, name: '陈建国', role: '施工队', level: 'A' as CreditLevel, score: 895, change: '+12', spec: '住宅精装/老房翻新', cases: 42, rating: 4.7, complaint: 1.2 },
                { rank: 4, name: '张明远', role: '业主', level: 'S' as CreditLevel, score: 920, change: '+5', spec: '优质业主/及时付款', cases: 2, rating: 5.0, complaint: 0 },
                { rank: 5, name: '王浩然', role: '设计师', level: 'A' as CreditLevel, score: 880, change: '-3', spec: '北欧/工业风', cases: 28, rating: 4.6, complaint: 1.8 },
              ].map((u, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                    i === 0 && 'bg-gradient-gold text-white',
                    i === 1 && 'bg-gray-300 text-white',
                    i === 2 && 'bg-amber-600 text-white',
                    i > 2 && 'bg-gray-100 text-gray-500',
                  )}>{u.rank}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-xs text-gray-900">{u.name}</span>
                      <CreditBadge level={u.level} score={u.score} size="sm" showIcon={false} />
                      <span className="text-[10px] text-gray-400 px-1 bg-gray-50 rounded">{u.role}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">{u.spec}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[9px] text-center flex-shrink-0 w-32">
                    <div className="bg-primary-50 rounded px-1"><div className="font-bold text-primary-700">{u.cases}</div><div className="text-gray-500">案例</div></div>
                    <div className="bg-gold-50 rounded px-1"><div className="font-bold text-gold-700">{u.rating}</div><div className="text-gray-500">评分</div></div>
                    <div className="bg-danger-50 rounded px-1"><div className="font-bold text-danger-700">{u.complaint}%</div><div className="text-gray-500">投诉</div></div>
                  </div>
                  <div className="text-right flex-shrink-0 w-10">
                    <div className="text-xs font-bold text-primary-600">{u.score}</div>
                    <div className={cn('text-[10px]', u.change.startsWith('+') ? 'text-success-600' : 'text-danger-600')}>{u.change}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-0.5"><TrendingUp className="w-3 h-3 text-gold-500" />平台信用分趋势（S级占比）</div>
              <LineChart data={creditTrendData} color="#d69e2e" height={80} showArea showGrid={false} yAxisFormatter={(v) => v.toString()} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-600">设计师能力图谱多维排序 · 派单入口</div>
              <div className="flex gap-0.5">
                {([
                  { key: 'style' as DesignerSortKey, label: '风格匹配' },
                  { key: 'cases' as DesignerSortKey, label: '完工数' },
                  { key: 'rating' as DesignerSortKey, label: '评分' },
                  { key: 'complaint' as DesignerSortKey, label: '投诉率' },
                ]).map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setDesignerSortKey(s.key)}
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded transition-colors',
                      designerSortKey === s.key ? 'bg-info-500 text-white font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >{s.label}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {sortedDesigners.map((d, i) => (
                <div key={d.id} className="p-2.5 rounded-lg border border-gray-100 hover:border-gold-200 hover:bg-gold-50/30 transition-all">
                  <div className="flex items-start gap-2">
                    <div className="relative flex-shrink-0">
                      <img src={d.avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <CreditBadge level={d.averageRating >= 4.8 ? 'S' as CreditLevel : 'A' as CreditLevel} score={Math.round(d.averageRating * 200 - 60)} size="sm" showIcon={false} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-900">{d.name}</span>
                        <span className="text-[10px] text-gold-600 bg-gold-50 px-1.5 rounded">排序维度 TOP {i + 1}</span>
                      </div>
                      <div className="flex flex-wrap gap-0.5 mt-0.5 mb-1">
                        {d.specializations.map((s) => (
                          <span key={s} className="text-[10px] px-1 py-0.5 bg-info-50 text-info-700 rounded">{s}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
                        <div className="bg-gold-50 rounded p-0.5"><div className="font-bold text-gold-700 flex items-center justify-center gap-0.5"><Star className="w-2 h-2 fill-gold-500 text-gold-500" />{d.averageRating}</div><div className="text-gray-500">业主评分</div></div>
                        <div className="bg-primary-50 rounded p-0.5"><div className="font-bold text-primary-700">{d.completedProjects}</div><div className="text-gray-500">完工案例</div></div>
                        <div className="bg-success-50 rounded p-0.5"><div className="font-bold text-success-700">{Math.round(d.radarScores.scheduleAdherence)}%</div><div className="text-gray-500">准时率</div></div>
                        <div className="bg-danger-50 rounded p-0.5"><div className="font-bold text-danger-700">{(d.complaintRate * 100).toFixed(1)}%</div><div className="text-gray-500">投诉率</div></div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <RadarChart
                          data={[
                            { subject: '设计', score: d.radarScores.designAbility, fullMark: 100 },
                            { subject: '沟通', score: d.radarScores.communication, fullMark: 100 },
                            { subject: '控本', score: d.radarScores.costControl, fullMark: 100 },
                            { subject: '进度', score: d.radarScores.scheduleAdherence, fullMark: 100 },
                            { subject: '售后', score: d.radarScores.afterSales, fullMark: 100 },
                          ]}
                          height={65}
                          color="#3182ce"
                        />
                        <div className="grid grid-cols-2 gap-1 flex-1">
                          <button className="text-[10px] py-1.5 bg-gold-500 text-white rounded hover:bg-gold-600 flex items-center justify-center gap-0.5 transition-colors">
                            <Send className="w-2.5 h-2.5" />派单
                          </button>
                          <button className="text-[10px] py-1.5 bg-white border border-gray-200 text-gray-600 rounded hover:bg-gray-50 flex items-center justify-center gap-0.5 transition-colors">
                            <Eye className="w-2.5 h-2.5" />作品集
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}