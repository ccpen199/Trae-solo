import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Banknote,
  Heart,
  Share2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  User,
  FileText,
  Briefcase,
  Clock,
  Calendar,
  Users,
  Coffee,
  Gift,
  Bus,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  Building2,
  MessageCircle,
  Award,
  FolderKanban,
  Edit3,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tag from '@/components/ui/Tag';

const jdSections = [
  {
    title: '岗位职责',
    content: [
      '参与抖音电商前端业务开发，负责商品详情页、活动页的功能实现与优化',
      '与产品、设计、后端紧密配合，推动需求快速上线，保障高质量交付',
      '参与技术方案评审，编写技术文档，沉淀通用组件与工具库',
      '关注页面性能与用户体验，持续进行性能优化与体验升级',
      '跟进线上问题排查与修复，保障系统稳定运行',
    ],
    defaultOpen: true,
  },
  {
    title: '任职要求',
    content: [
      '本科及以上学历，计算机相关专业优先，2027届及以后毕业生',
      '熟练掌握 HTML/CSS/JavaScript，对 ES6+ 新特性有深入理解',
      '熟悉 React/Vue 任一主流框架，有实际项目经验者优先',
      '了解前端工程化，熟悉 Webpack/Vite 等构建工具',
      '对技术有热情，学习能力强，具备良好的沟通与团队协作能力',
      '每周至少到岗 4 天，可连续实习 3 个月以上',
    ],
    defaultOpen: true,
  },
  {
    title: '加分项',
    content: [
      '有开源项目贡献或个人技术博客',
      '参与过大型互联网公司实习项目',
      '熟悉 TypeScript、Node.js、SSR 等技术',
      '有移动端 H5 或小程序开发经验',
      '算法能力扎实，ACM/蓝桥杯等竞赛获奖经历',
    ],
    defaultOpen: false,
  },
];

const welfareHighlights = [
  { icon: Banknote, label: '薪资待遇', desc: '200-300元/天', color: 'text-brand-500', bg: 'bg-brand-50' },
  { icon: Coffee, label: '免费三餐', desc: '早中晚+下午茶', color: 'text-amber-500', bg: 'bg-amber-50' },
  { icon: Bus, label: '交通补贴', desc: '免费班车/打车报销', color: 'text-sky-500', bg: 'bg-sky-50' },
  { icon: Gift, label: '节日福利', desc: '生日礼+节日礼盒', color: 'text-rose-500', bg: 'bg-rose-50' },
  { icon: Users, label: '团建活动', desc: '月度团建+年会', color: 'text-teal-500', bg: 'bg-teal-50' },
  { icon: GraduationCap, label: '转正机会', desc: '优秀者直接留用', color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

const similarJobs = [
  { id: 1, title: 'React开发实习生', company: '快手科技', city: '北京', salary: '220-320/天', rate: 83, logoBg: 'bg-orange-100', logoText: '快' },
  { id: 2, title: '全栈开发实习生', company: '小红书', city: '上海', salary: '180-280/天', rate: 85, logoBg: 'bg-pink-100', logoText: '红' },
  { id: 3, title: '小程序开发实习生', company: '微信事业群', city: '广州', salary: '210-310/天', rate: 79, logoBg: 'bg-teal-100', logoText: '微' },
  { id: 4, title: '可视化开发实习生', company: '蚂蚁集团', city: '杭州', salary: '250-380/天', rate: 87, logoBg: 'bg-sky-100', logoText: '蚂' },
];

export default function JobDetailPage() {
  const navigate = useNavigate();
  const [sections, setSections] = useState(
    jdSections.map((s) => ({ ...s, open: s.defaultOpen }))
  );
  const [liked, setLiked] = useState(false);
  const [applied, setApplied] = useState(false);
  const [profileComplete, setProfileComplete] = useState(0.65);
  const [verified, setVerified] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const toggleSection = (idx: number) => {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, open: !s.open } : s))
    );
  };

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="container space-y-6">
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Link to="/" className="hover:text-brand-600 transition-colors">首页</Link>
          <span>/</span>
          <Link to="/jobs" className="hover:text-brand-600 transition-colors">岗位广场</Link>
          <span>/</span>
          <span className="text-ink-800 font-medium">岗位详情</span>
        </div>
        {/* 顶部信息卡 */}
        <Card className="animate-fade-in-up overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-brand-500 via-brand-400 to-teal-500" />
          <CardContent className="pt-8">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex items-start gap-5 min-w-0 flex-1">
                <div className="w-20 h-20 rounded-2xl bg-sky-100 flex items-center justify-center font-bold text-4xl shadow-lg shrink-0">
                  字
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-bold text-ink-900 font-display tracking-tight">
                      前端开发实习生
                    </h1>
                    <Badge variant="danger" dot>急招中</Badge>
                    <Badge variant="verified" size="sm"><ShieldCheck size={12} /> 官方认证</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-ink-600 flex-wrap">
                    <span className="font-semibold text-lg text-ink-800">字节跳动</span>
                    <Badge variant="senior" size="xs">大厂</Badge>
                    <span className="flex items-center gap-1 text-sm"><MapPin size={15} className="text-sky-500" /> 北京·海淀区·知春路</span>
                    <span className="flex items-center gap-1 text-sm"><Clock size={15} className="text-amber-500" /> 4天/周·3个月</span>
                  </div>
                  <div className="flex items-center gap-5 mt-4 flex-wrap">
                    <div className="text-3xl font-bold text-brand-600 font-num">
                      200-300<span className="text-lg font-medium text-ink-500 ml-1">元/天</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 border border-teal-100">
                      <TrendingUp size={18} className="text-teal-600" />
                      <span className="text-sm text-ink-600">转正率</span>
                      <span className="text-lg font-bold text-teal-700 font-num">86%</span>
                    </div>
                    <Tag variant="brand">抖音电商</Tag>
                    <Tag variant="teal">技术线</Tag>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setLiked(!liked)}
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                    liked
                      ? 'bg-brand-50 border-brand-200 text-brand-500'
                      : 'border-ink-200 text-ink-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50'
                  }`}
                >
                  <Heart size={22} fill={liked ? 'currentColor' : 'none'} />
                </button>
                <button className="w-12 h-12 rounded-2xl border border-ink-200 flex items-center justify-center text-ink-400 hover:border-teal-300 hover:text-teal-500 hover:bg-teal-50 transition-all">
                  <Share2 size={22} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 主体两栏布局 */}
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* JD 正文 */}
            <Card className="animate-fade-in-up" style={{ animationDelay: '60ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} className="text-brand-500" />
                  岗位详情
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sections.map((section, i) => (
                  <div
                    key={section.title}
                    className="border border-ink-100 rounded-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleSection(i)}
                      className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-ink-50/50 to-transparent hover:from-ink-50 transition-colors"
                    >
                      <span className="font-semibold text-ink-800 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-sm font-bold font-num">
                          {i + 1}
                        </span>
                        {section.title}
                      </span>
                      {section.open ? (
                        <ChevronUp size={20} className="text-ink-400" />
                      ) : (
                        <ChevronDown size={20} className="text-ink-400" />
                      )}
                    </button>
                    {section.open && (
                      <div className="px-5 pb-5 pt-2 animate-fade-in">
                        <ul className="space-y-3">
                          {section.content.map((item, j) => (
                            <li key={j} className="flex gap-3 text-ink-600 leading-relaxed">
                              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                              <span className="flex-1">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 福利亮点 */}
            <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift size={20} className="text-amber-500" />
                  福利亮点
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {welfareHighlights.map((w) => (
                    <div
                      key={w.label}
                      className="p-4 rounded-2xl border border-ink-100 hover:border-brand-200 hover:shadow-soft transition-all group cursor-default"
                    >
                      <div className={`w-11 h-11 rounded-xl ${w.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <w.icon size={22} className={w.color} />
                      </div>
                      <div className="font-semibold text-ink-800 mb-0.5">{w.label}</div>
                      <div className="text-sm text-ink-500">{w.desc}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 实习说明 + 转正机会 */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="animate-fade-in-up" style={{ animationDelay: '140ms' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar size={20} className="text-sky-500" />
                    实习说明
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-ink-600">
                  <div className="flex justify-between py-2 border-b border-ink-50">
                    <span className="text-ink-500">实习周期</span>
                    <span className="font-medium">3-6个月</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-ink-50">
                    <span className="text-ink-500">到岗要求</span>
                    <span className="font-medium">每周4天以上</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-ink-50">
                    <span className="text-ink-500">工作时间</span>
                    <span className="font-medium">10:00 - 19:00</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-ink-500">面试形式</span>
                    <span className="font-medium">3轮技术+1轮HR</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="animate-fade-in-up border-teal-200/60 bg-gradient-to-br from-teal-50/40 to-transparent" style={{ animationDelay: '180ms' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <GraduationCap size={20} className="text-teal-600" />
                    转正机会
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-bold text-teal-600 font-num leading-none">86</span>
                    <span className="text-2xl text-teal-600 font-bold mb-1">%</span>
                    <span className="text-sm text-ink-500 mb-1.5 ml-2">实习生转正率</span>
                  </div>
                  <div className="h-2.5 bg-teal-100 rounded-full overflow-hidden">
                    <div className="h-full w-[86%] bg-teal-gradient rounded-full" />
                  </div>
                  <ul className="space-y-2 text-sm text-ink-600 pt-1">
                    <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-teal-500" /> 表现优异直接获得校招offer</li>
                    <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-teal-500" /> 转正后薪资上浮15-25%</li>
                    <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-teal-500" /> 免笔试直通终面通道</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 右侧边栏 */}
          <div className="lg:col-span-4 space-y-5">
            {/* 企业资质信息卡 */}
            <Card className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 size={20} className="text-brand-500" />
                  企业资质
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-ink-50 cursor-pointer hover:bg-ink-100/70 transition-colors" onClick={() => navigate('/company/1')}>
                  <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-ink-200 to-ink-300 flex items-center justify-center shrink-0 overflow-hidden">
                    <FileText size={28} className="text-ink-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-ink-800">营业执照</div>
                    <div className="text-xs text-ink-500">统一社会信用代码已核验</div>
                    <Badge variant="verified" size="xs" dot>
                      <ShieldCheck size={10} /> 平台已审核
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-cream-100">
                    <div className="text-xs text-ink-500 mb-1">成立时间</div>
                    <div className="font-semibold text-ink-800">2012年</div>
                  </div>
                  <div className="p-3 rounded-xl bg-cream-100">
                    <div className="text-xs text-ink-500 mb-1">企业规模</div>
                    <div className="font-semibold text-ink-800">10万人以上</div>
                  </div>
                  <div className="p-3 rounded-xl bg-cream-100">
                    <div className="text-xs text-ink-500 mb-1">注册资本</div>
                    <div className="font-semibold text-ink-800">20亿人民币</div>
                  </div>
                  <div className="p-3 rounded-xl bg-cream-100">
                    <div className="text-xs text-ink-500 mb-1">公司类型</div>
                    <div className="font-semibold text-ink-800">互联网科技</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 带教人卡片 */}
            <Card className="animate-fade-in-up border-gradient-to-r from-brand-100 to-teal-100" style={{ animationDelay: '120ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User size={20} className="text-teal-500" />
                  你的带教人
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-teal-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    张
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-ink-900">张明</span>
                      <Badge variant="senior" size="xs">资深带教</Badge>
                    </div>
                    <div className="text-sm text-ink-600 mt-1">高级前端工程师</div>
                    <div className="text-xs text-ink-400 mt-0.5">抖音电商 · 基础架构组</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center py-3 border-y border-ink-100">
                  <div>
                    <div className="text-xl font-bold text-brand-600 font-num">58</div>
                    <div className="text-xs text-ink-500">带教人数</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-teal-600 font-num">92%</div>
                    <div className="text-xs text-ink-500">好评率</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-amber-600 font-num">41</div>
                    <div className="text-xs text-ink-500">成功转正</div>
                  </div>
                </div>
                <Button variant="ghost" className="w-full mt-3 justify-start text-ink-600">
                  <MessageCircle size={16} className="mr-2" />
                  向带教人提问
                </Button>
              </CardContent>
            </Card>

            {/* 实习协议 + 投递按钮 */}
            <Card className="animate-fade-in-up" style={{ animationDelay: '160ms' }}>
              <CardContent className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 rounded-2xl border border-ink-100 hover:border-brand-300 hover:bg-brand-50/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <FileText size={20} className="text-amber-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-ink-800 text-sm">实习协议预览</div>
                      <div className="text-xs text-ink-500">三方协议/保密协议模板</div>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-ink-300 group-hover:text-brand-500 transition-colors" />
                </button>

                <Button
                  size="lg"
                  className="w-full"
                  variant={applied ? 'outline' : 'primary'}
                  leftIcon={<Briefcase size={18} />}
                  onClick={() => {
                    if (applied) {
                      navigate('/me/applications');
                    } else if (!verified || profileComplete < 0.8) {
                      setShowGuideModal(true);
                    } else {
                      setApplied(true);
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 5000);
                    }
                  }}
                >
                  {applied ? '已投递 ✓' : '立即投递简历'}
                </Button>
                <Button size="lg" variant="secondary" className="w-full" leftIcon={<Users size={18} />} onClick={() => navigate('/referral')}>
                  找人内推 · 通过率+40%
                </Button>
                <p className="text-xs text-center text-ink-400 pt-1">
                  投递即视为同意《用户服务协议》和《隐私政策》
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 相似岗位推荐 */}
        <section className="pt-6 animate-fade-in-up" style={{ animationDelay: '220ms' }}>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold text-ink-900 font-display">相似岗位推荐</h2>
              <p className="text-ink-500 mt-1 text-sm">和你查看这个岗位的同学，还投了这些</p>
            </div>
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={16} />}>更多</Button>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
            {similarJobs.map((job) => (
              <Card key={job.id} hoverable className="shrink-0 w-[280px] snap-start">
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${job.logoBg} flex items-center justify-center font-bold text-xl`}>
                      {job.logoText}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-ink-900 truncate">{job.title}</div>
                      <div className="text-xs text-ink-500">{job.company} · {job.city}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="salary">💰 {job.salary}</Badge>
                    <Badge variant="success">转正 {job.rate}%</Badge>
                  </div>
                  <Button variant="outline" className="w-full mt-1" size="sm" onClick={() => navigate('/jobs/' + job.id)}>查看详情</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* 投递引导Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={() => setShowGuideModal(false)} />
          <div className="relative w-full max-w-md animate-fade-in-up">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-amber-400 via-brand-400 to-teal-400" />
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-100 to-brand-100 flex items-center justify-center">
                    <ShieldCheck size={32} className="text-brand-600" />
                  </div>
                  <h3 className="text-xl font-bold text-ink-900">投递前请完善你的求职准备</h3>
                  <p className="text-sm text-ink-500 mt-2">完成以下两项，解锁更多优质岗位</p>
                </div>

                <div className="space-y-4">
                  {/* Step1 学籍验证 */}
                  <div className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-400 text-white font-bold flex items-center justify-center text-sm shrink-0">1</div>
                        <div>
                          <div className="font-semibold text-ink-800 flex items-center gap-2">
                            <GraduationCap size={16} className="text-amber-500" />
                            学籍验证
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-700 font-medium">未完成</span>
                          </div>
                          <p className="text-xs text-ink-500 mt-1">完成学籍认证，获得专属内推通道</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => { setShowGuideModal(false); navigate('/student/profile'); }}
                    >
                      立即验证
                    </Button>
                  </div>

                  {/* Step2 档案完整度 */}
                  <div className="p-4 rounded-2xl border border-ink-200 bg-cream-50/50">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-brand-500 text-white font-bold flex items-center justify-center text-sm shrink-0">2</div>
                      <div className="flex-1">
                        <div className="font-semibold text-ink-800 mb-3">档案完整度</div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1 h-3 bg-ink-100 rounded-full overflow-hidden">
                            <div className="h-full w-[65%] bg-gradient-to-r from-brand-400 to-teal-400 rounded-full" />
                          </div>
                          <span className="text-lg font-bold text-brand-600 font-num">65%</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-amber-600">
                            <Award size={14} />
                            <span>技能证书</span>
                            <span className="text-ink-400">已上传 2 / 3 个</span>
                          </div>
                          <div className="flex items-center gap-2 text-amber-600">
                            <FolderKanban size={14} />
                            <span>实训项目</span>
                            <span className="text-ink-400">需补充 1 个</span>
                          </div>
                          <div className="flex items-center gap-2 text-amber-600">
                            <Edit3 size={14} />
                            <span>自我描述</span>
                            <span className="text-ink-400">建议 150 字+</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => { setShowGuideModal(false); navigate('/student/profile'); }}
                    >
                      完善档案
                    </Button>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button variant="ghost" className="flex-1" onClick={() => setShowGuideModal(false)}>
                    稍后再说
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => {
                      setShowGuideModal(false);
                      if (verified && profileComplete >= 0.8) {
                        setApplied(true);
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 5000);
                      }
                    }}
                  >
                    我已完善，重新投递
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 投递成功Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-ink-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 max-w-md">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">投递成功！</div>
              <div className="text-xs text-ink-300 mt-0.5">HR 将在 1-3 个工作日内查看</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 border-white/20 shrink-0"
              onClick={() => navigate('/me/applications')}
            >
              查看投递进度
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
