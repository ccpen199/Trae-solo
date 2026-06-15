import { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Clock,
  User,
  BookOpen,
  Video,
  FileText,
  AlertTriangle,
  Check,
  X,
  ChevronDown,
  Eye,
} from 'lucide-react';
import { api } from '../../utils/api';
import { cn } from '../../lib/utils';
import type { ReviewRecord, PaginatedResponse } from '../../../shared/types';

type TabType = 'pending' | 'approved' | 'rejected';
type ContentType = 'all' | 'course' | 'video' | 'profile' | 'service';

const contentTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  course: { label: '课程', icon: BookOpen, color: 'bg-blue-500/20 text-blue-400' },
  video: { label: '视频', icon: Video, color: 'bg-purple-500/20 text-purple-400' },
  profile: { label: '用户资料', icon: User, color: 'bg-green-500/20 text-green-400' },
  service: { label: '服务', icon: FileText, color: 'bg-orange-500/20 text-orange-400' },
};

const tabConfig: Record<TabType, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: '待审核', icon: Clock, color: 'text-amber-400 bg-amber-500/20' },
  approved: { label: '已通过', icon: CheckCircle, color: 'text-green-400 bg-green-500/20' },
  rejected: { label: '已驳回', icon: XCircle, color: 'text-red-400 bg-red-500/20' },
};

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  item: ReviewRecord | null;
}

function RejectModal({ isOpen, onClose, onConfirm, item }: RejectModalProps) {
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!reason.trim()) {
      setErrors('请填写驳回原因');
      return;
    }
    onConfirm(reason);
    setReason('');
    setErrors(null);
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md animate-fade-in-up">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">驳回审核</h3>
              <p className="text-sm text-zinc-500">请填写驳回原因，以便提交者了解问题</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <p className="text-sm text-zinc-500 mb-1">审核内容</p>
            <p className="text-white font-medium">
              {contentTypeConfig[item.contentType]?.label} - ID: {item.contentId}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              驳回原因 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors) setErrors(null);
              }}
              placeholder="请详细描述驳回的原因..."
              rows={4}
              className={cn(
                'w-full px-4 py-3 rounded-xl bg-zinc-800 border text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all',
                errors ? 'border-red-500' : 'border-zinc-700'
              )}
            />
            {errors && <p className="mt-2 text-sm text-red-400">{errors}</p>}
          </div>

          <div className="text-sm text-zinc-500">
            <p className="mb-2">常用原因：</p>
            <div className="flex flex-wrap gap-2">
              {['内容违规', '信息不完整', '质量不达标', '涉嫌侵权'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors text-xs"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            确认驳回
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewCenter() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [contentType, setContentType] = useState<ContentType>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [showContentTypeFilter, setShowContentTypeFilter] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReviewRecord | null>(null);
  const [viewingItem, setViewingItem] = useState<ReviewRecord | null>(null);

  useEffect(() => {
    loadStats();
    loadReviews();
  }, [activeTab, contentType]);

  const loadStats = async () => {
    try {
      const response: any = await api.review.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load review stats:', error);
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, pageSize: 20, status: activeTab };
      if (contentType !== 'all') {
        params.contentType = contentType;
      }
      const response: any = await api.review.list(params);
      const data = response.data as PaginatedResponse<ReviewRecord>;
      setReviews(data.items);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.review.approve(id);
      loadReviews();
      loadStats();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleRejectClick = (item: ReviewRecord) => {
    setSelectedItem(item);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!selectedItem) return;
    try {
      await api.review.reject(selectedItem.id, reason);
      setRejectModalOpen(false);
      setSelectedItem(null);
      loadReviews();
      loadStats();
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const autoReviewPassedCount = reviews.filter((r) => r.autoCheckPassed).length;
  const autoReviewRate = reviews.length > 0 ? Math.round((autoReviewPassedCount / reviews.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">内容审核中心</h1>
          <p className="text-zinc-500 mt-1">管理和审核平台提交的所有内容</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索内容ID..."
              className="pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.pending || 0}</p>
              <p className="text-sm text-zinc-500">待审核</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.approved || 0}</p>
              <p className="text-sm text-zinc-500">已通过</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.rejected || 0}</p>
              <p className="text-sm text-zinc-500">已驳回</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{autoReviewRate}%</p>
              <p className="text-sm text-zinc-500">自动审核通过率</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
          {(Object.keys(tabConfig) as TabType[]).map((tab) => {
            const TabIcon = tabConfig[tab].icon;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  activeTab === tab
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-white'
                )}
              >
                <TabIcon className="w-4 h-4" />
                {tabConfig[tab].label}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowContentTypeFilter(!showContentTypeFilter)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {contentType === 'all' ? '全部类型' : contentTypeConfig[contentType]?.label}
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                showContentTypeFilter && 'rotate-180'
              )}
            />
          </button>

          {showContentTypeFilter && (
            <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-10">
              <button
                onClick={() => {
                  setContentType('all');
                  setShowContentTypeFilter(false);
                }}
                className={cn(
                  'w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors flex items-center gap-2',
                  contentType === 'all' ? 'text-primary-400' : 'text-zinc-400'
                )}
              >
                <FileCheck className="w-4 h-4" />
                全部类型
              </button>
              {(Object.keys(contentTypeConfig) as ContentType[]).filter((c) => c !== 'all').map((type) => {
                const ContentTypeIcon = contentTypeConfig[type].icon;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setContentType(type);
                      setShowContentTypeFilter(false);
                    }}
                    className={cn(
                      'w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors flex items-center gap-2',
                      contentType === type ? 'text-primary-400' : 'text-zinc-400'
                    )}
                  >
                    <ContentTypeIcon className="w-4 h-4" />
                    {contentTypeConfig[type].label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Review table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  内容类型
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  内容ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  提交者
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  自动审核
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  提交时间
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  状态
                </th>
                {activeTab === 'pending' && (
                  <th className="px-6 py-4 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    操作
                  </th>
                )}
                {activeTab !== 'pending' && (
                  <th className="px-6 py-4 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    审核人/原因
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    暂无{activeTab === 'pending' ? '待审核' : activeTab === 'approved' ? '已通过' : '已驳回'}的内容
                  </td>
                </tr>
              ) : (
                reviews.map((review) => {
                  const ContentIcon = contentTypeConfig[review.contentType]?.icon;
                  const StatusIcon = tabConfig[review.status as TabType]?.icon;
                  return (
                  <tr key={review.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', contentTypeConfig[review.contentType]?.color)}>
                          {ContentIcon && <ContentIcon className="w-4 h-4" />}
                        </div>
                        <span className="text-white font-medium">
                          {contentTypeConfig[review.contentType]?.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-400 font-mono text-sm">
                      {review.contentId.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {review.submitter?.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white">{review.submitter?.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {review.autoCheckPassed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          <Check className="w-3 h-3" />
                          通过
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                          <X className="w-3 h-3" />
                          未通过
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                      {new Date(review.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', tabConfig[review.status as TabType]?.color)}>
                        {StatusIcon && <StatusIcon className="w-3 h-3" />}
                        {tabConfig[review.status as TabType]?.label}
                      </span>
                    </td>
                    {activeTab === 'pending' ? (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingItem(review)}
                            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="p-2 rounded-lg hover:bg-green-500/20 text-green-400 hover:text-green-300 transition-colors"
                            title="通过"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectClick(review)}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                            title="驳回"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    ) : (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-zinc-500 text-sm">
                        {review.status === 'rejected' ? (
                          <span className="text-red-400">{review.reason}</span>
                        ) : (
                          <span>{review.reviewer?.username || '系统'}</span>
                        )}
                      </td>
                    )}
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auto review statistics */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">自动审核统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400">自动审核通过率</span>
              <span className="text-white font-medium">{autoReviewRate}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                style={{ width: `${autoReviewRate}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400">需人工审核</span>
              <span className="text-white font-medium">{reviews.length - autoReviewPassedCount} 项</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                style={{ width: `${100 - autoReviewRate}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400">今日审核总数</span>
              <span className="text-white font-medium">{reviews.length} 项</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      <RejectModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={handleRejectConfirm}
        item={selectedItem}
      />

      {/* View detail modal */}
      {viewingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg animate-fade-in-up">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">内容详情</h3>
              <button
                onClick={() => setViewingItem(null)}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <p className="text-zinc-500 text-sm mb-1">内容类型</p>
                  <p className="text-white font-medium">
                    {contentTypeConfig[viewingItem.contentType]?.label}
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <p className="text-zinc-500 text-sm mb-1">内容ID</p>
                  <p className="text-white font-medium font-mono text-sm">{viewingItem.contentId}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <p className="text-zinc-500 text-sm mb-1">提交者</p>
                  <p className="text-white font-medium">{viewingItem.submitter?.username}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <p className="text-zinc-500 text-sm mb-1">自动审核</p>
                  <p className={viewingItem.autoCheckPassed ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                    {viewingItem.autoCheckPassed ? '通过' : '未通过'}
                  </p>
                </div>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <p className="text-zinc-500 text-sm mb-1">提交时间</p>
                <p className="text-white font-medium">
                  {new Date(viewingItem.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => {
                  handleApprove(viewingItem.id);
                  setViewingItem(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                通过审核
              </button>
              <button
                onClick={() => {
                  setSelectedItem(viewingItem);
                  setRejectModalOpen(true);
                  setViewingItem(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                驳回审核
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
