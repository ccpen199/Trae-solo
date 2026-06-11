import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, X, MessageSquare, SlidersHorizontal } from 'lucide-react';
import { mockCases, industries, positions, experienceLevels } from '@/data/mockCases';
import type { ResumeCase } from '@/types/case';

type SortKey = '热门' | '最新' | '评分';

const sortFn: Record<SortKey, (a: ResumeCase, b: ResumeCase) => number> = {
  '热门': (a, b) => b.hrReviews.length - a.hrReviews.length,
  '最新': (a, b) => b.id.localeCompare(a.id),
  '评分': (a, b) => b.rating - a.rating,
};

export default function Cases() {
  const [selIndustries, setSelIndustries] = useState<string[]>([]);
  const [selPositions, setSelPositions] = useState<string[]>([]);
  const [selLevels, setSelLevels] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('热门');

  const toggle = (arr: string[], v: string, set: React.Dispatch<React.SetStateAction<string[]>>) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const filtered = useMemo(() => {
    let list = mockCases;
    if (selIndustries.length) list = list.filter(c => selIndustries.includes(c.industry));
    if (selPositions.length) list = list.filter(c => selPositions.includes(c.position));
    if (selLevels.length) list = list.filter(c => selLevels.includes(c.experienceLevel));
    return [...list].sort(sortFn[sort]);
  }, [selIndustries, selPositions, selLevels, sort]);

  const activeTags = [
    ...selIndustries.map(v => ({ label: v, clear: () => setSelIndustries(selIndustries.filter(x => x !== v)) })),
    ...selPositions.map(v => ({ label: v, clear: () => setSelPositions(selPositions.filter(x => x !== v)) })),
    ...selLevels.map(v => ({ label: experienceLevels.find(e => e.value === v)?.label ?? v, clear: () => setSelLevels(selLevels.filter(x => x !== v)) })),
  ];

  const CheckboxList = ({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (v: string) => void }) => (
    <div className="space-y-1.5">
      {items.map(item => (
        <label key={item} className="flex items-center gap-2 cursor-pointer text-sm text-surface-300 hover:text-brand-900 transition-colors">
          <input type="checkbox" checked={selected.includes(item)} onChange={() => onToggle(item)}
            className="w-3.5 h-3.5 rounded border-surface-200 text-brand-500 focus:ring-brand-500" />
          {item}
        </label>
      ))}
    </div>
  );

  return (
    <div className="flex h-full">
      <aside className="w-64 shrink-0 border-r border-surface-100 bg-white/60 p-5 overflow-y-auto">
        <div className="flex items-center gap-2 mb-6">
          <SlidersHorizontal className="w-4 h-4 text-brand-500" />
          <span className="font-display font-bold text-brand-900">筛选</span>
        </div>
        {activeTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {activeTags.map(t => (
              <span key={t.label} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-brand-500/10 text-brand-500 rounded-full">
                {t.label}
                <button onClick={t.clear} className="hover:text-brand-700"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
        <div className="mb-6">
          <h4 className="font-display text-sm font-bold text-brand-900 mb-2">行业筛选</h4>
          <CheckboxList items={industries} selected={selIndustries} onToggle={v => toggle(selIndustries, v, setSelIndustries)} />
        </div>
        <div className="mb-6">
          <h4 className="font-display text-sm font-bold text-brand-900 mb-2">岗位筛选</h4>
          <CheckboxList items={positions} selected={selPositions} onToggle={v => toggle(selPositions, v, setSelPositions)} />
        </div>
        <div>
          <h4 className="font-display text-sm font-bold text-brand-900 mb-2">经验层级</h4>
          <div className="flex flex-wrap gap-2">
            {experienceLevels.map(lv => (
              <button key={lv.value} onClick={() => toggle(selLevels, lv.value, setSelLevels)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${selLevels.includes(lv.value) ? 'bg-brand-500 text-white border-brand-500' : 'border-surface-200 text-surface-300 hover:border-brand-500 hover:text-brand-500'}`}>
                {lv.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-brand-900">案例库</h1>
            <span className="text-sm text-surface-300">{filtered.length} 个案例</span>
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
            className="text-sm border border-surface-200 rounded-lg px-3 py-1.5 bg-white text-surface-300 focus:outline-none focus:ring-1 focus:ring-brand-500">
            {(['热门', '最新', '评分'] as SortKey[]).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/cases/${c.id}`} className="block glass-card card-hover overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-brand-900 to-brand-800 p-4 relative">
                  <div className="space-y-2">
                    <div className="h-2 w-3/4 bg-white/15 rounded" />
                    <div className="h-2 w-1/2 bg-white/10 rounded" />
                    <div className="h-2 w-2/3 bg-white/10 rounded" />
                    <div className="h-2 w-1/3 bg-brand-500/25 rounded" />
                    <div className="h-2 w-2/5 bg-brand-500/20 rounded" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex gap-1.5 mb-2">
                    <span className="px-2 py-0.5 text-xs bg-brand-500 text-white rounded-full">{c.industry}</span>
                    <span className="px-2 py-0.5 text-xs bg-brand-500 text-white rounded-full">{c.position}</span>
                  </div>
                  <h3 className="font-display font-bold text-brand-900 mb-2 line-clamp-1">{c.title}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                    <span className="text-sm text-gold-500 font-mono">{c.rating}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.tags.map(t => <span key={t} className="px-2 py-0.5 text-xs bg-surface-100 text-surface-300 rounded">{t}</span>)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-surface-300">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {c.hrReviews.length} 条HR点评
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
