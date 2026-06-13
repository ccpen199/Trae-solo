import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  UserCog,
  FileText,
  Calendar,
  CheckCircle,
  Sparkles,
  MapPin,
  Phone,
  Star,
  ChevronRight,
  Plus,
  Clock,
  Home,
  Car,
  ArrowRight,
  Check,
  AlertCircle,
  CircleDot,
  Circle,
} from 'lucide-react';
import { butlerApi } from '@/lib/api';
import { cn } from '@/lib/utils';

type TabType = 'requirements' | 'match' | 'consultants' | 'appointments' | 'contract';

interface Requirement {
  id: string;
  userId: string;
  userName: string;
  phone: string;
  budgetMin: number;
  budgetMax: number;
  areaMin: number;
  areaMax: number;
  bedrooms: string;
  districts: string[];
  propertyTypes: string[];
  purpose: string;
  schoolRequired: boolean;
  subwayRequired: boolean;
  decoration: string;
  deliveryDate: string;
  additionalNotes: string;
  createdAt: string;
  status: string;
}

interface Consultant {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  experience: number;
  specialty: string[];
  rating: number;
  dealCount: number;
  status: string;
}

interface MatchReport {
  id: string;
  requirementId: string;
  matches: Array<{
    id: string;
    propertyId: string;
    property: any;
    matchScore: number;
    matchReasons: string[];
    recommended: boolean;
  }>;
  aiSummary: string;
  aiAdvice: string;
  createdAt: string;
  reviewed: boolean;
  reviewerName: string;
  reviewComments: string;
}

const STATUS_ORDER = ['pending', 'matched', 'reviewed', 'appointment_made', 'viewing', 'signed', 'completed'];

const FLOW_STEPS = [
  { key: 'submit', title: '提交需求', icon: FileText, statusAfter: 'pending' },
  { key: 'ai', title: 'AI匹配', icon: Sparkles, statusAfter: 'matched' },
  { key: 'review', title: '顾问复核', icon: UserCog, statusAfter: 'reviewed' },
  { key: 'viewing', title: '预约带看', icon: Car, statusAfter: 'appointment_made' },
  { key: 'sign', title: '签约成交', icon: CheckCircle, statusAfter: 'signed' },
];

function getStepIndex(status: string): number {
  const idx = STATUS_ORDER.indexOf(status);
  if (idx < 0) return 0;
  return Math.min(idx, FLOW_STEPS.length - 1);
}

export default function Butler() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('requirements');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [matchReport, setMatchReport] = useState<MatchReport | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    userName: '',
    phone: '',
    budgetMin: 50,
    budgetMax: 200,
    areaMin: 80,
    areaMax: 120,
    bedrooms: '3室',
    districts: ['和平区'],
    propertyTypes: ['住宅'],
    purpose: '自住',
    schoolRequired: false,
    subwayRequired: true,
    decoration: '精装',
    deliveryDate: '2025年底',
    additionalNotes: '',
  });

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowForm(true);
    }
    fetchRequirements();
    fetchConsultants();
  }, []);

  const fetchRequirements = async () => {
    const res = await butlerApi.getRequirements();
    if (res.success) {
      setRequirements(res.data);
    }
  };

  const fetchConsultants = async () => {
    const res = await butlerApi.getConsultants();
    if (res.success) {
      setConsultants(res.data);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const submitData = {
      ...formData,
      budgetMin: formData.budgetMin * 10000,
      budgetMax: formData.budgetMax * 10000,
    };
    const res = await butlerApi.createRequirement(submitData);
    if (res.success) {
      setShowForm(false);
      fetchRequirements();
      setTimeout(async () => {
        const reportRes = await butlerApi.getMatchReport(res.data.id);
        if (reportRes.success) {
          setMatchReport(reportRes.data);
        }
      }, 1500);
    }
    setLoading(false);
  };

  const viewMatchReport = async (reqId: string) => {
    const res = await butlerApi.getMatchReport(reqId);
    if (res.success) {
      setMatchReport(res.data);
      setActiveTab('match');
    }
  };

  const latestReq = requirements.length > 0 ? requirements[0] : null;
  const latestStepIndex = latestReq ? getStepIndex(latestReq.status) : -1;

  const appointmentsData = useMemo(() => {
    if (!latestReq || STATUS_ORDER.indexOf(latestReq.status) < STATUS_ORDER.indexOf('appointment_made')) {
      return [];
    }
    const matchProps = matchReport?.matches || [];
    const topMatch = matchProps[0];
    const consultant = consultants[0];
    const apptDate = new Date();
    apptDate.setDate(apptDate.getDate() + 2);
    return [
      {
        id: 'apt-1',
        propertyName: topMatch?.property?.name || latestReq.districts[0] + '精选楼盘',
        propertyId: topMatch?.propertyId || '',
        consultantName: consultant?.name || '张明',
        date: apptDate.toISOString().split('T')[0],
        time: '14:00',
        status: latestReq.status === 'viewing' ? 'viewing' : 'confirmed',
        pickupAddress: '沈阳市和平区青年大街288号',
        notes: '专车接送，全程约2小时',
      },
    ];
  }, [latestReq, matchReport, consultants]);

  const contractData = useMemo(() => {
    if (!latestReq || STATUS_ORDER.indexOf(latestReq.status) < STATUS_ORDER.indexOf('signed')) {
      return null;
    }
    const matchProps = matchReport?.matches || [];
    const topMatch = matchProps[0];
    return {
      propertyName: topMatch?.property?.name || '精选楼盘',
      propertyId: topMatch?.propertyId || '',
      consultantName: consultants[0]?.name || '张明',
      steps: [
        { name: '认购定金', status: 'completed', date: '2025-06-10', desc: '已缴纳定金5万元' },
        { name: '首付支付', status: 'completed', date: '2025-06-13', desc: '已支付首付30%' },
        { name: '贷款审批', status: latestReq.status === 'completed' ? 'completed' : 'in_progress', date: latestReq.status === 'completed' ? '2025-06-18' : '', desc: latestReq.status === 'completed' ? '银行审批通过' : '银行审批中，预计3-5个工作日' },
        { name: '网签备案', status: latestReq.status === 'completed' ? 'completed' : 'pending', date: '', desc: '待贷款审批通过后办理' },
        { name: '交房验收', status: 'pending', date: '', desc: '预计2026年6月交付' },
      ],
    };
  }, [latestReq, matchReport, consultants]);

  const tabs = [
    { key: 'requirements', label: '我的需求', icon: FileText },
    { key: 'match', label: '匹配报告', icon: Sparkles },
    { key: 'consultants', label: '专属顾问', icon: UserCog },
    { key: 'appointments', label: '看房预约', icon: Calendar },
    { key: 'contract', label: '签约进度', icon: CheckCircle },
  ];

  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: '待匹配', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    matched: { label: '已匹配', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    reviewed: { label: '已复核', color: 'text-green-700', bgColor: 'bg-green-100' },
    appointment_made: { label: '已预约', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    viewing: { label: '看房中', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    signed: { label: '已签约', color: 'text-green-700', bgColor: 'bg-green-100' },
    completed: { label: '已完成', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  };

  const allDistricts = ['和平区', '沈河区', '皇姑区', '铁西区', '大东区', '于洪区', '苏家屯区', '沈北新区'];
  const bedroomOptions = ['1室', '2室', '3室', '4室', '5室及以上'];
  const purposeOptions = [
    { value: '自住', label: '自住' },
    { value: '投资', label: '投资' },
    { value: '改善', label: '改善' },
    { value: '学区', label: '学区' },
  ];

  const toggleDistrict = (district: string) => {
    setFormData((prev) => ({
      ...prev,
      districts: prev.districts.includes(district)
        ? prev.districts.filter((d) => d !== district)
        : [...prev.districts, district],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">AI 购房管家</h1>
            <p className="text-blue-100 max-w-xl">
              提交您的购房需求，AI智能匹配最优房源，专属顾问一对一服务，从选房到签约全程陪伴
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            提交需求
          </button>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            {FLOW_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = latestStepIndex >= idx;
              const isCurrent = latestStepIndex === idx && latestReq != null;
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center min-w-[72px]">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all',
                        isCompleted
                          ? 'bg-white text-blue-600 shadow-lg scale-110'
                          : 'bg-white/20 backdrop-blur text-white/60',
                        isCurrent && 'ring-2 ring-white/60 ring-offset-2 ring-offset-transparent',
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={cn('text-sm font-medium', isCompleted ? 'text-white' : 'text-white/50')}>
                      {step.title}
                    </span>
                    {isCurrent && (
                      <span className="text-xs text-yellow-300 mt-0.5">进行中</span>
                    )}
                  </div>
                  {idx < FLOW_STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 mt-[-20px]">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          latestStepIndex > idx ? 'bg-white' : 'bg-white/20',
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={cn(
                  'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'requirements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">我的购房需求</h2>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  新增需求
                </button>
              </div>

              {requirements.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">您还没有提交购房需求</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    立即提交
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {requirements.map((req) => {
                    const status = statusConfig[req.status] || statusConfig.pending;
                    const stepIdx = getStepIndex(req.status);
                    return (
                      <div
                        key={req.id}
                        className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-colors"
                      >
                        <div
                          className="p-4 cursor-pointer"
                          onClick={() => {
                            setSelectedRequirement(req);
                            if (req.status !== 'pending') {
                              viewMatchReport(req.id);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                预算 {(req.budgetMin / 10000).toFixed(0)}-
                                {(req.budgetMax / 10000).toFixed(0)}万 · {req.bedrooms}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {req.districts.join('、')} · {req.purpose}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-xs font-medium',
                                status.bgColor,
                                status.color,
                              )}
                            >
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">
                              <Clock className="w-4 h-4 inline mr-1" />
                              {req.createdAt}
                            </span>
                            <span className="text-blue-600 flex items-center gap-1">
                              查看详情
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                          <p className="text-xs text-gray-400 mb-2">服务进度</p>
                          <div className="flex items-center gap-1">
                            {FLOW_STEPS.map((step, idx) => {
                              const Icon = step.icon;
                              const isDone = stepIdx >= idx;
                              const isCurrent = stepIdx === idx;
                              return (
                                <div key={step.key} className="flex items-center flex-1">
                                  <div className="flex flex-col items-center">
                                    <div
                                      className={cn(
                                        'w-6 h-6 rounded-full flex items-center justify-center',
                                        isDone ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400',
                                        isCurrent && 'ring-2 ring-blue-200',
                                      )}
                                    >
                                      {isDone ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                                    </div>
                                    <span className={cn('text-[10px] mt-1', isDone ? 'text-blue-600 font-medium' : 'text-gray-400')}>
                                      {step.title}
                                    </span>
                                  </div>
                                  {idx < FLOW_STEPS.length - 1 && (
                                    <div className={cn('flex-1 h-0.5 mx-1 mb-4', stepIdx > idx ? 'bg-blue-400' : 'bg-gray-200')} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'match' && (
            <div>
              {!matchReport ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">请先提交购房需求获取AI匹配报告</p>
                  <button
                    onClick={() => setActiveTab('requirements')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    提交需求
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h3 className="font-bold text-gray-900">AI 智能匹配报告</h3>
                    </div>
                    <p className="text-gray-600 mb-4">{matchReport.aiSummary}</p>
                    <div className="bg-white/60 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">AI 购房建议</p>
                      <p className="text-gray-700">{matchReport.aiAdvice}</p>
                    </div>
                    {matchReport.reviewed && (
                      <div className="mt-4 flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">
                            专属顾问 {matchReport.reviewerName} 已审核
                          </p>
                          <p className="text-sm text-gray-700">
                            {matchReport.reviewComments}
                          </p>
                        </div>
                      </div>
                    )}
                    {!matchReport.reviewed && (
                      <div className="mt-4 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-yellow-700">等待顾问复核中</p>
                          <p className="text-sm text-gray-500">专属顾问将在1个工作日内完成复核并给出专业建议</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">
                      为您匹配到 {matchReport.matches.length} 个楼盘
                    </h3>
                    <div className="space-y-4">
                      {matchReport.matches.map((match, idx) => (
                        <div
                          key={match.id}
                          className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="flex">
                            <div className="w-40 h-32 bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 relative">
                              <div className="absolute top-2 left-2">
                                <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                                  {idx + 1}
                                </span>
                              </div>
                              <div className="absolute bottom-2 right-2">
                                <span className="px-2 py-1 bg-white/90 backdrop-blur rounded text-xs font-medium text-purple-600">
                                  匹配度 {match.matchScore}%
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <Link
                                    to={`/properties/${match.propertyId}`}
                                    className="font-bold text-gray-900 hover:text-blue-600"
                                  >
                                    {match.property.name}
                                  </Link>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {match.property.district} · {match.property.area}
                                  </p>
                                </div>
                                <p className="text-xl font-bold text-orange-500">
                                  {match.property.price.toLocaleString()}
                                  <span className="text-xs font-normal text-gray-400"> 元/㎡</span>
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {match.matchReasons.slice(0, 4).map((reason, ridx) => (
                                  <span
                                    key={ridx}
                                    className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" />
                                    {reason}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="h-2 bg-gray-100 rounded-full flex-1 mr-4">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                                    style={{ width: `${match.matchScore}%` }}
                                  />
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTab('appointments');
                                  }}
                                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                >
                                  预约看房
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'consultants' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">专属购房顾问</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {consultants.map((consultant) => (
                  <div
                    key={consultant.id}
                    className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xl font-bold">
                          {consultant.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{consultant.name}</h3>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium',
                              consultant.status === 'available'
                                ? 'bg-green-100 text-green-700'
                                : consultant.status === 'busy'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-500',
                            )}
                          >
                            {consultant.status === 'available'
                              ? '在线'
                              : consultant.status === 'busy'
                              ? '忙碌'
                              : '离线'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-yellow-500 mb-2">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-medium">{consultant.rating}</span>
                          <span className="text-gray-400">分 · {consultant.dealCount}笔成交</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                          从业 {consultant.experience} 年经验
                        </p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {consultant.specialty.slice(0, 3).map((spec, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 py-2 border border-blue-500 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" />
                        电话咨询
                      </button>
                      <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                        预约服务
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">看房预约</h2>
              {appointmentsData.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">暂无看房预约记录</p>
                  <p className="text-sm text-gray-400 mb-4">
                    {latestReq && latestReq.status === 'pending'
                      ? '您的需求正在AI匹配中，匹配完成后可预约带看'
                      : latestReq && latestReq.status === 'matched'
                      ? 'AI已生成匹配报告，请查看报告并确认后预约带看'
                      : latestReq && latestReq.status === 'reviewed'
                      ? '顾问已复核匹配结果，您可以预约专车带看'
                      : '提交购房需求并获取匹配报告后，可预约专属顾问带您看房'}
                  </p>
                  {latestReq && (latestReq.status === 'reviewed' || latestReq.status === 'matched') ? (
                    <button
                      onClick={() => setActiveTab('match')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      查看匹配报告
                    </button>
                  ) : !latestReq ? (
                    <button
                      onClick={() => setShowForm(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      提交购房需求
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  {appointmentsData.map((apt) => (
                    <div key={apt.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-100">预约看房</p>
                            <h3 className="text-lg font-bold mt-1">{apt.propertyName}</h3>
                          </div>
                          <span className={cn(
                            'px-3 py-1 rounded-full text-xs font-medium',
                            apt.status === 'viewing' ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white',
                          )}>
                            {apt.status === 'viewing' ? '看房中' : '已确认'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">看房日期</p>
                            <p className="font-medium text-gray-900">{apt.date} {apt.time}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">专属顾问</p>
                            <p className="font-medium text-gray-900">{apt.consultantName}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">接送地址</p>
                            <p className="font-medium text-gray-900">{apt.pickupAddress}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">出行方式</p>
                            <p className="font-medium text-gray-900 flex items-center gap-1">
                              <Car className="w-4 h-4 text-blue-500" />
                              专车接送
                            </p>
                          </div>
                        </div>
                        {apt.notes && (
                          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                            {apt.notes}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Link
                            to={`/properties/${apt.propertyId}`}
                            className="flex-1 py-2 border border-blue-500 text-blue-600 rounded-lg text-sm font-medium text-center hover:bg-blue-50"
                          >
                            查看楼盘
                          </Link>
                          <button className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                            联系顾问
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">预约流程说明</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white">
                          <Check className="w-3 h-3" />
                        </div>
                        AI匹配
                      </div>
                      <ArrowRight className="w-3 h-3" />
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white">
                          <Check className="w-3 h-3" />
                        </div>
                        顾问复核
                      </div>
                      <ArrowRight className="w-3 h-3" />
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white">
                          <Car className="w-3 h-3" />
                        </div>
                        <span className="font-medium text-purple-600">专车带看</span>
                      </div>
                      <ArrowRight className="w-3 h-3" />
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-white">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                        签约成交
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contract' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">签约进度</h2>
              {!contractData ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">暂无签约进度</p>
                  <p className="text-sm text-gray-400 mb-4">
                    {latestReq && STATUS_ORDER.indexOf(latestReq.status) >= STATUS_ORDER.indexOf('appointment_made') && STATUS_ORDER.indexOf(latestReq.status) < STATUS_ORDER.indexOf('signed')
                      ? '看房预约已确认，完成看房后进入签约流程'
                      : '完成认购后，您可以在这里查看签约全流程进度'}
                  </p>
                  {latestReq && STATUS_ORDER.indexOf(latestReq.status) >= STATUS_ORDER.indexOf('appointment_made') && STATUS_ORDER.indexOf(latestReq.status) < STATUS_ORDER.indexOf('signed') && (
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      查看看房预约
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-100">签约楼盘</p>
                        <h3 className="text-lg font-bold mt-1">{contractData.propertyName}</h3>
                      </div>
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                        顾问: {contractData.consultantName}
                      </span>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-6">
                    <h4 className="font-medium text-gray-900 mb-6">签约全流程进度</h4>
                    <div className="space-y-0">
                      {contractData.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                                step.status === 'completed'
                                  ? 'bg-green-500 text-white'
                                  : step.status === 'in_progress'
                                  ? 'bg-blue-500 text-white ring-2 ring-blue-200'
                                  : 'bg-gray-200 text-gray-400',
                              )}
                            >
                              {step.status === 'completed' ? (
                                <Check className="w-4 h-4" />
                              ) : step.status === 'in_progress' ? (
                                <CircleDot className="w-4 h-4" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </div>
                            {idx < contractData.steps.length - 1 && (
                              <div
                                className={cn(
                                  'w-0.5 h-10',
                                  step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200',
                                )}
                              />
                            )}
                          </div>
                          <div className="pb-6">
                            <p className={cn(
                              'font-medium',
                              step.status === 'completed' ? 'text-green-700' :
                              step.status === 'in_progress' ? 'text-blue-700' : 'text-gray-400',
                            )}>
                              {step.name}
                              {step.status === 'in_progress' && (
                                <span className="ml-2 text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded">进行中</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
                            {step.date && (
                              <p className="text-xs text-gray-400 mt-1">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {step.date}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">提交购房需求</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-blue-500" />
                  基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">您的姓名</label>
                    <input
                      type="text"
                      value={formData.userName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, userName: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">联系电话</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入手机号"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-blue-500">¥</span>
                  预算范围
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">最低预算 (万元)</label>
                    <input
                      type="number"
                      value={formData.budgetMin}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, budgetMin: Number(e.target.value) }))
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-gray-400 pt-6">至</span>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">最高预算 (万元)</label>
                    <input
                      type="number"
                      value={formData.budgetMax}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, budgetMax: Number(e.target.value) }))
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-500" />
                  面积要求
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">最小面积 (㎡)</label>
                    <input
                      type="number"
                      value={formData.areaMin}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, areaMin: Number(e.target.value) }))
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-gray-400 pt-6">至</span>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">最大面积 (㎡)</label>
                    <input
                      type="number"
                      value={formData.areaMax}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, areaMax: Number(e.target.value) }))
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">户型要求</h3>
                <div className="flex flex-wrap gap-2">
                  {bedroomOptions.map((bedroom) => (
                    <button
                      key={bedroom}
                      onClick={() => setFormData((prev) => ({ ...prev, bedrooms: bedroom }))}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        formData.bedrooms === bedroom
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                      )}
                    >
                      {bedroom}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  意向区域
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allDistricts.map((district) => (
                    <button
                      key={district}
                      onClick={() => toggleDistrict(district)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        formData.districts.includes(district)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                      )}
                    >
                      {district}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">购房目的</h3>
                <div className="flex flex-wrap gap-2">
                  {purposeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, purpose: option.value }))
                      }
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        formData.purpose === option.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">配套要求</h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.schoolRequired}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, schoolRequired: e.target.checked }))
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">学区房</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.subwayRequired}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, subwayRequired: e.target.checked }))
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">近地铁</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">装修要求</h3>
                <select
                  value={formData.decoration}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, decoration: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="不限">不限</option>
                  <option value="毛坯">毛坯</option>
                  <option value="简装">简装</option>
                  <option value="精装">精装</option>
                  <option value="豪装">豪装</option>
                </select>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">其他要求</h3>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, additionalNotes: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                  placeholder="请描述您的其他购房需求..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '提交中...' : '提交需求，AI匹配'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
