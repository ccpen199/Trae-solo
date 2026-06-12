import { useState } from 'react';
import {
  LayoutDashboard,
  Send,
  Heart,
  GraduationCap,
  Bell,
  Settings,
  Edit3,
  ChevronRight,
  Briefcase,
  TrendingUp,
  Clock,
  MapPin,
  DollarSign,
  Star,
  Award,
  CheckCircle2,
  MessageCircle,
  FileText,
  Sparkles,
  Users,
  Target,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

type NavKey = 'overview' | 'applications' | 'favorites' | 'profile' | 'notifications' | 'settings';

const navItems: { key: NavKey; label: string; icon: any; badge?: number }[] = [
  { key: 'overview', label: '总览', icon: LayoutDashboard },
  { key: 'applications', label: '我的投递', icon: Send, badge: 3 },
  { key: 'favorites', label: '我的收藏', icon: Heart, badge: 12 },
  { key: 'profile', label: '成长档案', icon: GraduationCap },
  { key: 'notifications', label: '消息通知', icon: Bell, badge: 5 },
  { key: 'settings', label: '账号设置', icon: Settings },
];

const applicationStats = [
  { name: '初筛中', value: 8, color: '#38bdf8' },
  { name: '面试中', value: 5, color: '#FF7A3D' },
  { name: '已Offer', value: 2, color: '#2EC4B6' },
  { name: '待处理', value: 4, color: '#a78bfa' },
  { name: '已拒绝', value: 3, color: '#fca5a5' },
];

const activities = [
  { id: 1, icon: CheckCircle2, color: 'text-teal-500', bg: 'bg-teal-50', title: '字节跳动 · 初筛通过', time: '今天 15:32', desc: '恭喜！您的简历已通过HR初筛，等待面试安排' },
  { id: 2, icon: MessageCircle, color: 'text-brand-500', bg: 'bg-brand-50', title: '张学长 · 新消息', time: '今天 11:20', desc: '"明天下午的面试记得准备项目介绍，重点讲性能优化部分~"' },
  { id: 3, icon: FileText, color: 'text-violet-500', bg: 'bg-violet-50', title: 'AI简历优化完成', time: '昨天 21:08', desc: '简历匹配度从54%提升至92%，可投递字节前端岗位' },
  { id: 4, icon: Award, color: 'text-amber-500', bg: 'bg-amber-50', title: '获得「坚持达人」勋章', time: '昨天 09:00', desc: '连续打卡实习日志30天，解锁新成就！' },
  { id: 5, icon: Users, color: 'text-sky-500', bg: 'bg-sky-50', title: '分配专属服务官', time: '06-08 16:45', desc: '张学长（字节跳动前端）已成为您的专属服务官' },
];

const recommendJobs = [
  { id: 1, title: '前端开发实习生', company: '字节跳动', salary: '300-500/天', city: '北京', match: 96, logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bytedance%20logo%20icon%20minimal&image_size=square', tags: ['React', '急招'] },
  { id: 2, title: '全栈开发实习', company: '阿里巴巴', salary: '350-550/天', city: '杭州', match: 92, logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=alibaba%20logo%20icon%20minimal&image_size=square', tags: ['Node', '全栈'] },
  { id: 3, title: '产品经理实习生', company: '腾讯', salary: '300-450/天', city: '深圳', match: 88, logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tencent%20logo%20icon%20minimal&image_size=square', tags: ['B端', '数据分析'] },
];

export default function MePage() {
  const [activeNav, setActiveNav] = useState<NavKey>('overview');

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 p-2 animate-fade-in-up h-fit lg:sticky lg:top-4">
            <nav className="space-y-1 p-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveNav(item.key)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-float'
                        : 'text-ink-600 hover:bg-cream-100'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={18} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </span>
                    {item.badge && (
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isActive ? 'bg-white text-brand-600' : 'bg-brand-100 text-brand-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-3 mt-3">
              <Card className="bg-gradient-to-br from-violet-500 to-sky-500 border-0 text-white overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} />
                    <span className="text-xs font-medium opacity-90">升级 VIP</span>
                  </div>
                  <p className="text-xs opacity-90 mb-3 leading-relaxed">
                    无限AI优化 · 1v1导师辅导 · 专属内推
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs opacity-70 line-through">¥199</span>
                      <span className="text-2xl font-bold font-num ml-1">¥29</span>
                    </div>
                    <button className="bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                      升级
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            <Card className="animate-fade-in-up overflow-hidden" style={{ animationDelay: '0.05s' }}>
              <div className="relative h-32 bg-gradient-to-r from-brand-500 via-brand-400 to-teal-400">
                <div className="absolute inset-0 bg-hero-gradient opacity-50" />
              </div>
              <CardContent className="-mt-16 relative pt-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-2xl border-4 border-white shadow-card overflow-hidden bg-white">
                      <img
                        src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20young%20asian%20college%20student%20portrait%20photo%20friendly%20smile&image_size=square_hd"
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-2xl font-bold text-ink-900">李思远</h2>
                      <Badge variant="verified" dot>学籍已认证</Badge>
                      <Badge variant="brand">VIP会员</Badge>
                      <Badge variant="warn">🏆 Lv.7</Badge>
                    </div>
                    <p className="text-sm text-ink-500 mb-3">
                      浙江大学 · 计算机科学与技术 · 2022级 · GPA 3.8/4.0
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-ink-600">
                        <Target size={14} className="text-brand-500" />
                        求职意向：前端开发
                      </span>
                      <span className="flex items-center gap-1.5 text-ink-600">
                        <MapPin size={14} className="text-sky-500" />
                        期望城市：杭州/上海
                      </span>
                      <span className="flex items-center gap-1.5 text-ink-600">
                        <DollarSign size={14} className="text-teal-500" />
                        期望薪资：15K-25K
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 pb-2">
                    <Button variant="outline" size="sm">
                      <Edit3 size={14} />
                      编辑资料
                    </Button>
                    <Button variant="primary" size="sm">
                      <FileText size={14} />
                      预览简历
                    </Button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 border-t border-ink-100">
                  <OverviewStat icon={<Send size={16} />} label='累计投递' value='22' sub='本月+5' color='text-brand-600' bg='bg-brand-50' />
                  <OverviewStat icon={<CheckCircle2 size={16} />} label='已获面试' value='7' sub='本月+3' color='text-teal-600' bg='bg-teal-50' />
                  <OverviewStat icon={<Award size={16} />} label='已拿Offer' value='2' sub='阿里/腾讯' color='text-amber-600' bg='bg-amber-50' />
                  <OverviewStat icon={<TrendingUp size={16} />} label='成功率' value='38%' sub='+5%↑' color='text-violet-600' bg='bg-violet-50' />
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-5 gap-6">
              <Card className="md:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Briefcase className="text-brand-500" size={20} />
                    投递进度分布
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={applicationStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {applicationStats.map((entry, index) => (
                            <Cell key={index} fill={entry.color} stroke="white" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px -8px rgba(45,42,61,0.15)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {applicationStats.map((s) => (
                      <div key={s.name} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="text-ink-600 truncate">{s.name}</span>
                        <span className="font-bold font-num text-ink-800 ml-auto">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-3 animate-fade-in-up" style={{ animationDelay: '0.12s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-base">
                      <Clock className="text-teal-500" size={20} />
                      最近活动
                    </span>
                    <button className="text-xs text-brand-600 hover:underline flex items-center gap-0.5">
                      查看全部 <ChevronRight size={12} />
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="relative">
                    <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-brand-200 via-teal-200 to-sky-200" />
                    <div className="space-y-1">
                      {activities.map((act, idx) => {
                        const Icon = act.icon;
                        return (
                          <div key={act.id} className="relative flex gap-4 py-2.5 animate-fade-in-up" style={{ animationDelay: `${0.14 + idx * 0.05}s` }}>
                            <div className={`relative z-10 w-10 h-10 rounded-full ${act.bg} ${act.color} flex items-center justify-center border-2 border-white shadow-soft shrink-0`}>
                              <Icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <h5 className="text-sm font-semibold text-ink-800 truncate">{act.title}</h5>
                                <span className="text-[10px] text-ink-400 shrink-0">{act.time}</span>
                              </div>
                              <p className="text-xs text-ink-500 leading-relaxed line-clamp-2">{act.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Star className="text-amber-500" size={22} />
                    为你推荐的岗位
                    <Badge variant="brand" size="xs">高匹配度</Badge>
                  </span>
                  <button className="text-sm text-brand-600 hover:underline flex items-center gap-0.5">
                    查看更多 <ChevronRight size={14} />
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {recommendJobs.map((job, idx) => (
                    <Card key={job.id} hoverable className="animate-fade-in-up overflow-hidden cursor-pointer" style={{ animationDelay: `${0.42 + idx * 0.06}s` }}>
                      <div className={`h-1.5 bg-gradient-to-r ${idx === 0 ? 'from-brand-400 to-amber-400' : idx === 1 ? 'from-teal-400 to-sky-400' : 'from-violet-400 to-purple-400'}`} />
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <img src={job.logo} alt="" className="w-10 h-10 rounded-xl object-cover border border-ink-100" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-ink-900 truncate">{job.title}</h4>
                            <p className="text-xs text-ink-500 truncate">{job.company}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs mb-3">
                          <span className="flex items-center gap-1 font-bold text-brand-600 font-num">
                            <DollarSign size={12} />
                            {job.salary}
                          </span>
                          <span className="flex items-center gap-1 text-ink-500">
                            <MapPin size={12} />
                            {job.city}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {job.tags.map((t) => (
                            <Badge key={t} variant="info" size="xs">{t}</Badge>
                          ))}
                        </div>
                        <div className="pt-3 border-t border-ink-100 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp size={12} className="text-teal-500" />
                            <span className="text-xs text-ink-500">匹配度</span>
                            <span className="font-bold text-teal-600 font-num text-sm">{job.match}%</span>
                          </div>
                          <button className="text-xs text-brand-600 font-medium flex items-center gap-0.5 hover:underline">
                            立即投递 <ChevronRight size={12} />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewStat({ icon, label, value, sub, color, bg }: { icon: any; label: string; value: string; sub: string; color: string; bg: string }) {
  return (
    <div className={`p-3 rounded-xl ${bg}`}>
      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold font-num ${color}`}>{value}</p>
      <p className="text-[10px] text-ink-500 mt-0.5">{sub}</p>
    </div>
  );
}
