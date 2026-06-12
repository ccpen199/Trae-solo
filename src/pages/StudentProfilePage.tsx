import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  GraduationCap,
  MapPin,
  DollarSign,
  Briefcase,
  Upload,
  FileText,
  Award,
  FolderKanban,
  Edit3,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  Plus,
  Eye,
  Calendar,
  Building2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';

type VerificationStatus = 'verified' | 'pending' | 'unverified';
type TabKey = 'basic' | 'skills' | 'projects' | 'about';

const statusConfig: Record<VerificationStatus, { label: string; variant: any; icon: any }> = {
  verified: { label: '认证通过', variant: 'verified', icon: CheckCircle },
  pending: { label: '待审核', variant: 'warn', icon: Clock },
  unverified: { label: '未验证', variant: 'danger', icon: XCircle },
};

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [verificationStatus] = useState<VerificationStatus>('pending');
  const profileComplete = 0.78;

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'basic', label: '基本信息', icon: User },
    { key: 'skills', label: '技能证书', icon: Award },
    { key: 'projects', label: '实训项目', icon: FolderKanban },
    { key: 'about', label: '自我描述', icon: Edit3 },
  ];

  const StatusIcon = statusConfig[verificationStatus].icon;

  const certificates = [
    { id: 1, name: '英语六级CET-6', issuer: '教育部考试中心', date: '2024-06', score: '568分' },
    { id: 2, name: '计算机二级Python', issuer: '教育部考试中心', date: '2024-03', score: '优秀' },
    { id: 3, name: '阿里云云计算ACP', issuer: '阿里巴巴云计算', date: '2024-09', score: '认证通过' },
    { id: 4, name: 'PMP项目管理', issuer: 'PMI国际项目管理协会', date: '2025-01', score: '5A通过' },
  ];

  const projects = [
    {
      id: 1,
      name: '电商平台后台管理系统',
      period: '2024.07 - 2024.09',
      role: '前端开发',
      stack: ['React', 'TypeScript', 'Ant Design', 'Redux'],
      desc: '负责商品管理、订单模块的前端开发，优化页面加载性能提升40%，参与组件库设计与开发。',
    },
    {
      id: 2,
      name: '校园二手交易小程序',
      period: '2024.03 - 2024.06',
      role: '全栈开发·队长',
      stack: ['Taro', 'Node.js', 'MongoDB', 'Redis'],
      desc: '带领4人团队完成从需求分析到上线的全流程，日活峰值500+，获校级创新创业大赛银奖。',
    },
    {
      id: 3,
      name: '智能推荐算法引擎',
      period: '2024.10 - 至今',
      role: '算法实习生',
      stack: ['Python', 'PyTorch', 'Spark', 'Hadoop'],
      desc: '基于协同过滤与内容推荐混合模型，优化CTR指标提升15%，AB实验通过已全量上线。',
    },
  ];

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        {verificationStatus !== 'verified' && (
          <div className="animate-fade-in-up bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Clock size={20} className="text-amber-600" />
              </div>
              <div>
                <div className="font-semibold text-amber-800">学籍验证审核中</div>
                <div className="text-sm text-amber-600">预计1-2个工作日完成审核，完成后可解锁专属内推通道</div>
              </div>
            </div>
            <Button variant="primary" size="sm" leftIcon={<Upload size={14} />}>
              重新提交材料
            </Button>
          </div>
        )}
        <Card className="animate-fade-in-up overflow-hidden">
          <div className="relative h-44 bg-gradient-to-r from-brand-500 via-brand-400 to-teal-400">
            <div className="absolute inset-0 bg-hero-gradient opacity-40" />
          </div>
          <div className="relative -mt-20 px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-card overflow-hidden bg-white">
                  <img
                    src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20young%20asian%20college%20student%20portrait%20photo%20friendly%20smile&image_size=square_hd"
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-ink-900">李思远</h1>
                  <Badge variant={statusConfig[verificationStatus].variant} dot>
                    <StatusIcon size={12} />
                    {statusConfig[verificationStatus].label}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-ink-600 text-sm">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap size={16} className="text-brand-500" />
                    浙江大学 · 计算机科学与技术
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={16} className="text-teal-500" />
                    2022级 · 大三在读
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User size={16} className="text-sky-500" />
                    学号：322010***
                  </span>
                </div>
              </div>
              <div className="pb-2 flex gap-3 flex-wrap">
                <Button variant="outline" size="md">
                  <Eye size={16} />
                  预览简历
                </Button>
                <Button variant="primary" size="md">
                  <Edit3 size={16} />
                  编辑资料
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  className="relative"
                  onClick={() => navigate('/me/applications')}
                >
                  <Briefcase size={16} />
                  我的投递记录
                  <span className="ml-1">(5)</span>
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                    5
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="text-teal-500" size={22} />
              学籍验证
            </CardTitle>
            <p className="text-sm text-ink-500">完成学籍认证可获得专属内推通道，优先触达名企HR</p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-1.5 block ml-0.5">就读院校</label>
                  <div className="relative">
                    <select className="w-full h-11 px-3.5 rounded-xl2 bg-white border border-ink-200 text-sm text-ink-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all appearance-none pr-10">
                      <option>浙江大学</option>
                      <option>清华大学</option>
                      <option>北京大学</option>
                      <option>上海交通大学</option>
                      <option>复旦大学</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                  </div>
                </div>
                <Input label="学号" placeholder="请输入完整学号" defaultValue="3220101234" />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-ink-700 block ml-0.5">上传学生证</label>
                <div className="border-2 border-dashed border-ink-200 rounded-xl2 p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all min-h-[120px]">
                  <Upload size={28} className="text-ink-400" />
                  <p className="text-sm text-ink-500 text-center">拖拽照片到此处<br />或点击上传学生证正反面</p>
                  <p className="text-xs text-ink-400">支持 JPG/PNG，单张≤5MB</p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between pt-4 border-t border-ink-100">
              <p className="text-xs text-ink-500 flex items-center gap-1.5">
                <Clock size={14} />
                人工审核通常在1-2个工作日完成
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <FileText size={14} />
                  人工审核通道
                </Button>
                <Button variant="primary" size="sm">
                  <CheckCircle size={14} />
                  提交验证
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 投递准备进度卡 */}
        <Card className="animate-fade-in-up border-gradient-to-r from-brand-100 to-teal-100" style={{ animationDelay: '0.15s' }}>
          <CardContent>
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* 左：圆环进度 */}
              <div className="flex items-center gap-6 lg:w-56 shrink-0">
                <div className="relative w-28 h-28 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-ink-100"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={`${2 * Math.PI * 52 * (1 - profileComplete)}`}
                      className="transition-all duration-700"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="50%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-ink-900 font-num">{Math.round(profileComplete * 100)}%</span>
                    <span className="text-xs text-ink-500">完整度</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-ink-900">求职档案进度</h4>
                  <p className="text-xs text-ink-500 mt-1">完善档案解锁更多岗位</p>
                </div>
              </div>

              {/* 中：分项目标列表 */}
              <div className="flex-1 min-w-0">
                <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                      <CheckCircle size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink-800 text-sm">学籍验证</div>
                      <div className="text-xs text-emerald-600">审核中</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                      <CheckCircle size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink-800 text-sm">基本信息</div>
                      <div className="text-xs text-emerald-600">已完善</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                    <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
                      <Clock size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink-800 text-sm flex items-center gap-1.5">
                        <Award size={14} className="text-amber-500" />
                        技能证书
                      </div>
                      <div className="text-xs text-amber-600">2 / 3 个</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                    <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
                      <Clock size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink-800 text-sm flex items-center gap-1.5">
                        <FolderKanban size={14} className="text-amber-500" />
                        实训项目
                      </div>
                      <div className="text-xs text-amber-600">2 / 3 个</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 sm:col-span-2 lg:col-span-1 xl:col-span-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                      <CheckCircle size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink-800 text-sm flex items-center gap-1.5">
                        <Edit3 size={14} className="text-emerald-500" />
                        自我描述
                      </div>
                      <div className="text-xs text-emerald-600">已完成（320字）</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右：可投递岗位提示 */}
              <div className="lg:w-56 shrink-0 p-5 rounded-2xl bg-gradient-to-br from-brand-50 to-teal-50 border border-brand-100/60 text-center lg:text-left">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-sm text-ink-600 mb-1">完成后可解锁</div>
                <div className="text-3xl font-bold text-brand-600 font-num mb-1">128<span className="text-lg font-medium">个</span></div>
                <div className="text-sm text-ink-600 mb-4">优质实习岗位</div>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  rightIcon={<ArrowRight size={14} />}
                  onClick={() => navigate('/jobs')}
                >
                  去岗位广场看看
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="border-b border-ink-100 px-2">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative px-5 py-4 flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-all ${
                      isActive ? 'text-brand-600' : 'text-ink-500 hover:text-ink-700'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-gradient rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <CardContent>
            {activeTab === 'basic' && (
              <div className="grid md:grid-cols-2 gap-5 animate-fade-in">
                <Input label="年级" defaultValue="本科大三（2022级）" />
                <Input label="专业方向" defaultValue="人工智能与机器学习方向" />
                <Input
                  label="期望城市"
                  leftIcon={<MapPin size={16} className="text-brand-500" />}
                  defaultValue="杭州 · 上海 · 深圳"
                />
                <Input
                  label="期望薪资（月）"
                  leftIcon={<DollarSign size={16} className="text-teal-500" />}
                  defaultValue="15K - 25K"
                />
                <div className="md:col-span-2">
                  <Input
                    label="期望行业"
                    leftIcon={<Briefcase size={16} className="text-sky-500" />}
                    defaultValue="互联网大厂 · 人工智能 · 金融科技"
                  />
                </div>
                <div className="md:col-span-2 pt-2">
                  <h4 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                    <Building2 size={16} className="text-brand-500" />
                    期望职能方向
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['前端开发', '算法工程师', '产品经理', '数据分析', '全栈开发', 'AI应用开发'].map((tag) => (
                      <Badge key={tag} variant="brand" className="py-1.5 px-3 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-ink-700">已获得证书（{certificates.length}）</h4>
                  <Button size="sm" variant="outline">
                    <Plus size={14} />
                    添加证书
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {certificates.map((cert, idx) => (
                    <Card key={cert.id} hoverable className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.08}s` }}>
                      <CardContent className="flex gap-4">
                        <div className="w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br from-teal-400 to-brand-400 flex items-center justify-center text-white">
                          <Award size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-ink-900 truncate">{cert.name}</h5>
                          <p className="text-xs text-ink-500 mt-0.5">{cert.issuer}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-ink-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {cert.date}
                            </span>
                            <Badge variant="verified" size="xs">{cert.score}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-4 animate-fade-in">
                {projects.map((proj, idx) => (
                  <Card key={proj.id} hoverable className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <CardContent>
                      <div className="flex flex-col md:flex-row md:items-start gap-5">
                        <div className="w-full md:w-44 h-28 shrink-0 rounded-xl overflow-hidden">
                          <img
                            src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(proj.name + ' tech project dashboard ui modern')}&image_size=landscape_4_3`}
                            alt={proj.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h5 className="font-bold text-ink-900 text-lg">{proj.name}</h5>
                            <Badge variant="info">{proj.role}</Badge>
                          </div>
                          <p className="text-xs text-ink-500 mb-2 flex items-center gap-1">
                            <Calendar size={12} />
                            {proj.period}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {proj.stack.map((s) => (
                              <span key={s} className="text-xs px-2 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                                {s}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-ink-600 leading-relaxed">{proj.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-2 block ml-0.5">自我介绍 / 个人陈述</label>
                  <textarea
                    defaultValue={`热爱技术，善于学习，对人工智能与Web开发有浓厚兴趣。在校期间GPA 3.8/4.0，连续两年获校级一等奖学金。具备扎实的计算机基础与工程实践能力，有3段高质量实习经历。

性格开朗，沟通协作能力强，曾作为队长带领团队获多项创新创业竞赛奖项。期望能够加入一家富有活力的科技公司，在实际业务中快速成长，创造价值。`}
                    className="w-full min-h-[200px] p-4 rounded-xl2 bg-white border border-ink-200 text-sm text-ink-800 placeholder:text-ink-300 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all resize-y"
                  />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-ink-100">
                  <p className="text-xs text-ink-500">建议 300-500 字，突出亮点与求职意向</p>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                      <FileText size={14} />
                      导出PDF简历
                    </Button>
                    <Button variant="primary" size="sm">
                      <CheckCircle size={14} />
                      保存修改
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
