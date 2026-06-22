import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { moderationApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatDate, getInitials } from '../utils/constants';

const REPORT_TYPE_LABELS: Record<string, string> = {
  spam: '垃圾广告', inappropriate: '不当内容', fraud: '欺诈信息', copyright: '侵权', other: '其他'
};
const REPORT_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: 'text-amber-700', bg: 'bg-amber-100' },
  investigating: { label: '调查中', color: 'text-blue-700', bg: 'bg-blue-100' },
  resolved: { label: '已处理', color: 'text-green-700', bg: 'bg-green-100' },
  rejected: { label: '已驳回', color: 'text-gray-600', bg: 'bg-gray-100' }
};
const ACTION_LABELS: Record<string, string> = {
  warning: '警告用户', content_removed: '删除内容', user_suspended: '暂停账号', user_banned: '封禁账号', no_action: '无需处理'
};
const CONTENT_TYPE_LABELS: Record<string, string> = {
  diary: '装修日记', comment: '评论', message: '私信', portfolio: '作品集'
};

export default function ModerationPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'reports' | 'filter'>('reports');
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [filterStats, setFilterStats] = useState<any>(null);
  const [filterLogs, setFilterLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processForm, setProcessForm] = useState({ status: 'resolved', actionTaken: 'no_action', actionDescription: '', investigationNotes: '' });

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    const fetch = async () => {
      setLoading(true);
      try {
        if (activeTab === 'reports') {
          const res: any = await moderationApi.getModerationReports({ status: statusFilter });
          if (res?.success) { setReports(res.data.reports || []); setStats(res.data.statistics || {}); }
        } else {
          const res: any = await moderationApi.getFilterStats();
          if (res?.success) { setFilterStats(res.data.statistics); setFilterLogs(res.data.recentLogs || []); }
        }
      } finally { setLoading(false); }
    };
    fetch();
  }, [activeTab, statusFilter, user]);

  const doProcess = async (id: string) => {
    try {
      const res: any = await moderationApi.processReport(id, processForm);
      if (res?.success) { alert('处理完成'); setProcessingId(null); setReports(prev => prev.map(r => r._id === id ? res.data : r)); }
    } catch (e: any) { alert(e.message); }
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-red-700">🛡️ 内容审核后台</h1>
        <p className="text-gray-500 text-sm mt-1">管理举报、查看内容过滤日志、维护社区专业可信</p>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setActiveTab('reports')} className={`px-6 py-2.5 rounded-xl font-medium ${activeTab === 'reports' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
          🚩 举报管理 {stats.pending ? <span className="ml-1 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{stats.pending}</span> : null}
        </button>
        <button onClick={() => setActiveTab('filter')} className={`px-6 py-2.5 rounded-xl font-medium ${activeTab === 'filter' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
          🔍 内容过滤日志
        </button>
      </div>

      {activeTab === 'reports' && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="card p-4"><p className="text-xs text-gray-500">待处理</p><p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending || 0}</p></div>
            <div className="card p-4"><p className="text-xs text-gray-500">调查中</p><p className="text-2xl font-bold text-blue-600 mt-1">{stats.investigating || 0}</p></div>
            <div className="card p-4"><p className="text-xs text-gray-500">已处理</p><p className="text-2xl font-bold text-green-600 mt-1">{stats.total ? (stats.total - (stats.pending || 0) - (stats.investigating || 0)) : 0}</p></div>
            <div className="card p-4"><p className="text-xs text-gray-500">累计举报</p><p className="text-2xl font-bold text-gray-700 mt-1">{stats.total || 0}</p></div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[{ key: '', label: '全部' }, { key: 'pending', label: '待处理' }, { key: 'investigating', label: '调查中' }, { key: 'resolved', label: '已处理' }, { key: 'rejected', label: '已驳回' }].map(f => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)} className={`tag ${statusFilter === f.key ? '!bg-red-100 !text-red-700' : ''}`}>{f.label}</button>
            ))}
          </div>

          {loading ? <div className="card p-12 text-center text-gray-500">加载中...</div> : reports.length === 0 ? (
            <div className="card p-12 text-center text-gray-500"><p className="text-5xl mb-3">✅</p><p>暂无举报记录</p></div>
          ) : (
            <div className="space-y-4">
              {reports.map(r => {
                const rStatus = REPORT_STATUS_LABELS[r.status];
                const reporter = typeof r.reporterId === 'string' ? { username: '用户', nickname: '', avatar: '' } : r.reporterId;
                const targetUser = typeof r.targetUserId === 'string' ? { username: '用户', nickname: '', avatar: '' } : r.targetUserId;
                return (
                  <div key={r._id} className="card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`badge ${rStatus.bg} ${rStatus.color}`}>{rStatus.label}</span>
                          <span className="badge bg-red-50 text-red-700">{REPORT_TYPE_LABELS[r.reportType] || r.reportType}</span>
                          <span className="badge bg-gray-100 text-gray-600">目标: {r.targetType}</span>
                          {r.relatedReports?.length > 1 && <span className="badge bg-amber-50 text-amber-700">关联举报 ×{r.relatedReports.length}</span>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs mb-1">举报人</p>
                            <div className="flex items-center gap-2">
                              {reporter.avatar ? <img src={reporter.avatar} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">{getInitials(reporter.nickname || reporter.username)}</div>}
                              <span className="font-medium">{reporter.nickname || reporter.username}</span>
                              <span className="text-xs text-gray-400">ID: {r.reporterId._id || r.reporterId}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-1">被举报用户</p>
                            <div className="flex items-center gap-2">
                              {targetUser.avatar ? <img src={targetUser.avatar} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs">{getInitials(targetUser.nickname || targetUser.username)}</div>}
                              <span className="font-medium">{targetUser.nickname || targetUser.username}</span>
                              <span className="text-xs text-gray-400">ID: {r.targetUserId._id || r.targetUserId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                          <p className="text-sm font-medium text-gray-700 mb-1">举报理由:</p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{r.description}</p>
                        </div>
                        {r.contentSnapshot && (
                          <div className="mt-3 p-4 border border-amber-200 bg-amber-50/50 rounded-xl">
                            <p className="text-xs text-amber-700 mb-2">📸 内容快照 (举报时)</p>
                            {r.contentSnapshot.title && <p className="text-sm font-semibold text-gray-900 mb-1">{r.contentSnapshot.title}</p>}
                            {r.contentSnapshot.content && <p className="text-sm text-gray-600 line-clamp-3">{r.contentSnapshot.content}</p>}
                            {r.contentSnapshot.images?.length > 0 && (
                              <div className="grid grid-cols-5 gap-1 mt-2">
                                {r.contentSnapshot.images.slice(0, 5).map((img: string, i: number) => <img key={i} src={img} className="w-full aspect-square rounded object-cover" />)}
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-2">时间: {formatDate(r.contentSnapshot.timestamp)}</p>
                          </div>
                        )}
                        {r.evidenceImages?.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2">证据:</p>
                            <div className="grid grid-cols-6 gap-1">
                              {r.evidenceImages.map((img: string, i: number) => <img key={i} src={img} className="aspect-square rounded object-cover w-full" />)}
                            </div>
                          </div>
                        )}
                        {r.actionTaken && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                            <p className="font-medium text-blue-700">处理结果: {ACTION_LABELS[r.actionTaken] || r.actionTaken}</p>
                            {r.actionDescription && <p className="text-blue-600 mt-1">{r.actionDescription}</p>}
                            {r.resolvedAt && <p className="text-xs text-gray-500 mt-1">处理于 {formatDate(r.resolvedAt)}</p>}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-3">提交于 {formatDate(r.createdAt)}</p>
                      </div>
                      <div className="shrink-0 space-y-2">
                        {processingId === r._id ? (
                          <div className="w-72 bg-white border-2 border-red-200 rounded-xl p-4 shadow-lg space-y-3">
                            <p className="font-semibold text-sm">处理举报</p>
                            <div>
                              <label className="text-xs font-medium mb-1 block">处理状态</label>
                              <select value={processForm.status} onChange={e => setProcessForm(p => ({ ...p, status: e.target.value }))} className="input text-sm">
                                <option value="investigating">转为调查中</option>
                                <option value="resolved">已处理</option>
                                <option value="rejected">驳回举报</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">处置动作</label>
                              <select value={processForm.actionTaken} onChange={e => setProcessForm(p => ({ ...p, actionTaken: e.target.value }))} className="input text-sm">
                                {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">处置说明</label>
                              <textarea value={processForm.actionDescription} onChange={e => setProcessForm(p => ({ ...p, actionDescription: e.target.value }))} className="input text-sm" rows={2} />
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">调查备注</label>
                              <textarea value={processForm.investigationNotes} onChange={e => setProcessForm(p => ({ ...p, investigationNotes: e.target.value }))} className="input text-sm" rows={2} />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setProcessingId(null)} className="btn-outline !py-1 text-xs flex-1">取消</button>
                              <button onClick={() => doProcess(r._id)} className="btn-primary !py-1 text-xs flex-1">确认</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {r.targetType === 'diary' && <Link to={`/diaries/${r.targetId}`} className="btn-outline !py-1 text-xs w-full block text-center">查看目标</Link>}
                            {['pending', 'investigating'].includes(r.status) && <button onClick={() => { setProcessingId(r._id); setProcessForm({ status: 'resolved', actionTaken: 'no_action', actionDescription: r.actionDescription || '', investigationNotes: r.investigationNotes || '' }); }} className="bg-red-600 text-white w-full !py-1 text-xs rounded-lg hover:bg-red-700">处理</button>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'filter' && (
        <>
          {filterStats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="card p-4"><p className="text-xs text-gray-500">累计拦截</p><p className="text-2xl font-bold text-gray-900 mt-1">{filterStats.total}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-500">已拦截</p><p className="text-2xl font-bold text-red-600 mt-1">{filterStats.blocked}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-500">已屏蔽</p><p className="text-2xl font-bold text-amber-600 mt-1">{filterStats.censored}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-500">待审核</p><p className="text-2xl font-bold text-blue-600 mt-1">{filterStats.flagged}</p></div>
              <div className="card p-4"><p className="text-xs text-gray-500">触发率</p><p className="text-2xl font-bold text-purple-600 mt-1">{filterStats.total ? ((filterStats.blocked + filterStats.censored + filterStats.flagged) / 100).toFixed(1) : 0}%</p></div>
            </div>
          )}

          {filterStats?.byContentType && (
            <div className="card p-5">
              <h3 className="font-semibold mb-3">按内容类型分布</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {filterStats.byContentType.map((item: any) => (
                  <div key={item._id} className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">{CONTENT_TYPE_LABELS[item._id] || item._id}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="font-semibold mb-4">最近50条过滤记录</h3>
            {loading ? <p className="text-center py-8 text-gray-500">加载中...</p> : filterLogs.length === 0 ? (
              <p className="text-center py-8 text-gray-500">暂无过滤记录</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2 font-medium">时间</th>
                      <th className="py-2 font-medium">类型</th>
                      <th className="py-2 font-medium">用户</th>
                      <th className="py-2 font-medium">命中关键词</th>
                      <th className="py-2 font-medium">处置</th>
                      <th className="py-2 font-medium">原始内容</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterLogs.map(log => {
                      const u = typeof log.userId === 'string' ? { username: '用户', nickname: '' } : log.userId;
                      return (
                        <tr key={log._id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 text-gray-500 whitespace-nowrap">{formatDate(log.createdAt, 'MM-DD HH:mm')}</td>
                          <td className="py-3"><span className="badge bg-gray-100 text-gray-600">{CONTENT_TYPE_LABELS[log.contentType] || log.contentType}</span></td>
                          <td className="py-3 font-medium whitespace-nowrap">{u.nickname || u.username}</td>
                          <td className="py-3"><div className="flex flex-wrap gap-1">{log.matchedWords.slice(0, 5).map((w: string, i: number) => <span key={i} className="badge bg-red-50 text-red-600">{w}</span>)}</div></td>
                          <td className="py-3 whitespace-nowrap">
                            <span className={`badge ${log.action === 'blocked' ? 'bg-red-100 text-red-700' : log.action === 'censored' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                              {log.action === 'blocked' ? '拦截' : log.action === 'censored' ? '屏蔽' : '标记'}
                            </span>
                          </td>
                          <td className="py-3 max-w-xs"><p className="text-gray-600 line-clamp-2">{log.originalContent}</p></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
