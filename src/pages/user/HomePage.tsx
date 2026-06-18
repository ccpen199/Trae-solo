import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Clock,
  Plus,
  Check,
  Eye,
} from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { TrendBadge } from '@/components/ui/TrendBadge';
import { BarChart } from '@/components/charts/BarChart';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const categories = [
  { code: 'consumer', name: '消费品牌', description: '涵盖食品饮料、美妆个护、家居日用等消费领域的客观评价', icon: ShoppingBag, color: 'from-emerald-500/20 to-emerald-500/5', accent: 'text-emerald-400' },
  { code: 'education', name: '教育服务', description: '培训机构、在线课程、教育机构的专业评估报告', icon: GraduationCap, color: 'from-blue-500/20 to-blue-500/5', accent: 'text-blue-400' },
  { code: 'medical', name: '医美服务', description: '医疗机构、医美项目、健康产品的可信评价', icon: Heart, color: 'from-rose-500/20 to-rose-500/5', accent: 'text-rose-400' },
  { code: 'travel', name: '旅游出行', description: '酒店、景区、旅行社的综合评分', icon: Plane, color: 'from-amber-500/20 to-amber-500/5', accent: 'text-amber-400' },
];

const topRankings: Record<string, { id: number; targetName: string; score: number; trend: 'up' | 'down' | 'stable'; change: number }[]> = {
  consumer: [
    { id: 1, targetName: '蒙牛乳业', score: 92.6, trend: 'up', change: 3 },
    { id: 2, targetName: '农夫山泉', score: 89.3, trend: 'stable', change: 0 },
    { id: 3, targetName: '伊利集团', score: 87.8, trend: 'up', change: 1 },
    { id: 4, targetName: '海天味业', score: 85.2, trend: 'down', change: 2 },
    { id: 5, targetName: '海尔智家', score: 83.5, trend: 'up', change: 5 },
  ],
  education: [
    { id: 101, targetName: '新东方教育', score: 91.2, trend: 'up', change: 2 },
    { id: 102, targetName: '学而思', score: 88.5, trend: 'up', change: 1 },
    { id: 103, targetName: '好未来', score: 86.3, trend: 'stable', change: 0 },
    { id: 104, targetName: '网易有道', score: 84.8, trend: 'down', change: 1 },
    { id: 105, targetName: '中公教育', score: 82.4, trend: 'up', change: 4 },
  ],
  medical: [
    { id: 201, targetName: '北京协和医院', score: 94.2, trend: 'stable', change: 0 },
    { id: 202, targetName: '上海瑞金医院', score: 91.7, trend: 'up', change: 2 },
    { id: 203, targetName: '广州中山医院', score: 89.5, trend: 'up', change: 1 },
    { id: 204, targetName: '武汉同济医院', score: 87.3, trend: 'stable', change: 0 },
    { id: 205, targetName: '四川华西医院', score: 85.8, trend: 'down', change: 1 },
  ],
  travel: [
    { id: 301, targetName: '携程旅行', score: 90.8, trend: 'up', change: 2 },
    { id: 302, targetName: '同程旅行', score: 88.4, trend: 'up', change: 3 },
    { id: 303, targetName: '飞猪旅行', score: 86.1, trend: 'stable', change: 0 },
    { id: 304, targetName: '去哪儿网', score: 83.9, trend: 'down', change: 1 },
    { id: 305, targetName: '美团酒店', score: 81.7, trend: 'up', change: 2 },
  ],
};

const hotReports = [
  { id: 1, title: '2026年Q2北京消费品品牌综合评价报告', category: '消费品牌', score: 91, date: '2026-06-12' },
  { id: 2, title: '上海地区教育机构服务质量深度评测', category: '教育服务', score: 88, date: '2026-06-10' },
  { id: 3, title: '医疗美容机构资质合规性专项检查报告', category: '医美服务', score: 93, date: '2026-06-08' },
  { id: 4, title: '长三角地区旅游景区满意度横向对比', category: '旅游出行', score: 86, date: '2026-06-05' },
];

const trendData = [
  { name: '1月', 报告数: 128, 参与用户: 890 },
  { name: '2月', 报告数: 145, 参与用户: 1020 },
  { name: '3月', 报告数: 168, 参与用户: 1180 },
  { name: '4月', 报告数: 192, 参与用户: 1350 },
  { name: '5月', 报告数: 215, 参与用户: 1520 },
  { name: '6月', 报告数: 248, 参与用户: 1780 },
];

const planItems = [
  { id: 1, name: '2026Q2乳制品评测', progress: 67, deadline: '2026-06-30' },
  { id: 2, name: '医美机构资质专项', progress: 42, deadline: '2026-07-10' },
  { id: 3, name: '在线教育质量调研', progress: 88, deadline: '2026-06-25' },
];

const reviewItems = [
  { id: 103, title: '海天酱油添加剂安全分析', reviewer: '张明', status: 'cross_validating' },
  { id: 104, title: '新东方教育服务质量评测', reviewer: '李华', status: 'reviewing' },
  { id: 105, title: '携程旅行用户满意度调查', reviewer: '王芳', status: 'submitted' },
];

const appealItems = [
  { id: 1, brand: '蒙牛乳业', issue: '数据抽样方法异议' },
  { id: 2, brand: '海天味业', issue: '服务体验评分偏低申诉' },
];

const weightItems = [
  { cat: '消费品', weights: ['质量30%', '服务25%', '信誉25%', '价格20%'] },
  { cat: '教育', weights: ['教学30%', '师资30%', '服务20%', '性价比20%'] },
  { cat: '医美', weights: ['资质65%', '效果30%', '价格5%'] },
  { cat: '旅游', weights: ['服务30%', '产品25%', '售后25%', '价格20%'] },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('compareIds');
      if (saved) setCompareIds(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('compareIds', JSON.stringify(compareIds)); } catch {}
  }, [compareIds]);

  const addToCompare = (id: number, name: string) => {
    if (compareIds.includes(id)) {
      setToastMsg(`${name} 已在对比列表中`);
    } else if (compareIds.length >= 4) {
      setToastMsg('对比最多4个对象，请先移除');
    } else {
      setCompareIds([...compareIds, id]);
      setToastMsg(`已加入 ${name}，当前 ${compareIds.length + 1}/4`);
    }
    setTimeout(() => setToastMsg(''), 2200);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-primary text-white rounded-md shadow-lg animate-fade-in text-sm">
          {toastMsg}
        </div>
      )}

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
              融合电商平台、政府许可、投诉数据、专业评测等多源数据，经过专业采样、交叉验证、动态加权的严格评测流程，为消费者提供客观、专业、可溯源的垂直领域评价服务。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/rankings" className="btn-primary px-6 py-3">查看排行榜 <ArrowRight className="w-4 h-4 ml-2" /></Link>
              <Link to="/compare" className="btn-outline px-6 py-3">
                <GitCompare className="w-4 h-4 mr-2" />
                竞品对比 {compareIds.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary rounded text-xs">{compareIds.length}/4</span>}
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-12 max-w-lg">
              <div><div className="text-3xl font-bold font-serif text-white">2,480+</div><div className="text-sm text-slate-500 mt-1">评价报告</div></div>
              <div><div className="text-3xl font-bold font-serif text-white">18,600+</div><div className="text-sm text-slate-500 mt-1">评测对象</div></div>
              <div><div className="text-3xl font-bold font-serif text-white">98.5%</div><div className="text-sm text-slate-500 mt-1">数据可信度</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif font-bold text-white">四大评价领域</h2>
          <Link to="/rankings" className="text-primary text-sm hover:text-primary-dark inline-flex items-center gap-1">查看全部 <ChevronRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.code} to={`/category/${cat.code}`} className={`card card-hover p-6 block group animate-slide-up stagger-${idx + 1} cursor-pointer relative`}>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-6 h-6 ${cat.accent}`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{cat.name}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">{cat.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    查看规则与报告 <ChevronRight className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif font-bold text-white">各领域 Top 5 榜单</h2>
          <Link to="/compare" className="text-sm text-primary hover:text-primary-dark inline-flex items-center gap-1">
            <GitCompare className="w-4 h-4" /> 去对比 {compareIds.length > 0 && <span className="px-1.5 py-0.5 bg-primary/20 rounded text-xs">{compareIds.length}/4</span>}
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((cat, catIdx) => (
            <div key={cat.code} className={`card p-5 animate-slide-up stagger-${(catIdx % 4) + 1} relative`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <cat.icon className={`w-5 h-5 ${cat.accent}`} />
                  <h3 className="font-semibold text-white">{cat.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/compare" className="text-xs text-primary hover:text-primary-dark inline-flex items-center gap-1">
                    <GitCompare className="w-3 h-3" />
                    去对比 {compareIds.length > 0 && <span className="px-1 py-0.5 bg-primary/20 rounded text-xs">{compareIds.length}/4</span>}
                  </Link>
                  <Link to={`/rankings/${cat.code}`} className="text-xs text-slate-400 hover:text-primary inline-flex items-center">
                    完整榜单 <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
              <div className="space-y-2">
                {topRankings[cat.code].map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded hover:bg-surface-light/50 transition-colors group">
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-warning/20 text-warning' : 'bg-slate-700 text-slate-400'}`}>{idx + 1}</span>
                    <span className="flex-1 text-sm text-slate-200 truncate">{item.targetName}</span>
                    <span className="text-sm font-medium text-white">{item.score}</span>
                    <TrendBadge trend={item.trend} value={item.change} />
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCompare(item.id, item.targetName); }}
                      disabled={compareIds.includes(item.id)}
                      className={`p-1.5 rounded-md transition-all ${compareIds.includes(item.id) ? 'bg-primary/20 text-primary' : 'text-slate-500 hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100'}`}
                      title={compareIds.includes(item.id) ? '已加入对比' : '加入对比'}
                    >
                      {compareIds.includes(item.id) ? <GitCompare className="w-3.5 h-3.5" /> : <GitCompare className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6 animate-slide-up stagger-1">
            <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-primary" /><h3 className="font-semibold text-white">评测趋势</h3></div>
            <BarChart data={trendData} series={[{ key: '报告数', color: '#10B981', name: '报告数' }, { key: '参与用户', color: '#6366F1', name: '参与用户' }]} height={260} />
          </div>
          <div className="card p-6 animate-slide-up stagger-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /><h3 className="font-semibold text-white">热门报告</h3></div>
            </div>
            <div className="space-y-3">
              {hotReports.map((report, idx) => (
                <Link key={report.id} to={`/report/${report.id}`} className={`flex items-center gap-3 p-3 rounded hover:bg-surface-light/50 transition-colors animate-slide-up stagger-${idx + 1}`}>
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

      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif font-bold text-white">平台业务中心</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center"><ClipboardList className="w-4 h-4 text-accent" /></div>
                <h3 className="font-semibold text-white">评测计划排期</h3>
              </div>
              <Link to="/admin/plans" className="text-xs text-primary hover:text-primary-dark inline-flex items-center">查看全部 <ChevronRight className="w-3 h-3" /></Link>
            </div>
            <div className="space-y-3">
              {planItems.map((p) => (
                <div key={p.id} className="p-3 bg-surface-light/30 rounded-md">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white font-medium">{p.name}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />截止 {p.deadline}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="text-xs text-accent font-medium w-10 text-right">{p.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-surface-light/50">
              <Link to="/admin/plans" className="text-xs text-primary hover:text-primary-dark inline-flex items-center gap-1">
                查看全部计划 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-primary" /></div>
                <h3 className="font-semibold text-white">报告审核流</h3>
              </div>
              <Link to="/admin/reviews" className="text-xs text-primary hover:text-primary-dark inline-flex items-center">处理审核 <ChevronRight className="w-3 h-3" /></Link>
            </div>
            <div className="space-y-2">
              {reviewItems.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-2.5 bg-surface-light/30 rounded-md">
                  <Eye className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{r.title}</p>
                    <p className="text-xs text-slate-500">评测员：{r.reviewer}</p>
                  </div>
                  <StatusBadge status={r.status as any} />
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-surface-light/50">
              <Link to="/admin/reviews" className="text-xs text-primary hover:text-primary-dark inline-flex items-center gap-1">
                处理所有审核 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-warning/10 flex items-center justify-center"><MessageSquareWarning className="w-4 h-4 text-warning" /></div>
                <h3 className="font-semibold text-white">品牌申诉通道</h3>
              </div>
              <Link to="/brand/appeal" className="text-xs text-primary hover:text-primary-dark inline-flex items-center">处理申诉 <ChevronRight className="w-3 h-3" /></Link>
            </div>
            <div className="space-y-2">
              {appealItems.map((a) => (
                <div key={a.id} className="p-3 bg-warning/5 rounded-md border border-warning/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white font-medium">{a.brand}</span>
                    <StatusBadge status="pending" />
                  </div>
                  <p className="text-xs text-slate-400 truncate">申诉事由：{a.issue}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-surface-light/50">
              <Link to="/brand/appeal" className="text-xs text-primary hover:text-primary-dark inline-flex items-center gap-1">
                处理所有申诉 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-blue-400/10 flex items-center justify-center"><Scale className="w-4 h-4 text-blue-400" /></div>
                <h3 className="font-semibold text-white">权重与规则配置</h3>
              </div>
              <Link to="/admin/weights" className="text-xs text-primary hover:text-primary-dark inline-flex items-center">配置权重 <ChevronRight className="w-3 h-3" /></Link>
            </div>
            <div className="space-y-2.5">
              {weightItems.map((w) => (
                <div key={w.cat} className="p-2.5 bg-surface-light/30 rounded-md">
                  <div className="text-sm text-white font-medium mb-1.5">{w.cat}</div>
                  <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
                    {w.weights.map((text, i) => {
                      const match = text.match(/(\d+)%/);
                      const pct = match ? parseInt(match[1]) : 25;
                      const colors = ['bg-primary', 'bg-accent', 'bg-warning', 'bg-blue-400', 'bg-rose-400'];
                      return (
                        <div
                          key={i}
                          className={`${colors[i % colors.length]} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                          title={text}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {w.weights.map((text, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-surface-light text-slate-400 text-[10px]">{text}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-surface-light/50">
              <Link to="/admin/weights" className="text-xs text-primary hover:text-primary-dark inline-flex items-center gap-1">
                配置所有权重 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
