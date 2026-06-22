import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Image,
  Video,
  MapPin,
  User,
  Calendar,
  Tag,
  CheckSquare,
  Square,
  Download,
  RefreshCw,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/stores/useAdminStore';
import { useBaoliaoStore } from '@/stores/useBaoliaoStore';
import AdminSidebar from '@/components/layout/AdminSidebar';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import Input from '@/components/common/Input';
import TextArea from '@/components/common/TextArea';
import { mockBaoliaos } from '@/data/mockBaoliaos';
import { huizhouDistricts } from '@/utils/location';
import { cn } from '@/lib/utils';
import type { Baoliao } from '@/types';

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
];

const categoryOptions = [
  { value: 'all', label: '全部分类' },
  { value: 'traffic', label: '交通出行' },
  { value: 'environment', label: '环境保护' },
  { value: 'facility', label: '市政设施' },
  { value: 'livelihood', label: '民生服务' },
  { value: 'emergency', label: '突发事件' },
  { value: 'other', label: '其他建议' },
];

const districtOptions = [
  { value: 'all', label: '全部区域' },
  ...huizhouDistricts.map((d) => ({ value: d.name, label: d.name })),
];

const timeOptions = [
  { value: 'all', label: '全部时间' },
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
];

const sensitiveWords = ['违规', '色情', '暴力', '赌博', '诈骗', '反动'];

function detectSensitiveWords(content: string): string[] {
  return sensitiveWords.filter((word) => content.includes(word));
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function StatusBadge({ status }: { status: Baoliao['status'] }) {
  const styles = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  const labels = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  };

  const icons = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle,
  };

  const Icon = icons[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
        styles[status]
      )}
    >
      <Icon className="w-3 h-3" />
      {labels[status]}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="p-4">
        <div className="w-5 h-5 rounded bg-neutral-700" />
      </td>
      <td className="p-4">
        <div className="h-5 bg-neutral-700 rounded w-64" />
      </td>
      <td className="p-4">
        <div className="h-4 bg-neutral-700 rounded w-24" />
      </td>
      <td className="p-4">
        <div className="h-4 bg-neutral-700 rounded w-20" />
      </td>
      <td className="p-4">
        <div className="h-4 bg-neutral-700 rounded w-24" />
      </td>
      <td className="p-4">
        <div className="h-4 bg-neutral-700 rounded w-28" />
      </td>
      <td className="p-4">
        <div className="h-6 bg-neutral-700 rounded-full w-16" />
      </td>
      <td className="p-4">
        <div className="h-8 bg-neutral-700 rounded w-32" />
      </td>
    </tr>
  );
}

export default function Review() {
  const navigate = useNavigate();
  const { fetchPendingBaoliaos, reviewBaoliao, loading } = useBaoliaoStore();
  const { getBaoliaoStats } = useAdminStore();
  const [baoliaos, setBaoliaos] = useState<Baoliao[]>([]);
  const [filteredBaoliaos, setFilteredBaoliaos] = useState<Baoliao[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedBaoliao, setSelectedBaoliao] = useState<Baoliao | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortField, setSortField] = useState<'createdAt' | 'views' | 'likes'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      await fetchPendingBaoliaos();
      const statsData = await getBaoliaoStats();
      setStats(statsData);
      setBaoliaos(mockBaoliaos);
      setFilteredBaoliaos(mockBaoliaos);
      setTimeout(() => setPageLoading(false), 500);
    };

    loadData();
  }, [fetchPendingBaoliaos, getBaoliaoStats]);

  useEffect(() => {
    let result = [...baoliaos];

    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter((b) => b.category === categoryFilter);
    }
    if (districtFilter !== 'all') {
      result = result.filter((b) => b.location.district === districtFilter);
    }
    if (timeFilter !== 'all') {
      const now = new Date();
      if (timeFilter === 'today') {
        result = result.filter(
          (b) => new Date(b.createdAt).toDateString() === now.toDateString()
        );
      } else if (timeFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        result = result.filter((b) => new Date(b.createdAt) >= weekAgo);
      } else if (timeFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        result = result.filter((b) => new Date(b.createdAt) >= monthAgo);
      }
    }
    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(lower) ||
          b.content.toLowerCase().includes(lower) ||
          b.user.nickname.toLowerCase().includes(lower)
      );
    }

    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (sortField === 'createdAt') {
        return sortOrder === 'desc'
          ? new Date(bVal).getTime() - new Date(aVal).getTime()
          : new Date(aVal).getTime() - new Date(bVal).getTime();
      }
      return sortOrder === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });

    setFilteredBaoliaos(result);
  }, [baoliaos, statusFilter, categoryFilter, districtFilter, timeFilter, searchText, sortField, sortOrder]);

  const sensitiveWordsFound = useMemo(() => {
    if (!selectedBaoliao) return [];
    return [
      ...detectSensitiveWords(selectedBaoliao.title),
      ...detectSensitiveWords(selectedBaoliao.content),
    ];
  }, [selectedBaoliao]);

  const isAllSelected = filteredBaoliaos.length > 0 && selectedIds.size === filteredBaoliaos.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredBaoliaos.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBaoliaos.map((b) => b.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleViewDetail = (baoliao: Baoliao) => {
    setSelectedBaoliao(baoliao);
    setRejectReason('');
    setShowRejectInput(false);
    setShowDetailModal(true);
  };

  const handleApprove = async (id: string) => {
    setReviewLoading(id);
    await reviewBaoliao(id, 'approved');
    setBaoliaos((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'approved' as const } : b))
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setReviewLoading(null);
    if (selectedBaoliao?.id === id) {
      setShowDetailModal(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      setShowRejectInput(true);
      return;
    }
    setReviewLoading(id);
    await reviewBaoliao(id, 'rejected', rejectReason);
    setBaoliaos((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: 'rejected' as const, rejectReason } : b
      )
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setReviewLoading(null);
    setRejectReason('');
    setShowRejectInput(false);
    if (selectedBaoliao?.id === id) {
      setShowDetailModal(false);
    }
  };

  const handleBatchApprove = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await reviewBaoliao(id, 'approved');
    }
    setBaoliaos((prev) =>
      prev.map((b) => (selectedIds.has(b.id) ? { ...b, status: 'approved' as const } : b))
    );
    setSelectedIds(new Set());
  };

  const handleBatchReject = () => {
    if (!rejectReason.trim()) {
      setShowRejectInput(true);
      return;
    }
    const ids = Array.from(selectedIds);
    Promise.all(ids.map((id) => reviewBaoliao(id, 'rejected', rejectReason))).then(() => {
      setBaoliaos((prev) =>
        prev.map((b) =>
          selectedIds.has(b.id) ? { ...b, status: 'rejected' as const, rejectReason } : b
        )
      );
      setSelectedIds(new Set());
      setRejectReason('');
      setShowRejectInput(false);
    });
  };

  const handleRefresh = async () => {
    setPageLoading(true);
    await fetchPendingBaoliaos();
    const statsData = await getBaoliaoStats();
    setStats(statsData);
    setBaoliaos(mockBaoliaos);
    setTimeout(() => setPageLoading(false), 300);
  };

  const handleSort = (field: 'createdAt' | 'views' | 'likes') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: 'createdAt' | 'views' | 'likes' }) => {
    if (sortField !== field) return null;
    return sortOrder === 'desc' ? (
      <ChevronDown className="w-4 h-4 inline" />
    ) : (
      <ChevronUp className="w-4 h-4 inline" />
    );
  };

  return (
    <div className="flex min-h-screen bg-neutral-900">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-[1800px] mx-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">爆料审核</h1>
              <p className="text-neutral-400 mt-1">审核和管理用户提交的爆料内容</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="md" onClick={handleRefresh} leftIcon={<RefreshCw className="w-4 h-4" />}>
                刷新
              </Button>
              <Button variant="secondary" size="md" leftIcon={<Download className="w-4 h-4" />}>
                导出数据
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-700/50"
            >
              <p className="text-neutral-400 text-sm">全部爆料</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-amber-500/30"
            >
              <p className="text-amber-400 text-sm">待审核</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{stats.pending}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/30"
            >
              <p className="text-emerald-400 text-sm">已通过</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.approved}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-rose-500/30"
            >
              <p className="text-rose-400 text-sm">已拒绝</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">{stats.rejected}</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-700/50 mb-6"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="搜索标题、内容或用户..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  prefix={<Search className="w-4 h-4 text-neutral-400" />}
                  className="bg-neutral-700/50 border-neutral-600 text-white placeholder-neutral-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-neutral-400" />
                <Select
                  options={statusOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  size="md"
                  className="w-32 bg-neutral-700/50 border-neutral-600"
                />
                <Select
                  options={categoryOptions}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  size="md"
                  className="w-32 bg-neutral-700/50 border-neutral-600"
                />
                <Select
                  options={districtOptions}
                  value={districtFilter}
                  onChange={setDistrictFilter}
                  size="md"
                  className="w-32 bg-neutral-700/50 border-neutral-600"
                />
                <Select
                  options={timeOptions}
                  value={timeFilter}
                  onChange={setTimeFilter}
                  size="md"
                  className="w-32 bg-neutral-700/50 border-neutral-600"
                />
              </div>
            </div>
          </motion.div>

          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-westlake-500/10 border border-westlake-500/30 rounded-xl p-4 mb-6 flex items-center justify-between"
            >
              <span className="text-westlake-400">
                已选择 <span className="font-bold">{selectedIds.size}</span> 条爆料
              </span>
              <div className="flex items-center gap-3">
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleBatchApprove}
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                >
                  批量通过
                </Button>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => setShowRejectInput(true)}
                  leftIcon={<XCircle className="w-4 h-4" />}
                >
                  批量拒绝
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-neutral-400"
                >
                  取消选择
                </Button>
              </div>
            </motion.div>
          )}

          {showRejectInput && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-800/80 border border-neutral-600 rounded-xl p-4 mb-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="text-neutral-300 text-sm font-medium mb-2 block">
                    拒绝原因
                  </label>
                  <TextArea
                    placeholder="请输入拒绝原因..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="bg-neutral-700/50 border-neutral-600 text-white placeholder-neutral-500"
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-2 mt-6">
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={selectedIds.size > 0 ? handleBatchReject : () => selectedBaoliao && handleReject(selectedBaoliao.id)}
                    disabled={!rejectReason.trim()}
                  >
                    确认拒绝
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowRejectInput(false);
                      setRejectReason('');
                    }}
                    className="text-neutral-400"
                  >
                    取消
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700/50">
                    <th className="p-4 text-left">
                      <button onClick={handleSelectAll} className="text-neutral-400 hover:text-white">
                        {isAllSelected || isIndeterminate ? (
                          <CheckSquare className="w-5 h-5 text-westlake-400" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </th>
                    <th className="p-4 text-left text-neutral-400 font-medium text-sm">标题</th>
                    <th className="p-4 text-left text-neutral-400 font-medium text-sm">发布用户</th>
                    <th className="p-4 text-left text-neutral-400 font-medium text-sm">分类</th>
                    <th className="p-4 text-left text-neutral-400 font-medium text-sm">区域</th>
                    <th
                      className="p-4 text-left text-neutral-400 font-medium text-sm cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort('createdAt')}
                    >
                      发布时间 <SortIcon field="createdAt" />
                    </th>
                    <th className="p-4 text-left text-neutral-400 font-medium text-sm">状态</th>
                    <th className="p-4 text-left text-neutral-400 font-medium text-sm">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pageLoading ? (
                    Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : filteredBaoliaos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center">
                        <div className="text-neutral-500">
                          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>暂无符合条件的爆料</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {filteredBaoliaos.map((baoliao, index) => (
                        <motion.tr
                          key={baoliao.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b border-neutral-700/30 hover:bg-neutral-700/20 transition-colors"
                        >
                          <td className="p-4">
                            <button
                              onClick={() => handleSelect(baoliao.id)}
                              className="text-neutral-400 hover:text-white"
                            >
                              {selectedIds.has(baoliao.id) ? (
                                <CheckSquare className="w-5 h-5 text-westlake-400" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                          <td className="p-4">
                            <div
                              className="cursor-pointer group"
                              onClick={() => handleViewDetail(baoliao)}
                            >
                              <p className="text-white font-medium group-hover:text-westlake-400 transition-colors line-clamp-1 max-w-md">
                                {baoliao.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                {baoliao.images.length > 0 && (
                                  <span className="text-xs text-neutral-500 flex items-center gap-1">
                                    <Image className="w-3 h-3" /> {baoliao.images.length}
                                  </span>
                                )}
                                {baoliao.video && (
                                  <span className="text-xs text-neutral-500 flex items-center gap-1">
                                    <Video className="w-3 h-3" /> 视频
                                  </span>
                                )}
                                <span className="text-xs text-neutral-500 flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> {baoliao.views}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center">
                                <User className="w-4 h-4 text-neutral-300" />
                              </div>
                              <span className="text-neutral-300 text-sm">{baoliao.user.nickname}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-700/50 rounded text-xs text-neutral-300">
                              <Tag className="w-3 h-3" />
                              {baoliao.categoryName}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-neutral-300 text-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-neutral-500" />
                              {baoliao.location.district}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-neutral-400 text-sm flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(baoliao.createdAt)}
                            </span>
                          </td>
                          <td className="p-4">
                            <StatusBadge status={baoliao.status} />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetail(baoliao)}
                                className="text-neutral-400 hover:text-white p-2"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {baoliao.status === 'pending' && (
                                <>
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleApprove(baoliao.id)}
                                    loading={reviewLoading === baoliao.id}
                                  >
                                    通过
                                  </Button>
                                  <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedBaoliao(baoliao);
                                      setShowRejectInput(true);
                                    }}
                                  >
                                    拒绝
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setRejectReason('');
          setShowRejectInput(false);
        }}
        title="爆料详情"
        size="xl"
      >
        {selectedBaoliao && (
          <div className="space-y-4">
            {sensitiveWordsFound.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 flex items-start gap-2"
              >
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-rose-400 font-medium text-sm">检测到敏感词</p>
                  <p className="text-rose-300 text-sm mt-1">
                    包含敏感词：{sensitiveWordsFound.map((w) => `"${w}"`).join(', ')}
                  </p>
                </div>
              </motion.div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">{selectedBaoliao.title}</h3>
              <div className="flex items-center gap-4 text-sm text-neutral-400">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {selectedBaoliao.user.nickname}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selectedBaoliao.location.address}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(selectedBaoliao.createdAt)}
                </span>
                <StatusBadge status={selectedBaoliao.status} />
              </div>
            </div>

            <div className="bg-neutral-700/30 rounded-lg p-4">
              <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">
                {selectedBaoliao.content}
              </p>
            </div>

            {selectedBaoliao.images.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-neutral-400 mb-2">图片</h4>
                <div className="grid grid-cols-4 gap-2">
                  {selectedBaoliao.images.map((img, i) => (
                    <motion.div
                      key={i}
                      className="aspect-square rounded-lg overflow-hidden bg-neutral-700"
                      whileHover={{ scale: 1.05 }}
                    >
                      <img
                        src={img}
                        alt={`图片 ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {selectedBaoliao.video && (
              <div>
                <h4 className="text-sm font-medium text-neutral-400 mb-2">视频</h4>
                <div className="aspect-video bg-neutral-700 rounded-lg flex items-center justify-center">
                  <Video className="w-12 h-12 text-neutral-500" />
                </div>
              </div>
            )}

            {selectedBaoliao.rejectReason && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
                <h4 className="text-rose-400 font-medium text-sm mb-1">拒绝原因</h4>
                <p className="text-rose-300 text-sm">{selectedBaoliao.rejectReason}</p>
              </div>
            )}

            {showRejectInput && (
              <div className="bg-neutral-700/30 rounded-lg p-4">
                <label className="text-neutral-300 text-sm font-medium mb-2 block">
                  拒绝原因
                </label>
                <TextArea
                  placeholder="请输入拒绝原因..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="bg-neutral-700/50 border-neutral-600 text-white placeholder-neutral-500"
                  rows={3}
                />
              </div>
            )}
          </div>
        )}
        {selectedBaoliao && selectedBaoliao.status === 'pending' && (
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDetailModal(false);
                setRejectReason('');
                setShowRejectInput(false);
              }}
            >
              关闭
            </Button>
            <Button
              variant="success"
              onClick={() => handleApprove(selectedBaoliao.id)}
              loading={reviewLoading === selectedBaoliao.id}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              通过审核
            </Button>
            <Button
              variant="warning"
              onClick={() => handleReject(selectedBaoliao.id)}
              loading={reviewLoading === selectedBaoliao.id}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              {showRejectInput ? '确认拒绝' : '拒绝'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
