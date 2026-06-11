import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  CreditCard,
  HeartPulse,
  Building2,
  FileText,
  Smartphone,
  TrendingUp,
  Clock,
  Bell,
  ChevronRight,
  UserCheck,
  Award,
  BriefcaseMedical,
  Landmark,
  ArrowRight,
  X,
  Search,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  ListChecks,
  User,
  Hash,
  Calendar,
  Tag,
  BookOpen,
  List,
  MapPin,
  Phone,
  ChevronDown,
  ChevronUp,
  Users,
  Target,
  Timer,
  FileCheck,
  ExternalLink,
  AlertTriangle,
  ShieldAlert,
  History,
  Info,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { useUserStore } from '@/store/useUserStore';
import { mockInsuranceSummaries, mockHousingFund, mockMessages, mockPolicyDocuments, mockPersonalGuides, mockEnterpriseGuides, mockTransferProgress } from '@/mock/data';
import { formatCurrency, formatDate } from '@/utils/format';
import type { PolicyDocument, GuideItem, TransferProgress } from '@/types';

const getTimelinessColor = (timeliness: string) => {
  const map: Record<string, string> = {
    immediate: 'bg-emerald-500',
    short: 'bg-primary-500',
    medium: 'bg-amber-500',
    long: 'bg-violet-500',
  };
  return map[timeliness] || 'bg-neutral-500';
};

const getTimelinessText = (timeliness: string) => {
  const map: Record<string, string> = {
    immediate: '即时办理',
    short: '短期(≤5工作日)',
    medium: '中期(≤20工作日)',
    long: '长期(累计计算)',
  };
  return map[timeliness] || timeliness;
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole } = useUserStore();

  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDocument | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null);
  const [guideKeyword, setGuideKeyword] = useState('');
  const [guideCategory, setGuideCategory] = useState('全部');
  const [guideGroup, setGuideGroup] = useState('全部');
  const [guideScenario, setGuideScenario] = useState('全部');
  const [guideTimeliness, setGuideTimeliness] = useState('全部');

  const personalServices = [
    { icon: CreditCard, label: '社保查询', path: '/personal/social-insurance', color: 'from-blue-500 to-blue-600', desc: '五险明细·账户余额' },
    { icon: Landmark, label: '公积金', path: '/personal/housing-fund', color: 'from-emerald-500 to-emerald-600', desc: '缴存·贷款·提取' },
    { icon: HeartPulse, label: '医保服务', path: '/personal/medical', color: 'from-rose-500 to-rose-600', desc: '就医记录·报销查询' },
    { icon: FileText, label: '人事考试', path: '/personal/exam', color: 'from-violet-500 to-violet-600', desc: '报名·准考证·成绩' },
    { icon: Smartphone, label: '电子社保卡', path: '/personal/ecard', color: 'from-cyan-500 to-cyan-600', desc: 'NFC闪付·扫码' },
    { icon: UserCheck, label: '实名认证', path: '/personal/profile', color: 'from-amber-500 to-amber-600', desc: '生物识别认证' },
    { icon: BriefcaseMedical, label: '失业金申领', path: '/personal/profile', color: 'from-orange-500 to-orange-600', desc: '在线申请·进度查询' },
    { icon: Award, label: '技能提升', path: '/personal/profile', color: 'from-teal-500 to-teal-600', desc: '补贴申领·培训' },
  ];

  const enterpriseServices = [
    { icon: Building2, label: '参保管理', path: '/enterprise/insurance', color: 'from-blue-500 to-blue-600', desc: '员工增减员申报' },
    { icon: FileText, label: '失业金预审', path: '/enterprise/unemployment', color: 'from-emerald-500 to-emerald-600', desc: '申领材料预审' },
    { icon: Shield, label: '劳动关系', path: '/enterprise/contract', color: 'from-violet-500 to-violet-600', desc: '电子合同存证' },
    { icon: Award, label: '稳岗补贴', path: '/enterprise/profile', color: 'from-amber-500 to-amber-600', desc: '补贴申请·查询' },
    { icon: TrendingUp, label: '社保稽核', path: '/enterprise/profile', color: 'from-rose-500 to-rose-600', desc: '稽核通知·整改' },
    { icon: Clock, label: '工伤认定', path: '/enterprise/profile', color: 'from-cyan-500 to-cyan-600', desc: '工伤申报·认定' },
    { icon: FileText, label: '退休预审', path: '/enterprise/profile', color: 'from-orange-500 to-orange-600', desc: '职工退休预审' },
    { icon: UserCheck, label: '法人认证', path: '/enterprise/profile', color: 'from-teal-500 to-teal-600', desc: '企业实名认证' },
  ];

  const services = userRole === 'enterprise' ? enterpriseServices : personalServices;
  const guides = userRole === 'enterprise' ? mockEnterpriseGuides : mockPersonalGuides;

  const guideCategories = useMemo(() => {
    const set = new Set(guides.map((g) => g.category));
    return ['全部', ...Array.from(set)];
  }, [guides]);

  const guideGroups = useMemo(() => {
    const set = new Set(guides.flatMap((g) => g.targetGroups));
    return ['全部', ...Array.from(set)];
  }, [guides]);

  const guideScenarios = useMemo(() => {
    const set = new Set(guides.flatMap((g) => g.scenarios));
    return ['全部', ...Array.from(set)];
  }, [guides]);

  const guideTimelinessOptions = ['全部', 'immediate', 'short', 'medium', 'long'];

  const filteredGuides = useMemo(() => {
    return guides.filter((g) => {
      const matchKeyword = !guideKeyword || g.title.includes(guideKeyword) || g.desc.includes(guideKeyword);
      const matchCategory = guideCategory === '全部' || g.category === guideCategory;
      const matchGroup = guideGroup === '全部' || g.targetGroups.includes(guideGroup);
      const matchScenario = guideScenario === '全部' || g.scenarios.includes(guideScenario);
      const matchTimeliness = guideTimeliness === '全部' || g.timeliness === guideTimeliness;
      return matchKeyword && matchCategory && matchGroup && matchScenario && matchTimeliness;
    });
  }, [guides, guideKeyword, guideCategory, guideGroup, guideScenario, guideTimeliness]);

  const handlePolicyClick = (policy: PolicyDocument) => {
    setSelectedPolicy(policy);
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-secondary-400/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm mb-4">
                <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse" />
                系统运行正常 · 服务可用
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                您好，{user?.name || '用户'}
                <span className="block text-lg font-normal text-white/80 mt-2">
                  欢迎访问省级人社一体化服务平台
                </span>
              </h1>
              <p className="text-white/70 mb-6">
                为您提供社保、医保、公积金、就业等全链条人社服务，
                让数据多跑路，群众少跑腿。
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={userRole === 'enterprise' ? '/enterprise/insurance' : '/personal/social-insurance'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary-600 font-medium rounded-xl hover:bg-white/90 transition-colors shadow-lg"
                >
                  立即办理业务
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => {
                    setShowGuideModal(true);
                    setSelectedGuide(null);
                    setGuideKeyword('');
                    setGuideCategory('全部');
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-white/25 transition-colors border border-white/30"
                >
                  查看办事指南
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              {mockInsuranceSummaries.slice(0, 4).map((item, index) => (
                <div
                  key={item.type}
                  className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/25 transition-all"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <p className="text-white/70 text-sm mb-1">{item.typeName}</p>
                  <p className="text-2xl font-bold">
                    ¥{formatCurrency(item.totalBalance, 0)}
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    累计缴费 {item.totalMonths} 个月
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-6 relative z-20">
        {/* 热门服务 */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-neutral-600">
              {userRole === 'enterprise' ? '企业服务' : '热门服务'}
            </h2>
            <button
              onClick={() => {
                setShowGuideModal(true);
                setSelectedGuide(null);
                setGuideKeyword('');
                setGuideCategory('全部');
              }}
              className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
            >
              全部服务 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {services.map((service, index) => (
              <Link
                key={service.label}
                to={service.path}
                className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-primary-50 transition-all duration-200"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-200`}
                >
                  <service.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-neutral-600 group-hover:text-primary-500 transition-colors">
                  {service.label}
                </span>
                <span className="text-xs text-neutral-400 text-center hidden md:block">
                  {service.desc}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            {/* 我的业务 */}
            <Card className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-neutral-600">我的业务</h2>
                <Link
                  to="/messages"
                  className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  全部记录 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {mockTransferProgress.slice(0, 2).map((transfer) => {
                  const progress = transfer.nodes ? Math.round((transfer.nodes.filter(n => n.completed).length / transfer.nodes.length) * 100) : transfer.completedDays;
                  const insuranceTypeText = transfer.insuranceType === 'pension' ? '养老保险' : '医疗保险';
                  return (
                    <div
                      key={transfer.id}
                      onClick={() => navigate('/personal/social-insurance')}
                      className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl hover:bg-primary-50/50 transition-colors cursor-pointer"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${transfer.isOverdue ? 'bg-danger-100 text-danger-500' : 'bg-primary-100 text-primary-500'}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-medium text-neutral-600 truncate">
                            {insuranceTypeText}关系转移
                            <span className="text-xs text-neutral-400 ml-2">{transfer.transferNo}</span>
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {transfer.isOverdue && (
                              <span className="text-xs px-2 py-0.5 bg-danger-500/10 text-danger-500 rounded-full flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                已超时 {transfer.overdueDays} 天
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                transfer.status === 'completed'
                                  ? 'bg-success-500/10 text-success-500'
                                  : 'bg-primary-50 text-primary-500'
                              }`}
                            >
                              {transfer.status === 'completed' ? '已完成' : '办理中'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-400 mb-2">
                          {transfer.fromCity} → {transfer.toCity} · {transfer.applyDate} 提交
                          {transfer.supervisionRecords && transfer.supervisionRecords.length > 0 && (
                            <span className="ml-2 text-danger-500">
                              · 已有 {transfer.supervisionRecords.length} 条督办记录
                            </span>
                          )}
                        </p>
                        <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${transfer.isOverdue ? 'bg-gradient-to-r from-danger-400 to-warning-500' : 'bg-gradient-to-r from-primary-400 to-primary-500'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {transfer.currentNode && (
                          <p className="text-xs text-neutral-500 mt-1">
                            当前节点：{transfer.currentNode}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div
                  onClick={() => navigate('/personal/housing-fund')}
                  className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl hover:bg-primary-50/50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-500">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-neutral-600 truncate">公积金提取申请</h3>
                      <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-500 rounded-full">
                        审核中
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mb-2">2025-06-18 提交 · 预计3个工作日办结</p>
                    <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: '40%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 政策公告 */}
            <Card className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-neutral-600">政策公告</h2>
                <button
                  onClick={() => {
                    setShowPolicyModal(true);
                    setSelectedPolicy(null);
                  }}
                  className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  查看更多 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {mockPolicyDocuments.slice(0, 4).map((policy, index) => (
                  <div
                    key={policy.id}
                    onClick={() => handlePolicyClick(policy)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <div className="w-1 h-12 bg-gradient-to-b from-primary-400 to-secondary-400 rounded-full flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-neutral-600 mb-1 line-clamp-1">
                        {policy.title}
                      </h3>
                      <p className="text-xs text-neutral-400 line-clamp-2 mb-2">{policy.summary}</p>
                      <div className="flex items-center gap-3 text-xs text-neutral-300">
                        <span>{policy.issuingAuthority}</span>
                        <span>·</span>
                        <span>{policy.publishDate}</span>
                      </div>
                    </div>
                    {index === 0 && (
                      <span className="text-xs px-2 py-0.5 bg-danger-500/10 text-danger-500 rounded-full flex-shrink-0">
                        最新
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* 快捷数据 */}
            <Card className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-neutral-600">账户概览</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">社保账户</p>
                      <p className="text-lg font-bold text-neutral-600">
                        ¥{formatCurrency(mockInsuranceSummaries.reduce((sum, i) => sum + i.totalBalance, 0), 0)}
                      </p>
                    </div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-success-500" />
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-transparent rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">公积金账户</p>
                      <p className="text-lg font-bold text-neutral-600">
                        ¥{formatCurrency(mockHousingFund.balance, 0)}
                      </p>
                    </div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-success-500" />
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-cyan-50 to-transparent rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center text-white">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">医保账户</p>
                      <p className="text-lg font-bold text-neutral-600">
                        ¥{formatCurrency(35600, 0)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-success-500">正常</span>
                </div>
              </div>
            </Card>

            {/* 消息通知 */}
            <Card className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-neutral-600">消息通知</h2>
                <Link to="/messages" className="text-xs text-primary-500 hover:text-primary-600">
                  全部消息
                </Link>
              </div>
              <div className="space-y-3">
                {mockMessages.slice(0, 3).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                      !msg.isRead ? 'bg-primary-50/50' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        msg.type === 'warning'
                          ? 'bg-warning-500/10 text-warning-500'
                          : msg.type === 'business'
                          ? 'bg-primary-100 text-primary-500'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-neutral-600 truncate">{msg.title}</h3>
                        {!msg.isRead && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 办理时效承诺 */}
            <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white animate-fade-in-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">办理时效承诺</h3>
                  <p className="text-xs text-white/70">限时办结 · 超时督办</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/10 rounded-lg py-3">
                  <p className="text-2xl font-bold">15</p>
                  <p className="text-xs text-white/70">工作日</p>
                  <p className="text-xs text-white/60 mt-1">社保转移</p>
                </div>
                <div className="bg-white/10 rounded-lg py-3">
                  <p className="text-2xl font-bold">7</p>
                  <p className="text-xs text-white/70">工作日</p>
                  <p className="text-xs text-white/60 mt-1">医保报销</p>
                </div>
                <div className="bg-white/10 rounded-lg py-3">
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-white/70">工作日</p>
                  <p className="text-xs text-white/60 mt-1">参保登记</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* 办事指南 Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-bold">办事指南 · 可检索清单</h3>
                  <p className="text-xs text-white/70">按事项分类检索，支持关键词查询</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowGuideModal(false);
                  setSelectedGuide(null);
                }}
                className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selectedGuide ? (
              <>
                <div className="p-5 border-b border-neutral-100 space-y-3">
                  <div className="relative">
                    <Search className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={guideKeyword}
                      onChange={(e) => setGuideKeyword(e.target.value)}
                      placeholder="请输入办事事项关键词，如：社保转移、医保备案..."
                      className="w-full pl-11 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-neutral-500 w-16 flex-shrink-0">事项分类：</span>
                      <div className="flex flex-wrap gap-2">
                        {guideCategories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setGuideCategory(cat)}
                            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                              guideCategory === cat
                                ? 'bg-primary-500 text-white'
                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-neutral-500 w-16 flex-shrink-0">适用人群：</span>
                      <div className="flex flex-wrap gap-2">
                        {guideGroups.slice(0, 8).map((g) => (
                          <button
                            key={g}
                            onClick={() => setGuideGroup(g)}
                            className={`px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1 ${
                              guideGroup === g
                                ? 'bg-emerald-500 text-white'
                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                            }`}
                          >
                            <Users className="w-3 h-3" />
                            {g.length > 8 ? g.slice(0, 8) + '...' : g}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-neutral-500 w-16 flex-shrink-0">办理场景：</span>
                      <div className="flex flex-wrap gap-2">
                        {guideScenarios.slice(0, 10).map((s) => (
                          <button
                            key={s}
                            onClick={() => setGuideScenario(s)}
                            className={`px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1 ${
                              guideScenario === s
                                ? 'bg-violet-500 text-white'
                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                            }`}
                          >
                            <Target className="w-3 h-3" />
                            {s.length > 8 ? s.slice(0, 8) + '...' : s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-neutral-500 w-16 flex-shrink-0">办理时效：</span>
                      <div className="flex flex-wrap gap-2">
                        {guideTimelinessOptions.map((t) => (
                          <button
                            key={t}
                            onClick={() => setGuideTimeliness(t)}
                            className={`px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1 ${
                              guideTimeliness === t
                                ? 'bg-amber-500 text-white'
                                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                            }`}
                          >
                            <Timer className="w-3 h-3" />
                            {t === '全部' ? t : getTimelinessText(t)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 380px)' }}>
                  <p className="text-xs text-neutral-400 mb-3">
                    共找到 <span className="text-primary-500 font-semibold">{filteredGuides.length}</span> 项办事指南
                  </p>
                  {filteredGuides.length === 0 ? (
                    <div className="py-16 text-center text-neutral-400">
                      <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>未找到匹配的办事指南，请换个关键词试试</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredGuides.map((guide) => (
                        <div
                          key={guide.id}
                          onClick={() => setSelectedGuide(guide)}
                          className="p-4 border border-neutral-100 rounded-xl hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer transition-all group"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 text-white flex items-center justify-center flex-shrink-0">
                              <ClipboardList className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-neutral-700 group-hover:text-primary-500 transition-colors">
                                  {guide.title}
                                </h4>
                                <span className="text-[10px] px-2 py-0.5 bg-primary-50 text-primary-500 rounded-full">
                                  {guide.category}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 text-white rounded-full ${getTimelinessColor(guide.timeliness)}`}>
                                  {getTimelinessText(guide.timeliness)}
                                </span>
                              </div>
                              <p className="text-sm text-neutral-400 mb-2">{guide.desc}</p>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {guide.targetGroups.slice(0, 3).map((g, i) => (
                                  <span key={i} className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">
                                    {g}
                                  </span>
                                ))}
                                {guide.targetGroups.length > 3 && (
                                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">
                                    +{guide.targetGroups.length - 3}类人群
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> 承诺办结 {guide.time}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Building2 className="w-3 h-3" /> {guide.dept}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
                <div className="p-5 bg-gradient-to-br from-primary-50 to-blue-50 border-b border-neutral-100">
                  <button
                    onClick={() => setSelectedGuide(null)}
                    className="text-xs text-primary-500 hover:text-primary-600 inline-flex items-center gap-1 mb-3"
                  >
                    <ChevronDown className="w-3 h-3 rotate-90" /> 返回清单
                  </button>
                  <h3 className="text-xl font-bold text-neutral-700 mb-2">{selectedGuide.title}</h3>
                  <p className="text-sm text-neutral-500 mb-3">{selectedGuide.desc}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-white rounded-full border border-neutral-200 text-neutral-500">
                      <Tag className="w-3 h-3" /> {selectedGuide.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-white rounded-full border border-neutral-200 text-neutral-500">
                      <Clock className="w-3 h-3" /> {selectedGuide.time}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-white rounded-full border border-neutral-200 text-neutral-500">
                      <Building2 className="w-3 h-3" /> {selectedGuide.dept}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 text-white rounded-full ${getTimelinessColor(selectedGuide.timeliness)}`}>
                      <Timer className="w-3 h-3" /> {getTimelinessText(selectedGuide.timeliness)}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center gap-1">
                    <Info className="w-3 h-3" /> {selectedGuide.timelinessDesc}
                  </div>
                </div>

                <div className="p-5 space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-semibold text-emerald-700">适用人群</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedGuide.targetGroups.map((g, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white text-emerald-700 rounded-full">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-violet-600" />
                        <h4 className="font-semibold text-violet-700">适用场景</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedGuide.scenarios.map((s, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white text-violet-700 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileCheck className="w-5 h-5 text-amber-600" />
                      <h4 className="font-semibold text-amber-700">办理条件</h4>
                    </div>
                    <ul className="space-y-2">
                      {selectedGuide.conditions.map((c, i) => (
                        <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ListChecks className="w-5 h-5 text-primary-500" />
                      <h4 className="font-semibold text-neutral-700">申报材料</h4>
                    </div>
                    <ul className="space-y-2 pl-7">
                      {selectedGuide.materials.map((m, i) => (
                        <li key={i} className="text-sm text-neutral-600 flex items-start gap-2">
                          <span className="text-neutral-400 mt-0.5">{i + 1}.</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <List className="w-5 h-5 text-primary-500" />
                      <h4 className="font-semibold text-neutral-700">办理流程</h4>
                    </div>
                    <div className="relative pl-8">
                      {selectedGuide.flow.map((step, i) => (
                        <div key={i} className="relative pb-5 last:pb-0">
                          <div
                            className={`absolute left-[-20px] top-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                              i === selectedGuide.flow.length - 1
                                ? 'bg-success-500 text-white'
                                : 'bg-primary-100 text-primary-500'
                            }`}
                          >
                            {i + 1}
                          </div>
                          {i < selectedGuide.flow.length - 1 && (
                            <div className="absolute left-[-6px] top-9 w-0.5 h-full bg-primary-100" />
                          )}
                          <p className="text-sm text-neutral-600 pt-2">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedGuide.onlineEntry && (
                    <div className="bg-primary-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ExternalLink className="w-5 h-5 text-primary-600" />
                        <h4 className="font-semibold text-primary-700">办理入口</h4>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => {
                            navigate(selectedGuide.onlineEntry!);
                            setShowGuideModal(false);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all text-sm"
                        >
                          <Smartphone className="w-4 h-4" /> 线上办理
                        </button>
                        {selectedGuide.offlineLocations && selectedGuide.offlineLocations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedGuide.offlineLocations.map((loc, i) => (
                              <div key={i} className="text-xs bg-white px-3 py-2 rounded-lg border border-primary-100">
                                <p className="font-medium text-neutral-700">{loc.name}</p>
                                <p className="text-neutral-500 flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" /> {loc.address}
                                </p>
                                {loc.phone && (
                                  <p className="text-neutral-500 flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {loc.phone}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedGuide.path && (
                    <div className="pt-2">
                      <Link
                        to={selectedGuide.path}
                        onClick={() => setShowGuideModal(false)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-md"
                      >
                        立即在线办理 <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 政策 Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-500 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-bold">{selectedPolicy ? '政策详情' : '政策公告列表'}</h3>
                  <p className="text-xs text-white/70">
                    {selectedPolicy ? '政策文件全文与解读' : `共 ${mockPolicyDocuments.length} 条政策文件`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPolicyModal(false);
                  setSelectedPolicy(null);
                }}
                className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selectedPolicy ? (
              <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
                <div className="space-y-3">
                  {mockPolicyDocuments.map((policy, index) => (
                    <div
                      key={policy.id}
                      onClick={() => setSelectedPolicy(policy)}
                      className="p-4 border border-neutral-100 rounded-xl hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-11 h-11 rounded-xl text-white flex items-center justify-center flex-shrink-0 ${
                            policy.type === 'notice'
                              ? 'bg-gradient-to-br from-primary-400 to-primary-500'
                              : 'bg-gradient-to-br from-secondary-400 to-secondary-500'
                          }`}
                        >
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-neutral-700 group-hover:text-primary-500 transition-colors">
                              {policy.title}
                            </h4>
                            {index === 0 && (
                              <span className="text-[10px] px-2 py-0.5 bg-danger-500/10 text-danger-500 rounded-full">
                                最新
                              </span>
                            )}
                            {policy.tags?.slice(0, 3).map((t) => (
                              <span
                                key={t.id}
                                className="text-[10px] px-2 py-0.5 bg-primary-50 text-primary-500 rounded-full"
                              >
                                {t.name}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-neutral-400 mb-2 line-clamp-2">{policy.summary}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {policy.publishDate}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {policy.issuingAuthority}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> 有效期至 {policy.validUntil}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
                <div className="p-5 bg-gradient-to-br from-primary-50 to-blue-50 border-b border-neutral-100">
                  <button
                    onClick={() => setSelectedPolicy(null)}
                    className="text-xs text-primary-500 hover:text-primary-600 inline-flex items-center gap-1 mb-3"
                  >
                    <ChevronDown className="w-3 h-3 rotate-90" /> 返回列表
                  </button>
                  <h3 className="text-xl font-bold text-neutral-700 mb-2">{selectedPolicy.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedPolicy.tags?.map((t) => (
                      <span
                        key={t.id}
                        className="text-[10px] px-2.5 py-1 bg-white text-primary-500 rounded-full border border-primary-100"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" /> {selectedPolicy.issuingAuthority}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> 发布日期 {selectedPolicy.publishDate}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 有效期至 {selectedPolicy.validUntil}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Hash className="w-3 h-3" /> 文号 {selectedPolicy.documentNo || '人社发〔2025〕XX号'}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-5 text-neutral-600 text-sm leading-relaxed">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-semibold text-emerald-700">适用人群</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPolicy.applicableGroups?.map((g, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white text-emerald-700 rounded-full">
                            {g}
                          </span>
                        )) || <span className="text-xs text-emerald-500">暂无数据</span>}
                      </div>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-violet-600" />
                        <h4 className="font-semibold text-violet-700">适用场景</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPolicy.applicableScenarios?.map((s, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white text-violet-700 rounded-full">
                            {s}
                          </span>
                        )) || <span className="text-xs text-violet-500">暂无数据</span>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-neutral-700 mb-2">一、政策背景</h4>
                    <p>{selectedPolicy.summary}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-700 mb-2">二、核心内容</h4>
                    <ul className="space-y-2 pl-6 list-disc">
                      <li>优化经办服务流程，减少群众跑动次数，推动"一网通办"全程电子化</li>
                      <li>提高待遇保障水平，建立动态调整机制，让群众共享经济社会发展成果</li>
                      <li>强化基金监管，确保基金安全可持续运行</li>
                      <li>加强跨部门数据共享，实现"数据多跑路，群众少跑腿"</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-700 mb-2">三、办理方式</h4>
                    <div className="space-y-3">
                      {selectedPolicy.handlingMethods?.map((hm, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-500 flex-shrink-0">
                            <ExternalLink className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-neutral-700 text-sm">{hm.channel}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">{hm.description}</p>
                          </div>
                          {hm.url && (
                            <button
                              onClick={() => {
                                navigate(hm.url!);
                                setShowPolicyModal(false);
                              }}
                              className="text-xs px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-1"
                            >
                              前往办理 <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-neutral-100 flex flex-wrap gap-3">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-500 rounded-lg hover:bg-primary-100 transition-colors text-sm">
                      <FileText className="w-4 h-4" /> 下载政策原文
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-500 rounded-lg hover:bg-primary-100 transition-colors text-sm">
                      <AlertCircle className="w-4 h-4" /> 查看政策解读
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
