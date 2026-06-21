import { motion } from 'framer-motion';
import { ChevronDown, LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';

type ViewMode = 'card' | 'compare';
type StarFilter = 'all' | '3' | '4' | '5';
type SortBy = 'distance' | 'rating' | 'response';

interface FilterBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  starFilter: StarFilter;
  onStarFilterChange: (filter: StarFilter) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
}

export const FilterBar = ({
  viewMode,
  onViewModeChange,
  starFilter,
  onStarFilterChange,
  sortBy,
  onSortChange,
}: FilterBarProps) => {
  const [starFilterOpen, setStarFilterOpen] = useState(false);

  const starFilterLabel =
    starFilter === 'all' ? '全部星级' : `${starFilter}星以上`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-soft border border-warm-card p-4 mb-5 flex flex-wrap items-center gap-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">筛选：</span>
        <div className="relative">
          <button
            onClick={() => setStarFilterOpen(!starFilterOpen)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-warm-bg text-sm text-brand hover:bg-brand-50 transition-colors"
          >
            {starFilterLabel}
            <ChevronDown size={14} />
          </button>
          {starFilterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-warm-card py-1 z-10 min-w-28"
            >
              {(['all', '3', '4', '5'] as StarFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onStarFilterChange(s);
                    setStarFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-warm-bg transition-colors ${
                    starFilter === s ? 'text-accent font-medium' : 'text-brand'
                  }`}
                >
                  {s === 'all' ? '全部星级' : `${s}星以上`}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">排序：</span>
        <div className="flex rounded-lg bg-warm-bg p-0.5">
          {[
            { value: 'distance', label: '距离最近' },
            { value: 'rating', label: '评分最高' },
            { value: 'response', label: '响应最快' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value as SortBy)}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                sortBy === opt.value
                  ? 'bg-white text-brand shadow-sm font-medium'
                  : 'text-gray-500 hover:text-brand'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-sm text-gray-500">视图：</span>
        <div className="flex rounded-lg bg-warm-bg p-0.5">
          <button
            onClick={() => onViewModeChange('card')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'card'
                ? 'bg-white text-brand shadow-sm'
                : 'text-gray-500 hover:text-brand'
            }`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => onViewModeChange('compare')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'compare'
                ? 'bg-white text-brand shadow-sm'
                : 'text-gray-500 hover:text-brand'
            }`}
          >
            <List size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
