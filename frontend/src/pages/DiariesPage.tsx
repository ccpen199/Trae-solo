import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { diaryApi } from '../services/api';
import type { Diary } from '../types';
import { CONSTRUCTION_STAGE_LABELS, HOUSE_TYPE_LABELS, STAGE_ORDER, DECORATION_STYLES, formatCurrency, fromNow, getInitials } from '../utils/constants';

export default function DiariesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({
    stage: searchParams.get('stage') || '',
    style: searchParams.get('style') || '',
    city: searchParams.get('city') || '',
    sort: 'latest'
  });

  const fetchDiaries = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.page, limit: pagination.limit, ...filters };
      const res: any = await diaryApi.getList(params);
      if (res?.success) {
        setDiaries(res.data.diaries || []);
        setPagination(res.data.pagination);
      }
    } catch (e) {
      setDiaries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDiaries(); }, [filters, pagination.page]);

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(p => ({ ...p, page: 1 }));
    if (value) searchParams.set(key, value); else searchParams.delete(key);
    setSearchParams(searchParams);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">装修日记</h1>
          <p className="text-gray-500 text-sm mt-1">来自真实业主的装修过程记录</p>
        </div>
        <Link to="/diaries/create" className="btn-accent">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          发布日记
        </Link>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 font-medium w-16 shrink-0">施工阶段</span>
          <button onClick={() => updateFilter('stage', '')} className={`tag ${!filters.stage ? 'tag-active' : ''}`}>全部</button>
          {STAGE_ORDER.map(stage => (
            <button key={stage} onClick={() => updateFilter('stage', stage)} className={`tag ${filters.stage === stage ? 'tag-active' : ''}`}>
              {CONSTRUCTION_STAGE_LABELS[stage].label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 font-medium w-16 shrink-0">装修风格</span>
          <button onClick={() => updateFilter('style', '')} className={`tag ${!filters.style ? 'tag-active' : ''}`}>全部</button>
          {DECORATION_STYLES.slice(0, 8).map(s => (
            <button key={s} onClick={() => updateFilter('style', s)} className={`tag ${filters.style === s ? 'tag-active' : ''}`}>{s}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-500 font-medium w-16 shrink-0">城市</span>
          <input
            value={filters.city}
            onChange={e => updateFilter('city', e.target.value)}
            className="input !w-40"
            placeholder="如：北京市"
          />
          <span className="text-sm text-gray-500 font-medium w-16 shrink-0 ml-3">排序</span>
          <select value={filters.sort} onChange={e => updateFilter('sort', e.target.value)} className="input !w-40">
            <option value="latest">最新发布</option>
            <option value="popular">最受欢迎</option>
            <option value="budget_low">预算从低到高</option>
            <option value="budget_high">预算从高到低</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-500">加载中...</div>
      ) : diaries.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-3">🏚️</p>
          <p className="text-gray-500 mb-4">暂无符合条件的日记</p>
          <Link to="/diaries/create" className="btn-primary">发布第一篇日记</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {diaries.map(diary => {
              const stageInfo = CONSTRUCTION_STAGE_LABELS[diary.constructionStage];
              const author = typeof diary.userId === 'string' ? { username: '用户', avatar: '', nickname: '' } : diary.userId;
              return (
                <Link key={diary._id} to={`/diaries/${diary._id}`} className="card group hover:-translate-y-1 transition-all">
                  <div className="aspect-video bg-gray-100 overflow-hidden relative">
                    <img src={diary.coverImage || `https://picsum.photos/seed/${diary._id}/600/400`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    {stageInfo && <div className={`absolute top-3 left-3 badge ${stageInfo.bg} ${stageInfo.color}`}>{stageInfo.label}</div>}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-700">{diary.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>🏠 {HOUSE_TYPE_LABELS[diary.houseType] || diary.houseType} · {diary.houseArea}㎡</span>
                      {diary.address?.city && <span>📍 {diary.address.city}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {diary.styleTags?.slice(0, 3).map(s => <span key={s} className="badge bg-primary-50 text-primary-700">{s}</span>)}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-1.5">
                        {author.avatar ? <img src={author.avatar} className="w-5 h-5 rounded-full" alt="" /> :
                          <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-[10px] flex items-center justify-center font-semibold">{getInitials(author.nickname || author.username)}</div>}
                        <span className="text-xs text-gray-600">{author.nickname || author.username}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-400">
                        <span>👁 {diary.views}</span>
                        <span>❤ {diary.likes?.length || 0}</span>
                        <span>💬 {diary.commentCount}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-primary-700 font-semibold">{formatCurrency(diary.budget?.totalEstimated || 0)}</span>
                      <span className="text-gray-400 text-xs">{fromNow(diary.createdAt)}</span>
                    </div>
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
