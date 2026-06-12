import {
  MapPin,
  Building2,
  Users,
  Banknote,
  ShieldCheck,
  TrendingUp,
  Briefcase,
  Clock,
  Star,
  ThumbsUp,
  MessageCircle,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tag from '@/components/ui/Tag';

const radarData = [
  { subject: '薪资待遇', value: 92, fullMark: 100 },
  { subject: '工作环境', value: 95, fullMark: 100 },
  { subject: '转正机会', value: 88, fullMark: 100 },
  { subject: '成长空间', value: 90, fullMark: 100 },
  { subject: '团队文化', value: 89, fullMark: 100 },
];

const salaryDistribution = [
  { range: '100-150', count: 128, label: '100-150/天' },
  { range: '150-200', count: 456, label: '150-200/天' },
  { range: '200-250', count: 892, label: '200-250/天' },
  { range: '250-300', count: 1024, label: '250-300/天' },
  { range: '300-350', count: 567, label: '300-350/天' },
  { range: '350-400', count: 234, label: '350-400/天' },
  { range: '400+', count: 156, label: '400+/天' },
];

const scoreDetails = [
  { label: '薪资待遇', value: 92, desc: '行业TOP 5%，有竞争力的实习补贴', color: 'bg-brand-500', textColor: 'text-brand-600' },
  { label: '工作环境', value: 95, desc: '办公室舒适，设施完善，免费三餐下午茶', color: 'bg-teal-500', textColor: 'text-teal-600' },
  { label: '转正机会', value: 88, desc: '转正流程透明，表现优异可直接留用', color: 'bg-amber-500', textColor: 'text-amber-600' },
  { label: '成长空间', value: 90, desc: '大牛导师带队，体系化培训成长快', color: 'bg-sky-500', textColor: 'text-sky-600' },
  { label: '团队文化', value: 89, desc: '氛围融洽，扁平管理，同事素质高', color: 'bg-rose-500', textColor: 'text-rose-600' },
];

const reviews = [
  {
    id: 1,
    role: '前端开发实习生',
    department: '抖音电商',
    duration: '实习5个月',
    date: '2026-05-20',
    rating: 5,
    content: '整体体验非常好！导师特别耐心，会一步步带你熟悉代码库和业务流程。虽然任务压力不小，但成长也很快。弹性工作制很香，晚上加班也有打车报销和宵夜。最满意的是下午茶真的很丰富哈哈哈～',
    tags: ['导师靠谱', '成长快', '福利好'],
    likes: 128,
    anonymous: false,
    initial: '李',
  },
  {
    id: 2,
    role: '产品经理实习生',
    department: '用户增长',
    duration: '实习3个月',
    date: '2026-05-10',
    rating: 4,
    content: '节奏很快，基本是6116的节奏，但能接触到核心业务，做的事情有影响力。同事大多是清北复交+海外名校，整体素质非常高。转正竞争激烈，需要足够亮眼的产出才行。',
    tags: ['业务核心', '同事优秀', '强度大'],
    likes: 96,
    anonymous: true,
    initial: '匿',
  },
  {
    id: 3,
    role: '算法实习生',
    department: '推荐算法',
    duration: '实习6个月',
    date: '2026-04-28',
    rating: 5,
    content: '算法氛围浓厚，组里有很多顶会论文大佬，每周都有paper reading分享。实验资源充足，T100显卡随便用。最大的收获是跟着带教一起发了一篇workshop论文，对申请phd帮助很大！',
    tags: ['技术强', '学术氛围', '资源充足'],
    likes: 210,
    anonymous: false,
    initial: '王',
  },
  {
    id: 4,
    role: '运营实习生',
    department: '市场运营',
    duration: '实习4个月',
    date: '2026-04-15',
    rating: 4,
    content: '运营工作比较细碎，但能看到数据反馈，知道自己做的事情有没有用。团队氛围不错，同事都很nice，遇到问题愿意帮你。不足是实习生话语权有限，很多事情是执行层面。',
    tags: ['数据驱动', '氛围好', '执行多'],
    likes: 67,
    anonymous: false,
    initial: '张',
  },
  {
    id: 5,
    role: 'UI设计师实习生',
    department: '设计中心',
    duration: '实习5个月',
    date: '2026-03-30',
    rating: 5,
    content: '设计体系非常完善，有成熟的design system和方法论。能学到大公司规范的设计流程，对新人成长帮助很大。有设计评审环节，可以和资深设计师交流，进步肉眼可见。',
    tags: ['体系完善', '设计评审', '成长大'],
    likes: 145,
    anonymous: true,
    initial: '匿',
  },
  {
    id: 6,
    role: 'Java开发实习生',
    department: '基础架构',
    duration: '实习6个月',
    date: '2026-03-18',
    rating: 4,
    content: '技术栈比较新，用的都是业界主流的技术框架。Code review比较严格，从中学到很多。遗憾的是转正hc有限，最后没能留下，但这段经历还是帮我拿到了其他大厂offer。',
    tags: ['技术新', 'CR严格', '转正难'],
    likes: 88,
    anonymous: false,
    initial: '陈',
  },
];

const openPositions = [
  { id: 1, title: '前端开发实习生', dept: '抖音电商', city: '北京', salary: '200-300/天', rate: 86, logoBg: 'bg-sky-100', logoText: '字' },
  { id: 2, title: '后端开发实习生', dept: '基础架构', city: '北京', salary: '220-320/天', rate: 82, logoBg: 'bg-sky-100', logoText: '字' },
  { id: 3, title: '算法实习生-推荐', dept: '推荐团队', city: '北京/上海', salary: '300-500/天', rate: 78, logoBg: 'bg-sky-100', logoText: '字' },
  { id: 4, title: '产品经理实习生', dept: '国际化', city: '上海', salary: '250-350/天', rate: 80, logoBg: 'bg-sky-100', logoText: '字' },
];

function ScoreItem({ label, value, color, textColor, desc }: { label: string; value: number; color: string; textColor: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-ink-50 transition-colors">
      <div className="relative w-12 h-12 shrink-0">
        <svg className="w-full h-full -rotate-90">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#ECEAF3" strokeWidth="4" />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            className={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 125.6} 125.6`}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-bold text-sm font-num ${textColor}`}>
          {value}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-ink-800 text-sm mb-0.5">{label}</div>
        <div className="text-xs text-ink-500 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

function ReviewCard({ r }: { r: typeof reviews[0] }) {
  return (
    <div className="relative pl-6 pb-6 last:pb-0 animate-fade-in-up">
      <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-gradient-to-br from-brand-500 to-teal-500 ring-4 ring-cream-50" />
      {r !== reviews[reviews.length - 1] && (
        <div className="absolute left-[5px] top-5 bottom-0 w-px bg-gradient-to-b from-brand-200 to-teal-200" />
      )}
      <div className="bg-white rounded-2xl p-5 shadow-soft border border-ink-100 ml-3">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
              r.anonymous ? 'bg-ink-200 text-ink-600' : 'bg-gradient-to-br from-brand-400 to-teal-400 text-white'
            }`}>
              {r.initial}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-ink-800 text-sm">
                  {r.anonymous ? '匿名实习生' : `${r.initial}同学`}
                </span>
                <Badge variant="verified" size="xs">已核实</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-500 mt-0.5 flex-wrap">
                <span>{r.role}</span>
                <span>·</span>
                <span>{r.department}</span>
                <span>·</span>
                <span>{r.duration}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={16}
                className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-ink-200'}
              />
            ))}
          </div>
        </div>
        <p className="text-sm text-ink-600 leading-relaxed mb-3">{r.content}</p>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex flex-wrap gap-2">
            {r.tags.map((t) => (
              <Tag key={t} variant="teal" size="xs">
                {t}
              </Tag>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-ink-400">
            <span>{r.date}</span>
            <button className="flex items-center gap-1 hover:text-brand-500 transition-colors">
              <ThumbsUp size={14} /> {r.likes}
            </button>
            <button className="flex items-center gap-1 hover:text-teal-500 transition-colors">
              <MessageCircle size={14} /> 回复
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompanyDetailPage() {
  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="container space-y-6">
        {/* 顶部企业信息Banner */}
        <Card className="animate-fade-in-up overflow-hidden border-0">
          <div className="relative h-40 bg-gradient-to-r from-brand-500 via-brand-400 to-teal-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_85%_30%,rgba(255,255,255,0.12),transparent_40%)]" />
            <div className="absolute bottom-4 right-6 flex items-center gap-2">
              <Badge variant="success" className="bg-white/90 backdrop-blur"><ShieldCheck size={12} /> 官方认证企业</Badge>
            </div>
          </div>
          <CardContent className="-mt-14 relative">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div className="flex items-end gap-5 flex-wrap">
                <div className="w-28 h-28 rounded-3xl bg-white shadow-card border-4 border-white flex items-center justify-center font-bold text-5xl shrink-0">
                  <span className="bg-brand-gradient bg-clip-text text-transparent">腾</span>
                </div>
                <div className="pb-2">
                  <h1 className="text-3xl font-bold text-ink-900 font-display tracking-tight flex items-center gap-3 flex-wrap">
                    腾讯科技
                    <Badge variant="senior" size="sm">互联网大厂</Badge>
                  </h1>
                  <div className="flex items-center gap-4 mt-2 text-ink-600 flex-wrap">
                    <span className="flex items-center gap-1.5"><Building2 size={16} className="text-brand-500" /> 互联网/科技/游戏</span>
                    <span className="flex items-center gap-1.5"><Users size={16} className="text-teal-500" /> 10万人以上规模</span>
                    <span className="flex items-center gap-1.5"><MapPin size={16} className="text-sky-500" /> 深圳·南山·总部</span>
                    <span className="flex items-center gap-1.5 text-amber-600 font-semibold font-num">
                      <TrendingUp size={16} /> 综合评分 91
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pb-2">
                <Button variant="outline" leftIcon={<Briefcase size={16} />}>在招岗位 · 128</Button>
                <Button leftIcon={<Star size={16} />}>关注企业</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 双栏主体 */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* 左栏 - 图表 */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* 六边形雷达图 */}
              <Card className="animate-fade-in-up" style={{ animationDelay: '60ms' }}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp size={20} className="text-brand-500" /> 综合能力雷达
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                        <PolarGrid stroke="#D3CFE1" strokeWidth={1} />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: '#524E6B', fontSize: 12, fontWeight: 500 }}
                          tickLine={false}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tick={false}
                          axisLine={false}
                        />
                        <RechartsRadar
                          dataKey="value"
                          stroke="#FF7A3D"
                          strokeWidth={3}
                          fill="url(#radarGradient)"
                          fillOpacity={0.6}
                        />
                        <defs>
                          <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#FF7A3D" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#2EC4B6" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 薪资区间柱状图 */}
              <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Banknote size={20} className="text-amber-500" /> 实习薪资分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salaryDistribution} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEAF3" />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: '#7C7894', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis tick={{ fill: '#7C7894', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: 'none',
                            boxShadow: '0 8px 32px -8px rgba(45,42,61,0.2)',
                            fontSize: 12,
                          }}
                          formatter={(value: number) => [`${value} 个岗位`, '数量']}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {salaryDistribution.map((_, i) => (
                            <Cell
                              key={i}
                              fill={i === 3 ? '#FF7A3D' : `hsl(${20 + i * 8}, 95%, ${62 - i * 2}%)`}
                              fillOpacity={i === 3 ? 1 : 0.6}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 评价时间轴 */}
            <Card className="animate-fade-in-up" style={{ animationDelay: '140ms' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle size={20} className="text-teal-500" />
                    实习生匿名评价
                    <Badge variant="success" size="xs" className="ml-2">{reviews.length * 478}条</Badge>
                  </CardTitle>
                  <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>查看全部</Button>
                </div>
              </CardHeader>
              <CardContent className="bg-cream-50/50 -mx-5 -mb-5 mx-0 rounded-b-card pt-0">
                <div className="pt-5">
                  {reviews.map((r) => (
                    <ReviewCard key={r.id} r={r} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右栏 - 数据摘要 + 评分明细 */}
          <div className="lg:col-span-5 space-y-5">
            {/* 数据摘要 */}
            <Card className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>
              <CardHeader>
                <CardTitle className="text-lg">数据摘要</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/50 border border-brand-100">
                    <div className="text-3xl font-bold text-brand-600 font-num mb-1">2,856</div>
                    <div className="text-xs text-ink-600">评价人数</div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-ink-400">
                      <Users size={12} /> 覆盖38个城市
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-100">
                    <div className="text-3xl font-bold text-teal-600 font-num mb-1">88.2%</div>
                    <div className="text-xs text-ink-600">愿意推荐率</div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-ink-400">
                      <ThumbsUp size={12} /> 行业TOP 3%
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-100">
                    <div className="text-3xl font-bold text-amber-600 font-num mb-1">¥272</div>
                    <div className="text-xs text-ink-600">日均薪资</div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-ink-400">
                      <Banknote size={12} /> 中位数水平
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100/50 border border-sky-100">
                    <div className="text-3xl font-bold text-sky-600 font-num mb-1">4.6月</div>
                    <div className="text-xs text-ink-600">平均实习时长</div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-ink-400">
                      <Clock size={12} /> 52%实习超半年
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 评分明细 */}
            <Card className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>
              <CardHeader>
                <CardTitle className="text-lg">5维度评分明细</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {scoreDetails.map((s) => (
                  <ScoreItem key={s.label} {...s} />
                ))}
              </CardContent>
            </Card>

            {/* 同类企业对比 */}
            <Card className="animate-fade-in-up" style={{ animationDelay: '160ms' }}>
              <CardHeader>
                <CardTitle className="text-lg">同类企业TOP5</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: '字节跳动', score: 90, rank: 2 },
                  { name: '阿里巴巴', score: 89, rank: 3 },
                  { name: '网易互娱', score: 87, rank: 4 },
                  { name: '美团点评', score: 84, rank: 5 },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-ink-50 cursor-pointer transition-colors group">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold font-num ${
                      c.rank === 2 ? 'bg-slate-200 text-slate-700' :
                      c.rank === 3 ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-ink-500'
                    }`}>
                      {c.rank}
                    </span>
                    <span className="font-medium text-ink-800 flex-1">{c.name}</span>
                    <span className="font-bold text-ink-900 font-num">{c.score}</span>
                    <ChevronRight size={16} className="text-ink-300 group-hover:text-brand-500 transition-colors" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 底部在招岗位 */}
        <section className="pt-4 pb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Card>
            <CardHeader>
              <div className="flex items-end justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Briefcase size={22} className="text-brand-500" />
                    该企业在招岗位
                    <Badge variant="brand" size="sm">128个</Badge>
                  </CardTitle>
                  <p className="text-ink-500 text-sm mt-1">高薪好岗位，快速投递拿offer</p>
                </div>
                <Button variant="ghost" rightIcon={<ArrowRight size={16} />}>查看全部岗位</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {openPositions.map((job) => (
                  <Card key={job.id} hoverable className="overflow-hidden">
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl ${job.logoBg} flex items-center justify-center font-bold text-lg`}>
                          {job.logoText}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-ink-900 truncate text-sm">{job.title}</div>
                          <div className="text-xs text-ink-500 truncate">{job.dept}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="salary" size="xs">💰 {job.salary}</Badge>
                        <Badge variant="city" size="xs"><MapPin size={10} /> {job.city}</Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-ink-100">
                        <div className="text-xs">
                          <span className="text-ink-500">转正 </span>
                          <span className="font-bold text-teal-600 font-num">{job.rate}%</span>
                        </div>
                        <Button size="xs" variant="secondary">立即投</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
