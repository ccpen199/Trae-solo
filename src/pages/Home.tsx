import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Building2,
  Search,
  FileText,
  MessageCircle,
  UserCheck,
  Radar,
  Wrench,
  MapPin,
  TrendingUp,
  Trophy,
  Award,
  Medal,
  Star,
  ChevronRight,
  Heart,
  Share2,
  Flame,
  ArrowRight,
  Sparkles,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tag from '@/components/ui/Tag';

const heroStats = [
  { label: '在招岗位', value: '12,800+', icon: Briefcase, color: 'text-brand-500', bg: 'bg-brand-50' },
  { label: '注册学生', value: '35,000+', icon: Users, color: 'text-teal-500', bg: 'bg-teal-50' },
  { label: '入驻企业', value: '2,100+', icon: Building2, color: 'text-amber-500', bg: 'bg-amber-50' },
];

const quickEntries = [
  { title: '找岗位', desc: '海量精选实习', icon: Search, variant: 'brand' as const, gradient: 'from-brand-400 to-brand-500', path: '/jobs' },
  { title: '建档案', desc: '智能简历生成', icon: FileText, variant: 'teal' as const, gradient: 'from-teal-400 to-teal-500', path: '/student/profile' },
  { title: '互助社区', desc: '学长经验分享', icon: MessageCircle, variant: 'amber' as const, gradient: 'from-amber-400 to-orange-500', path: '/community' },
  { title: '真人内推', desc: '直通面试机会', icon: UserCheck, variant: 'sky' as const, gradient: 'from-sky-400 to-sky-500', path: '/referral' },
  { title: '公司雷达', desc: '企业真实评价', icon: Radar, variant: 'rose' as const, gradient: 'from-rose-400 to-pink-500', path: '/radar' },
  { title: '成长工具箱', desc: '面试备考助手', icon: Wrench, variant: 'ink' as const, gradient: 'from-ink-500 to-ink-600', path: '/tools' },
];

const hotJobs = [
  { id: 1, title: '前端开发实习生', company: '字节跳动', city: '北京', salary: '200-300/天', convertRate: 86, verified: true, logoBg: 'bg-sky-100', logoText: '字' },
  { id: 2, title: '产品经理实习生', company: '腾讯科技', city: '深圳', salary: '250-350/天', convertRate: 82, verified: true, logoBg: 'bg-teal-100', logoText: '腾' },
  { id: 3, title: '算法实习生', company: '阿里巴巴', city: '杭州', salary: '300-500/天', convertRate: 78, verified: true, logoBg: 'bg-orange-100', logoText: '阿' },
  { id: 4, title: 'Java后端实习生', company: '美团点评', city: '北京', salary: '220-320/天', convertRate: 75, verified: true, logoBg: 'bg-yellow-100', logoText: '美' },
  { id: 5, title: 'UI设计师实习生', company: '网易互娱', city: '广州', salary: '180-280/天', convertRate: 80, verified: true, logoBg: 'bg-red-100', logoText: '网' },
  { id: 6, title: '数据分析实习生', company: '京东集团', city: '北京', salary: '200-300/天', convertRate: 72, verified: true, logoBg: 'bg-rose-100', logoText: '京' },
  { id: 7, title: '运营实习生', company: '小红书', city: '上海', salary: '160-240/天', convertRate: 88, verified: true, logoBg: 'bg-pink-100', logoText: '红' },
  { id: 8, title: '市场推广实习生', company: '小米科技', city: '北京', salary: '150-220/天', convertRate: 70, verified: true, logoBg: 'bg-amber-100', logoText: '小' },
];

const radarTopList = [
  { rank: 1, name: '腾讯科技', industry: '互联网/游戏', feedback: 2856, salary: 92, env: 95, convert: 88, growth: 90 },
  { rank: 2, name: '字节跳动', industry: '互联网/科技', feedback: 2341, salary: 95, env: 88, convert: 82, growth: 93 },
  { rank: 3, name: '阿里巴巴', industry: '电商/科技', feedback: 2189, salary: 90, env: 90, convert: 85, growth: 89 },
  { rank: 4, name: '美团点评', industry: '本地生活', feedback: 1876, salary: 85, env: 82, convert: 80, growth: 86 },
  { rank: 5, name: '网易互娱', industry: '游戏/娱乐', feedback: 1543, salary: 88, env: 92, convert: 83, growth: 84 },
];

const communityHot = [
  { id: 1, title: '大三零基础如何准备互联网暑期实习？', answers: 128, views: 12500, tag: '求职经验', author: '匿名用户', preview: '首先要明确方向，前端/后端/产品/设计选择一个赛道深入...', isSenior: false },
  { id: 2, title: '字节跳动HR面经分享，已OC！', answers: 89, views: 8900, tag: '面经分享', author: '李学长·已入职', preview: '三面技术+HR面，重点考察项目深度和思考方式，建议准备2-3个深挖项目...', isSenior: true },
  { id: 3, title: '实习三个月要不要跑路？感觉学不到东西', answers: 256, views: 23400, tag: '职场困惑', author: '匿名用户', preview: '先分析是自己没主动找活还是真的没内容，如果是后者建议早做打算...', isSenior: false },
  { id: 4, title: '双非本科进大厂的真实路径分享', answers: 167, views: 18700, tag: '逆袭经验', author: '王学姐·鹅厂PM', preview: '没有学历优势就要在项目和实习经历上下功夫，大一就要开始准备...', isSenior: true },
];

const tagVariantMap = {
  brand: 'brand' as const,
  teal: 'teal' as const,
  amber: 'amber' as const,
  sky: 'sky' as const,
  rose: 'rose' as const,
  ink: 'ink' as const,
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-ink-500">{label}</span>
        <span className="font-semibold text-ink-700 font-num">{value}</span>
      </div>
      <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const styles = {
    1: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-200',
    2: 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-lg shadow-slate-200',
    3: 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-100',
  } as Record<number, string>;
  const icons = { 1: Trophy, 2: Award, 3: Medal } as Record<number, typeof Trophy>;
  const Icon = icons[rank];
  if (rank <= 3 && Icon) {
    return (
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${styles[rank]}`}>
        <Icon size={18} />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-ink-100 flex items-center justify-center text-ink-500 font-bold font-num">
      {rank}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="container pt-16 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <Badge variant="brand" dot>
                <Sparkles size={12} /> 2026暑期实习招聘季进行中
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold text-ink-900 leading-[1.1] tracking-tight font-display">
                找对<span className="bg-brand-gradient bg-clip-text text-transparent">第一份</span>
                <br />
                实习，<span className="bg-teal-gradient bg-clip-text text-transparent">少走</span>弯路
              </h1>
              <p className="text-lg text-ink-500 max-w-lg leading-relaxed">
                专注大学生实习求职的一站式平台，汇聚12800+名企岗位，35000+学长学姐经验分享，
                助你精准匹配优质offer。
              </p>
              <div className="grid grid-cols-3 gap-6 max-w-md">
                {heroStats.map((s) => (
                  <div key={s.label} className="space-y-2">
                    <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                      <s.icon size={22} className={s.color} />
                    </div>
                    <div className="text-2xl font-bold text-ink-900 font-num">{s.value}</div>
                    <div className="text-xs text-ink-500">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-2">
                <Button size="lg" leftIcon={<Search size={18} />} onClick={() => navigate('/jobs')}>
                  立即找岗位
                </Button>
                <Button size="lg" variant="outline" rightIcon={<ChevronRight size={18} />} onClick={() => navigate('/community')}>
                  了解平台
                </Button>
              </div>
            </div>
            <div className="relative lg:h-[520px] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/20 via-transparent to-teal-400/20 rounded-[40px]" />
              <div className="absolute top-12 left-8 w-64 h-64 rounded-3xl bg-brand-gradient opacity-90 animate-float shadow-2xl" />
              <div className="absolute bottom-16 right-12 w-48 h-48 rounded-3xl bg-teal-gradient opacity-90 animate-float shadow-2xl" style={{ animationDelay: '1s' }} />
              <div className="absolute top-32 right-20 w-32 h-32 rounded-2xl bg-amber-400 opacity-80 animate-float" style={{ animationDelay: '2s' }} />
              <div className="absolute bottom-32 left-16 bg-white rounded-2xl shadow-card p-4 animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                    <ShieldCheck size={24} className="text-teal-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-ink-900 text-sm">官方认证</div>
                    <div className="text-xs text-ink-500">企业资质已审核</div>
                  </div>
                </div>
              </div>
              <div className="absolute top-56 left-48 bg-white rounded-2xl shadow-card p-4 animate-float" style={{ animationDelay: '1.5s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                    <GraduationCap size={24} className="text-brand-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-ink-900 text-sm">内推直通</div>
                    <div className="text-xs text-ink-500">学长学姐帮忙递简历</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Entries */}
      <section className="container -mt-12 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickEntries.map((entry, i) => (
            <Card
              key={entry.title}
              hoverable
              className="animate-fade-in-up p-5 flex flex-col items-center text-center cursor-pointer"
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => navigate(entry.path)}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${entry.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                <entry.icon size={26} className="text-white" />
              </div>
              <div className="font-semibold text-ink-900 mb-1">{entry.title}</div>
              <div className="text-xs text-ink-500">{entry.desc}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Hot Jobs */}
      <section className="container pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="brand"><Flame size={12} /> 本周热门</Badge>
            </div>
            <h2 className="text-3xl font-bold text-ink-900 font-display tracking-tight">热门岗位推荐</h2>
            <p className="text-ink-500 mt-2">高转正率·HR实时在线·简历快速反馈</p>
          </div>
          <Button variant="ghost" rightIcon={<ArrowRight size={16} />} onClick={() => navigate('/jobs')}>查看全部</Button>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
          {hotJobs.map((job, i) => (
            <Card
              key={job.id}
              hoverable
              className="shrink-0 w-[300px] snap-start animate-fade-in-up cursor-pointer"
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => navigate('/jobs/' + job.id)}
            >
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${job.logoBg} flex items-center justify-center font-bold text-xl`}>
                      {job.logoText}
                    </div>
                    <div>
                      <div className="font-bold text-ink-900">{job.company}</div>
                      <div className="flex items-center gap-1.5 text-xs text-ink-500 mt-0.5">
                        <MapPin size={12} /> {job.city}
                      </div>
                    </div>
                  </div>
                  <button className="w-9 h-9 rounded-xl bg-ink-50 flex items-center justify-center text-ink-400 hover:text-brand-500 hover:bg-brand-50 transition-colors">
                    <Heart size={18} />
                  </button>
                </div>
                <div>
                  <h3 className="font-semibold text-ink-900 mb-2">{job.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="salary">💰 {job.salary}</Badge>
                    {job.verified && <Badge variant="verified"><ShieldCheck size={12} /> 认证企业</Badge>}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                    <div className="text-sm">
                      <span className="text-ink-500">转正率 </span>
                      <span className="font-bold text-teal-600 font-num">{job.convertRate}%</span>
                    </div>
                    <Button size="sm" variant="secondary" onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate('/jobs/' + job.id); }}>立即投递</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Radar Top */}
      <section className="bg-gradient-to-b from-transparent via-cream-100/50 to-transparent py-20">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="success"><TrendingUp size={12} /> 基于真实评价</Badge>
              </div>
              <h2 className="text-3xl font-bold text-ink-900 font-display tracking-tight">公司雷达 · TOP榜</h2>
              <p className="text-ink-500 mt-2">基于万名实习生匿名反馈数据生成</p>
            </div>
            <Button variant="ghost" rightIcon={<ArrowRight size={16} />} onClick={() => navigate('/radar')}>完整榜单</Button>
          </div>
          <div className="space-y-4">
            {radarTopList.map((c, i) => (
              <Card
                key={c.name}
                hoverable
                className="animate-fade-in-up cursor-pointer"
                style={{ animationDelay: `${i * 80}ms` }}
                onClick={() => navigate('/company/' + c.rank)}
              >
                <CardContent className="flex items-center gap-6">
                  <RankBadge rank={c.rank} />
                  <div className="min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-ink-900">{c.name}</h3>
                      <Badge variant="verified" size="xs"><ShieldCheck size={10} /> 认证</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-500 mt-1">
                      <span>{c.industry}</span>
                      <span>·</span>
                      <span className="font-num">{c.feedback.toLocaleString()} 条反馈</span>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-6">
                    <ScoreBar label="薪资待遇" value={c.salary} color="bg-brand-500" />
                    <ScoreBar label="工作环境" value={c.env} color="bg-teal-500" />
                    <ScoreBar label="转正机会" value={c.convert} color="bg-amber-500" />
                    <ScoreBar label="成长空间" value={c.growth} color="bg-sky-500" />
                  </div>
                  <ChevronRight size={20} className="text-ink-300" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Community Hot */}
      <section className="container py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="warn"><Star size={12} /> 高赞精选</Badge>
            </div>
            <h2 className="text-3xl font-bold text-ink-900 font-display tracking-tight">社区热榜</h2>
            <p className="text-ink-500 mt-2">来自真实学长学姐的经验分享</p>
          </div>
          <Button variant="ghost" rightIcon={<ArrowRight size={16} />} onClick={() => navigate('/community')}>进入社区</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {communityHot.map((q, i) => (
            <Card
              key={q.id}
              hoverable
              className="animate-fade-in-up cursor-pointer"
              style={{ animationDelay: `${i * 100}ms` }}
              onClick={() => navigate('/community/' + q.id)}
            >
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Tag variant={i % 2 === 0 ? 'brand' : 'teal'} size="xs">{q.tag}</Tag>
                  <span className="text-xs text-ink-400">· {q.views.toLocaleString()} 浏览</span>
                </div>
                <h3 className="font-semibold text-ink-900 text-lg leading-snug line-clamp-2">
                  {q.title}
                </h3>
                <p className="text-sm text-ink-500 leading-relaxed line-clamp-2">{q.preview}</p>
                <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${q.isSenior ? 'bg-teal-50 border border-teal-100' : 'bg-ink-50'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${q.isSenior ? 'bg-teal-500 text-white' : 'bg-ink-200 text-ink-600'}`}>
                      {q.isSenior ? q.author.charAt(0) : '匿'}
                    </div>
                    <span className={`text-sm font-medium ${q.isSenior ? 'text-teal-700' : 'text-ink-500'}`}>
                      {q.author}
                    </span>
                    {q.isSenior && <Badge variant="senior" size="xs">学长认证</Badge>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-ink-400">
                    <MessageCircle size={14} /> {q.answers} 回答
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="container pb-20">
        <Card className="bg-gradient-to-r from-brand-500 via-brand-400 to-teal-500 border-0 overflow-hidden">
          <CardContent className="py-14 px-8 md:px-14 flex flex-col md:flex-row items-center justify-between gap-8 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.15),transparent_50%),radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white font-display tracking-tight mb-3">
                现在就开始，找到你的心动实习💼
              </h2>
              <p className="text-white/85 text-base max-w-xl">
                完善简历一键投递，匹配度高的岗位主动找上你
              </p>
            </div>
            <div className="relative z-10 flex gap-3 shrink-0">
              <Button size="lg" className="bg-white text-brand-600 hover:bg-white/95 shadow-2xl" leftIcon={<Search size={18} />} onClick={() => navigate('/jobs')}>
                搜索岗位
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white/60 hover:bg-white/15 hover:border-white hover:text-white">
                <Share2 size={18} className="mr-2" />
                分享给同学
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
