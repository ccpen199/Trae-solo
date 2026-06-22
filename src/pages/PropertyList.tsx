import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import PropertyCard from '@/components/property/PropertyCard';
import { useAppStore } from '@/store';
import EmptyState from '@/components/common/EmptyState';
import type { PropertyStatus } from '@/types';
import { PROPERTY_STATUS_LABEL } from '@/types';

const STATUS_FILTERS: ('all' | PropertyStatus)[] = ['all', 'rented', 'vacant', 'maintenance', 'sold'];

export default function PropertyList() {
  const properties = useAppStore((s) => s.properties);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | PropertyStatus>('all');

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (status !== 'all' && p.status !== status) return false;
      if (keyword) {
        const k = keyword.toLowerCase();
        if (
          !p.title.toLowerCase().includes(k) &&
          !p.address.toLowerCase().includes(k) &&
          !p.layout.toLowerCase().includes(k)
        )
          return false;
      }
      return true;
    });
  }, [properties, keyword, status]);

  const counts = STATUS_FILTERS.reduce(
    (acc, s) => ({
      ...acc,
      [s]: s === 'all' ? properties.length : properties.filter((p) => p.status === s).length,
    }),
    {} as Record<string, number>
  );

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="kicker mb-2">房产档案</div>
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-slate-900">
            房源管理
            <span className="text-base font-sans font-medium text-slate-400 ml-3">
              共 {properties.length} 套房源
            </span>
          </h2>
        </div>
        <Link to="/properties/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          新增房源
        </Link>
      </div>

      <div className="card p-4 rounded-2xl flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="搜索房源名称、地址、户型…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          {STATUS_FILTERS.map((s) => {
            const active = status === s;
            const label = s === 'all' ? '全部' : PROPERTY_STATUS_LABEL[s];
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all ' +
                  (active
                    ? 'bg-brand-700 text-white shadow-button'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100')
                }
              >
                {label}
                <span className={'ml-1.5 text-[11px] ' + (active ? 'text-brand-100' : 'text-slate-400')}>
                  {counts[s] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card rounded-2xl">
          <EmptyState
            title="未找到房源"
            description={keyword ? '请尝试其他关键词或清空筛选条件' : '点击右上角「新增房源」开始录入第一套房产'}
            action={
              <Link to="/properties/new" className="btn-primary">
                <Plus className="w-4 h-4" />
                新增房源
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
