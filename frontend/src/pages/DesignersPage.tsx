import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { designerApi } from '../services/api';
import type { User } from '../types';
import { DECORATION_STYLES, formatCurrency, getInitials } from '../utils/constants';

export default function DesignersPage() {
  const [designers, setDesigners] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', minRating: 0, style: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await designerApi.getList({ ...filters, page: pagination.page, limit: pagination.limit });
      if (res?.success) {
        setDesigners(res.data.designers || []);
        setPagination(res.data.pagination);
      }
    } catch (_) { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filters, pagination.page]);

  const update = (k: string, v: any) => { setFilters(p => ({ ...p, [k]: v })); setPagination(p => ({ ...p, page: 1 })); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎨 认证设计师</h1>
          <p className="text-gray-500 text-sm mt-1">经过平台资质审核的专业设计师</p>
        </div>
        <Link to="/designers/apply" className="btn-primary">申请入驻</Link>
      </div>

      <div className="card p-5 flex flex-wrap gap-3 items-center">
        <span className="text-sm text-gray-500 font-medium">筛选:</span>
        <input value={filters.city} onChange={e => update('city', e.target.value)} className="input !w-40" placeholder="所在城市" />
        <select value={filters.style} onChange={e => update('style', e.target.value)} className="input !w-40">
          <option value="">全部风格</option>
          {DECORATION_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.minRating} onChange={e => update('minRating', Number(e.target.value))} className="input !w-40">
          <option value={0}>全部评分</option>
          <option value={4}>4分以上</option>
          <option value={4.5}>4.5分以上</option>
          <option value={4.8}>4.8分以上</option>
        </select>
      </div>

      {loading ? <div className="text-center py-20 text-gray-500">加载中...</div> : designers.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <p className="text-5xl mb-3">🎨</p>
          <p>暂无符合条件的设计师</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {designers.map(d => {
              const cred = (d as any).credentials || d.qualifications;
              return (
              <Link key={d._id} to={`/designers/${d._id}`} className="card p-5 hover:-translate-y-1 transition-all">
                <div className="flex items-start space-x-4">
                  {d.avatar ? <img src={d.avatar} className="w-16 h-16 rounded-2xl object-cover" /> :
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-200 to-primary-400 text-primary-800 flex items-center justify-center text-2xl font-bold">{getInitials(d.nickname || d.username)}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 truncate">{d.nickname || d.username}</h3>
                      {d.designerStatus === 'approved' && <span className="badge bg-accent-50 text-accent-700 text-[10px]">✓认证</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{d.serviceAreas?.slice(0, 3).join(' · ') || '全国服务'}</p>
                    {(d as any).serviceRadius && <p className="text-xs text-gray-400 mt-0.5">服务半径: {(d as any).serviceRadius}km</p>}
                    <div className="flex items-center mt-2">
                      <span className="text-amber-500">★</span>
                      <span className="text-sm font-semibold text-gray-900 ml-1">{d.statistics?.rating || 4.8}</span>
                      <span className="text-xs text-gray-400 ml-1">({d.statistics?.reviewCount || 0}条评价)</span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600 line-clamp-2">{d.bio || '专业室内设计师，为您打造理想家居空间。'}</p>
                {cred && (cred as any).certificationType && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-semibold text-blue-700">📜 {(cred as any).certificationType}</p>
                    {(cred as any).issuingAuthority && <p className="text-xs text-blue-500 mt-0.5">颁证机构: {(cred as any).issuingAuthority}</p>}
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(d.portfolio || []).slice(0, 3).map((p, i) => p.style ? <span key={i} className="badge bg-gray-100 text-gray-600">{p.style}</span> : null)}
                    <span className="badge bg-primary-50 text-primary-700">{d.statistics?.completedProjects || 0}个项目</span>
                  </div>
                  {d.portfolio && d.portfolio.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {d.portfolio.slice(0, 2).map((p, i) => (
                        <div key={i} className="flex items-center text-xs text-gray-500">
                          <span className="font-medium text-gray-700 truncate flex-1">{p.title}</span>
                          {p.houseArea && <span className="ml-2 shrink-0">{p.houseArea}㎡</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <button onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))} className="btn-outline" disabled={pagination.page === 1}>上一页</button>
              <span className="px-4 py-2 text-gray-600">{pagination.page} / {pagination.totalPages}</span>
              <button onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))} className="btn-outline" disabled={pagination.page === pagination.totalPages}>下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
