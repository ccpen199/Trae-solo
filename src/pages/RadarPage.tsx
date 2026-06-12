import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronRight,
  ShieldCheck,
  Radar,
  Building2,
  Users,
  Banknote,
  Leaf,
  TrendingUp,
  Award,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tag from '@/components/ui/Tag';
import Input from '@/components/ui/Input';

const industries = [
  { name: '全部行业', count: 2100 },
  { name: '互联网/科技', count: 680 },
  { name: '金融/银行', count: 320 },
  { name: '快消/零售', count: 240 },
  { name: '游戏/娱乐', count: 180 },
  { name: '教育/培训', count: 210 },
  { name: '医疗/健康', count: 150 },
  { name: '制造/工业', count: 170 },
  { name: '咨询/服务', count: 150 },
];

const sortOptions = [
  { label: '综合评分', key: 'overall' },
  { label: '薪资待遇', key: 'salary' },
  { label: '工作环境', key: 'env' },
  { label: '转正率', key: 'convert' },
];

const companies = [
  {
    id: 1,
    name: '腾讯科技',
    logoBg: 'bg-teal-100',
    logoText: '腾',
    industry: '互联网/科技',
    feedbackCount: 2856,
    verified: true,
    traceable: true,
    rank: 1,
    salaryRange: '￥8-15K',
    salaryPerDay: 280,
    convertRate: 88,
    studentFeedback: 256,
    hrSupplement: 12,
    salarySample: 126,
    scores: {
      overall: 91,
      salary: 92,
      env: 95,
      convert: 88,
      growth: 90,
      culture: 89,
    },
    radarData: [
      { subject: '薪资', value: 92 },
      { subject: '环境', value: 95 },
      { subject: '转正', value: 88 },
      { subject: '成长', value: 90 },
      { subject: '文化', value: 89 },
    ],
  },
  {
    id: 2,
    name: '字节跳动',
    logoBg: 'bg-sky-100',
    logoText: '字',
    industry: '互联网/科技',
    feedbackCount: 2341,
    verified: true,
    traceable: true,
    rank: 2,
    salaryRange: '￥10-18K',
    salaryPerDay: 320,
    convertRate: 82,
    studentFeedback: 312,
    hrSupplement: 8,
    salarySample: 145,
    scores: {
      overall: 90,
      salary: 95,
      env: 88,
      convert: 82,
      growth: 93,
      culture: 85,
    },
    radarData: [
      { subject: '薪资', value: 95 },
      { subject: '环境', value: 88 },
      { subject: '转正', value: 82 },
      { subject: '成长', value: 93 },
      { subject: '文化', value: 85 },
    ],
  },
  {
    id: 3,
    name: '阿里巴巴',
    logoBg: 'bg-orange-100',
    logoText: '阿',
    industry: '电商/科技',
    feedbackCount: 2189,
    verified: true,
    traceable: true,
    rank: 3,
    salaryRange: '￥9-16K',
    salaryPerDay: 300,
    convertRate: 85,
    studentFeedback: 278,
    hrSupplement: 15,
    salarySample: 132,
    scores: {
      overall: 89,
      salary: 90,
      env: 90,
      convert: 85,
      growth: 89,
      culture: 91,
    },
    radarData: [
      { subject: '薪资', value: 90 },
      { subject: '环境', value: 90 },
      { subject: '转正', value: 85 },
      { subject: '成长', value: 89 },
      { subject: '文化', value: 91 },
    ],
  },
  {
    id: 4,
    name: '美团点评',
    logoBg: 'bg-yellow-100',
    logoText: '美',
    industry: '本地生活',
    feedbackCount: 1876,
    verified: true,
    traceable: true,
    rank: 4,
    salaryRange: '￥6-12K',
    salaryPerDay: 220,
    convertRate: 80,
    studentFeedback: 189,
    hrSupplement: 6,
    salarySample: 98,
    scores: {
      overall: 84,
      salary: 85,
      env: 82,
      convert: 80,
      growth: 86,
      culture: 84,
    },
    radarData: [
      { subject: '薪资', value: 85 },
      { subject: '环境', value: 82 },
      { subject: '转正', value: 80 },
      { subject: '成长', value: 86 },
      { subject: '文化', value: 84 },
    ],
  },
  {
    id: 5,
    name: '网易互娱',
    logoBg: 'bg-red-100',
    logoText: '网',
    industry: '游戏/娱乐',
    feedbackCount: 1543,
    verified: true,
    traceable: true,
    rank: 5,
    salaryRange: '￥7-14K',
    salaryPerDay: 250,
    convertRate: 83,
    studentFeedback: 167,
    hrSupplement: 9,
    salarySample: 87,
    scores: {
      overall: 87,
      salary: 88,
      env: 92,
      convert: 83,
      growth: 84,
      culture: 87,
    },
    radarData: [
      { subject: '薪资', value: 88 },
      { subject: '环境', value: 92 },
      { subject: '转正', value: 83 },
      { subject: '成长', value: 84 },
      { subject: '文化', value: 87 },
    ],
  },
  {
    id: 6,
    name: '高盛中国',
    logoBg: 'bg-amber-100',
    logoText: '高',
    industry: '金融/银行',
    feedbackCount: 986,
    verified: true,
    traceable: false,
    rank: 6,
    salaryRange: '￥15-30K',
    salaryPerDay: 500,
    convertRate: 70,
    studentFeedback: 98,
    hrSupplement: 3,
    salarySample: 56,
    scores: {
      overall: 88,
      salary: 96,
      env: 94,
      convert: 70,
      growth: 85,
      culture: 92,
    },
    radarData: [
      { subject: '薪资', value: 96 },
      { subject: '环境', value: 94 },
      { subject: '转正', value: 70 },
      { subject: '成长', value: 85 },
      { subject: '文化', value: 92 },
    ],
  },
  {
    id: 7,
    name: '宝洁中国',
    logoBg: 'bg-sky-100',
    logoText: '宝',
    industry: '快消/零售',
    feedbackCount: 872,
    verified: true,
    traceable: true,
    rank: 7,
    salaryRange: '￥5-10K',
    salaryPerDay: 180,
    convertRate: 78,
    studentFeedback: 134,
    hrSupplement: 7,
    salarySample: 72,
    scores: {
      overall: 86,
      salary: 82,
      env: 90,
      convert: 78,
      growth: 88,
      culture: 93,
    },
    radarData: [
      { subject: '薪资', value: 82 },
      { subject: '环境', value: 90 },
      { subject: '转正', value: 78 },
      { subject: '成长', value: 88 },
      { subject: '文化', value: 93 },
    ],
  },
  {
    id: 8,
    name: '小米科技',
    logoBg: 'bg-orange-100',
    logoText: '小',
    industry: '硬件/科技',
    feedbackCount: 1234,
    verified: true,
    traceable: false,
    rank: 8,
    salaryRange: '￥6-11K',
    salaryPerDay: 200,
    convertRate: 76,
    studentFeedback: 112,
    hrSupplement: 5,
    salarySample: 64,
    scores: {
      overall: 82,
      salary: 78,
      env: 83,
      convert: 76,
      growth: 85,
      culture: 84,
    },
    radarData: [
      { subject: '薪资', value: 78 },
      { subject: '环境', value: 83 },
      { subject: '转正', value: 76 },
      { subject: '成长', value: 85 },
      { subject: '文化', value: 84 },
    ],
  },
];

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-ink-500">{label}</span>
        <span className="font-bold text-ink-700 font-num">{value}</span>
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

function MiniRadar({ data }: { data: { subject: string; value: number }[] }) {
  return (
    <div className="w-[140px] h-[140px] shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="#ECEAF3" strokeWidth={1} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#7C7894', fontSize: 10 }}
            tickLine={false}
          />
          <RechartsRadar
            dataKey="value"
            stroke="#FF7A3D"
            fill="url(#miniGradient)"
            fillOpacity={0.5}
            strokeWidth={2}
          />
          <defs>
            <linearGradient id="miniGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF7A3D" />
              <stop offset="100%" stopColor="#2EC4B6" />
            </linearGradient>
          </defs>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

const filterTags = [
  { name: '可追溯数据', key: 'traceable' },
  { name: '转正率>50%', key: 'convert' },
  { name: '薪资>200/天', key: 'salary' },
  { name: '环境评分>4.0', key: 'env' },
];

export default function RadarPage() {
  const [activeIndustry, setActiveIndustry] = useState(0);
  const [activeSort, setActiveSort] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const navigate = useNavigate();

  const toggleFilter = (key: string) => {
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const sortKey = sortOptions[activeSort].key as 'overall' | 'salary' | 'env' | 'convert';
  const filteredCompanies = [...companies]
    .filter((c) => {
      if (searchText && !c.name.includes(searchText)) return false;
      if (activeIndustry > 0 && c.industry !== industries[activeIndustry].name) return false;
      if (activeFilters.includes('traceable') && !c.traceable) return false;
      if (activeFilters.includes('convert') && c.convertRate <= 50) return false;
      if (activeFilters.includes('salary') && c.salaryPerDay <= 200) return false;
      if (activeFilters.includes('env') && c.scores.env <= 80) return false;
      return true;
    })
    .sort((a, b) => b.scores[sortKey] - a.scores[sortKey]);

  const traceableCount = filteredCompanies.filter((c) => c.traceable).length;

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="container space-y-6">
        {/* 页面头部 */}
        <div className="animate-fade-in-up space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="success" dot>
              <TrendingUp size={12} /> 数据每周更新
            </Badge>
            <Badge variant="brand">
              <Award size={12} /> 万名同学参与评价
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-ink-900 font-display tracking-tight">
            公司雷达 · 真实企业评价榜
          </h1>
          <p className="text-ink-500 max-w-2xl">
            基于 {companies.reduce((s, c) => s + c.feedbackCount, 0).toLocaleString()}+ 条实习生匿名真实反馈，
            多维度还原企业实习体验，帮你选对第一站
          </p>
        </div>

        {/* 搜索 + 筛选 + 排序 */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '40ms' }}>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[280px] max-w-md">
                <Input
                  label="搜索企业"
                  placeholder="输入企业名称..."
                  leftIcon={<Search size={16} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[300px]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-ink-700 ml-0.5">行业筛选</label>
                  <span className="text-xs text-ink-500">
                    共找到 <span className="font-bold text-brand-600 font-num">{filteredCompanies.length}</span> 家企业
                    <span className="mx-1">·</span>
                    其中 <span className="font-bold text-teal-600 font-num">{traceableCount}</span> 家数据可追溯
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {industries.slice(0, 5).map((ind, i) => (
                    <button
                      key={ind.name}
                      onClick={() => setActiveIndustry(i)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                        activeIndustry === i
                          ? 'bg-brand-gradient text-white shadow-float'
                          : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                      }`}
                    >
                      {ind.name}
                      <span className={`ml-1.5 text-xs ${activeIndustry === i ? 'text-white/80' : 'text-ink-400'} font-num`}>
                        {ind.count}
                      </span>
                    </button>
                  ))}
                  <button className="px-3.5 py-2 rounded-xl text-sm font-medium bg-ink-50 text-ink-500 hover:bg-ink-100 flex items-center gap-1">
                    <Filter size={14} /> 更多
                  </button>
                </div>
              </div>
              <div className="shrink-0">
                <label className="text-sm font-medium text-ink-700 ml-0.5 mb-1.5 block">维度排序</label>
                <div className="flex p-1 bg-ink-50 rounded-xl">
                  {sortOptions.map((s, i) => (
                    <button
                      key={s.key}
                      onClick={() => setActiveSort(i)}
                      className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeSort === i
                          ? 'bg-white text-ink-900 shadow-soft'
                          : 'text-ink-500 hover:text-ink-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-ink-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-ink-700">快捷筛选</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {filterTags.map((tag) => (
                  <button
                    key={tag.key}
                    onClick={() => toggleFilter(tag.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeFilters.includes(tag.key)
                        ? 'bg-teal-500 text-white shadow-soft'
                        : 'bg-ink-50 text-ink-600 hover:bg-ink-100 border border-ink-200'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center">
                <Building2 size={24} className="text-brand-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-ink-900 font-num">2,146</div>
                <div className="text-xs text-ink-500">收录企业</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
                <Users size={24} className="text-teal-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-ink-900 font-num">58,342</div>
                <div className="text-xs text-ink-500">参与评价</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Banknote size={24} className="text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-ink-900 font-num">¥218</div>
                <div className="text-xs text-ink-500">日均薪资中位数</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <Leaf size={24} className="text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-ink-900 font-num">80.3%</div>
                <div className="text-xs text-ink-500">平均转正率</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 公司卡片列表 */}
        <div className="space-y-4">
          {filteredCompanies.map((c, i) => (
            <Card
              key={c.id}
              hoverable
              className="animate-fade-in-up overflow-hidden cursor-pointer"
              style={{ animationDelay: `${120 + i * 60}ms` }}
              onClick={() => navigate('/company/' + c.id)}
            >
              <CardContent className="flex items-start gap-6 flex-wrap">
                <div className="flex items-center gap-4 min-w-[240px]">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold font-num ${
                    c.rank <= 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-ink-100 text-ink-500'
                  }`}>
                    #{c.rank}
                  </div>
                  <div className={`w-16 h-16 rounded-2xl ${c.logoBg} flex items-center justify-center font-bold text-2xl shadow-md shrink-0`}>
                    {c.logoText}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-xl text-ink-900">{c.name}</h3>
                      {c.verified && <Badge variant="verified" size="xs"><ShieldCheck size={10} /> 认证</Badge>}
                      {c.traceable && (
                        <Badge variant="success" size="xs" className="bg-emerald-500">
                          <CheckCircle2 size={10} className="mr-0.5" /> 可追溯
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Tag variant="teal" size="xs">{c.industry}</Tag>
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-brand-500 font-num">{c.salaryRange}</span>
                        <span
                          className="text-ink-400 cursor-help text-base"
                          title="基于近3个月126名实习生日薪换算"
                        >
                          ❓
                        </span>
                      </div>
                      <Badge variant="success" size="sm" className="font-num">
                        {c.convertRate}%
                        <span
                          className="ml-1 text-emerald-100 cursor-help"
                          title="口径：近6个月转正人数/入职人数"
                        >
                          ❓
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-ink-500">
                      <Users size={12} />
                      <span className="font-num">{c.feedbackCount.toLocaleString()}</span> 人反馈
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-[320px]">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    <ScoreBar label="薪资待遇" value={c.scores.salary} color="bg-brand-500" />
                    <ScoreBar label="工作环境" value={c.scores.env} color="bg-teal-500" />
                    <ScoreBar label="转正机会" value={c.scores.convert} color="bg-amber-500" />
                    <ScoreBar label="成长空间" value={c.scores.growth} color="bg-sky-500" />
                  </div>
                  <div className="mt-2 text-xs text-ink-400 flex items-center gap-1">
                    <span>数据来源：</span>
                    <span className="font-num text-brand-500">{c.studentFeedback}</span>
                    <span>条学生匿名反馈</span>
                    <span className="mx-1">+</span>
                    <span className="font-num text-teal-500">{c.hrSupplement}</span>
                    <span>条HR补充</span>
                  </div>
                </div>

                <div className="flex items-center gap-5 shrink-0">
                  <MiniRadar data={c.radarData} />
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-teal-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg font-num">
                      {c.scores.overall}
                    </div>
                    <div className="text-xs text-ink-500 whitespace-nowrap">综合评分</div>
                    <Button size="sm" variant="secondary" rightIcon={<ChevronRight size={14} />} onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate('/company/' + c.id); }}>
                      详情
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 加载更多 */}
        <div className="flex justify-center pt-4 pb-8">
          <Button variant="outline" size="lg">
            <Radar size={18} className="mr-2" />
            加载更多企业
          </Button>
        </div>
      </div>
    </div>
  );
}
