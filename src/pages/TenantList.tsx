import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, ShieldAlert } from 'lucide-react';
import TenantTable from '@/components/tenant/TenantTable';
import { useAppStore } from '@/store';
import EmptyState from '@/components/common/EmptyState';
import type { TenantStatus } from '@/types';
import { TENANT_STATUS_LABEL, VerifyStatus } from '@/types';

const STATUS_FILTERS: ('all' | TenantStatus)[] = ['all', 'living', 'pending', 'moved'];

export default function TenantList() {
  const tenants = useAppStore((s) => s.tenants);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | TenantStatus>('all');
  const [onlyUnverified, setOnlyUnverified] = useState(false);

  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      if (status !== 'all' && t.status !== status) return false;
      if (onlyUnverified && t.verifyStatus === ('verified' as VerifyStatus)) return false;
      if (keyword) {
        const k = keyword.toLowerCase();
        if (
          !t.name.toLowerCase().includes(k) &&
          !t.phone.includes(k) &&
          !t.idCard.idNo.includes(k)
        )
          return false;
      }
      return true;
    });
  }, [tenants, keyword, status, onlyUnverified]);

  const counts = STATUS_FILTERS.reduce(
    (acc, s) => ({
      ...acc,
      [s]: s === 'all' ? tenants.length : tenants.filter((t) => t.status === s).length,
    }),
    {} as Record<string, number>
  );
  const unverifiedCount = tenants.filter((t) => t.verifyStatus !== 'verified').length;

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="kicker mb-2">租客档案</div>
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-slate-900">
            租客管理
            <span className="text-base font-sans font-medium text-slate-400 ml-3">
              共 {tenants.length} 位租客，在住 {counts.living ?? 0} 位
            </span>
          </h2>
        </div>
        <Link to="/tenants/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          新增租客
        </Link>
      </div>

      <div className="card p-4 rounded-2xl flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="搜索姓名、手机号、身份证号…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          {STATUS_FILTERS.map((s) => {
            const active = status === s;
            const label = s === 'all' ? '全部' : TENANT_STATUS_LABEL[s];
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
          <label className="ml-2 flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50/60 text-amber-700 text-sm hover:bg-amber-100 transition-all">
            <ShieldAlert className="w-3.5 h-3.5" />
            <input
              type="checkbox"
              className="accent-amber-600"
              checked={onlyUnverified}
              onChange={(e) => setOnlyUnverified(e.target.checked)}
            />
            待核验
            {unverifiedCount > 0 && (
              <span className="text-[11px] font-bold bg-amber-500 text-white rounded-full px-1.5 py-px min-w-[18px] text-center">
                {unverifiedCount}
              </span>
            )}
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card rounded-2xl">
          <EmptyState
            title="未找到租客"
            description={keyword ? '请尝试其他关键词或筛选条件' : '点击「新增租客」开始录入租客信息并完成身份核验'}
            action={
              <Link to="/tenants/new" className="btn-primary">
                <Plus className="w-4 h-4" />
                新增租客
              </Link>
            }
          />
        </div>
      ) : (
        <TenantTable tenants={filtered} />
      )}
    </div>
  );
}
