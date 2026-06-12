import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Eye, MessageSquare, SlidersHorizontal, ChevronDown, ChevronUp, Grid3X3, List, Search, RotateCcw, Check, ChevronRight, Target, Flame, Award } from 'lucide-react';
import { mockCases, industries, positions, experienceLevels } from '@/data/mockCases';
import type { ResumeCase, HRReview } from '@/types/case';

type SortKey = '热门' | '最新' | '评分' | '修改次数';
type ViewMode = 'grid' | 'list';

const sortFn: Record<SortKey, (a: ResumeCase, b: ResumeCase) => number> = {
  '热门': (a, b) => b.hrReviews.length - a.hrReviews.length,
  '最新': (a, b) => b.id.localeCompare(a.id),
  '评分': (a, b) => b.rating - a.rating,
  '修改次数': (a, b) => b.tags.length - a.tags.length,
};

function seededRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h) + seed.charCodeAt(i), h |= 0;
  return Math.abs(h % 10000) / 10000;
}

const POSITION_MAP: Record<string, string[]> = {
  '互联网': ['前端工程师', '产品经理', '算法工程师', 'UI设计师', '后端工程师'],
  '金融': ['投资分析师', '风控专员', '客户经理', '量化研究员'],
  '制造': ['工艺工程师', '质量工程师', '生产主管'],
  '医疗': ['临床研究员', '医疗器械工程师', '医药代表'],
  '教育': ['课程设计师', '教研主管', '在线讲师'],
  '咨询': ['战略顾问', '管理咨询', '数据分析师'],
  '媒体': ['内容运营', '新媒体编辑', '视频剪辑师'],
  '零售': ['店长', '买手', '供应链专员'],
};

const EXPERIENCE_PREF: Record<string, Record<string, number>> = {
  '互联网': { '前端工程师': 43, '产品经理': 38, '算法工程师': 52, 'UI设计师': 29 },
};

export default function Cases() {
  const [selIndustries, setSelIndustries] = useState<string[]>([]);
  const [selPositions, setSelPositions] = useState<string[]>([]);
  const [selLevel, setSelLevel] = useState<string>('');
  const [sort, setSort] = useState<SortKey>('热门');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchText, setSearchText] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ industry: false, position: false, level: false });
  const [showToast, setShowToast] = useState(false);
  const [detailCase, setDetailCase] = useState<ResumeCase | null>(null);
  const [activeAnchor, setActiveAnchor] = useState<HRReview | null>(null);

  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 2000);
    return () => clearTimeout(t);
  }, [showToast]);

  const caseViews = useMemo(() => {
    const map: Record<string, number> = {};
    mockCases.forEach(c => { map[c.id] = Math.floor(seededRandom(c.id) * 4500) + 500; });
    return map;
  }, []);

  const industryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mockCases.forEach(c => { counts[c.industry] = (counts[c.industry] || 0) + 1; });
    return counts;
  }, []);

  const toggle = (arr: string[], v: string, set: React.Dispatch<React.SetStateAction<string[]>>) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const toggleCollapse = (key: string) =>
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const filtered = useMemo(() => {
    let list = mockCases;
    if (selIndustries.length) list = list.filter(c => selIndustries.includes(c.industry));
    if (selPositions.length) list = list.filter(c => selPositions.includes(c.position));
    if (selLevel) list = list.filter(c => c.experienceLevel === selLevel);
    if (searchText) {
      const s = searchText.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(s) || c.tags.some(t => t.toLowerCase().includes(s)));
    }
    return [...list].sort(sortFn[sort]);
  }, [selIndustries, selPositions, selLevel, sort, searchText]);

  const activeTags = [
    ...selIndustries.map(v => ({ type: '行业', label: v, clear: () => setSelIndustries(selIndustries.filter(x => x !== v)) })),
    ...selPositions.map(v => ({ type: '岗位', label: v, clear: () => setSelPositions(selPositions.filter(x => x !== v)) })),
    ...(selLevel ? [{ type: '经验', label: experienceLevels.find(e => e.value === selLevel)?.label || selLevel, clear: () => setSelLevel('') }] : []),
  ];

  const resetFilters = () => {
    setSelIndustries([]);
    setSelPositions([]);
    setSelLevel('');
    setSearchText('');
    setShowToast(true);
  };

  const hitRate = Math.round((filtered.length / mockCases.length) * 100);
  const currentInd = selIndustries[0];
  const currentPos = selPositions[0];
  const recommendedExp = currentInd && currentPos && EXPERIENCE_PREF[currentInd]?.[currentPos]
    ? { level: '3-5年', pct: EXPERIENCE_PREF[currentInd][currentPos] }
    : null;

  const breadcrumbParts: { label: string; detail?: string }[] = [{ label: '全部案例' }];
  if (currentInd) breadcrumbParts.push({ label: `行业: ${currentInd}`, detail: `关联岗位: ${(POSITION_MAP[currentInd] || []).join('/')}` });
  if (currentPos) breadcrumbParts.push({ label: `岗位: ${currentPos}`, detail: recommendedExp ? `推荐经验: ${recommendedExp.level} (${recommendedExp.pct}%的HR偏好)` : undefined });
  if (selLevel) breadcrumbParts.push({ label: `经验: ${experienceLevels.find(e => e.value === selLevel)?.label}`, detail: `三级筛选已生效 · 命中 ${filtered.length}/${mockCases.length} 份案例` });

  const totalHRReviews = mockCases.reduce((s, c) => s + c.hrReviews.length, 0);
  const avgRating = (mockCases.reduce((s, c) => s + c.rating, 0) / mockCases.length).toFixed(1);

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        return <Star key={i} className={`w-3.5 h-3.5 ${i < fullStars ? 'text-gold-500 fill-gold-500' : (i === fullStars && hasHalf ? 'text-gold-500 fill-gold-500/50' : 'text-surface-200')}`} />;
      })}
    </div>
  );

  const getAnchorSummary = (c: ResumeCase) => {
    const pos = c.hrReviews.filter(r => r.type === 'positive').length;
    const sug = c.hrReviews.filter(r => r.type === 'suggestion').length;
    const war = c.hrReviews.filter(r => r.type === 'warning').length;
    return { total: c.hrReviews.length, pos, sug, war };
  };

  const FilterSection = ({ title, keyName, children }: { title: string; keyName: string; children: React.ReactNode }) => (
    <div className="mb-5">
      <button onClick={() => toggleCollapse(keyName)} className="flex items-center justify-between w-full mb-3">
        <h4 className="font-display text-sm font-bold text-brand-900">{title}</h4>
        {collapsed[keyName] ? <ChevronDown className="w-4 h-4 text-surface-300" /> : <ChevronUp className="w-4 h-4 text-surface-300" />}
      </button>
      {!collapsed[keyName] && children}
    </div>
  );

  const Card = ({ c, i }: { c: ResumeCase; i: number }) => {
    const anchors = getAnchorSummary(c);
    return (
      <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
        className="group relative glass-card card-hover overflow-hidden bg-white cursor-pointer" onClick={() => setDetailCase(c)}>
        <div className="h-36 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-5 relative overflow-hidden">
          <div className="space-y-2.5 relative z-10">
            <div className="h-2.5 w-3/4 bg-white/20 rounded-full" />
            <div className="h-2 w-1/2 bg-white/15 rounded-full" />
            <div className="h-2 w-2/3 bg-white/15 rounded-full" />
            <div className="h-2 w-1/3 bg-brand-400/40 rounded-full" />
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl" />
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="px-2 py-0.5 text-xs bg-brand-500/10 text-brand-600 rounded-full font-medium">{c.industry}</span>
            <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-600 rounded-full font-medium">{c.position}</span>
            <span className="px-2 py-0.5 text-xs bg-gold-500/10 text-gold-600 rounded-full font-medium">
              {experienceLevels.find(e => e.value === c.experienceLevel)?.label}
            </span>
          </div>
          <h3 className="font-display font-bold text-lg text-brand-900 mb-2 line-clamp-1 group-hover:text-brand-600 transition-colors">{c.title}</h3>
          <div className="flex items-center gap-2 mb-2">
            {renderStars(c.rating)}
            <span className="text-sm font-mono text-gold-600 font-bold">{c.rating}</span>
          </div>
          <div className="mb-3 px-2.5 py-2 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-lg border border-sky-100">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-sky-700 font-medium">
                <Target className="w-3.5 h-3.5" /> 含 {anchors.total} 条HR锚点
              </span>
              <span className="text-surface-500">正面{anchors.pos}·建议{anchors.sug}·警告{anchors.war}</span>
            </div>
            <button className="mt-1.5 text-[11px] text-brand-600 hover:text-brand-700 font-medium underline underline-offset-2" onClick={(e) => { e.stopPropagation(); setDetailCase(c); }}>
              查看锚点分布 →
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-surface-400">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /><span>{caseViews[c.id] || 0}</span></div>
              <div className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /><span>{anchors.total}点评</span></div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="w-full py-2 bg-brand-900 text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors" onClick={(e) => { e.stopPropagation(); setDetailCase(c); }}>
              查看详情
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const AnchorDot = ({ type, top, left, review }: { type: string; top: string; left: string; review: HRReview }) => {
    const color = type === 'positive' ? 'bg-emerald-500' : type === 'suggestion' ? 'bg-amber-400' : 'bg-red-500';
    const isActive = activeAnchor?.id === review.id;
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setActiveAnchor(isActive ? null : review); }}
        className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${color} border-2 border-white shadow-md z-10 transition-all hover:scale-125 ${isActive ? 'scale-125 ring-2 ring-offset-2 ring-brand-500' : ''}`}
        style={{ top, left }}
      />
    );
  };

  return (
    <div className="flex h-full relative">
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-brand-900 text-white rounded-xl shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">已重置所有筛选条件</span>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="w-72 shrink-0 border-r border-surface-100 bg-white flex flex-col">
        <div className="p-6 border-b border-surface-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <h3 className="font-display font-bold text-brand-900">筛选条件</h3>
              <p className="text-xs text-surface-400">精准匹配你的需求</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gradient-to-r from-brand-50 to-emerald-50 rounded-xl border border-brand-100">
            <p className="text-xs text-surface-500 mb-1">筛选命中率</p>
            <p className="text-lg font-bold text-brand-700 font-mono">
              <span className="text-emerald-600">{filtered.length}</span>/{mockCases.length} 份
              <span className="ml-2 text-sm text-emerald-600 font-bold">{hitRate}%</span>
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-5">
            <p className="text-xs text-surface-400 mb-2">已选条件</p>
            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              <AnimatePresence mode="popLayout">
                {activeTags.map((t, idx) => (
                  <motion.span key={`${t.type}-${t.label}`} layout initial={{ opacity: 0, scale: 0.8, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-brand-500 text-white rounded-full">
                    <span className="opacity-80">{t.type}:</span>{t.label}
                    <button onClick={t.clear} className="hover:bg-white/20 rounded-full p-0.5 -mr-1">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              {activeTags.length === 0 && <span className="text-xs text-surface-300 py-1">暂无筛选条件</span>}
            </div>
          </div>

          <FilterSection title="行业" keyName="industry">
            <div className="space-y-2">
              {industries.map(item => (
                <label key={item} className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selIndustries.includes(item)} onChange={() => toggle(selIndustries, item, setSelIndustries)}
                      className="w-4 h-4 rounded border-surface-200 text-brand-500 focus:ring-brand-500 focus:ring-offset-0" />
                    <span className="text-sm text-surface-600 group-hover:text-brand-600 transition-colors">{item}</span>
                  </div>
                  <span className="text-xs text-surface-300 font-mono">{industryCounts[item] || 0}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="岗位" keyName="position">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300" />
              <input type="text" placeholder="搜索岗位..." value={searchText} onChange={e => setSearchText(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500" />
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {positions.filter(p => !currentInd || POSITION_MAP[currentInd]?.includes(p)).map(item => (
                <label key={item} className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={selPositions.includes(item)} onChange={() => toggle(selPositions, item, setSelPositions)}
                    className="w-4 h-4 rounded border-surface-200 text-brand-500 focus:ring-brand-500 focus:ring-offset-0" />
                  <span className="text-sm text-surface-600 group-hover:text-brand-600 transition-colors">{item}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="经验层级" keyName="level">
            <div className="space-y-2">
              {experienceLevels.map(lv => (
                <button key={lv.value} onClick={() => setSelLevel(selLevel === lv.value ? '' : lv.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                    selLevel === lv.value
                      ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                      : 'bg-white text-surface-600 border-surface-200 hover:border-brand-300 hover:text-brand-600'
                  }`}>
                  <div className={`w-2 h-2 rounded-full ${selLevel === lv.value ? 'bg-white' : 'bg-surface-300'}`} />
                  <span className="text-sm font-medium">{lv.label}</span>
                  {recommendedExp && lv.label === recommendedExp.level && (
                    <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">{recommendedExp.pct}%偏好</span>
                  )}
                </button>
              ))}
            </div>
          </FilterSection>
        </div>

        <div className="p-6 border-t border-surface-50">
          <button onClick={resetFilters}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-surface-500 hover:text-brand-500 border border-surface-200 hover:border-brand-300 rounded-lg transition-colors">
            <RotateCcw className="w-4 h-4" />
            重置筛选
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-surface-50/30">
        <div className="px-8 py-4 bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-800 text-white">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2"><Award className="w-4 h-4 text-gold-400" /><span className="text-sm">案例库总计: <b className="font-mono text-gold-300">{mockCases.length}</b> 份</span></div>
            <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" /><span className="text-sm">覆盖行业: <b className="font-mono text-orange-300">{industries.length}</b></span></div>
            <div className="flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400" /><span className="text-sm">覆盖岗位: <b className="font-mono text-emerald-300">{positions.length}</b></span></div>
            <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-sky-400" /><span className="text-sm">HR点评总数: <b className="font-mono text-sky-300">{totalHRReviews}</b>条</span></div>
            <div className="flex items-center gap-2"><Star className="w-4 h-4 text-gold-400 fill-gold-400" /><span className="text-sm">平均评分: <b className="font-mono text-gold-300">{avgRating}/5.0</b></span></div>
          </div>
        </div>

        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-surface-100 px-8 py-5">
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input type="text" placeholder="搜索案例标题、关键词..." value={searchText} onChange={e => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white" />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4 text-xs text-surface-500 overflow-x-auto pb-1">
            <span className="flex items-center gap-1.5 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-500" /> 筛选轨迹:
            </span>
            {breadcrumbParts.map((item, idx) => (
              <span key={idx} className="flex items-center gap-1.5 shrink-0 max-w-md">
                {idx > 0 && <ChevronRight className="w-3 h-3 text-surface-300" />}
                <div className="flex flex-col">
                  <span className={`px-2 py-0.5 rounded-full ${idx === breadcrumbParts.length - 1 && selLevel ? 'bg-brand-500 text-white font-medium' : 'bg-surface-100 text-surface-600'}`}>
                    {item.label}
                  </span>
                  {item.detail && <span className="text-[10px] text-surface-400 mt-0.5 pl-2">{item.detail}</span>}
                </div>
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="font-display text-2xl font-bold text-brand-900">案例库</h1>
              <span className="px-3 py-1 bg-brand-500/10 text-brand-600 rounded-full text-sm font-medium">
                命中率 <b className="font-mono">{hitRate}%</b> · 共 {filtered.length} 份精选简历
              </span>
            </div>
            <div className="flex items-center gap-3">
              <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                className="text-sm border border-surface-200 rounded-lg px-3.5 py-2 bg-white text-surface-600 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 cursor-pointer">
                {(['热门', '最新', '评分', '修改次数'] as SortKey[]).map(s => <option key={s} value={s}>最{s}</option>)}
              </select>
              <div className="flex items-center bg-surface-100 rounded-lg p-1">
                <button onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-brand-600 shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}>
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-surface-400 hover:text-surface-600'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-surface-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg">暂无匹配案例</p>
              <p className="text-sm mt-1">请调整筛选条件或搜索关键词</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-3' : 'grid-cols-1'}`}>
              {filtered.map((c, i) => <Card key={c.id} c={c} i={i} />)}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {detailCase && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => { setDetailCase(null); setActiveAnchor(null); }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-gradient-to-r from-brand-900 to-brand-800 text-white">
                <div>
                  <h2 className="font-display font-bold text-xl">{detailCase.title}</h2>
                  <p className="text-xs text-brand-200 mt-0.5">{detailCase.industry} · {detailCase.position} · {experienceLevels.find(e => e.value === detailCase.experienceLevel)?.label} · 评分 {detailCase.rating}/5.0</p>
                </div>
                <button onClick={() => { setDetailCase(null); setActiveAnchor(null); }} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <X className="w-4 h-4" /> 关闭详情
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex">
                <div className="flex-1 overflow-auto p-8 bg-surface-50/50 relative">
                  <div className="max-w-[640px] mx-auto bg-white shadow-xl rounded-xl p-10 relative min-h-[800px]">
                    {detailCase.hrReviews.map((r, idx) => (
                      <AnchorDot key={r.id} type={r.type} top={`${15 + idx * 12}%`} left={`${30 + (idx % 4) * 15}%`} review={r} />
                    ))}
                    <h1 className="text-3xl font-bold text-brand-900 mb-1" style={{ fontFamily: 'serif' }}>张 某 某</h1>
                    <p className="text-sm text-surface-500 mb-6">高级{detailCase.position} · 上海 · 138-xxxx-xxxx · example@email.com</p>
                    <div className="space-y-6">
                      <section><h2 className="text-base font-bold text-brand-800 border-b-2 border-brand-500 pb-1 mb-3">个人简介</h2>
                        <p className="text-sm text-surface-700 leading-relaxed">拥有{experienceLevels.find(e => e.value === detailCase.experienceLevel)?.label}相关工作经验，擅长{detailCase.tags.slice(0, 3).join('、')}。曾在多家头部{detailCase.industry}企业任职，主导过多个核心项目，具备优秀的团队协作和项目管理能力。</p>
                      </section>
                      <section><h2 className="text-base font-bold text-brand-800 border-b-2 border-brand-500 pb-1 mb-3">工作经历</h2>
                        <div className="space-y-4">
                          <div><div className="flex justify-between items-start"><div><p className="font-semibold text-brand-900 text-sm">某头部{detailCase.industry}公司</p><p className="text-xs text-surface-600">高级{detailCase.position}</p></div><p className="text-xs text-surface-400">2022.03 - 至今</p></div>
                            <ul className="mt-2 space-y-1 text-xs text-surface-700"><li>• 负责核心业务线的设计与开发，服务用户超1000万</li><li>• 带领团队完成技术架构升级，性能提升60%</li><li>• 主导公司级重点项目，年度KPI达120%</li></ul>
                          </div>
                          <div><div className="flex justify-between items-start"><div><p className="font-semibold text-brand-900 text-sm">知名{detailCase.industry}企业</p><p className="text-xs text-surface-600">{detailCase.position}</p></div><p className="text-xs text-surface-400">2019.06 - 2022.02</p></div>
                            <ul className="mt-2 space-y-1 text-xs text-surface-700"><li>• 参与多项重要产品的设计与实现</li><li>• 优化用户体验指标，关键转化率提升25%</li></ul>
                          </div>
                        </div>
                      </section>
                      <section><h2 className="text-base font-bold text-brand-800 border-b-2 border-brand-500 pb-1 mb-3">项目经历</h2>
                        <div><p className="font-semibold text-brand-900 text-sm">企业级核心平台重构</p><p className="text-xs text-surface-500 mt-0.5">2023.01 - 2023.09 · 技术负责人</p>
                          <ul className="mt-2 space-y-1 text-xs text-surface-700"><li>• 平台日活从50万提升至300万，系统稳定性99.99%</li><li>• 引入微服务架构，部署效率提升5倍</li></ul>
                        </div>
                      </section>
                      <section><h2 className="text-base font-bold text-brand-800 border-b-2 border-brand-500 pb-1 mb-3">教育背景</h2>
                        <div className="flex justify-between"><div><p className="font-semibold text-brand-900 text-sm">某知名高校</p><p className="text-xs text-surface-600">计算机科学与技术 · 本科</p></div><p className="text-xs text-surface-400">2015.09 - 2019.06</p></div>
                      </section>
                    </div>
                  </div>
                </div>
                <div className="w-80 border-l border-surface-100 bg-white flex flex-col">
                  <div className="px-5 py-4 border-b border-surface-100 bg-surface-50/50">
                    <h3 className="font-display font-bold text-brand-900 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> HR 点评锚点 ({detailCase.hrReviews.length})</h3>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 正面 {detailCase.hrReviews.filter(r => r.type === 'positive').length}</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 建议 {detailCase.hrReviews.filter(r => r.type === 'suggestion').length}</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> 警告 {detailCase.hrReviews.filter(r => r.type === 'warning').length}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-4 space-y-3">
                    {detailCase.hrReviews.map((r, ri) => {
                      const color = r.type === 'positive' ? 'border-emerald-200 bg-emerald-50/50' : r.type === 'suggestion' ? 'border-amber-200 bg-amber-50/50' : 'border-red-200 bg-red-50/50';
                      const dotColor = r.type === 'positive' ? 'bg-emerald-500' : r.type === 'suggestion' ? 'bg-amber-400' : 'bg-red-500';
                      const isActive = activeAnchor?.id === r.id;
                      const reviewers = [
                        { name: '张敏', title: '资深HRD', industry: detailCase.industry, experience: '10年' },
                        { name: '李涛', title: '高级HRBP', industry: detailCase.industry, experience: '8年' },
                        { name: '王芳', title: '招聘负责人', industry: detailCase.industry, experience: '6年' },
                      ];
                      const rev = reviewers[ri % reviewers.length];
                      return (
                        <div key={r.id} onClick={() => setActiveAnchor(isActive ? null : r)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${color} ${isActive ? 'ring-2 ring-brand-500 scale-[1.02]' : 'hover:scale-[1.01]'}`}>
                          <div className="flex items-start gap-2.5">
                            <span className={`w-3 h-3 rounded-full shrink-0 mt-0.5 ${dotColor}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-brand-900 leading-snug">{r.comment}</p>
                              <div className="mt-2 pt-2 border-t border-black/5 flex items-center gap-2 text-[10px] text-surface-500">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-[10px]">{rev.name[0]}</div>
                                <div>
                                  <p className="font-semibold text-brand-800">{rev.name}</p>
                                  <p className="text-surface-400">{rev.title} · {rev.industry} · {rev.experience}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
