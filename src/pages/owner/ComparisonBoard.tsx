import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X, Plus, Check, Star, Calendar, Award, FileText, Building2,
  Clock, Shield, ChevronDown, Phone, CheckCircle2, AlertTriangle, Info, Table2, BarChart3, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  company: string;
  logo: string;
  tagline: string;
  totalPrice: number;
  period: string;
  mainMaterials: { name: string; brand: string; level: string }[];
  auxLevel: string;
  designer: { name: string; level: string; projects: number; rating: number };
  warranty: { main: string; aux: string; leak: string };
  highlights: string[];
  risks: string[];
  overall: string;
  score: number;
  detail: {
    materials: { name: string; brand: string; spec: string; qty: string; price: number }[];
    gantt: { phase: string; duration: string; tasks: string[] }[];
    warrantyText: string;
  };
}

const PLANS: Plan[] = [
  {
    id: 'p1', company: '悦家装饰', logo: '🏆', tagline: '省心整装高端品牌',
    totalPrice: 158000, period: '90天',
    mainMaterials: [
      { name: '地板', brand: '圣象/大自然', level: 'high' },
      { name: '瓷砖', brand: '马可波罗/诺贝尔', level: 'high' },
      { name: '橱柜', brand: '欧派/金牌', level: 'high' },
      { name: '卫浴', brand: '科勒/TOTO', level: 'high' },
      { name: '乳胶漆', brand: '芬琳/都芳', level: 'high' },
    ],
    auxLevel: '顶级',
    designer: { name: '王设计', level: '首席设计师', projects: 320, rating: 4.9 },
    warranty: { main: '5年', aux: '3年', leak: '终身保修' },
    highlights: ['明星设计师团队', '108项标准工艺', '12次节点验收', '零增项承诺', '环保不达标全额退款'],
    risks: [],
    overall: '推荐', score: 92,
    detail: {
      materials: [
        { name: '实木复合地板', brand: '圣象', spec: '1210×195×15mm', qty: '85㎡', price: 24480 },
        { name: '抛釉大理石瓷砖', brand: '马可波罗', spec: '800×800mm', qty: '62㎡', price: 18600 },
        { name: '整体橱柜', brand: '欧派', spec: '定制4.5地+2.5吊', qty: '1套', price: 32800 },
        { name: '智能马桶套装', brand: '科勒', spec: 'K-3900T', qty: '2台', price: 15600 },
        { name: '进口乳胶漆', brand: '芬琳', spec: '雅露系列', qty: '5桶', price: 8900 },
      ],
      gantt: [
        { phase: '拆除改造', duration: '7天', tasks: ['主体拆除', '墙体砌筑', '现场清理'] },
        { phase: '水电改造', duration: '12天', tasks: ['强电布设', '给排水管', '打压测试'] },
        { phase: '泥瓦工程', duration: '18天', tasks: ['厨卫防水', '墙地砖铺贴'] },
        { phase: '木工工程', duration: '15天', tasks: ['吊顶安装', '定制柜安装'] },
        { phase: '油漆工程', duration: '16天', tasks: ['基层处理', '腻子批刮', '底漆面漆'] },
        { phase: '安装工程', duration: '12天', tasks: ['地板铺装', '灯具安装', '五金洁具'] },
        { phase: '竣工验收', duration: '10天', tasks: ['整体保洁', '空气质量检测'] },
      ],
      warrantyText: '整体工程质保5年，水电隐蔽工程终身保修，防水终身保修。24小时上门服务热线，48小时内响应到场处理。',
    },
  },
  {
    id: 'p2', company: '简美装饰', logo: '⭐', tagline: '性价比首选品牌',
    totalPrice: 128000, period: '75天',
    mainMaterials: [
      { name: '地板', brand: '德尔/菲林格尔', level: 'mid' },
      { name: '瓷砖', brand: '东鹏/蒙娜丽莎', level: 'mid' },
      { name: '橱柜', brand: '志邦/尚品', level: 'mid' },
      { name: '卫浴', brand: '九牧/箭牌', level: 'mid' },
      { name: '乳胶漆', brand: '多乐士/立邦', level: 'mid' },
    ],
    auxLevel: '优质',
    designer: { name: '李设计', level: '资深设计师', projects: 210, rating: 4.7 },
    warranty: { main: '3年', aux: '2年', leak: '10年' },
    highlights: ['本地20年老品牌', '72项标准工艺', '水电走顶工艺', '知名品牌主材'],
    risks: ['不做防水二次闭水', '部分辅材品牌可选'],
    overall: '优秀', score: 85,
    detail: {
      materials: [
        { name: '强化复合地板', brand: '德尔', spec: '1215×192×12mm', qty: '85㎡', price: 17850 },
        { name: '通体大理石瓷砖', brand: '东鹏', spec: '800×800mm', qty: '62㎡', price: 13640 },
        { name: '整体橱柜', brand: '志邦', spec: '定制4地+2吊', qty: '1套', price: 22800 },
        { name: '卫浴三件套', brand: '九牧', spec: '组合套装', qty: '2套', price: 9600 },
        { name: '净味乳胶漆', brand: '多乐士', spec: '竹炭系列', qty: '5桶', price: 5800 },
      ],
      gantt: [
        { phase: '拆除改造', duration: '5天', tasks: ['主体拆除', '墙体砌筑'] },
        { phase: '水电改造', duration: '10天', tasks: ['水电布设', '打压测试'] },
        { phase: '泥瓦工程', duration: '15天', tasks: ['防水施工', '瓷砖铺贴'] },
        { phase: '木工工程', duration: '12天', tasks: ['吊顶安装', '定制柜安装'] },
        { phase: '油漆工程', duration: '14天', tasks: ['腻子乳胶漆', '成品安装'] },
        { phase: '安装工程', duration: '15天', tasks: ['综合安装', '保洁验收'] },
      ],
      warrantyText: '整体工程质保3年，水电10年保修，防水10年。工作日24小时响应。',
    },
  },
  {
    id: 'p3', company: '新家装饰', logo: '💎', tagline: '网红新势力品牌',
    totalPrice: 188000, period: '105天',
    mainMaterials: [
      { name: '地板', brand: '生活家/必美(进口)', level: 'high' },
      { name: '瓷砖', brand: '诺贝尔/依诺岩板', level: 'high' },
      { name: '橱柜', brand: '博洛尼/威法', level: 'high' },
      { name: '卫浴', brand: '高仪/汉斯格雅(进口)', level: 'high' },
      { name: '乳胶漆', brand: '本杰明摩尔(进口)', level: 'high' },
    ],
    auxLevel: '顶级',
    designer: { name: '陈设计', level: '设计总监', projects: 450, rating: 5.0 },
    warranty: { main: '10年', aux: '5年', leak: '终身保修' },
    highlights: ['德系精工工艺', '全屋进口主材', '1对1全程管家', 'VR可视化施工', '第三方监理'],
    risks: ['施工周期较长'],
    overall: '推荐', score: 95,
    detail: {
      materials: [
        { name: '三层实木地板', brand: '必美(奥地利)', spec: '2200×190×14mm', qty: '85㎡', price: 42500 },
        { name: '大板岩板', brand: '依诺', spec: '900×1800mm', qty: '62㎡', price: 31000 },
        { name: '高端定制橱柜', brand: '博洛尼', spec: '实木定制', qty: '1套', price: 58000 },
        { name: '进口智能卫浴', brand: '高仪(德国)', spec: '智能套装', qty: '2套', price: 28800 },
        { name: '原装进口漆', brand: '本杰明摩尔', spec: '美国原装', qty: '6桶', price: 12800 },
      ],
      gantt: [
        { phase: '拆除改造', duration: '8天', tasks: ['精细拆除', '新建墙体'] },
        { phase: '水电改造', duration: '15天', tasks: ['德国标准', '全屋净水前置', '智能布线'] },
        { phase: '泥瓦工程', duration: '20天', tasks: ['三遍防水', '二次排水', '瓷砖薄贴'] },
        { phase: '木工工程', duration: '20天', tasks: ['轻钢龙骨吊顶', '进口五金配件'] },
        { phase: '油漆工程', duration: '20天', tasks: ['全屋挂网', '三层腻子', '专业喷涂'] },
        { phase: '安装工程', duration: '15天', tasks: ['精细安装', '成品保护'] },
        { phase: '竣工验收', duration: '7天', tasks: ['第三方监理验收', '空气净化'] },
      ],
      warrantyText: '整体工程质保10年，水电防水终身保修。专属管家7×24小时服务。',
    },
  },
];

const DIMS = [
  { key: 'totalPrice', label: '方案总价', icon: BarChart3, type: 'price' },
  { key: 'period', label: '施工周期', icon: Calendar, type: 'text' },
  { key: 'mainMaterials', label: '主材品牌', icon: Table2, type: 'materials' },
  { key: 'auxLevel', label: '辅材等级', icon: Award, type: 'level' },
  { key: 'designer', label: '设计师资质', icon: Sparkles, type: 'designer' },
  { key: 'warranty', label: '质保条款', icon: Shield, type: 'warranty' },
  { key: 'highlights', label: '服务亮点', icon: CheckCircle2, type: 'tags' },
  { key: 'risks', label: '潜在风险', icon: AlertTriangle, type: 'risks' },
];

function getLevelStyle(level: string) {
  if (level === 'high' || level === '顶级') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (level === 'mid' || level === '优质') return 'bg-wood-50 text-wood-700 border border-wood-200';
  return 'bg-ivory-100 text-carbon-600 border border-ivory-200';
}

function OverallBadge({ overall }: { overall: string }) {
  if (overall === '推荐') return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm">✅ 最推荐</span>;
  if (overall === '优秀') return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-wood-400 to-wood-500 text-white shadow-sm">⭐ 优秀方案</span>;
  return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-haze-400 to-haze-500 text-white shadow-sm">📋 标准方案</span>;
}

function CellContent({ dim, plan }: { dim: typeof DIMS[number]; plan: Plan }) {
  const val = (plan as Record<string, unknown>)[dim.key];

  if (dim.type === 'price') {
    const price = val as number;
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-terracotta-600 font-mono">
          ¥{(price / 10000).toFixed(2)}<span className="text-sm font-normal">万</span>
        </div>
        <div className="text-xs text-ivory-500 mt-1">90㎡建筑面积</div>
      </div>
    );
  }

  if (dim.type === 'text') {
    return (
      <div className="text-center">
        <div className="text-lg font-bold text-carbon-800 flex items-center justify-center gap-1.5">
          <Clock className="w-4 h-4 text-haze-500" />
          {val as string}
        </div>
        <div className="text-xs text-ivory-500 mt-0.5">含验收缓冲期</div>
      </div>
    );
  }

  if (dim.type === 'materials') {
    const items = val as Plan['mainMaterials'];
    return (
      <div className="space-y-1.5">
        {items.slice(0, 3).map((m) => (
          <div key={m.name} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-carbon-600">{m.name}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${getLevelStyle(m.level)}`}>{m.brand}</span>
          </div>
        ))}
        {items.length > 3 && <div className="text-[10px] text-ivory-400">...共{items.length}项，点击展开</div>}
      </div>
    );
  }

  if (dim.type === 'level') {
    return (
      <div className="text-center">
        <span className={`inline-block px-4 py-1.5 rounded-lg text-sm font-semibold ${getLevelStyle(val as string)}`}>{val as string}</span>
      </div>
    );
  }

  if (dim.type === 'designer') {
    const d = val as Plan['designer'];
    return (
      <div className="text-center">
        <div className="w-8 h-8 mx-auto rounded-full bg-wood-100 flex items-center justify-center text-wood-700 font-bold text-xs mb-1">{d.name[0]}</div>
        <div className="text-sm font-medium text-carbon-800">{d.name}</div>
        <div className="text-[10px] text-ivory-500">{d.level}</div>
        <div className="flex items-center justify-center gap-2 text-[10px] text-ivory-500 mt-0.5">
          <span>{d.projects}套</span>
          <span>⭐{d.rating}</span>
        </div>
      </div>
    );
  }

  if (dim.type === 'warranty') {
    const w = val as Plan['warranty'];
    return (
      <div className="text-center space-y-1.5">
        <div className="inline-flex flex-wrap justify-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] border border-emerald-200">主体{w.main}</span>
          <span className="px-2 py-0.5 rounded bg-wood-50 text-wood-700 text-[10px] border border-wood-200">辅材{w.aux}</span>
        </div>
        <div><span className="px-2 py-0.5 rounded bg-haze-50 text-haze-700 text-[10px] border border-haze-200">防水{w.leak}</span></div>
      </div>
    );
  }

  if (dim.type === 'tags') {
    const items = val as string[];
    return (
      <div className="flex flex-wrap justify-center gap-1">
        {items.length > 0 ? items.map((t) => (
          <span key={t} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] border border-emerald-200">
            <Check className="w-3 h-3" />{t}
          </span>
        )) : <span className="text-xs text-ivory-400">—</span>}
      </div>
    );
  }

  if (dim.type === 'risks') {
    const items = val as string[];
    return (
      <div className="flex flex-wrap justify-center gap-1">
        {items.length > 0 ? items.map((t) => (
          <span key={t} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] border border-rose-200">
            <AlertTriangle className="w-3 h-3" />{t}
          </span>
        )) : <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-ivory-100 text-ivory-500 text-[10px]">无明显风险</span>}
      </div>
    );
  }

  return null;
}

function ExpandedDetail({ plan, dimKey }: { plan: Plan; dimKey: string }) {
  if (dimKey === 'mainMaterials') {
    return (
      <div className="mt-3 pt-3 border-t border-dashed border-ivory-200">
        <div className="text-xs font-semibold text-carbon-700 mb-2 flex items-center gap-1"><FileText className="w-3.5 h-3.5" />主材清单明细</div>
        <table className="w-full text-[11px]">
          <thead><tr className="bg-ivory-50"><th className="px-2 py-1 text-left">材料</th><th className="px-2 py-1 text-left">品牌</th><th className="px-2 py-1 text-right">数量</th><th className="px-2 py-1 text-right">金额</th></tr></thead>
          <tbody>
            {plan.detail.materials.map((m) => (
              <tr key={m.name} className="border-t border-ivory-100"><td className="px-2 py-1">{m.name}</td><td className="px-2 py-1 text-wood-700">{m.brand}</td><td className="px-2 py-1 text-right">{m.qty}</td><td className="px-2 py-1 text-right font-mono text-terracotta-600">¥{m.price.toLocaleString()}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (dimKey === 'warranty') {
    return (
      <div className="mt-3 pt-3 border-t border-dashed border-ivory-200">
        <div className="text-xs font-semibold text-carbon-700 mb-2 flex items-center gap-1"><Shield className="w-3.5 h-3.5" />质保条款原文</div>
        <p className="text-[11px] text-carbon-600 leading-relaxed">{plan.detail.warrantyText}</p>
      </div>
    );
  }
  if (dimKey === 'period') {
    return (
      <div className="mt-3 pt-3 border-t border-dashed border-ivory-200">
        <div className="text-xs font-semibold text-carbon-700 mb-2 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />施工进度甘特图</div>
        <div className="space-y-1.5">
          {plan.detail.gantt.map((g, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-16 text-[10px] text-carbon-600 shrink-0"><div className="font-semibold">{g.phase}</div><div className="text-ivory-500">{g.duration}</div></div>
              <div className="flex-1"><div className="h-5 rounded bg-gradient-to-r from-wood-200 to-wood-400" style={{ width: `${50 + Math.random() * 40}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function ComparisonBoard() {
  const [selectedIds, setSelectedIds] = useState<string[]>(PLANS.slice(0, 3).map((p) => p.id));
  const [diffOnly, setDiffOnly] = useState(false);
  const [expanded, setExpanded] = useState<{ dimKey: string; planId: string } | null>(null);

  const active = PLANS.filter((p) => selectedIds.includes(p.id));
  const topPlan = [...active].sort((a, b) => b.score - a.score)[0];

  const isSame = (dimKey: string) => {
    if (active.length < 2) return false;
    const vals = active.map((p) => JSON.stringify((p as Record<string, unknown>)[dimKey]));
    return new Set(vals).size === 1;
  };

  const toggleExpand = (dimKey: string, planId: string) => {
    setExpanded((prev) => (prev?.dimKey === dimKey && prev.planId === planId ? null : { dimKey, planId }));
  };

  const isExpandable = (type: string) => ['materials', 'warranty', 'text'].includes(type);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="section-title">方案比价看板</h1>
        <p className="section-subtitle">多维度对比装修方案，AI帮你选出最合适的装修公司</p>
      </div>

      <div className="card-base p-5 mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-carbon-700">已选方案：</span>
            <div className="flex items-center gap-2 flex-wrap">
              {active.map((plan) => (
                <div key={plan.id} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-ivory-200 shadow-sm group">
                  <span className="text-xl">{plan.logo}</span>
                  <span className="font-medium text-sm text-carbon-800">{plan.company}</span>
                  <span className="text-xs text-terracotta-600 font-semibold font-mono">¥{(plan.totalPrice / 10000).toFixed(1)}万</span>
                  {selectedIds.length > 2 && (
                    <button onClick={() => setSelectedIds((prev) => prev.filter((id) => id !== plan.id))} className="ml-1 w-5 h-5 rounded-full bg-ivory-100 text-carbon-400 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-terracotta-500 hover:text-white transition-all">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {selectedIds.length < 4 && (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-ivory-300 hover:border-terracotta-400 hover:bg-terracotta-50 transition-all text-sm text-ivory-500 hover:text-terracotta-600">
                    <Plus className="w-4 h-4" />添加方案
                  </button>
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl border border-ivory-200 shadow-card-hover py-2 z-20 hidden group-hover:block min-w-[180px]">
                    {PLANS.filter((p) => !selectedIds.includes(p.id)).map((p) => (
                      <button key={p.id} onClick={() => setSelectedIds((prev) => [...prev, p.id])} className="w-full px-4 py-2 text-left text-sm hover:bg-ivory-50 flex items-center gap-2">
                        <span>{p.logo}</span><span className="flex-1">{p.company}</span><span className="text-xs text-terracotta-600 font-mono">¥{(p.totalPrice / 10000).toFixed(1)}万</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div onClick={() => setDiffOnly(!diffOnly)} className={cn('w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer', diffOnly ? 'bg-terracotta-500' : 'bg-ivory-300')}>
              <motion.div animate={{ x: diffOnly ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="w-5 h-5 bg-white rounded-full shadow-md" />
            </div>
            <span className="text-sm text-carbon-600 font-medium">只看差异项</span>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin card-base overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-ivory-50 border-b border-ivory-200">
              <th className="sticky left-0 z-10 bg-ivory-50 px-5 py-5 text-left font-medium text-ivory-500 min-w-[180px]">
                <Info className="w-4 h-4 text-haze-500 inline mr-1" />对比维度
              </th>
              {active.map((plan) => (
                <th key={plan.id} className="px-5 py-5 text-center min-w-[220px]">
                  <OverallBadge overall={plan.overall} />
                  <div className="text-3xl mt-2">{plan.logo}</div>
                  <div className="font-serif text-lg font-bold text-carbon-900 mt-1">{plan.company}</div>
                  <div className="text-xs text-ivory-500">{plan.tagline}</div>
                  <div className="mt-2 text-sm text-carbon-600 flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-carbon-800">{plan.score}</span><span className="text-xs">综合分</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIMS.filter((d) => !diffOnly || !isSame(d.key)).map((dim, dimIdx) => {
              const DimIcon = dim.icon;
              return (
                <tr key={dim.key} className={cn('border-b border-ivory-100', dimIdx % 2 === 1 && 'bg-ivory-50/50')}>
                  <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', dimIdx % 2 === 0 ? 'bg-wood-100 text-wood-600' : 'bg-haze-100 text-haze-600')}>
                        <DimIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-carbon-800">{dim.label}</div>
                        {isExpandable(dim.type) && <div className="text-[10px] text-ivory-400">点击展开</div>}
                      </div>
                    </div>
                  </td>
                  {active.map((plan) => {
                    const same = isSame(dim.key);
                    const expandable = isExpandable(dim.type);
                    const isExp = expanded?.dimKey === dim.key && expanded?.planId === plan.id;
                    return (
                      <td
                        key={plan.id}
                        className={cn(
                          'px-5 py-4',
                          !same && active.length > 1 && 'bg-terracotta-50/40',
                          expandable && 'cursor-pointer hover:bg-terracotta-50 transition-colors'
                        )}
                        onClick={() => expandable && toggleExpand(dim.key, plan.id)}
                      >
                        <CellContent dim={dim} plan={plan} />
                        <AnimatePresence>
                          {expandable && isExp && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <ExpandedDetail plan={plan} dimKey={dim.key} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {topPlan && (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mt-8 card-base p-6 md:p-8 bg-gradient-to-br from-emerald-50 via-amber-50/50 to-wood-50 border-emerald-100 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-200/30" />
          <div className="relative grid md:grid-cols-5 gap-6 items-center">
            <div className="md:col-span-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-4xl">🏆</div>
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-sm">AI推荐</span>
                  <h3 className="font-serif text-2xl font-bold text-carbon-900 mt-1">综合推荐：{topPlan.company}</h3>
                </div>
              </div>
              <p className="text-carbon-600 mt-2 leading-relaxed">
                综合对比后，<span className="font-semibold">{topPlan.company}</span> 在{topPlan.highlights.slice(0, 2).join('、')}等方面表现突出，更适合大多数家庭装修需求。
              </p>
            </div>
            <div className="md:col-span-2">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-white shadow-sm">
                  <div><div className="text-2xl font-bold font-serif">{topPlan.logo}</div><div className="text-sm text-carbon-700">{topPlan.company}</div></div>
                  <div className="text-right"><div className="text-3xl font-bold text-terracotta-600 font-mono">¥{(topPlan.totalPrice / 10000).toFixed(2)}<span className="text-base">万</span></div><div className="text-[10px] text-ivory-500">{topPlan.period}</div></div>
                </div>
                <Link to="/owner/companies/1" className="btn-cta w-full justify-center">
                  <Phone className="w-4 h-4" />预约该公司
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
