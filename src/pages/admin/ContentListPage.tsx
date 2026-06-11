import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '../../lib/api';
import ContentCard from '../../components/ui/ContentCard';
import StatusBadge from '../../components/ui/StatusBadge';
import DataTable from '../../components/ui/DataTable';
import type { Content, ContentStatus, ContentType } from '../../../shared/types';

type SourceFilter = '' | 'PGC' | 'UGC';

const ContentListPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [status, setStatus] = useState<ContentStatus | ''>('');
  const [type, setType] = useState<ContentType | ''>('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('');
  const [region, setRegion] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contents', page, status, type, keyword, region],
    queryFn: async () => {
      const res = await contentApi.getList({
        page,
        pageSize: viewMode === 'grid' ? 12 : 20,
        status: status || undefined,
        type: type || undefined,
        keyword: keyword || undefined,
        region: region || undefined,
      });
      return res.data;
    },
  });

  const getSourceType = (content: Content): { label: 'PGC' | 'UGC'; color: string } => {
    const lower = content.authorName?.toLowerCase() || '';
    const isPgc =
      content.authorName?.includes('文旅') ||
      content.authorName?.includes('编辑') ||
      content.authorName?.includes('管理员') ||
      content.authorName?.includes('景区') ||
      content.authorName?.includes('运营') ||
      content.authorName?.includes('官方') ||
      lower.includes('admin') ||
      lower.includes('editor') ||
      lower.includes('gov') ||
      lower.includes('scenic') ||
      lower.includes('enterprise') ||
      lower.includes('zhang') ||
      lower.includes('wang') ||
      content.category?.includes('政策') ||
      content.category?.includes('官方');
    return isPgc
      ? { label: 'PGC', color: 'bg-primary-100 text-primary-700 border border-primary-200' }
      : { label: 'UGC', color: 'bg-blue-100 text-blue-700 border border-blue-200' };
  };

  const typeLabel: Record<string, string> = {
    article: '📄 图文',
    video: '🎬 视频',
    vr: '🎮 VR导览',
    infographic: '📊 信息图',
  };

  const displayedItems = React.useMemo(() => {
    let items = data?.items || [];
    if (sourceFilter) {
      items = items.filter((c: Content) => getSourceType(c).label === sourceFilter);
    }
    return items;
  }, [data?.items, sourceFilter]);

  const displayedTotal = displayedItems.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const statusOptions: { value: ContentStatus | ''; label: string }[] = [
    { value: '', label: '全部状态' },
    { value: 'draft', label: '草稿' },
    { value: 'pending_audit', label: '待审核' },
    { value: 'published', label: '已发布' },
    { value: 'rejected', label: '已驳回' },
    { value: 'offline', label: '已下架' },
  ];

  const typeOptions: { value: ContentType | ''; label: string }[] = [
    { value: '', label: '全部类型' },
    { value: 'article', label: '图文' },
    { value: 'video', label: '视频' },
    { value: 'vr', label: 'VR导览' },
    { value: 'infographic', label: '信息图' },
  ];

  const regionOptions = ['全部地区', '全国', '北京', '上海', '广东', '江苏', '浙江', '四川', '陕西', '云南', '其他'];

  const columns = [
    {
      key: 'source',
      title: '来源',
      width: '7%',
      render: (row: Content) => {
        const s = getSourceType(row);
        return (
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${s.color}`}>
            {s.label}
          </span>
        );
      },
    },
    {
      key: 'title',
      title: '内容信息',
      width: '30%',
      render: (row: Content) => (
        <div className="flex items-center gap-3">
          <img src={row.coverImage || 'https://picsum.photos/seed/ct' + row.id + '/48/48'} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-ink-800 truncate">{row.title}</p>
            <p className="text-xs text-ink-500 truncate">
              <span className="inline-block mr-2">{typeLabel[row.type] || row.type}</span>
              <span className="text-ink-400">作者 {row.authorName || '未知'}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      title: '分类',
      width: '9%',
      render: (row: Content) => <span className="text-sm text-ink-600">{row.category || '-'}</span>,
    },
    {
      key: 'region',
      title: '发布地区',
      width: '9%',
      render: (row: Content) => (
        <span className="inline-flex items-center gap-1 text-sm text-landscape-600">
          📍 {row.region || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      title: '审核状态',
      width: '10%',
      render: (row: Content) => <StatusBadge status={row.status as any} />,
    },
    {
      key: 'propagation',
      title: '传播追踪',
      width: '20%',
      render: (row: Content) => (
        <div className="grid grid-cols-4 gap-1 text-center">
          <div title="浏览量">
            <div className="text-xs text-ink-400">浏览</div>
            <div className="text-sm font-semibold text-ink-700">{row.views.toLocaleString()}</div>
          </div>
          <div title="点赞">
            <div className="text-xs text-ink-400">点赞</div>
            <div className="text-sm font-semibold text-red-500">{row.likes}</div>
          </div>
          <div title="分享">
            <div className="text-xs text-ink-400">分享</div>
            <div className="text-sm font-semibold text-blue-500">{row.shares}</div>
          </div>
          <div title="评论">
            <div className="text-xs text-ink-400">评论</div>
            <div className="text-sm font-semibold text-amber-600">{row.comments || 0}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'updatedAt',
      title: '更新时间',
      width: '10%',
      render: (row: Content) => (
        <span className="text-xs text-ink-500">
          {row.updatedAt?.slice(0, 16).replace('T', ' ') || row.createdAt?.slice(0, 16).replace('T', ' ') || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '10%',
      render: (row: Content) => (
        <div className="flex gap-2">
          <button className="text-primary-600 hover:text-primary-700 text-sm whitespace-nowrap" onClick={() => navigate(`/admin/content/${row.id}`)}>查看</button>
          <button className="text-ink-600 hover:text-ink-700 text-sm whitespace-nowrap" onClick={() => navigate(`/admin/content/${row.id}/edit`)}>编辑</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">内容管理</h1>
          <p className="text-ink-500 text-sm mt-1">
            管理所有PGC专业生产 / UGC用户生产内容 ·
            <span className="ml-1 text-primary-600 font-semibold">{displayedTotal || data?.total || 0}</span> 条
            {sourceFilter && <span className="ml-2 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">筛选：{sourceFilter}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value as SourceFilter); setPage(1); }}
            className="input !py-2 text-sm w-auto"
          >
            <option value="">全部来源</option>
            <option value="PGC">📝 PGC 专业生产</option>
            <option value="UGC">👥 UGC 用户投稿</option>
          </select>
          <button onClick={() => navigate('/admin/content/create')} className="btn-primary">
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            创建内容
          </button>
        </div>
      </div>

      <div className="card chinese-border">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-ink-700 mb-1">关键词搜索</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input"
              placeholder="搜索标题、摘要、作者..."
            />
          </div>
          <div className="w-36">
            <label className="block text-sm font-medium text-ink-700 mb-1">状态</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ContentStatus | '')} className="input">
              {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="block text-sm font-medium text-ink-700 mb-1">类型</label>
            <select value={type} onChange={(e) => setType(e.target.value as ContentType | '')} className="input">
              {typeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="block text-sm font-medium text-ink-700 mb-1">地区</label>
            <select value={region} onChange={(e) => setRegion(e.target.value === '全部地区' ? '' : e.target.value)} className="input">
              {regionOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary">
            🔍 搜索
          </button>
          <button type="button" onClick={() => { setKeyword(''); setStatus(''); setType(''); setRegion(''); setSourceFilter(''); setPage(1); refetch(); }} className="btn-secondary">
            重置
          </button>
          <div className="flex items-center gap-1 ml-auto bg-ink-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow text-primary-600' : 'text-ink-500'}`}
              title="卡片视图"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow text-primary-600' : 'text-ink-500'}`}
              title="表格视图"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedItems.map((content: Content) => (
            <ContentCard
              key={content.id}
              content={content}
              onView={(id) => navigate(`/admin/content/${id}`)}
              onEdit={(id) => navigate(`/admin/content/${id}/edit`)}
            />
          ))}
          {!isLoading && displayedItems.length === 0 && (
            <div className="col-span-full text-center py-16 text-ink-500 bg-white rounded-xl border border-dashed border-ink-200">
              <svg className="w-16 h-16 mx-auto text-ink-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-medium">暂无匹配的内容</p>
              <p className="text-sm mt-1">试试调整筛选条件，或</p>
              <button onClick={() => navigate('/admin/content/create')} className="text-primary-600 hover:text-primary-700 font-medium mt-2 text-sm">
                + 创建第一篇内容
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card chinese-border p-0 overflow-hidden">
          <DataTable
            columns={columns}
            data={displayedItems}
            loading={isLoading}
            emptyText="暂无匹配的内容数据"
            onRowClick={(row) => navigate(`/admin/content/${row.id}`)}
          />
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-ink-200 disabled:opacity-50 hover:bg-ink-50 text-sm"
          >
            ← 上一页
          </button>
          <span className="text-sm text-ink-600 px-4">
            第 <span className="font-semibold text-primary-600">{page}</span> / {data.totalPages} 页，共 {data.total} 条
          </span>
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page === data.totalPages}
            className="px-4 py-2 rounded-lg border border-ink-200 disabled:opacity-50 hover:bg-ink-50 text-sm"
          >
            下一页 →
          </button>
        </div>
      )}
    </div>
  );
};

export default ContentListPage;
