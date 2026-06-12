import { useState } from 'react';
import {
  Building2,
  MapPin,
  Users,
  Briefcase,
  FileText,
  Calendar,
  TrendingUp,
  Eye,
  MessageSquare,
  Download,
  Plus,
  UserPlus,
  BarChart3,
  CheckCircle2,
  Clock,
  GraduationCap,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

const applicationTrendData = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1}`,
  投递数: Math.floor(40 + Math.random() * 60 + Math.sin(i / 4) * 20),
  面试数: Math.floor(8 + Math.random() * 20 + Math.cos(i / 5) * 8),
}));

const radarData = [
  { subject: '专业能力', value: 86 },
  { subject: '沟通协作', value: 92 },
  { subject: '学习能力', value: 88 },
  { subject: '执行力', value: 84 },
  { subject: '责任心', value: 95 },
];

const mockResumes = [
  {
    id: 1,
    name: '李思琪',
    avatar: 'L',
    school: '清华大学',
    major: '计算机科学与技术',
    job: '前端开发实习生',
    time: '10分钟前',
    completeness: 96,
  },
  {
    id: 2,
    name: '陈俊杰',
    avatar: 'C',
    school: '北京大学',
    major: '软件工程',
    job: '后端开发实习生',
    time: '32分钟前',
    completeness: 88,
  },
  {
    id: 3,
    name: '王雨桐',
    avatar: 'W',
    school: '复旦大学',
    major: '数据科学',
    job: '数据分析实习生',
    time: '1小时前',
    completeness: 92,
  },
  {
    id: 4,
    name: '张浩然',
    avatar: 'Z',
    school: '上海交通大学',
    major: '市场营销',
    job: '运营实习生',
    time: '2小时前',
    completeness: 75,
  },
  {
    id: 5,
    name: '刘美琳',
    avatar: 'L',
    school: '浙江大学',
    major: '产品设计',
    job: 'UI设计实习生',
    time: '3小时前',
    completeness: 85,
  },
  {
    id: 6,
    name: '赵子轩',
    avatar: 'Z',
    school: '南京大学',
    major: '人力资源',
    job: 'HR实习生',
    time: '5小时前',
    completeness: 78,
  },
  {
    id: 7,
    name: '孙雅雯',
    avatar: 'S',
    school: '武汉大学',
    major: '会计学',
    job: '财务实习生',
    time: '昨天',
    completeness: 91,
  },
  {
    id: 8,
    name: '周子墨',
    avatar: 'Z',
    school: '同济大学',
    major: '电气工程',
    job: '硬件研发实习生',
    time: '昨天',
    completeness: 70,
  },
];

const statsCards = [
  {
    title: '在招岗位数',
    value: '24',
    delta: '+3',
    trend: 'up',
    icon: Briefcase,
    gradient: 'from-brand-500 to-brand-300',
    bg: 'bg-brand-50',
    textColor: 'text-brand-600',
  },
  {
    title: '今日新增简历',
    value: '86',
    delta: '+12%',
    trend: 'up',
    icon: FileText,
    gradient: 'from-teal-500 to-teal-300',
    bg: 'bg-teal-50',
    textColor: 'text-teal-600',
  },
  {
    title: '本周面试数',
    value: '38',
    delta: '+5',
    trend: 'up',
    icon: Calendar,
    gradient: 'from-amber-500 to-amber-300',
    bg: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    title: '实习转正率',
    value: '78.5%',
    delta: '+2.3%',
    trend: 'up',
    icon: TrendingUp,
    gradient: 'from-sky-500 to-sky-300',
    bg: 'bg-sky-50',
    textColor: 'text-sky-600',
  },
];

const quickActions = [
  { label: '发布新岗位', icon: Plus, variant: 'primary' as const },
  { label: '管理带教人', icon: UserPlus, variant: 'secondary' as const },
  { label: '导出报表', icon: Download, variant: 'outline' as const },
];

export default function EnterpriseDashboard() {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  return (
    <div className="min-h-screen bg-ink-50/60 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900 p-6 mb-6 animate-fade-in-up shadow-card">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

          <div className="relative z-10 flex flex-col lg:flex-row gap-6 justify-between">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
                <Building2 className="w-10 h-10 text-brand-300" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    橙青科技有限公司
                  </h1>
                  <Badge variant="verified" dot size="sm" className="bg-teal-500/20 text-teal-200 border-teal-400/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    营业执照已认证
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-ink-300">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    互联网 / 人工智能
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    规模 500-1000人
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    上海市 · 浦东新区
                  </span>
                </div>
                <div className="flex items-center gap-6 pt-1">
                  <div>
                    <div className="text-2xl font-bold font-num text-white">156</div>
                    <div className="text-xs text-ink-400 mt-0.5">本月收到简历</div>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div>
                    <div className="text-2xl font-bold font-num text-teal-300">42</div>
                    <div className="text-xs text-ink-400 mt-0.5">本月面试</div>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div>
                    <div className="text-2xl font-bold font-num text-brand-300">18</div>
                    <div className="text-xs text-ink-400 mt-0.5">本月录用</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 lg:items-end">
              <Badge variant="brand" size="sm" className="bg-brand-500/20 text-brand-200 border-brand-400/30">
                <Clock className="w-3.5 h-3.5" />
                2026年6月 · 数据概览
              </Badge>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/30 hover:text-white">
                  <BarChart3 className="w-4 h-4" />
                  查看月报
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {statsCards.map((stat, idx) => (
            <Card
              key={stat.title}
              hoverable
              className="animate-fade-in-up overflow-hidden"
            >
              <CardContent className="p-5 relative">
                <div
                  className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-40 bg-gradient-to-br ${stat.gradient}`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                />
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-ink-500 font-medium">{stat.title}</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-bold font-num text-ink-900 tracking-tight">
                        {stat.value}
                      </span>
                      <span className="text-xs font-semibold text-teal-600 flex items-center gap-0.5 bg-teal-50 px-1.5 py-0.5 rounded-md">
                        <TrendingUp className="w-3 h-3" />
                        {stat.delta}
                      </span>
                    </div>
                  </div>
                  <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                    <stat.icon className={`w-5.5 h-5.5 ${stat.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {['all', 'frontend', 'backend', 'design'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeFilter === f
                    ? 'bg-white text-brand-600 shadow-soft border border-brand-200'
                    : 'text-ink-500 hover:text-ink-700 hover:bg-white/60'
                }`}
              >
                {f === 'all' ? '全部岗位' : f === 'frontend' ? '前端类' : f === 'backend' ? '后端类' : '设计类'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                size="sm"
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <Card className="lg:col-span-3 animate-fade-in-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-500" />
                  最近投递简历
                </CardTitle>
                <p className="text-sm text-ink-500 mt-1">共 {mockResumes.length} 位候选人等待处理</p>
              </div>
              <Button variant="ghost" size="sm">
                查看全部
                <TrendingUp className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex flex-col divide-y divide-ink-100">
                {mockResumes.map((resume, idx) => (
                  <div
                    key={resume.id}
                    className="flex items-center gap-4 py-4 hover:bg-cream-50/50 -mx-2 px-2 rounded-xl transition-all duration-200 group animate-fade-in-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-teal-400 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-soft">
                      {resume.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-ink-900 text-sm">{resume.name}</span>
                        <Badge variant="info" size="xs">
                          <GraduationCap className="w-3 h-3" />
                          应届生
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-ink-500 mb-2">
                        <span>{resume.school}</span>
                        <span className="text-ink-300">·</span>
                        <span>{resume.major}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="brand" size="xs">
                          {resume.job}
                        </Badge>
                        <div className="flex items-center gap-2 flex-1 max-w-[140px]">
                          <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                resume.completeness >= 90
                                  ? 'bg-teal-gradient'
                                  : resume.completeness >= 75
                                  ? 'bg-brand-gradient'
                                  : 'bg-amber-400'
                              }`}
                              style={{ width: `${resume.completeness}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-ink-600 font-num shrink-0">
                            {resume.completeness}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <span className="text-xs text-ink-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {resume.time}
                      </span>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button variant="ghost" size="xs">
                          <Eye className="w-3.5 h-3.5" />
                          查看
                        </Button>
                        <Button variant="outline" size="xs">
                          <MessageSquare className="w-3.5 h-3.5" />
                          邀约
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 flex flex-col gap-5">
            <Card className="animate-fade-in-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-500" />
                  近30天投递趋势
                </CardTitle>
                <p className="text-sm text-ink-500 mt-1">投递与面试数据变化</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-56 -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={applicationTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ECEAF3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#A8A2C1' }}
                        axisLine={{ stroke: '#ECEAF3' }}
                        tickLine={false}
                        interval={4}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#A8A2C1' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #ECEAF3',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px -8px rgba(45, 42, 61, 0.12)',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="投递数"
                        stroke="#FF7A3D"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4, fill: '#FF7A3D', strokeWidth: 0 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="面试数"
                        stroke="#2EC4B6"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4, fill: '#2EC4B6', strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-5 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                    <span className="text-xs text-ink-600">投递数</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span className="text-xs text-ink-600">面试数</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  学生综合评价
                </CardTitle>
                <p className="text-sm text-ink-500 mt-1">往届实习生能力维度</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-48 -mx-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="#D3CFE1" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 11, fill: '#524E6B' }}
                      />
                      <PolarRadiusAxis
                        tick={{ fontSize: 9, fill: '#A8A2C1' }}
                        axisLine={false}
                        tickCount={3}
                      />
                      <Radar
                        dataKey="value"
                        stroke="#FF7A3D"
                        fill="#FF7A3D"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-between text-xs text-ink-500 mt-2 px-2">
                  <span>平均分 89.0</span>
                  <span className="text-teal-600 font-medium">↑ 较上月 +2.5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
