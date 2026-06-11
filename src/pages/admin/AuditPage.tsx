import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { auditApi } from '../../lib/api';
import StatusBadge from '../../components/ui/StatusBadge';
import DataTable from '../../components/ui/DataTable';
import type { AuditRecord, Content } from '../../../shared/types';

const AuditPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [auditLevel, setAuditLevel] = useState<number | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [auditResult, setAuditResult] = useState<'approve' | 'reject'>('approve');
  const [auditComment, setAuditComment] = useState('');
  const [level] = useState<1 | 2 | 3>(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-pending', auditLevel],
    queryFn: async () => {
      const res = await auditApi.getPending({
        page: 1,
        pageSize: 20,
        auditLevel: auditLevel || undefined,
      });
      return res.data;
    },
  });

  const { data: statistics } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      const res = await auditApi.getStatistics();
      return res.data;
    },
  });

  const handleAudit = async () => {
    if (!selectedContent) return;
    try {
      await auditApi.action({
        contentId: selectedContent.id,
        action: auditResult,
        level: level as 1 | 2 | 3,
        opinion: auditComment,
      });
      queryClient.invalidateQueries({ queryKey: ['audit-pending'] });
      queryClient.invalidateQueries({ queryKey: ['audit-stats'] });
      setShowModal(false);
      setSelectedContent(null);
      setAuditComment('');
    } catch (err) {
      console.error('审核失败:', err);
    }
  };

  const columns = [
    {
      key: 'title',
      title: '内容标题',
      width: '30%',
      render: (row: Content & { currentAuditLevel: number }) => (
        <div className="flex items-center gap-3">
          <img src={(row as any).coverImage || 'https://picsum.photos/48/48'} alt="" className="w-12 h-12 rounded object-cover" />
          <div className="min-w-0">
            <p className="font-medium text-ink-800 truncate">{row.title}</p>
            <p className="text-xs text-ink-500">{(row as any).authorName} · {row.type}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'currentAuditLevel',
      title: '当前审核级',
      width: '12%',
      render: (row: Content & { currentAuditLevel: number }) => (
        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm font-medium">
          第{row.currentAuditLevel}级
        </span>
      ),
    },
    { key: 'category', title: '分类', width: '12%' },
    { key: 'region', title: '地区', width: '10%' },
    { key: 'status', title: '状态', width: '12%', render: (row: Content) => <StatusBadge status={row.status as any} /> },
    {
      key: 'submittedAt',
      title: '提交时间',
      width: '14%',
      render: (row: any) => <span className="text-sm text-ink-600">{new Date(row.createdAt).toLocaleString()}</span>,
    },
    {
      key: 'actions',
      title: '操作',
      width: '10%',
      render: (row: Content & { currentAuditLevel: number }) => (
        <button
          onClick={() => { setSelectedContent(row); setShowModal(true); }}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          审核
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">内容审核</h1>
          <p className="text-ink-500 text-sm mt-1">三级审核流程管理</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3].map((lvl) => (
          <div key={lvl} className="card chinese-border">
            <h3 className="text-sm text-ink-500 mb-2">第{lvl}级待审</h3>
            <p className="text-3xl font-bold text-primary-600">
              {statistics?.pendingByLevel?.[lvl] || 0}
            </p>
          </div>
        ))}
        <div className="card chinese-border">
          <h3 className="text-sm text-ink-500 mb-2">今日通过率</h3>
          <p className="text-3xl font-bold text-green-600">
            {statistics ? (
              statistics.todayApproved + statistics.todayRejected > 0
                ? ((statistics.todayApproved / (statistics.todayApproved + statistics.todayRejected)) * 100).toFixed(1) + '%'
                : '0%'
            ) : '0%'}
          </p>
        </div>
      </div>

      <div className="card chinese-border">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm text-ink-600">筛选：</span>
          <div className="flex gap-2">
            <button
              onClick={() => setAuditLevel('')}
              className={`px-3 py-1.5 rounded-lg text-sm ${auditLevel === '' ? 'bg-primary-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}
            >
              全部
            </button>
            {[1, 2, 3].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setAuditLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg text-sm ${auditLevel === lvl ? 'bg-primary-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}
              >
                第{lvl}级
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
        />
      </div>

      {showModal && selectedContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-ink-100">
              <h3 className="text-xl font-bold text-ink-800">内容审核</h3>
              <p className="text-ink-500 text-sm mt-1">{selectedContent.title}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink-500">作者：</span>
                  <span className="text-ink-800">{selectedContent.authorName}</span>
                </div>
                <div>
                  <span className="text-ink-500">类型：</span>
                  <span className="text-ink-800">{selectedContent.type}</span>
                </div>
                <div>
                  <span className="text-ink-500">分类：</span>
                  <span className="text-ink-800">{selectedContent.category}</span>
                </div>
                <div>
                  <span className="text-ink-500">地区：</span>
                  <span className="text-ink-800">{selectedContent.region}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-ink-700 mb-2">内容摘要</h4>
                <p className="text-sm text-ink-600 bg-ink-50 p-3 rounded-lg">{selectedContent.summary}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-ink-700 mb-2">审核结果</h4>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="audit"
                      value="approve"
                      checked={auditResult === 'approve'}
                      onChange={() => setAuditResult('approve')}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-green-700 font-medium">通过</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="audit"
                      value="reject"
                      checked={auditResult === 'reject'}
                      onChange={() => setAuditResult('reject')}
                      className="w-4 h-4 text-red-600"
                    />
                    <span className="text-red-700 font-medium">驳回</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-ink-700 mb-2">审核意见</h4>
                <textarea
                  value={auditComment}
                  onChange={(e) => setAuditComment(e.target.value)}
                  className="input h-24 resize-none"
                  placeholder="请输入审核意见（驳回时必填）"
                  required={auditResult === 'reject'}
                />
              </div>
            </div>
            <div className="p-6 border-t border-ink-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
              <button onClick={handleAudit} className="btn-primary">
                确认审核
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditPage;
