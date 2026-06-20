import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Star,
  Share2,
  ArrowLeft,
  Check,
  X,
  Award,
  Building,
  Calendar,
  DollarSign,
  Clock,
  Briefcase,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, Badge, MatchScore, Button, Modal } from '@/components/ui';
import { mockJobs, mockCompanies, mockMatchResults, mockCompanyQualifications, mockTalents } from '@shared/mock/data';
import { INDUSTRY_LIST, SKILL_DIMENSIONS, type JobDescription, type MatchResult, type SkillRadar, type Company, type CompanyQualification } from '@shared/types';
import { cn } from '@/lib/utils';

type TabType = 'detail' | 'skill' | 'company' | 'review';

const TABS: { value: TabType; label: string }[] = [
  { value: 'detail', label: '职位详情' },
  { value: 'skill', label: '技能匹配' },
  { value: 'company', label: '公司介绍' },
  { value: 'review', label: '面试评价' },
];

const MOCK_REVIEWS = [
  {
    id: '1',
    author: '匿名用户',
    rating: 5,
    position: '前台接待',
    date: '2024-05-15',
    content: '面试流程很规范，HR很专业，公司环境也不错。面试官问了很多关于客户服务的问题，整体体验很好。',
    pros: ['环境好', 'HR专业', '反馈及时'],
    cons: ['等待时间稍长'],
  },
  {
    id: '2',
    author: '李女士',
    rating: 4,
    position: '餐饮主管',
    date: '2024-04-20',
    content: '面试难度适中，主要考察管理经验和团队协调能力。公司福利不错，有员工餐和住宿。',
    pros: ['福利好', '面试官友善', '有晋升空间'],
    cons: ['需要倒班'],
  },
  {
    id: '3',
    author: '张先生',
    rating: 4.5,
    position: '美容师',
    date: '2024-03-10',
    content: '有实操考核环节，需要展示美容手法。培训体系完善，对个人技能提升很有帮助。',
    pros: ['培训完善', '技术氛围好', '产品福利多'],
    cons: ['业绩压力较大'],
  },
];

const getScheduleLabel = (type: string): string => {
  const map: Record<string, string> = {
    fixed: '固定班制',
    flexible: '弹性工作',
    shift: '轮班制',
  };
  return map[type] || type;
};

const getIndustryColor = (industry: string): string => {
  const industryInfo = INDUSTRY_LIST.find((i) => i.key === industry);
  return industryInfo?.color || '#1E3A5F';
};

const getIndustryLabel = (industry: string): string => {
  const industryInfo = INDUSTRY_LIST.find((i) => i.key === industry);
  return industryInfo?.label || industry;
};

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDescription | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [companyQualification, setCompanyQualification] = useState<CompanyQualification | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('detail');
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSalaryTooltip, setShowSalaryTooltip] = useState(false);
  const [showMatchTooltip, setShowMatchTooltip] = useState(false);
  const [applying, setApplying] = useState(false);

  const mySkillRadar: SkillRadar = mockTalents[0]?.skillRadar || {
    professional: 85,
    communication: 88,
    service: 90,
    teamwork: 82,
    stress: 78,
    learning: 80,
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const foundJob = mockJobs.find((j) => j.id === jobId);
      if (foundJob) {
        setJob(foundJob);
        const foundCompany = mockCompanies.find((c) => c.id === foundJob.companyId);
        setCompany(foundCompany || null);
        const foundMatch = mockMatchResults.find((m) => m.jobId === jobId);
        setMatchResult(foundMatch || null);
        const foundQual = mockCompanyQualifications.find((q) => q.companyId === foundJob.companyId);
        setCompanyQualification(foundQual || null);
      }
      setLoading(false);
    }, 500);
  }, [jobId]);

  const handleApply = async () => {
    setApplying(true);
    setTimeout(() => {
      setApplying(false);
      setShowApplyModal(false);
      alert('简历投递成功！HR会尽快与您联系。');
    }, 1500);
  };

  const getSimilarJobs = () => {
    if (!job) return [];
    return mockJobs
      .filter((j) => j.id !== job.id && j.industry === job.industry)
      .slice(0, 4);
  };

  const formatSalary = (job: JobDescription): string => {
    const base = job.salary.base;
    const max = base + job.salary.performance + job.salary.commission;
    return `${(base / 1000).toFixed(0)}k-${(max / 1000).toFixed(0)}k`;
  };

  const getVerificationStatusText = (status: string): string => {
    const map: Record<string, string> = {
      pending: '审核中',
      approved: '已认证',
      rejected: '未通过',
    };
    return map[status] || status;
  };

  const getVerificationStatusColor = (status: string): string => {
    const map: Record<string, string> = {
      pending: 'text-warning',
      approved: 'text-mint-500',
      rejected: 'text-accent-500',
    };
    return map[status] || 'text-neutral-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <Briefcase size={64} className="mx-auto text-neutral-300 mb-4" />
          <h2 className="text-xl font-bold text-neutral-700 mb-2">职位不存在</h2>
          <p className="text-neutral-500 mb-4">该职位可能已过期或被删除</p>
          <Button onClick={() => navigate('/jobs')}>返回职位列表</Button>
        </div>
      </div>
    );
  }

  const industryColor = getIndustryColor(job.industry);
  const similarJobs = getSimilarJobs();

  const radarComparisonData = SKILL_DIMENSIONS.map((dim) => ({
    dimension: dim.label,
    职位要求: job.skillRadar[dim.key as keyof SkillRadar],
    我的技能: mySkillRadar[dim.key as keyof SkillRadar],
    fullMark: 100,
  }));

  return (
    <div className="min-h-screen bg-neutral-100 pb-24 lg:pb-8">
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Link to="/" className="hover:text-primary-600 transition-colors">
              首页
            </Link>
            <ChevronRight size={14} />
            <Link to="/jobs" className="hover:text-primary-600 transition-colors">
              职位列表
            </Link>
            <ChevronRight size={14} />
            <span className="text-neutral-700 font-medium truncate">{job.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-neutral-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>返回职位列表</span>
        </button>

        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="font-serif text-2xl lg:text-3xl font-bold text-primary-800 mb-2">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${industryColor}15` }}
                    >
                      <Building size={24} style={{ color: industryColor }} />
                    </div>
                    <div>
                      <p className="font-medium text-primary-700">{company?.name}</p>
                      <Badge variant="info" size="sm">
                        {getIndustryLabel(job.industry)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {matchResult && (
                  <div className="relative">
                    <div
                      onMouseEnter={() => setShowMatchTooltip(true)}
                      onMouseLeave={() => setShowMatchTooltip(false)}
                    >
                      <MatchScore
                        score={matchResult.overallScore}
                        size="lg"
                      />
                    </div>
                    {showMatchTooltip && (
                      <div className="absolute right-full top-0 mr-4 w-72 bg-white rounded-xl shadow-card-hover border border-neutral-200 p-4 z-50">
                        <div className="flex items-center gap-2 mb-3">
                          <Info size={16} className="text-primary-500" />
                          <span className="font-medium">匹配度分析</span>
                        </div>
                        <MatchScore
                          score={matchResult.overallScore}
                          size="sm"
                          showDetails
                          breakdown={{
                            skillMatch: matchResult.skillMatch,
                            experienceMatch: matchResult.experienceMatch,
                            locationMatch: matchResult.locationMatch,
                            salaryMatch: matchResult.salaryMatch,
                            scenarioMatch: matchResult.scenarioMatch,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="relative">
                  <div
                    onMouseEnter={() => setShowSalaryTooltip(true)}
                    onMouseLeave={() => setShowSalaryTooltip(false)}
                    className="flex items-baseline gap-2 cursor-help"
                  >
                    <span
                      className="text-4xl font-bold"
                      style={{ color: industryColor }}
                    >
                      {formatSalary(job)}
                    </span>
                    <span className="text-neutral-400">/月</span>
                    <Info size={16} className="text-neutral-400" />
                  </div>
                  {showSalaryTooltip && (
                    <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-card-hover border border-neutral-200 p-4 z-50">
                      <h4 className="font-medium text-primary-800 mb-3">薪资结构</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">基本工资</span>
                          <span className="font-medium">¥{job.salary.base.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">绩效奖金</span>
                          <span className="font-medium">¥{job.salary.performance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">提成/津贴</span>
                          <span className="font-medium">¥{job.salary.commission.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-neutral-200 pt-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-600">福利</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.salary.benefits.map((benefit, i) => (
                              <Badge key={i} variant="success" size="sm">
                                {benefit}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                  <MapPin size={20} className="text-primary-500" />
                  <div>
                    <p className="text-xs text-neutral-500">工作地点</p>
                    <p className="text-sm font-medium text-neutral-700 truncate">
                      {job.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                  <Briefcase size={20} className="text-mint-500" />
                  <div>
                    <p className="text-xs text-neutral-500">工作类型</p>
                    <p className="text-sm font-medium text-neutral-700">
                      {getScheduleLabel(job.scheduleFlexibility)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                  <Calendar size={20} className="text-accent-500" />
                  <div>
                    <p className="text-xs text-neutral-500">发布时间</p>
                    <p className="text-sm font-medium text-neutral-700">
                      {new Date(job.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                  <Clock size={20} className="text-primary-500" />
                  <div>
                    <p className="text-xs text-neutral-500">招聘状态</p>
                    <p className="text-sm font-medium text-mint-600">招聘中</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() => setShowApplyModal(true)}
                  className="min-w-[140px]"
                >
                  <DollarSign size={20} />
                  立即投递
                </Button>
                <Button
                  variant={isFavorite ? 'primary' : 'secondary'}
                  size="lg"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Star
                    size={20}
                    fill={isFavorite ? 'currentColor' : 'none'}
                  />
                  {isFavorite ? '已收藏' : '收藏'}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setShowShareModal(true)}
                >
                  <Share2 size={20} />
                  分享
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="bg-white rounded-xl shadow-card mb-6 overflow-hidden">
          <div className="flex border-b border-neutral-200 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'px-6 py-4 font-medium whitespace-nowrap transition-all relative',
                  activeTab === tab.value
                    ? 'text-primary-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                {tab.label}
                {activeTab === tab.value && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: industryColor }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'detail' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="font-serif text-xl font-bold text-primary-800 mb-4">
                    职位描述
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-bold text-primary-800 mb-4">
                    任职要求
                  </h3>
                  <ul className="space-y-3">
                    {job.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-mint-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check size={12} className="text-mint-600" />
                        </div>
                        <span className="text-neutral-600">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-bold text-primary-800 mb-4">
                    福利待遇
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {job.benefits.map((benefit, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-3 bg-mint-50 rounded-xl"
                      >
                        <Award size={18} className="text-mint-500" />
                        <span className="text-sm text-neutral-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'skill' && matchResult && (
              <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-primary-800 mb-4 text-center">
                      技能对比分析
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarComparisonData}>
                          <defs>
                            <linearGradient id="jobRadarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#1E3A5F" stopOpacity={0.5} />
                              <stop offset="100%" stopColor="#1E3A5F" stopOpacity={0.3} />
                            </linearGradient>
                            <linearGradient id="myRadarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#4ECDC4" stopOpacity={0.5} />
                              <stop offset="100%" stopColor="#4ECDC4" stopOpacity={0.3} />
                            </linearGradient>
                          </defs>
                          <PolarGrid stroke="#E9ECEF" />
                          <PolarAngleAxis
                            dataKey="dimension"
                            tick={{ fill: '#495057', fontSize: 12 }}
                            tickLine={false}
                          />
                          <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={{ fill: '#ADB5BD', fontSize: 10 }}
                            tickCount={5}
                            axisLine={false}
                          />
                          <Radar
                            name="职位要求"
                            dataKey="职位要求"
                            stroke="#1E3A5F"
                            strokeWidth={2}
                            fill="url(#jobRadarGradient)"
                            fillOpacity={0.5}
                          />
                          <Radar
                            name="我的技能"
                            dataKey="我的技能"
                            stroke="#4ECDC4"
                            strokeWidth={2}
                            fill="url(#myRadarGradient)"
                            fillOpacity={0.5}
                          />
                          <Legend />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #E9ECEF',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-serif text-xl font-bold text-primary-800 mb-4">
                      匹配度细分
                    </h3>
                    <div className="space-y-5">
                      {[
                        { key: 'skillMatch', label: '技能匹配', value: matchResult.skillMatch },
                        { key: 'experienceMatch', label: '经验匹配', value: matchResult.experienceMatch },
                        { key: 'locationMatch', label: '地点匹配', value: matchResult.locationMatch },
                        { key: 'salaryMatch', label: '薪资匹配', value: matchResult.salaryMatch },
                        { key: 'scenarioMatch', label: '场景匹配', value: matchResult.scenarioMatch },
                      ].map((item) => {
                        const getColor = (v: number) => {
                          if (v >= 90) return '#4ECDC4';
                          if (v >= 75) return '#1E3A5F';
                          return '#FF6B6B';
                        };
                        const color = getColor(item.value);
                        return (
                          <div key={item.key} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-neutral-600">{item.label}</span>
                              <span className="font-medium" style={{ color }}>
                                {item.value}%
                              </span>
                            </div>
                            <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                  width: `${item.value}%`,
                                  backgroundColor: color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <Card gradientBorder>
                  <div className="p-6">
                    <h3 className="font-serif text-xl font-bold text-primary-800 mb-4">
                      AI 匹配分析
                    </h3>
                    <div className="space-y-3">
                      {matchResult.reasons.map((reason, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl"
                        >
                          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <Check size={14} className="text-primary-600" />
                          </div>
                          <span className="text-neutral-700">{reason}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-mint-50 rounded-xl border border-mint-200">
                      <p className="text-sm text-mint-700">
                        <span className="font-medium">综合建议：</span>
                        您的整体匹配度较高，建议尽快投递简历。该职位与您的技能和期望高度契合，成功概率较大。
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'company' && company && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex flex-col md:flex-row gap-6">
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${industryColor}15` }}
                  >
                    <Building size={48} style={{ color: industryColor }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-2xl font-bold text-primary-800 mb-2">
                      {company.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <Badge variant="info">{getIndustryLabel(company.industry)}</Badge>
                      {companyQualification && (
                        <Badge
                          variant={companyQualification.status === 'approved' ? 'success' : 'warning'}
                        >
                          {getVerificationStatusText(companyQualification.status)}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-neutral-600">
                        <MapPin size={16} />
                        <span>{company.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Briefcase size={16} />
                        <span>联系人：{company.contactPerson}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {companyQualification && (
                  <div>
                    <h4 className="font-serif text-lg font-bold text-primary-800 mb-4">
                      企业资质
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3">
                            <Award size={24} className="text-primary-600" />
                          </div>
                          <p className="text-sm text-neutral-500 mb-1">合规评分</p>
                          <p className="text-2xl font-bold text-primary-600">
                            {companyQualification.complianceScore}
                          </p>
                        </div>
                      </Card>
                      <Card>
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full bg-mint-100 flex items-center justify-center mx-auto mb-3">
                            <Check size={24} className="text-mint-600" />
                          </div>
                          <p className="text-sm text-neutral-500 mb-1">认证状态</p>
                          <p
                            className="text-lg font-bold"
                            style={{ color: getVerificationStatusColor(companyQualification.status) }}
                          >
                            {getVerificationStatusText(companyQualification.status)}
                          </p>
                        </div>
                      </Card>
                      <Card>
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center mx-auto mb-3">
                            <Calendar size={24} className="text-accent-600" />
                          </div>
                          <p className="text-sm text-neutral-500 mb-1">认证时间</p>
                          <p className="text-lg font-bold text-neutral-700">
                            {companyQualification.verifiedAt
                              ? new Date(companyQualification.verifiedAt).toLocaleDateString('zh-CN')
                              : '-'}
                          </p>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {companyQualification && companyQualification.industryCertifications.length > 0 && (
                  <div>
                    <h4 className="font-serif text-lg font-bold text-primary-800 mb-4">
                      行业认证
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {companyQualification.industryCertifications.map((cert, i) => (
                        <Badge key={i} variant="success" size="md">
                          <Award size={12} className="mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-serif text-lg font-bold text-primary-800 mb-4">
                    公司介绍
                  </h4>
                  <p className="text-neutral-600 leading-relaxed">
                    {company.name} 是一家专注于 {getIndustryLabel(company.industry)} 领域的优秀企业。
                    公司致力于为客户提供优质的产品和服务，注重员工的职业发展和福利待遇。
                    我们拥有专业的团队和完善的培训体系，为每一位员工提供广阔的发展空间。
                    加入我们，共创美好未来！
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'review' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-xl font-bold text-primary-800">
                    面试评价
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-accent-500">4.5</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
                          fill={star <= 4 ? '#FF6B6B' : 'none'}
                          className={star <= 4 ? 'text-accent-500' : 'text-neutral-300'}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-neutral-500">({MOCK_REVIEWS.length}条评价)</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {MOCK_REVIEWS.map((review) => (
                    <Card key={review.id} hoverable>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-neutral-800">
                              {review.author}
                            </span>
                            <Badge variant="info" size="sm">
                              {review.position}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={14}
                                  fill={star <= review.rating ? '#FF6B6B' : 'none'}
                                  className={star <= review.rating ? 'text-accent-500' : 'text-neutral-300'}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-neutral-400">
                              {review.date}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-neutral-600 mb-3 leading-relaxed">
                        {review.content}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {review.pros.map((pro, i) => (
                          <Badge key={`pro-${i}`} variant="success" size="sm">
                            <Check size={10} className="mr-1" />
                            {pro}
                          </Badge>
                        ))}
                        {review.cons.map((con, i) => (
                          <Badge key={`con-${i}`} variant="warning" size="sm">
                            <X size={10} className="mr-1" />
                            {con}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {similarJobs.length > 0 && (
          <div>
            <h3 className="font-serif text-xl font-bold text-primary-800 mb-4">
              相似职位推荐
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarJobs.map((similarJob) => (
                <Card
                  key={similarJob.id}
                  hoverable
                  className="cursor-pointer"
                  onClick={() => navigate(`/job/${similarJob.id}`)}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${getIndustryColor(similarJob.industry)}15` }}
                  >
                    <Briefcase size={24} style={{ color: getIndustryColor(similarJob.industry) }} />
                  </div>
                  <h4 className="font-medium text-neutral-800 mb-1 truncate">
                    {similarJob.title}
                  </h4>
                  <p className="text-sm text-neutral-500 mb-2 truncate">
                    {similarJob.company?.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className="font-bold"
                      style={{ color: getIndustryColor(similarJob.industry) }}
                    >
                      {formatSalary(similarJob)}
                    </span>
                    {mockMatchResults.find((m) => m.jobId === similarJob.id) && (
                      <Badge variant="info" size="sm">
                        匹配度 {mockMatchResults.find((m) => m.jobId === similarJob.id)?.overallScore}%
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 lg:hidden z-40">
        <div className="max-w-6xl mx-auto flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setIsFavorite(!isFavorite)}
          >
            <Star
              size={18}
              fill={isFavorite ? 'currentColor' : 'none'}
            />
            {isFavorite ? '已收藏' : '收藏'}
          </Button>
          <Button className="flex-1" onClick={() => setShowApplyModal(true)}>
            <DollarSign size={18} />
            立即投递
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="确认投递简历"
      >
        <div className="space-y-4">
          <div className="p-4 bg-neutral-50 rounded-xl">
            <h4 className="font-medium text-neutral-800 mb-2">{job.title}</h4>
            <p className="text-sm text-neutral-500">{company?.name}</p>
            <p className="text-lg font-bold text-primary-600 mt-2">
              {formatSalary(job)}
            </p>
          </div>
          <p className="text-neutral-600">
            确认要投递您的简历到该职位吗？HR将会在3个工作日内查看您的申请。
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowApplyModal(false)}
            >
              取消
            </Button>
            <Button
              className="flex-1"
              loading={applying}
              onClick={handleApply}
            >
              确认投递
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="分享职位"
      >
        <div className="space-y-4">
          <p className="text-neutral-600">
            将该职位分享给您的朋友或社交平台
          </p>
          <div className="grid grid-cols-4 gap-4">
            {['微信', '朋友圈', '微博', '复制链接'].map((item, i) => (
              <button
                key={i}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-neutral-50 transition-colors"
                onClick={() => {
                  alert(`${item}功能开发中...`);
                  setShowShareModal(false);
                }}
              >
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <Share2 size={20} className="text-primary-600" />
                </div>
                <span className="text-sm text-neutral-700">{item}</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
