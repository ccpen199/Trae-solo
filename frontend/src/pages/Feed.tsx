import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { postApi, topicApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Button, Tag, EmptyState, Badge, Icon } from '../components/ui';
import PostCard from '../components/PostCard';
import type { Post, Topic } from '../types';
import {
  getPostTypeColor,
  getPostTypeLabel,
  getRiskLevelLabel,
  getRiskLevelColor,
  getAuditActionLabel,
  getAuditActionColor,
  formatDateTime,
} from '../utils/format';

const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { location } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState(searchParams.get('type') || '');
  const [activeTopic, setActiveTopic] = useState(searchParams.get('topic') || '');
  const [activeAuditStatus, setActiveAuditStatus] = useState(searchParams.get('auditStatus') || '');
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [expandedAuditPostId, setExpandedAuditPostId] = useState<string | null>(null);

  const types = [
    { v: '', l: '全部' },
    { v: 'NOTICE', l: '政务通知' },
    { v: 'NEWS', l: '本地资讯' },
    { v: 'EMERGENCY', l: '突发事件' },
    { v: 'REVIEW', l: '消费探店' },
    { v: 'ACTIVITY', l: '商圈活动' },
    { v: 'INFO', l: '便民信息' },
  ];

  const auditStatusOptions = [
    { v: '', l: '全部' },
    { v: 'PENDING', l: '待审核' },
    { v: 'APPROVED', l: '已通过' },
    { v: 'REJECTED', l: '已驳回' },
    { v: 'RUMOR', l: '谣言标记' },
  ];

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    setPage(1);
    setPosts([]);
    loadPosts(1, true);
  }, [activeType, activeTopic, activeAuditStatus]);

  const loadTopics = async () => {
    try {
      const res = await topicApi.list();
      setTopics(res.topics || []);
    } catch {}
  };

  const loadPosts = async (p: number, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await postApi.feed({
        latitude: location?.latitude,
        longitude: location?.longitude,
        type: activeType || undefined,
        topic: activeTopic || undefined,
        auditStatus: activeAuditStatus || undefined,
        keyword: keyword.trim() || undefined,
        page: p,
        limit: 10,
      });
      const newPosts = res.posts || [];
      setPosts(reset ? newPosts : [...posts, ...newPosts]);
      setHasMore(res.hasMore);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = keyword.trim();
    if (value) {
      searchParams.set('q', value);
    } else {
      searchParams.delete('q');
    }
    setSearchParams(searchParams);
    setPage(1);
    setPosts([]);
    loadPosts(1, true);
  };

  const handleTopicClick = (name: string) => {
    const newTopic = activeTopic === name ? '' : name;
    setActiveTopic(newTopic);
    if (newTopic) {
      searchParams.set('topic', newTopic);
    } else {
      searchParams.delete('topic');
    }
    setSearchParams(searchParams);
  };

  const handleTypeClick = (type: string) => {
    setActiveType(type);
    if (type) {
      searchParams.set('type', type);
    } else {
      searchParams.delete('type');
    }
    setSearchParams(searchParams);
  };

  const handleAuditStatusClick = (status: string) => {
    setActiveAuditStatus(status);
    if (status) {
      searchParams.set('auditStatus', status);
    } else {
      searchParams.delete('auditStatus');
    }
    setSearchParams(searchParams);
  };

  const getAuditStatusLabel = (status: string) => {
    const opt = auditStatusOptions.find(o => o.v === status);
    return opt ? opt.l : status;
  };

  const toggleAuditTimeline = (postId: string) => {
    setExpandedAuditPostId(expandedAuditPostId === postId ? null : postId);
  };

  return (
    <div>
      {/* Filters */}
      <div className="sticky top-16 z-40 bg-gray-50/80 backdrop-blur py-4 mb-4 -mx-4 px-4">
        <div className="space-y-3">
          <form onSubmit={handleKeywordSubmit} className="flex gap-2">
            <input
              type="search"
              aria-label="搜索框"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索框：请输入关键词查看搜索结果"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600"
            >
              搜索
            </button>
          </form>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {types.map((t) => (
              <button
                key={t.v}
                onClick={() => handleTypeClick(t.v)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeType === t.v
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 flex-shrink-0">审核状态：</span>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 flex-1">
              {auditStatusOptions.map((s) => (
                <button
                  key={s.v}
                  onClick={() => handleAuditStatusClick(s.v)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeAuditStatus === s.v
                      ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {s.l}
                </button>
              ))}
            </div>
          </div>

          {topics.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {topics.slice(0, 15).map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTopicClick(t.name)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTopic === t.name
                      ? 'bg-orange-500 text-white'
                      : t.isHot
                      ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                      : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {t.isHot && '🔥 '}
                  {t.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => navigate('/create', { state: { defaultType: activeType || 'NEWS' } })}
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 shadow-md shadow-primary-500/20"
            >
              发布
            </button>
            <button
              onClick={() => handleTopicClick('避坑指南')}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTopic === '避坑指南'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              避坑指南
            </button>
            <button
              onClick={() => navigate('/utilities')}
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 text-sm font-medium"
            >
              便民服务
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(activeType || activeTopic || activeAuditStatus || keyword.trim()) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm text-gray-500">搜索结果 / 当前筛选：</span>
          {keyword.trim() && (
            <Tag onClick={() => {
              setKeyword('');
              searchParams.delete('q');
              setSearchParams(searchParams);
            }}>
              关键词：{keyword.trim()} ×
            </Tag>
          )}
          {activeType && (
            <Tag onClick={() => handleTypeClick('')}>
              {getPostTypeLabel(activeType)} ×
            </Tag>
          )}
          {activeTopic && (
            <Tag onClick={() => handleTopicClick(activeTopic)} active>
              {activeTopic} ×
            </Tag>
          )}
          {activeAuditStatus && (
            <span
              onClick={() => handleAuditStatusClick('')}
              className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer"
            >
              审核：{getAuditStatusLabel(activeAuditStatus)} ×
            </span>
          )}
          <button
            onClick={() => {
              setActiveType('');
              setActiveTopic('');
              setActiveAuditStatus('');
              setKeyword('');
              searchParams.delete('type');
              searchParams.delete('topic');
              searchParams.delete('auditStatus');
              searchParams.delete('q');
              setSearchParams(searchParams);
            }}
            className="text-sm text-primary-600 hover:underline ml-2"
          >
            清除筛选
          </button>
        </div>
      )}

      {/* Post List */}
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => {
            const latestAudit = post.auditLogs?.[0];
            const hasAuditLogs = post.auditLogs && post.auditLogs.length > 0;
            const hasMultipleAudits = post.auditLogs && post.auditLogs.length > 1;
            const hasApprove = post.auditLogs?.some(log => log.action === 'APPROVE');
            const hasReject = post.auditLogs?.some(log => log.action === 'REJECT');
            const hasRumor = post.auditLogs?.some(log => log.action === 'RUMOR');
            const isExpanded = expandedAuditPostId === post.id;

            return (
              <div key={post.id} className="space-y-3">
                <PostCard post={post} />

                {hasAuditLogs && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">审核信息</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAuditTimeline(post.id);
                        }}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                      >
                        <span className="text-sm">{isExpanded ? '▲' : '▼'}</span>
                        {isExpanded ? '收起审核记录' : '查看审核记录'}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {latestAudit?.riskLevel && (
                        <Badge className={`${getRiskLevelColor(latestAudit.riskLevel)}`}>
                          AI初筛：{getRiskLevelLabel(latestAudit.riskLevel)}
                          {latestAudit.aiScore !== undefined && ` (${Math.round(latestAudit.aiScore)}分)`}
                        </Badge>
                      )}
                      {hasApprove && (
                        <Badge className="bg-blue-100 text-blue-700">
                          ✓ 人工复审通过
                        </Badge>
                      )}
                      {hasReject && (
                        <Badge className="bg-red-100 text-red-700">
                          ✗ 已驳回
                        </Badge>
                      )}
                      {hasRumor && (
                        <Badge className="bg-red-100 text-red-700">
                          ⚠️ 谣言标记
                        </Badge>
                      )}
                      {hasMultipleAudits && (
                        <Badge className="bg-purple-100 text-purple-700">
                          🔍 可溯源
                        </Badge>
                      )}
                    </div>

                    {isExpanded && post.auditLogs && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-xs font-medium text-gray-600 mb-3">审核时间线</div>
                        <div className="space-y-3">
                          {post.auditLogs.map((log, idx) => (
                            <div key={log.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-2 h-2 rounded-full ${
                                  log.action === 'APPROVE' ? 'bg-blue-500' :
                                  log.action === 'REJECT' || log.action === 'RUMOR' ? 'bg-red-500' :
                                  log.action === 'CLARIFY' ? 'bg-purple-500' :
                                  'bg-yellow-500'
                                }`} />
                                {idx < post.auditLogs!.length - 1 && (
                                  <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                                )}
                              </div>
                              <div className="flex-1 pb-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={`${getAuditActionColor(log.action)} text-xs`}>
                                    {getAuditActionLabel(log.action)}
                                  </Badge>
                                  {log.riskLevel && (
                                    <span className="text-xs text-gray-500">
                                      风险等级：{getRiskLevelLabel(log.riskLevel)}
                                    </span>
                                  )}
                                  {log.aiScore !== undefined && (
                                    <span className="text-xs text-gray-500">
                                      AI评分：{Math.round(log.aiScore)}
                                    </span>
                                  )}
                                </div>
                                {log.reason && (
                                  <p className="text-xs text-gray-600 mb-1">{log.reason}</p>
                                )}
                                {log.matchedKeywords && log.matchedKeywords.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-1">
                                    {log.matchedKeywords.map((kw, i) => (
                                      <span key={i} className="text-xs bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded">
                                        {kw}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="text-xs text-gray-400">
                                  {formatDateTime(log.createdAt)}
                                  {log.auditor?.nickname && ` · ${log.auditor.nickname}`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={() => loadPosts(page + 1)}
                disabled={loading}
              >
                {loading ? '加载中...' : '加载更多'}
              </Button>
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse border border-gray-100">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-5/6" />
                <div className="h-4 bg-gray-100 rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🔍"
          title="没有找到相关内容"
          description="换个筛选条件试试吧，或者成为第一个发布者"
        />
      )}
    </div>
  );
};

export default FeedPage;
