import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '../../lib/api';
import ContentCard from '../../components/ui/ContentCard';
import StatusBadge from '../../components/ui/StatusBadge';
import DataTable from '../../components/ui/DataTable';
import type { Content, ContentStatus, ContentType } from '../../../shared/types';

const ContentListPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [status, setStatus] = useState<ContentStatus | ''>('');
  const [type, setType] = useState<ContentType | ''>('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contents', page, status, type, keyword],
    queryFn: async () => {
      const res = await contentApi.getList({
        page,
        pageSize: 12,
        status: status || undefined,
        type: type || undefined,
        keyword: keyword || undefined,
      });
      return res.data;
    },
  });

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

  const columns = [
    {
      key: 'title',
      title: '标题',
      width: '30%',
      render: (row: Content) => (
        <div className="flex items-center gap-3">
          <img src={row.coverImage || 'https://picsum.photos/48/48'} alt="" className="w-12 h-12 rounded object-cover" />
          <div className="min-w-0">
            <p className="font-medium text-ink-800 truncate">{row.title}</p>
            <p className="text-xs text-ink-500 truncate">{row.summary}</p>
          </div>
        </div>
      ),
    },
    { key: 'type', title: '类型', width: '10%', render: (row: Content) => <span className="text-sm">{row.type}</span> },
    { key: 'category', title: '分类', width: '10%' },
    { key: 'region', title: '地区', width: '10%' },
    { key: 'status', title: '状态', width: '12%', render: (row: Content) => <StatusBadge status={row.status as any} /> },
    {
      key: 'stats',
      title: '数据',
      width: '18%',
      render: (row: Content) => (
        <div className="flex gap-4 text-xs text-ink-500">
          <span>👁 {row.views.toLocaleString()}</span>
          <span>❤️ {row.likes}</span>
          <span>🔄 {row.shares}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '10%',
      render: (row: Content) => (
        <div className="flex gap-2">
          <button className="text-primary-600 hover:text-primary-700 text-sm" onClick={() => navigate(`/admin/content/${row.id}`)}>查看</button>
          <button className="text-ink-600 hover:text-ink-700 text-sm" onClick={() => navigate(`/admin/content/${row.id}/edit`)}>编辑</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">内容管理</h1>
          <p className="text-ink-500 text-sm mt-1">管理所有PGC/UGC内容</p>
        </div>
        <button onClick={() => navigate('/admin/content/create')} className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          创建内容
        </button>
      </div>

      <div className="card chinese-border">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-ink-700 mb-1">搜索</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input"
              placeholder="搜索标题、摘要..."
            />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-ink-700 mb-1">状态</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ContentStatus | '')} className="input">
              {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-ink-700 mb-1">类型</label>
            <select value={type} onChange={(e) => setType(e.target.value as ContentType | '')} className="input">
              {typeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary">搜索</button>
          <button type="button" onClick={() => { setKeyword(''); setStatus(''); setType(''); refetch(); }} className="btn-secondary">
            重置
          </button>
          <div className="flex items-center gap-1 ml-auto bg-ink-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow text-primary-600' : 'text-ink-500'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow text-primary-600' : 'text-ink-500'}`}
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
          {data?.items?.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              onView={(id) => navigate(`/admin/content/${id}`)}
              onEdit={(id) => navigate(`/admin/content/${id}/edit`)}
            />
          ))}
          {!isLoading && data?.items?.length === 0 && (
            <div className="col-span-full text-center py-12 text-ink-500">暂无内容</div>
          )}
        </div>
      ) : (
        <div className="card chinese-border p-0 overflow-hidden">
          <DataTable
            columns={columns}
            data={data?.items || []}
            loading={isLoading}
            onRowClick={(row) => navigate(`/admin/content/${row.id}`)}
          />
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-ink-200 disabled:opacity-50 hover:bg-ink-50"
          >
            上一页
          </button>
          <span className="text-sm text-ink-600">
            第 {page} / {data.totalPages} 页，共 {data.total} 条
          </span>
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page === data.totalPages}
            className="px-3 py-1.5 rounded-lg border border-ink-200 disabled:opacity-50 hover:bg-ink-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default ContentListPage;
