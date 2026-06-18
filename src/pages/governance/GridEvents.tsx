import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Search,
  Filter,
  Clock,
  User,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  XCircle,
  PlayCircle,
  Send,
  History,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { useGetPaginated, usePut } from '../../hooks/useApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import type { GridEvent, EventHistoryItem } from '../../../shared/types';

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'reported', label: '已上报' },
  { value: 'assigned', label: '已分派' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已结案' },
];

const priorityColors = {
  high: { bg: 'bg-red-100', text: 'text-red-700', label: '高优先级' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '中优先级' },
  low: { bg: 'bg-green-100', text: 'text-green-700', label: '低优先级' },
};

const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
  reported: { color: 'bg-blue-100 text-blue-700', label: '已上报', icon: AlertCircle },
  assigned: { color: 'bg-orange-100 text-orange-700', label: '已分派', icon: Send },
  processing: { color: 'bg-yellow-100 text-yellow-700', label: '处理中', icon: PlayCircle },
  resolved: { color: 'bg-green-100 text-green-700', label: '已解决', icon: CheckCircle },
  closed: { color: 'bg-gray-100 text-gray-700', label: '已结案', icon: XCircle },
};

export default function GridEvents() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<GridEvent | null>(null);
  const [remark, setRemark] = useState('');

  const { data, isLoading, refetch } = useGetPaginated<GridEvent>(
    ['grid-events', String(page), statusFilter],
    `/governance/grid/events?page=${page}&pageSize=10${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`
  );

  const updateMutation = usePut();

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedEvent) return;

    try {
      await updateMutation.mutateAsync({
        url: `/governance/grid/events/${selectedEvent.id}`,
        data: {
          status: newStatus,
          assignee: newStatus === 'assigned' ? '网格员张三' : undefined,
          remark: remark || undefined,
        },
      });
      setSelectedEvent(null);
      setRemark('');
      refetch();
      alert('操作成功！');
    } catch (error) {
      alert('操作失败，请稍后重试');
    }
  };

  const filteredEvents = data?.items?.filter((e) =>
    e.type.includes(search) ||
    e.description.includes(search) ||
    e.gridName.includes(search)
  );

  const getNextStatus = (current: string) => {
    const flow: Record<string, string[]> = {
      reported: ['assigned'],
      assigned: ['processing'],
      processing: ['resolved'],
      resolved: ['closed'],
    };
    return flow[current] || [];
  };

  const renderStatusTimeline = (event: GridEvent) => {
    const steps = [
      { key: 'reported', label: '上报', time: event.reportTime },
      { key: 'assigned', label: '分派', time: event.assignedTime },
      { key: 'processing', label: '处理', time: event.reportTime },
      { key: 'resolved', label: '解决', time: event.resolvedTime },
      { key: 'closed', label: '结案', time: event.closedTime },
    ];

    const currentIndex = steps.findIndex((s) => s.key === event.status);

    return (
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-green-100 scale-110' : ''}`}
              >
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : (idx + 1)}
              </div>
              <span className={`text-xs mt-2 font-medium ${
                isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
              {step.time && (
                <span className="text-xs text-gray-400 mt-0.5">
                  {new Date(step.time).toLocaleDateString('zh-CN')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">网格事件管理</h2>
            <p className="text-sm text-gray-500">事件闭环跟踪，全流程可视化管理</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status="error" text={`待处理 ${(data?.items?.filter(e => e.status !== 'closed').length || 0)}`} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索事件类型、描述、网格..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none bg-white"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = data?.items?.filter(e => e.status === key).length || 0;
          const Icon = config.icon;

          return (
            <Card key={key} hover onClick={() => { setStatusFilter(key); setPage(1); }}>
              <Card.Body className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${config.color.split(' ')[0]} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">{config.label}</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Card.Body className="animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : filteredEvents?.length ? (
        <div className="space-y-4">
          {filteredEvents.map((event, idx) => {
            const priority = priorityColors[event.priority];
            const StatusIcon = statusConfig[event.status].icon;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card hover onClick={() => setSelectedEvent(event)}>
                  <Card.Body>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          event.priority === 'high' ? 'bg-red-100 text-red-600' :
                          event.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{event.type}</h3>
                            <StatusBadge status={event.status === 'closed' ? 'success' : event.status === 'reported' ? 'info' : 'warning'} text={statusConfig[event.status].label} />
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${priority.bg} ${priority.text}`}>
                              {priority.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.gridName}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {event.reporter}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(event.reportTime).toLocaleString('zh-CN')}
                            </span>
                            {event.assignee && (
                              <span className="flex items-center gap-1">
                                <Send className="w-4 h-4" />
                                处理人：{event.assignee}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-6" />
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <Card.Body className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">暂无事件信息</p>
          </Card.Body>
        </Card>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page === data.totalPages}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setSelectedEvent(null); setRemark(''); }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{selectedEvent.type}</h3>
                      <StatusBadge status={selectedEvent.status === 'closed' ? 'success' : selectedEvent.status === 'reported' ? 'info' : 'warning'} text={statusConfig[selectedEvent.status].label} />
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[selectedEvent.priority].bg} ${priorityColors[selectedEvent.priority].text}`}>
                        {priorityColors[selectedEvent.priority].label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {selectedEvent.gridName}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {selectedEvent.reporter}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(selectedEvent.reportTime).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">事件描述</h4>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-4">
                    {selectedEvent.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">处理进度</h4>
                  {renderStatusTimeline(selectedEvent)}
                </div>

                {selectedEvent.assignee && (
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <Card.Body className="p-4">
                        <p className="text-sm text-gray-500 mb-1">处理人</p>
                        <p className="font-medium text-gray-900">{selectedEvent.assignee}</p>
                      </Card.Body>
                    </Card>
                    <Card>
                      <Card.Body className="p-4">
                        <p className="text-sm text-gray-500 mb-1">分派时间</p>
                        <p className="font-medium text-gray-900">
                          {selectedEvent.assignedTime ? new Date(selectedEvent.assignedTime).toLocaleString('zh-CN') : '-'}
                        </p>
                      </Card.Body>
                    </Card>
                  </div>
                )}

                {selectedEvent.history && selectedEvent.history.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" />
                      处理历史
                    </h4>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                      <div className="space-y-4">
                        {selectedEvent.history.map((item: EventHistoryItem, idx: number) => (
                          <div key={idx} className="flex gap-4 relative pl-10">
                            <div className="absolute left-2 w-4 h-4 rounded-full bg-white border-2 border-primary" />
                            <div className="flex-1 bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">{item.action}</span>
                                <span className="text-xs text-gray-400">{new Date(item.time).toLocaleString('zh-CN')}</span>
                              </div>
                              <p className="text-sm text-gray-500">操作人：{item.operator}</p>
                              {item.remark && <p className="text-sm text-gray-600 mt-2">备注：{item.remark}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {getNextStatus(selectedEvent.status).length > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      流程推进
                    </h4>
                    <p className="text-sm text-blue-700 mb-4">
                      当前状态：<span className="font-medium">{statusConfig[selectedEvent.status].label}</span>
                      ，可推进至：
                      {getNextStatus(selectedEvent.status).map(s => statusConfig[s].label).join('、')}
                    </p>
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="请输入处理备注（可选）..."
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none bg-white"
                      rows={3}
                    />
                    <div className="flex gap-3 mt-4">
                      {getNextStatus(selectedEvent.status).map((nextStatus) => (
                        <Button
                          key={nextStatus}
                          loading={updateMutation.isPending}
                          onClick={() => handleStatusChange(nextStatus)}
                        >
                          <span className="flex items-center gap-2">
                            <ArrowRight className="w-4 h-4" />
                            {statusConfig[nextStatus].label}
                          </span>
                        </Button>
                      ))}
                      <button
                        onClick={() => { setSelectedEvent(null); setRemark(''); }}
                        className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        关闭
                      </button>
                    </div>
                  </div>
                )}

                {getNextStatus(selectedEvent.status).length === 0 && (
                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => { setSelectedEvent(null); setRemark(''); }}
                      className="flex-1 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      关闭
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
