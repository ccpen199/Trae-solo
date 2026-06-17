import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { Button, Card, Badge, Avatar } from '../../components/ui';
import { formatTime } from '../../utils/format';
import type { Post } from '../../types';

type AuditPost = Post;

const AuditDashboard: React.FC = () => {
  const [posts, setPosts] = useState<AuditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedPost, setSelectedPost] = useState<AuditPost | null>(null);
  const [traceData, setTraceData] = useState<any>(null);
  const [showTrace, setShowTrace] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRumor, setIsRumor] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [todayApproved, setTodayApproved] = useState(0);
  const [showRumorConfirm, setShowRumorConfirm] = useState(false);
  const [rumorPost, setRumorPost] = useState<AuditPost | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filter !== 'ALL') params.riskLevel = filter;
      const res = await adminApi.pendingAudits(params);
      setPosts(res.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayApproved = async () => {
    try {
      const res = await adminApi.dashboardOverview();
      setTodayApproved(res.todayApproved ?? 0);
    } catch {
      console.error('获取今日审核统计失败');
    }
  };

  useEffect(() => {
    fetchPending();
    fetchTodayApproved();
  }, [filter]);

  const handleApprove = async (post: AuditPost) => {
    setActioningId(post.id);
    try {
      await adminApi.approvePost(post.id, '内容合规，审核通过');
      await fetchPending();
      await fetchTodayApproved();
      setSelectedPost(null);
    } catch (e: any) {
      alert(e.response?.data?.error || '操作失败');
    } finally {
      setActioningId(null);
    }
  };

  const openRejectModal = (post: AuditPost) => {
    setSelectedPost(post);
    setShowRejectModal(true);
    setRejectReason('');
    setIsRumor(false);
  };

  const openRumorConfirm = (post: AuditPost) => {
    setRumorPost(post);
    setShowRumorConfirm(true);
  };

  const handleRumor = async () => {
    if (!rumorPost) return;
    setActioningId(rumorPost.id);
    try {
      await adminApi.rejectPost(rumorPost.id, '内容被标记为谣言', true);
      await fetchPending();
      await fetchTodayApproved();
      setSelectedPost(null);
      setShowRumorConfirm(false);
      setRumorPost(null);
    } catch (e: any) {
      alert(e.response?.data?.error || '操作失败');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedPost || !rejectReason.trim()) {
      alert('请填写拒绝原因');
      return;
    }
    setActioningId(selectedPost.id);
    try {
      await adminApi.rejectPost(selectedPost.id, rejectReason, isRumor);
      await fetchPending();
      await fetchTodayApproved();
      setSelectedPost(null);
      setShowRejectModal(false);
    } catch (e: any) {
      alert(e.response?.data?.error || '操作失败');
    } finally {
      setActioningId(null);
    }
  };

  const handleTrace = async (post: AuditPost) => {
    try {
      const res = await adminApi.tracePost(post.id);
      setTraceData(res);
      setShowTrace(true);
    } catch (e: any) {
      console.error(e);
    }
  };

  const getRiskStyle = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'CRITICAL': return '极高风险';
      case 'HIGH': return '高风险';
      case 'MEDIUM': return '中风险';
      case 'LOW': return '低风险';
      default: return '未评估';
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      NEWS: '新闻资讯', REVIEW: '探店笔记', ACTIVITY: '商圈活动',
      NOTICE: '官方通知', EMERGENCY: '突发事件', INFO: '便民信息',
    };
    return map[type] || type;
  };

  const stats = {
    total: posts.length,
    highRisk: posts.filter(p => {
      const level = p.auditLogs?.[0]?.riskLevel;
      return level === 'CRITICAL' || level === 'HIGH';
    }).length,
    todayApproved,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">内容审核工作台</h1>
        <p className="text-sm text-slate-500 mt-1">AI初筛 + 人工复审 · 守护社区内容安全</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-red-700">待审核总数</div>
              <div className="text-4xl font-bold text-red-600 mt-2">{stats.total}</div>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-yellow-700">高风险内容数</div>
              <div className="text-4xl font-bold text-yellow-600 mt-2">{stats.highRisk}</div>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-700">今日已审核数</div>
              <div className="text-4xl font-bold text-green-600 mt-2">{stats.todayApproved}</div>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-600 mr-2">风险筛选：</span>
          {[
            { key: 'ALL', label: '全部' },
            { key: 'CRITICAL', label: '极高风险' },
            { key: 'HIGH', label: '高风险' },
            { key: 'MEDIUM', label: '中风险' },
            { key: 'LOW', label: '低风险' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === item.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-4">
          {loading ? (
            <Card className="p-8 text-center text-slate-500">加载中...</Card>
          ) : posts.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <div className="text-lg font-medium text-slate-700">太棒了！</div>
              <div className="text-sm text-slate-500 mt-1">当前没有待审核的内容</div>
            </Card>
          ) : (
            posts.map(post => {
              const audit = post.auditLogs?.[0];
              const isSelected = selectedPost?.id === post.id;
              return (
                <Card
                  key={post.id}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-primary-500 shadow-md' : ''
                  }`}
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getRiskStyle(audit?.riskLevel || '')}>
                        {getRiskLabel(audit?.riskLevel || '')}
                      </Badge>
                      <Badge className="bg-slate-100 text-slate-600">
                        {getTypeLabel(post.type)}
                      </Badge>
                      {post.isPitfall && (
                        <Badge className="bg-red-50 text-red-600">⚠️ 避坑标记</Badge>
                      )}
                      {post.hasProof && (
                        <Badge className="bg-blue-50 text-blue-600">📎 有凭证</Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap">
                      {formatTime(post.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={post.user?.nickname || '?'} size="sm" />
                    <div className="text-sm text-slate-700 font-medium">
                      {post.user?.nickname}
                    </div>
                    {post.user?.isVerified && (
                      <Badge className="bg-blue-50 text-blue-600">已认证</Badge>
                    )}
                  </div>

                  <h3 className="font-medium text-slate-800 mb-2 line-clamp-1">{post.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2">{post.content}</p>

                  {(audit?.matchedKeywords?.length ?? 0) > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-500 mb-1.5">AI敏感词匹配：</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {(audit?.matchedKeywords ?? []).map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-red-50 text-red-600 rounded"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(post.images?.length ?? 0) > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-1.5">
                      {(post.images ?? []).slice(0, 4).map((img, i) => (
                        <div key={i} className="aspect-square bg-slate-100 rounded overflow-hidden">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleApprove(post)}
                      disabled={actioningId === post.id}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ✅ 通过
                    </button>
                    <button
                      onClick={() => openRejectModal(post)}
                      disabled={actioningId === post.id}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ❌ 拒绝
                    </button>
                    <button
                      onClick={() => openRumorConfirm(post)}
                      disabled={actioningId === post.id}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      🚩 标记谣言
                    </button>
                    <button
                      onClick={() => handleTrace(post)}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      🔍 查看溯源
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <div className="col-span-2 space-y-4">
          <Card className="p-5 sticky top-6">
            {!selectedPost ? (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-3">←</div>
                <div className="text-sm">点击左侧内容查看详情</div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-slate-800">内容详情</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleTrace(selectedPost); }}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    📜 溯源追踪
                  </button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={getRiskStyle(selectedPost.auditLogs?.[0]?.riskLevel || '')}>
                      AI评分: {selectedPost.auditLogs?.[0]?.aiScore ?? 'N/A'}
                    </Badge>
                    <Badge className="bg-slate-100 text-slate-600">
                      {getTypeLabel(selectedPost.type)}
                    </Badge>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                    <div>
                      <span className="text-slate-500">标题：</span>
                      <span className="font-medium">{selectedPost.title}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">作者：</span>
                      <span>{selectedPost.user?.nickname}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">发布时间：</span>
                      <span>{formatTime(selectedPost.createdAt)}</span>
                    </div>
                    {selectedPost.locationName && (
                      <div>
                        <span className="text-slate-500">位置：</span>
                        <span>📍 {selectedPost.locationName}</span>
                      </div>
                    )}
                    {selectedPost.priceAnchor && (
                      <div>
                        <span className="text-slate-500">人均：</span>
                        <span className="text-orange-600 font-medium">¥{selectedPost.priceAnchor}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-slate-500 text-xs mb-1">正文内容：</div>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm whitespace-pre-wrap max-h-48 overflow-auto">
                      {selectedPost.content}
                    </div>
                  </div>

                  {(selectedPost.images?.length ?? 0) > 0 && (
                    <div>
                      <div className="text-slate-500 text-xs mb-1">图片：</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(selectedPost.images ?? []).map((img, i) => (
                          <div key={i} className="aspect-square rounded overflow-hidden border border-slate-200">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedPost.topics?.length ?? 0) > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {(selectedPost.topics ?? []).map((t, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-primary-50 text-primary-700 rounded">
                          #{t.topic?.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => { e.stopPropagation(); openRejectModal(selectedPost); }}
                    disabled={actioningId === selectedPost.id}
                  >
                    ❌ 拒绝
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => { e.stopPropagation(); handleApprove(selectedPost); }}
                    disabled={actioningId === selectedPost.id}
                  >
                    ✅ 通过
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">拒绝内容</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">拒绝原因 *</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={4}
                  placeholder="请详细说明拒绝原因..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
              <label className="flex items-start gap-2 p-3 bg-red-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRumor}
                  onChange={e => setIsRumor(e.target.checked)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-red-700">标记为谣言</div>
                  <div className="text-xs text-red-500 mt-0.5">标记后将进入谣言库，关联内容将被限流</div>
                </div>
              </label>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setShowRejectModal(false)}>
                  取消
                </Button>
                <Button variant="danger" size="sm" className="flex-1" onClick={handleReject} disabled={actioningId === selectedPost?.id}>
                  确认拒绝
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRumorConfirm && rumorPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRumorConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">🚩 确认标记为谣言</h3>
            <div className="p-4 bg-orange-50 rounded-xl mb-4 space-y-2 text-sm">
              <div>
                <span className="text-slate-500">标题：</span>
                <span className="font-medium">{rumorPost.title}</span>
              </div>
              <div>
                <span className="text-slate-500">作者：</span>
                <span>{rumorPost.user?.nickname}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              标记为谣言后，该内容将被拒绝并进入谣言库，关联内容将被限流。此操作不可撤销，请确认。
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setShowRumorConfirm(false)}>
                取消
              </Button>
              <Button variant="danger" size="sm" className="flex-1" onClick={handleRumor} disabled={actioningId === rumorPost.id}>
                确认标记谣言
              </Button>
            </div>
          </div>
        </div>
      )}

      {showTrace && traceData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTrace(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">📜 溯源追踪</h3>
            {traceData.post && (
              <div className="p-4 bg-slate-50 rounded-xl mb-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">标题：</span>
                  <span className="font-medium">{traceData.post.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">作者：</span>
                  <span>{traceData.post.user?.nickname}（{traceData.post.user?.phone}）</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500">数据：</span>
                  <span>👁 {traceData.post.viewCount}</span>
                  <span>👍 {traceData.post.likeCount}</span>
                  <span>📤 {traceData.post.shareCount}</span>
                  <Badge className="bg-slate-100">{traceData.post.status}</Badge>
                </div>
              </div>
            )}
            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-700">审核日志：</div>
              {traceData.logs?.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">暂无审核记录</div>
              ) : (
                traceData.logs?.map((log: any, i: number) => (
                  <div key={i} className="relative pl-6 pb-4 border-l-2 border-slate-200 last:pb-0">
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary-500 border-2 border-white"></div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getRiskStyle(log.riskLevel)}>{getRiskLabel(log.riskLevel)}</Badge>
                      <span className="text-xs text-slate-500">{formatTime(log.createdAt)}</span>
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-medium">{log.auditor?.nickname || 'AI系统'}</span>
                      <span className="text-slate-500"> · </span>
                      <span>{log.action === 'AI_SCREEN' ? 'AI初筛' : log.action === 'MANUAL_APPROVE' ? '人工通过' : log.action === 'MANUAL_REJECT' ? '人工拒绝' : log.action === 'RUMOR_FLAG' ? '标记谣言' : log.action}</span>
                    </div>
                    {log.reason && <div className="text-xs text-slate-500 mt-1">原因：{log.reason}</div>}
                    {(log.matchedKeywords?.length ?? 0) > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {(log.matchedKeywords ?? []).map((kw: string, j: number) => (
                          <span key={j} className="px-1.5 py-0.5 text-xs bg-red-50 text-red-600 rounded">{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Button variant="primary" size="sm" onClick={() => setShowTrace(false)} className="w-full">
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditDashboard;
