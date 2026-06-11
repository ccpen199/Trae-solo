import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Eye, MessageSquare, SlidersHorizontal, ChevronDown, ChevronUp, Grid3X3, List, Search, RotateCcw, Check, ChevronRight } from 'lucide-react';
import { mockCases, industries, positions, experienceLevels } from '@/data/mockCases';
import type { ResumeCase } from '@/types/case';

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

export default function Cases() {
  const [selIndustries, setSelIndustries] = useState<string[]>([]);
  const [selPositions, setSelPositions] = useState<string[]>([]);
  const [selLevel, setSelLevel] = useState<string>('');
  const [salaryRange, setSalaryRange] = useState<[number, number]>([10, 80]);
  const [sort, setSort] = useState<SortKey>('热门');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [positionSearch, setPositionSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    industry: false, position: false, level: false, salary: false,
  });
  const [showToast, setShowToast] = useState(false);

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

  const filteredPositions = useMemo(() =>
    positions.filter(p => p.toLowerCase().includes(positionSearch.toLowerCase()))
  , [positionSearch]);

  const toggle = (arr: string[], v: string, set: React.Dispatch<React.SetStateAction<string[]>>) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const toggleCollapse = (key: string) =>
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const filtered = useMemo(() => {
    let list = mockCases;
    if (selIndustries.length) list = list.filter(c => selIndustries.includes(c.industry));
    if (selPositions.length) list = list.filter(c => selPositions.includes(c.position));
    if (selLevel) list = list.filter(c => c.experienceLevel === selLevel);
    return [...list].sort(sortFn[sort]);
  }, [selIndustries, selPositions, selLevel, sort]);

  const activeTags = [
    ...selIndustries.map(v => ({ type: '行业', label: v, clear: () => setSelIndustries(selIndustries.filter(x => x !== v)) })),
    ...selPositions.map(v => ({ type: '岗位', label: v, clear: () => setSelPositions(selPositions.filter(x => x !== v)) })),
    ...(selLevel ? [{ type: '经验', label: experienceLevels.find(e => e.value === selLevel)?.label || selLevel, clear: () => setSelLevel('') }] : []),
  ];

  const resetFilters = () => {
    setSelIndustries([]);
    setSelPositions([]);
    setSelLevel('');
    setSalaryRange([10, 80]);
    setShowToast(true);
  };

  const getMatchedReviews = (c: ResumeCase): number => {
    let matched = 0;
    if (selIndustries.length && selIndustries.includes(c.industry)) matched += c.hrReviews.length;
    else if (selPositions.length && selPositions.includes(c.position)) matched += Math.ceil(c.hrReviews.length * 0.7);
    else if (selLevel && c.experienceLevel === selLevel) matched += Math.ceil(c.hrReviews.length * 0.5);
    else matched = c.hrReviews.length;
    return matched;
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

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        return <Star key={i} className={`w-3.5 h-3.5 ${i < fullStars ? 'text-gold-500 fill-gold-500' : (i === fullStars && hasHalf ? 'text-gold-500 fill-gold-500/50' : 'text-surface-200')}`} />;
      })}
    </div>
  );

  const Card = ({ c, i }: { c: ResumeCase; i: number }) => {
    const matched = getMatchedReviews(c);
    return (
      <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
        className="group relative glass-card card-hover overflow-hidden bg-white">
        <div className="h-36 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-5 relative overflow-hidden">
          <div className="space-y-2.5 relative z-10">
            <div className="h-2.5 w-3/4 bg-white/20 rounded-full" />
            <div className="h-2 w-1/2 bg-white/15 rounded-full" />
            <div className="h-2 w-2/3 bg-white/15 rounded-full" />
            <div className="h-2 w-1/3 bg-brand-400/40 rounded-full" />
            <div className="h-2 w-2/5 bg-brand-400/30 rounded-full" />
            <div className="h-2 w-1/2 bg-white/10 rounded-full" />
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
            {matched > 0 && (
              <span className="px-2 py-0.5 text-xs bg-sky-500/10 text-sky-600 rounded-full font-medium flex items-center gap-1">
                🔗 {matched}条匹配点评
              </span>
            )}
          </div>
          <h3 className="font-display font-bold text-lg text-brand-900 mb-3 line-clamp-1 group-hover:text-brand-600 transition-colors">{c.title}</h3>
          <div className="flex items-center gap-2 mb-3">
            {renderStars(c.rating)}
            <span className="text-sm font-mono text-gold-600 font-bold">{c.rating}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-surface-400 mb-4">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{caseViews[c.id] || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{c.hrReviews.length} 条点评</span>
            </div>
          </div>
          <Link to={`/cases/${c.id}`}
            className="opacity-0 group-hover:opacity-100 absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-brand-900 via-brand-900/80 to-transparent flex items-end justify-center pb-3 transition-opacity">
            <span className="text-white text-sm font-medium flex items-center gap-1">
              查看详情
            </span>
          </Link>
        </div>
      </motion.div>
    );
  };

  const filterBreadcrumb = [
    { label: '全部' },
    ...selIndustries.map(v => ({ label: `行业: ${v}` })),
    ...selPositions.map(v => ({ label: `岗位: ${v}` })),
    ...(selLevel ? [{ label: `经验: ${experienceLevels.find(e => e.value === selLevel)?.label || selLevel}` }] : []),
    { label: `共${filtered.length}份`, isLast: true },
  ];

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
            <p className="text-lg font-bold text-brand-700">
              当前筛选命中 <span className="text-emerald-600">{filtered.length}</span>/{mockCases.length} 份案例
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
              <input type="text" placeholder="搜索岗位..." value={positionSearch} onChange={e => setPositionSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500" />
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {filteredPositions.map(item => (
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
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="薪资范围" keyName="salary">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-600 font-bold font-mono">{salaryRange[0]}K</span>
                <span className="text-surface-300">—</span>
                <span className="text-brand-600 font-bold font-mono">{salaryRange[1]}K</span>
              </div>
              <div className="relative h-2 bg-surface-100 rounded-full">
                <div className="absolute h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full"
                  style={{ left: `${((salaryRange[0] - 5) / 95) * 100}%`, right: `${100 - ((salaryRange[1] - 5) / 95) * 100}%` }} />
                <input type="range" min="5" max="100" value={salaryRange[0]}
                  onChange={e => setSalaryRange([Math.min(Number(e.target.value), salaryRange[1] - 5), salaryRange[1]])}
                  className="absolute w-full h-2 top-0 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer" />
              </div>
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
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-surface-100 px-8 py-5">
          <div className="flex items-center gap-2 mb-4 text-xs text-surface-500 overflow-x-auto pb-1">
            <span className="flex items-center gap-1.5 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-500" /> 筛选轨迹:
            </span>
            {filterBreadcrumb.map((item, idx) => (
              <span key={idx} className="flex items-center gap-1.5 shrink-0">
                {idx > 0 && <ChevronRight className="w-3 h-3 text-surface-300" />}
                <span className={`px-2 py-0.5 rounded-full ${item.isLast ? 'bg-brand-500 text-white font-medium' : 'bg-surface-100 text-surface-600'}`}>
                  {item.label}
                </span>
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="font-display text-2xl font-bold text-brand-900">案例库</h1>
              <span className="px-3 py-1 bg-brand-500/10 text-brand-600 rounded-full text-sm font-medium">
                共找到 {filtered.length} 份精选简历
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
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-3' : 'grid-cols-1'}`}>
            {filtered.map((c, i) => <Card key={c.id} c={c} i={i} />)}
          </div>
        </div>
      </main>
    </div>
  );
}
