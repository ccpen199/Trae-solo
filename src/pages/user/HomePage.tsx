import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  GraduationCap,
  Heart,
  Plane,
  ArrowRight,
  TrendingUp,
  FileText,
  Shield,
  ChevronRight,
  GitCompare,
  ShieldCheck,
  ClipboardList,
  MessageSquareWarning,
  Scale,
} from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { TrendBadge } from '@/components/ui/TrendBadge';
import { BarChart } from '@/components/charts/BarChart';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const categories = [
  {
    code: 'consumer',
    name: '消费品牌',
    description: '涵盖食品饮料、美妆个护、家居日用等消费领域的客观评价',
    icon: ShoppingBag,
    color: 'from-emerald-500/20 to-emerald-500/5',
    accent: 'text-emerald-400',
  },
  {
    code: 'education',
    name: '教育服务',
    description: '培训机构、在线课程、教育机构的专业评估报告',
    icon: GraduationCap,
    color: 'from-blue-500/20 to-blue-500/5',
    accent: 'text-blue-400',
  },
  {
    code: 'medical',
    name: '医美服务',
    description: '医疗机构、医美项目、健康产品的可信评价',
    icon: Heart,
    color: 'from-rose-500/20 to-rose-500/5',
    accent: 'text-rose-400',
  },
  {
    code: 'travel',
    name: '旅游出行',
    description: '酒店、景区、旅行社的综合评分',
    icon: Plane,
    color: 'from-amber-500/20 to-amber-500/5',
    accent: 'text-amber-400',
  },
];

const topRankings: Record<
  string,
  { targetName: string; score: number; trend: 'up' | 'down' | 'stable'; change: number }[]
> = {
  consumer: [
    { targetName: '美好有机牛奶', score: 92.6, trend: 'up', change: 3 },
    { targetName: '美好坚果大礼包', score: 89.3, trend: 'stable', change: 0 },
    { targetName: '美好全麦面包', score: 87.8, trend: 'up', change: 1 },
    { targetName: '优选生活日用品', score: 85.2, trend: 'down', change: 2 },
    { targetName: '品质优选茶系列', score: 83.5, trend: 'up', change: 5 },
  ],
  education: [
    { targetName: '精英少儿英语', score: 91.2, trend: 'up', change: 2 },
    { targetName: '精英高考冲刺班', score: 88.5, trend: 'up', change: 1 },
    { targetName: '素质教育艺术课', score: 86.3, trend: 'stable', change: 0 },
    { targetName: '编程在线教育', score: 84.8, trend: 'down', change: 1 },
    { targetName: '职业技能培训', score: 82.4, trend: 'up', change: 4 },
  ],
  medical: [
    { targetName: '华美双眼皮整形', score: 88.7, trend: 'stable', change: 0 },
    { targetName: '华美玻尿酸注射', score: 87.2, trend: 'up', change: 1 },
    { targetName: '华美隆鼻整形', score: 85.9, trend: 'up', change: 2 },
    { targetName: '悦美皮肤管理', score: 83.6, trend: 'stable', change: 0 },
    { targetName: '丽都抗衰老中心', score: 81.3, trend: 'down', change: 1 },
  ],
  travel: [
    { targetName: '山水度假温泉酒店', score: 90.8, trend: 'up', change: 2 },
    { targetName: '山水古镇景区', score: 88.4, trend: 'up', change: 3 },
    { targetName: '精品民宿连锁', score: 86.1, trend: 'stable', change: 0 },
    { targetName: '山水旅行社', score: 83.9, trend: 'down', change: 1 },
    { targetName: '城市快捷酒店', score: 81.7, trend: 'up', change: 2 },
  ],
};

const hotReports = [
  {
    id: 1,
    title: '2026年Q2北京消费品品牌综合评价报告',
    category: '消费品牌',
    score: 91,
    date: '2026-06-12',
  },
  {
    id: 2,
    title: '上海地区教育机构服务质量深度评测',
    category: '教育服务',
    score: 88,
    date: '2026-06-10',
  },
  {
    id: 3,
    title: '医疗美容机构资质合规性专项检查报告',
    category: '医美服务',
    score: 93,
    date: '2026-06-08',
  },
  {
    id: 4,
    title: '长三角地区旅游景区满意度横向对比',
    category: '旅游出行',
    score: 86,
    date: '2026-06-05',
  },
];

const trendData = [
  { name: '1月', 报告数: 128, 参与用户: 890 },
  { name: '2月', 报告数: 145, 参与用户: 1020 },
  { name: '3月', 报告数: 168, 参与用户: 1180 },
  { name: '4月', 报告数: 192, 参与用户: 1350 },
  { name: '5月', 报告数: 215, 参与用户: 1520 },
  { name: '6月', 报告数: 248, 参与用户: 1780 },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden grid-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Shield className="w-4 h-4" />
              基于多源数据融合的权威评价平台
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-serif text-white mb-6 leading-tight">
              垂直领域可信评价中枢
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                让每一个评价都有迹可循
              </span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              融合电商平台、政府许可、投诉数据、专业评测等多源数据，
              经过专业采样、交叉验证、动态加权的严格评测流程，
              为消费者提供客观、专业、可溯源的垂直领域评价服务。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/rankings" className="btn-primary px-6 py-3">
                查看排行榜
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link to="/compare" className="btn-outline px-6 py-3">
                <GitCompare className="w-4 h-4 mr-2" />
                竞品对比
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-12 max-w-lg">
              <div>
                <div className="text-3xl font-bold font-serif text-white">2,480+</div>
                <div className="text-sm text-slate-500 mt-1">评价报告</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-serif text-white">18,600+</div>
                <div className="text-sm text-slate-500 mt-1">评测对象</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-serif text-white">98.5%</div>
                <div className="text-sm text-slate-500 mt-1">数据可信度</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif font-bold text-white">四大评价领域</h2>
          <Link
            to="/rankings"
            className="text-primary text-sm hover:text-primary-dark transition-colors inline-flex items-center gap-1"
          >
            查看全部
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.code}
                to={`/category/${cat.code}`}
                className={`card card-hover p-6 block group animate-slide-up stagger-${idx + 1}`}
              >
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                >
                  <Icon className={`w-6 h-6 ${cat.accent}`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{cat.name}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {cat.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Top Rankings Preview */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-serif font-bold text-white mb-8">各领域 Top 5 榜单</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((cat, catIdx) => (
            <div
              key={cat.code}
              className={`card p-5 animate-slide-up stagger-${(catIdx % 4) + 1}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <cat.icon className={`w-5 h-5 ${cat.accent}`} />
                  <h3 className="font-semibold text-white">{cat.name}</h3>
                </div>
                <Link
                  to={`/rankings/${cat.code}`}
                  className="text-xs text-primary hover:text-primary-dark inline-flex items-center"
                >
                  完整榜单
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {topRankings[cat.code as keyof typeof topRankings].map((item, idx) => (
                  <div
                    key={item.targetName}
                    className="flex items-center gap-3 p-2 rounded hover:bg-surface-light/50 transition-colors cursor-pointer"
                  >
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                        idx < 3
                          ? 'bg-warning/20 text-warning'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm text-slate-200">{item.targetName}</span>
                    <span className="text-sm font-medium text-white">{item.score}</span>
                    <TrendBadge trend={item.trend} value={item.change} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Chart & Reports */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6 animate-slide-up stagger-1">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-white">评测趋势</h3>
            </div>
            <BarChart
              data={trendData}
              series={[
                { key: '报告数', color: '#10B981', name: '报告数' },
                { key: '参与用户', color: '#6366F1', name: '参与用户' },
              ]}
              height={260}
            />
          </div>

          <div className="card p-6 animate-slide-up stagger-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-white">热门报告</h3>
              </div>
            </div>
            <div className="space-y-3">
              {hotReports.map((report, idx) => (
                <Link
                  key={report.id}
                  to={`/report/${report.id}`}
                  className={`flex items-center gap-3 p-3 rounded hover:bg-surface-light/50 transition-colors animate-slide-up stagger-${idx + 1}`}
                >
                  <ScoreRing score={report.score} size={48} strokeWidth={4} showLabel={false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{report.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">{report.category}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{report.date}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Entry Points */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif font-bold text-white">平台功能入口</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/dashboard" className="card card-hover p-5 block group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-primary">评测计划排期</h3>
            </div>
            <p className="text-xs text-slate-500">创建、分配和管理评测计划，追踪任务进度</p>
          </Link>
          <Link to="/admin/reviews" className="card card-hover p-5 block group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-primary">报告审核流</h3>
            </div>
            <p className="text-xs text-slate-500">初审→交叉验证→终审→发布，四级审核流程</p>
          </Link>
          <Link to="/brand/appeal" className="card card-hover p-5 block group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <MessageSquareWarning className="w-5 h-5 text-warning" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-primary">品牌申诉通道</h3>
            </div>
            <p className="text-xs text-slate-500">品牌方对评价结果提出异议，启动复核流程</p>
          </Link>
          <Link to="/admin/weights" className="card card-hover p-5 block group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center">
                <Scale className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-primary">权重与规则配置</h3>
            </div>
            <p className="text-xs text-slate-500">调整各领域评价维度权重，设置评测规则</p>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
