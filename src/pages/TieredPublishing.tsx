import { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Eye,
  User,
  Clock,
  Building,
  Home,
  FileText,
  Shield,
  CheckCircle2,
  XCircle,
  Timer,
  Send,
  MapPin,
  FileCheck,
  AlertCircle,
  History,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import {
  channelLabels,
  tierLabels,
  districts,
} from '@shared/types';
import type { ContentItem } from '@shared/types';
import { cn } from '@/lib/utils';

type TierType = 'city' | 'district' | 'street';

interface AuditRecord {
  id: string;
  title: string;
  applicant: string;
  applyTime: string;
  fromTier: TierType;
  toTier: TierType;
  result: 'approved' | 'rejected' | 'pending' | 'processing';
  auditor?: string;
  auditTime?: string;
  opinion?: string;
}

interface ApprovalStep {
  label: string;
  status: 'completed' | 'current' | 'pending';
  operator?: string;
  time?: string;
  opinion?: string;
}

const mockContent = {
  city: [
    {
      id: 'city_1',
      title: '市委召开常委会会议 研究部署经济社会发展重点工作',
      channel: 'politics',
      tier: 'city',
      status: 'published',
      source: 'manual',
      summary: '会议指出，要深入贯彻落实上级决策部署，扎实推进各项工作任务落地见效...',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=120&h=80&fit=crop',
      viewCount: 12580,
      publishTime: '2024-06-20 10:30:00',
      createTime: '2024-06-20 09:00:00',
      updateTime: '2024-06-20 10:30:00',
      creatorId: '1',
      creatorName: '张编辑',
    },
    {
      id: 'city_2',
      title: '徐州地铁4号线一期工程正式开通运营',
      channel: 'livelihood',
      tier: 'city',
      status: 'published',
      source: 'api',
      summary: '徐州地铁4号线一期工程于今日正式开通，全长25.4公里，设站19座...',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=120&h=80&fit=crop',
      viewCount: 28960,
      publishTime: '2024-06-20 09:15:00',
      createTime: '2024-06-19 16:00:00',
      updateTime: '2024-06-20 09:15:00',
      creatorId: '2',
      creatorName: '李记者',
    },
    {
      id: 'city_3',
      title: '徐州市优化营商环境新十条措施发布',
      channel: 'politics',
      tier: 'city',
      status: 'pending',
      source: 'manual',
      summary: '为进一步优化营商环境，市政府印发《关于优化营商环境的若干措施》...',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=120&h=80&fit=crop',
      viewCount: 0,
      createTime: '2024-06-20 08:30:00',
      updateTime: '2024-06-20 08:30:00',
      creatorId: '3',
      creatorName: '王专员',
    },
  ],
  district: [
    {
      id: 'district_1',
      title: '云龙区召开安全生产工作会议',
      channel: 'politics',
      tier: 'district',
      status: 'published',
      source: 'manual',
      summary: '云龙区召开安全生产工作会议，部署下一阶段安全生产重点任务...',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=120&h=80&fit=crop',
      viewCount: 5280,
      publishTime: '2024-06-19 14:20:00',
      createTime: '2024-06-19 10:00:00',
      updateTime: '2024-06-19 14:20:00',
      creatorId: '5',
      creatorName: '陈静',
    },
    {
      id: 'district_2',
      title: '泉山区文化惠民演出活动圆满举办',
      channel: 'culture',
      tier: 'district',
      status: 'pending',
      source: 'manual',
      summary: '泉山区文化惠民演出活动在市民广场举行，吸引了众多市民参与...',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=120&h=80&fit=crop',
      viewCount: 0,
      createTime: '2024-06-19 17:20:00',
      updateTime: '2024-06-19 17:20:00',
      creatorId: '5',
      creatorName: '陈静',
    },
    {
      id: 'district_3',
      title: '鼓楼区老旧小区改造工程进展通报',
      channel: 'livelihood',
      tier: 'district',
      status: 'published',
      source: 'manual',
      summary: '鼓楼区老旧小区改造项目已完成80%，预计年底前全部完工...',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=120&h=80&fit=crop',
      viewCount: 7820,
      publishTime: '2024-06-19 09:15:00',
      createTime: '2024-06-18 15:30:00',
      updateTime: '2024-06-19 09:15:00',
      creatorId: '7',
      creatorName: '刘建国',
    },
  ],
  street: [
    {
      id: 'street_1',
      title: '彭城街道开展夏季食品安全宣传活动',
      channel: 'livelihood',
      tier: 'street',
      status: 'pending',
      source: 'manual',
      summary: '彭城街道办事处组织开展夏季食品安全宣传进社区活动...',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=80&fit=crop',
      viewCount: 0,
      createTime: '2024-06-20 07:45:00',
      updateTime: '2024-06-20 07:45:00',
      creatorId: '6',
      creatorName: '赵明',
    },
    {
      id: 'street_2',
      title: '和平街道社区养老服务中心揭牌',
      channel: 'livelihood',
      tier: 'street',
      status: 'published',
      source: 'manual',
      summary: '和平街道社区养老服务中心今日正式揭牌，可为辖区老年人提供日间照料...',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=120&h=80&fit=crop',
      viewCount: 1280,
      publishTime: '2024-06-19 16:00:00',
      createTime: '2024-06-19 10:00:00',
      updateTime: '2024-06-19 16:00:00',
      creatorId: '8',
      creatorName: '孙丽华',
    },
  ],
} as Record<TierType, ContentItem[]>;

const mockAuditRecords: AuditRecord[] = [
  {
    id: 'audit_1',
    title: '彭城街道开展夏季食品安全宣传活动',
    applicant: '赵明',
    applyTime: '2024-06-20 07:45:00',
    fromTier: 'street',
    toTier: 'district',
    result: 'processing',
  },
  {
    id: 'audit_2',
    title: '泉山区文化惠民演出活动圆满举办',
    applicant: '陈静',
    applyTime: '2024-06-19 17:20:00',
    fromTier: 'district',
    toTier: 'city',
    result: 'pending',
  },
  {
    id: 'audit_3',
    title: '云龙区社区老年活动中心报道',
    applicant: '周敏',
    applyTime: '2024-06-19 14:30:00',
    fromTier: 'street',
    toTier: 'district',
    result: 'approved',
    auditor: '陈静',
    auditTime: '2024-06-19 16:00:00',
    opinion: '内容符合要求，同意升级到区级发布',
  },
  {
    id: 'audit_4',
    title: '铜山区某企业违规宣传活动报道',
    applicant: '吴强',
    applyTime: '2024-06-19 10:15:00',
    fromTier: 'district',
    toTier: 'city',
    result: 'rejected',
    auditor: '张编辑',
    auditTime: '2024-06-19 14:20:00',
    opinion: '内容涉及未经核实的企业信息，需补充相关证明材料后重新提交',
  },
  {
    id: 'audit_5',
    title: '关于做好防汛工作的通知',
    applicant: '王专员',
    applyTime: '2024-06-18 09:00:00',
    fromTier: 'city',
    toTier: 'district',
    result: 'approved',
    auditor: '系统自动',
    auditTime: '2024-06-18 09:05:00',
    opinion: '市级下发内容自动审批通过',
  },
  {
    id: 'audit_6',
    title: '鼓楼区文明城市创建活动安排',
    applicant: '刘建国',
    applyTime: '2024-06-18 15:30:00',
    fromTier: 'district',
    toTier: 'street',
    result: 'approved',
    auditor: '系统自动',
    auditTime: '2024-06-18 15:32:00',
    opinion: '区县级下沉街道内容自动审批',
  },
];

export default function TieredPublishing() {
  const [expandedTiers, setExpandedTiers] = useState(new Set(['city', 'district', 'street']));
  const [selectedDistrict, setSelectedDistrict] = useState(districts[0]);
  const [activeTab, setActiveTab] = useState<'content' | 'audit'>('content');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  const toggleTier = (tier: TierType) => {
    setExpandedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) {
        next.delete(tier);
      } else {
        next.add(tier);
      }
      return next;
    });
  };

  const getApprovalSteps = (item: ContentItem): ApprovalStep[] => {
    if (item.tier === 'city') {
      return [
        { label: '提交申请', status: 'completed', operator: item.creatorName, time: item.createTime },
        { label: '市级审核', status: item.status === 'published' ? 'completed' : 'current', operator: item.status === 'published' ? '张编辑' : undefined, time: item.status === 'published' ? item.publishTime : undefined, opinion: item.status === 'published' ? '内容合规，同意发布' : '待审核' },
        { label: '内容发布', status: item.status === 'published' ? 'completed' : 'pending' },
      ];
    }
    if (item.tier === 'district') {
      return [
        { label: '提交申请', status: 'completed', operator: item.creatorName, time: item.createTime },
        { label: '区县级审核', status: 'completed', operator: '陈静', time: '2024-06-19 10:30:00', opinion: '区级初审通过' },
        { label: '市级审核', status: item.status === 'published' ? 'completed' : 'current', operator: item.status === 'published' ? '张编辑' : undefined, time: item.status === 'published' ? item.publishTime : undefined, opinion: item.status === 'published' ? '同意升级发布' : '待市级审核' },
        { label: '内容发布', status: item.status === 'published' ? 'completed' : 'pending' },
      ];
    }
    return [
      { label: '提交申请', status: 'completed', operator: item.creatorName, time: item.createTime },
      { label: '街道级审核', status: 'completed', operator: '孙丽华', time: '2024-06-20 08:00:00', opinion: '街道初审通过' },
      { label: '区县级审核', status: item.status === 'published' ? 'completed' : 'current', operator: item.status === 'published' ? '陈静' : undefined, time: item.status === 'published' ? item.publishTime : undefined, opinion: item.status === 'published' ? '同意升级发布' : '待区县审核' },
      { label: '市级审核', status: 'pending' },
      { label: '内容发布', status: 'pending' },
    ];
  };

  const tierInfo = [
    { key: 'city' as TierType, label: '市级内容池', icon: Building, color: 'from-blue-500 to-blue-600', description: '面向全市发布的权威内容', publishPermission: '可直接发布全市级内容', auditPermission: '审核区县级升级内容', coverage: '徐州市全域（10个区县）' },
    { key: 'district' as TierType, label: '区县级内容池', icon: Home, color: 'from-green-500 to-green-600', description: '各区县自主发布内容', publishPermission: '可发布本区县内容', auditPermission: '审核街道级升级内容', coverage: '本行政区域内' },
    { key: 'street' as TierType, label: '街道级内容池', icon: MapPin, color: 'from-orange-500 to-orange-600', description: '街道基层信息上报', publishPermission: '仅可发布本街道内容', auditPermission: '初审本街道上报内容', coverage: '本街道辖区' },
  ];

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    pending: 'bg-yellow-100 text-yellow-700',
    published: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    pending: '待审核',
    published: '已发布',
    rejected: '已驳回',
  };

  const auditResultColors: Record<string, string> = {
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
  };

  const auditResultLabels: Record<string, string> = {
    approved: '已通过',
    rejected: '已驳回',
    pending: '待审批',
    processing: '审批中',
  };

  const stats = {
    cityCount: mockContent.city.length,
    districtCount: mockContent.district.length,
    streetCount: mockContent.street.length,
    pendingCount: [...mockContent.city, ...mockContent.district, ...mockContent.street].filter(c => c.status === 'pending').length,
    crossTierCount: mockAuditRecords.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="分级发布管理"
        description="市级/区县/街道三级内容池分级管理与权限控制"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="市级内容数"
          value={stats.cityCount}
          icon={<Building className="w-5 h-5" />}
          color="blue"
          compact
        />
        <StatCard
          title="区县级内容数"
          value={stats.districtCount}
          icon={<Home className="w-5 h-5" />}
          color="green"
          compact
        />
        <StatCard
          title="街道级内容数"
          value={stats.streetCount}
          icon={<MapPin className="w-5 h-5" />}
          color="orange"
          compact
        />
        <StatCard
          title="待审批数"
          value={stats.pendingCount}
          icon={<Timer className="w-5 h-5" />}
          color="yellow"
          compact
        />
        <StatCard
          title="跨层级申请数"
          value={stats.crossTierCount}
          icon={<Send className="w-5 h-5" />}
          color="purple"
          compact
        />
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center border-b border-slate-100">
          <button
            onClick={() => setActiveTab('content')}
            className={cn(
              'px-6 py-3.5 text-sm font-medium transition-colors border-b-2',
              activeTab === 'content'
                ? 'text-primary-600 border-primary-600 bg-primary-50/50'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              三级内容池
            </div>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={cn(
              'px-6 py-3.5 text-sm font-medium transition-colors border-b-2',
              activeTab === 'audit'
                ? 'text-primary-600 border-primary-600 bg-primary-50/50'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              审计复查
            </div>
          </button>
        </div>

        {activeTab === 'content' && (
          <div className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                {tierInfo.map((tier) => {
                  const Icon = tier.icon;
                  const isExpanded = expandedTiers.has(tier.key);
                  const contents = mockContent[tier.key];

                  return (
                    <div key={tier.key} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                      <button
                        onClick={() => toggleTier(tier.key)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', tier.color)}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-slate-900">{tier.label}</h3>
                            <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                              {contents.length} 条内容
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">{tier.description}</p>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-slate-100 p-4 space-y-3">
                          {contents.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => setSelectedContent(item)}
                              className={cn(
                                'flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer',
                                selectedContent?.id === item.id
                                  ? 'bg-primary-50 border border-primary-200'
                                  : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                              )}
                            >
                              <img
                                src={item.coverImage}
                                alt=""
                                className="w-20 h-14 rounded object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-slate-900 truncate">
                                  {item.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded">
                                    {channelLabels[item.channel]}
                                  </span>
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {item.creatorName}
                                  </span>
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {(item.publishTime || item.createTime).slice(5, 16)}
                                  </span>
                                </div>
                              </div>

                              <span className={cn('px-2 py-0.5 text-xs font-medium rounded', statusColors[item.status])}>
                                {statusLabels[item.status]}
                              </span>

                              <div className="flex items-center gap-1">
                                {tier.key !== 'city' && (
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="升级到上一级"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                )}
                                {tier.key !== 'street' && (
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                    title="下发到下一级"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                  title="查看详情"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4">
                {selectedContent ? (
                  <div className="bg-white rounded-xl border border-slate-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <FileCheck className="w-5 h-5 text-primary-600" />
                      <h3 className="font-semibold text-slate-900">跨层级审批流程</h3>
                    </div>
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium text-slate-800 truncate">{selectedContent.title}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                        <span>{tierLabels[selectedContent.tier]}</span>
                        <span>•</span>
                        <span>{selectedContent.creatorName}</span>
                      </div>
                    </div>
                    <div className="space-y-0">
                      {getApprovalSteps(selectedContent).map((step, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                              step.status === 'completed' && 'bg-green-500',
                              step.status === 'current' && 'bg-primary-600 ring-4 ring-primary-100',
                              step.status === 'pending' && 'bg-slate-200'
                            )}>
                              {step.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              ) : step.status === 'current' ? (
                                <Timer className="w-4 h-4 text-white" />
                              ) : (
                                <Clock className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            {index < getApprovalSteps(selectedContent).length - 1 && (
                              <div className={cn(
                                'w-0.5 flex-1 min-h-8',
                                step.status === 'completed' ? 'bg-green-300' : 'bg-slate-200'
                              )} />
                            )}
                          </div>
                          <div className="flex-1 pb-5">
                            <p className={cn(
                              'text-sm font-medium',
                              step.status === 'completed' && 'text-slate-800',
                              step.status === 'current' && 'text-primary-600',
                              step.status === 'pending' && 'text-slate-400'
                            )}>
                              {step.label}
                            </p>
                            {step.operator && (
                              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {step.operator}
                              </p>
                            )}
                            {step.time && (
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {step.time.slice(5, 16)}
                              </p>
                            )}
                            {step.opinion && (
                              <p className="text-xs text-slate-600 mt-1.5 p-2 bg-slate-50 rounded">
                                {step.opinion}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <FileCheck className="w-5 h-5 text-primary-600" />
                      <h3 className="font-semibold text-slate-900">跨层级审批流程</h3>
                    </div>
                    <div className="py-12 text-center text-slate-400">
                      <Timer className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">选择左侧内容查看审批流程</p>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-slate-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-primary-600" />
                    <h3 className="font-semibold text-slate-900">权限边界说明</h3>
                  </div>
                  <div className="space-y-3">
                    {tierInfo.map((tier) => {
                      const Icon = tier.icon;
                      return (
                        <div key={tier.key} className="p-3 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn('w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center', tier.color)}>
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-slate-800">{tier.label.replace('内容池', '运营主体')}</span>
                          </div>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-start gap-1.5">
                              <FileText className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-slate-500">发布权限：</span>
                                <span className="text-slate-700">{tier.publishPermission}</span>
                              </div>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-slate-500">审核权限：</span>
                                <span className="text-slate-700">{tier.auditPermission}</span>
                              </div>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-slate-500">覆盖范围：</span>
                                <span className="text-slate-700">{tier.coverage}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 p-5">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-600" />
                    区县列表
                  </h3>
                  <div className="space-y-1">
                    {districts.map((district) => (
                      <button
                        key={district}
                        onClick={() => setSelectedDistrict(district)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                          selectedDistrict === district
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        <Building className="w-4 h-4" />
                        {district}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-5 text-white">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    内容流转规则
                  </h4>
                  <ul className="text-sm text-white/90 space-y-1.5">
                    <li>• 街道内容可申请升级到区县</li>
                    <li>• 区县内容可申请升级到市级</li>
                    <li>• 市级内容可下沉下发到区县</li>
                    <li>• 区县内容可下沉下发到街道</li>
                    <li>• 所有升级申请需上级审核</li>
                    <li>• 下沉下发自动审批通过</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="p-5">
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">内容标题</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">申请人</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">申请时间</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">审批层级</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">审批结果</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">审批人</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">审批时间</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">审批意见</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockAuditRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-800 max-w-xs truncate">{record.title}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {record.applicant}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600 whitespace-nowrap">{record.applyTime.slice(5, 16)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-slate-600">{tierLabels[record.fromTier]}</span>
                            {record.fromTier !== record.toTier && (
                              <>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                <span className={cn(
                                  'text-sm font-medium',
                                  record.fromTier === 'street' ? 'text-green-600' :
                                  record.fromTier === 'district' ? 'text-blue-600' : 'text-orange-600'
                                )}>
                                  {tierLabels[record.toTier]}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded',
                            auditResultColors[record.result]
                          )}>
                            {record.result === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                            {record.result === 'rejected' && <XCircle className="w-3 h-3" />}
                            {(record.result === 'pending' || record.result === 'processing') && <Timer className="w-3 h-3" />}
                            {auditResultLabels[record.result]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">{record.auditor || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600 whitespace-nowrap">
                            {record.auditTime ? record.auditTime.slice(5, 16) : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-500 max-w-xs truncate">
                            {record.opinion || '-'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
