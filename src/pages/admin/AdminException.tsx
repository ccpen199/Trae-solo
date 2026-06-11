import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Car,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Tag,
  MessageSquare,
  UserCheck,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import AdminSidebar from '../../components/AdminSidebar';
import dayjs from 'dayjs';
import type { ExceptionEvent } from '../../../shared/types';

export default function AdminException() {
  const { exceptionEvents, updateWorkOrderStatus } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ExceptionEvent | null>(null);
  const [assignedHandler, setAssignedHandler] = useState('');

  const handlers = [
    { id: 'h001', name: '张工', role: '高级运维工程师' },
    { id: 'h002', name: '李工', role: '运维工程师' },
    { id: 'h003', name: '王工', role: '技术支持' },
    { id: 'h004', name: '赵工', role: '客服主管' },
  ];

  const stats = [
    {
      label: '待处理',
      value: exceptionEvents.filter((e) => e.status === '待处理').length,
      color: 'bg-yellow-500',
    },
    {
      label: '处理中',
      value: exceptionEvents.filter((e) => e.status === '处理中').length,
      color: 'bg-blue-500',
    },
    {
      label: '已解决',
      value: exceptionEvents.filter((e) => e.status === '已解决').length,
      color: 'bg-green-500',
    },
    {
      label: '高优先级',
      value: exceptionEvents.filter((e) => e.severity === '高').length,
      color: 'bg-red-500',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case '高':
        return 'bg-red-100 text-red-700';
      case '中':
        return 'bg-yellow-100 text-yellow-700';
      case '低':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '待处理':
        return 'bg-yellow-100 text-yellow-700';
      case '处理中':
        return 'bg-blue-100 text-blue-700';
      case '已解决':
        return 'bg-green-100 text-green-700';
      case '已关闭':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case '跟车干扰':
        return 'border-l-accent-500';
      case '标签失效':
        return 'border-l-red-500';
      case '交易失败':
        return 'border-l-yellow-500';
      case '路径异常':
        return 'border-l-blue-500';
      default:
        return 'border-l-purple-500';
    }
  };

  const filteredEvents = exceptionEvents.filter((event) => {
    const matchSeverity = severityFilter === '全部' || event.severity === severityFilter;
    const matchStatus = statusFilter === '全部' || event.status === statusFilter;
    return matchSeverity && matchStatus;
  });

  const handleAssign = (event: ExceptionEvent) => {
    setSelectedEvent(event);
    setShowAssignModal(true);
  };

  const confirmAssign = () => {
    if (selectedEvent && assignedHandler) {
      updateWorkOrderStatus(selectedEvent.id, '处理中');
      setShowAssignModal(false);
      setAssignedHandler('');
      setSelectedEvent(null);
    }
  };

  const handleResolve = (eventId: string) => {
    updateWorkOrderStatus(eventId, '已解决');
  };

  return (
    <div className="flex min-h-screen bg-dark-900">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">异常事件管理</h1>
              <p className="text-dark-400">通行异常事件自动归因与工单派发</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
              刷新数据
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + idx * 0.05 }}
              className="card-dark p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-dark-400 text-sm">{stat.label}</p>
                <div className={`w-2 h-2 ${stat.color} rounded-full animate-pulse`} />
              </div>
              <p className="text-3xl font-bold text-white font-mono">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card-dark p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="搜索事件描述或用户信息..."
                className="input-field-dark pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-dark-400" />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="input-field-dark w-auto"
                >
                  <option value="全部">全部级别</option>
                  <option value="高">高</option>
                  <option value="中">中</option>
                  <option value="低">低</option>
                </select>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field-dark w-auto"
              >
                <option value="全部">全部状态</option>
                <option value="待处理">待处理</option>
                <option value="处理中">处理中</option>
                <option value="已解决">已解决</option>
                <option value="已关闭">已关闭</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.05 }}
                className={`border-l-4 ${getEventTypeColor(event.eventType)} bg-dark-800 rounded-r-xl overflow-hidden`}
              >
                <div
                  className="p-4 cursor-pointer hover:bg-dark-700 transition-colors"
                  onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          event.severity === '高'
                            ? 'bg-red-500/20 text-red-400'
                            : event.severity === '中'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h4 className="text-white font-semibold">{event.eventType}</h4>
                          <span className={`badge ${getSeverityColor(event.severity)}`}>
                            {event.severity}级
                          </span>
                          <span className={`badge ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                        <p className="text-dark-300 text-sm line-clamp-1">{event.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-dark-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {dayjs(event.createdAt).format('YYYY-MM-DD HH:mm')}
                          </span>
                          {event.userId && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              用户 {event.userId.slice(1)}
                            </span>
                          )}
                          {event.trafficRecordId && (
                            <span className="flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              通行 {event.trafficRecordId.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {expandedId === event.id ? (
                        <ChevronUp className="w-5 h-5 text-dark-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-dark-400" />
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === event.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-dark-700"
                    >
                      <div className="p-4 bg-dark-750">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="p-4 bg-dark-700 rounded-lg">
                            <h5 className="text-sm font-medium text-dark-300 mb-2 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              智能归因分析
                            </h5>
                            <p className="text-white">{event.attribution}</p>
                          </div>
                          <div className="p-4 bg-dark-700 rounded-lg">
                            <h5 className="text-sm font-medium text-dark-300 mb-2 flex items-center gap-2">
                              <Tag className="w-4 h-4" />
                              工单信息
                            </h5>
                            <div className="space-y-1">
                              <p className="text-white">
                                工单号:{' '}
                                <span className="font-mono text-primary-400">
                                  {event.workOrderId || '待生成'}
                                </span>
                              </p>
                              <p className="text-dark-300 text-sm">
                                创建时间: {dayjs(event.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                              </p>
                              {event.resolvedAt && (
                                <p className="text-dark-300 text-sm">
                                  解决时间: {dayjs(event.resolvedAt).format('YYYY-MM-DD HH:mm:ss')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                          {event.status === '待处理' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssign(event);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
                              >
                                <Send className="w-4 h-4" />
                                派发工单
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResolve(event.id);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                              >
                                <CheckCircle className="w-4 h-4" />
                                标记已解决
                              </button>
                            </>
                          )}
                          {event.status === '处理中' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolve(event.id);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              标记已解决
                            </button>
                          )}
                          {event.status === '已解决' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateWorkOrderStatus(event.id, '已关闭');
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors text-sm"
                            >
                              <XCircle className="w-4 h-4" />
                              关闭工单
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('View detail:', event.id);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors text-sm"
                          >
                            <FileText className="w-4 h-4" />
                            查看详情
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-dark-400">暂无符合条件的异常事件</p>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {showAssignModal && selectedEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/70 backdrop-blur-sm"
              onClick={() => setShowAssignModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-dark-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-dark-700"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-white mb-2">派发工单</h3>
                <p className="text-dark-400 mb-6">{selectedEvent.eventType}</p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-dark-300 mb-3">
                    选择处理人员
                  </label>
                  <div className="space-y-2">
                    {handlers.map((handler) => (
                      <button
                        key={handler.id}
                        onClick={() => setAssignedHandler(handler.id)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3 ${
                          assignedHandler === handler.id
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-600 hover:border-dark-500'
                        }`}
                      >
                        <div className="w-10 h-10 bg-dark-600 rounded-full flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-dark-300" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{handler.name}</p>
                          <p className="text-sm text-dark-400">{handler.role}</p>
                        </div>
                        {assignedHandler === handler.id && (
                          <CheckCircle className="w-5 h-5 text-primary-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    处理说明
                  </label>
                  <textarea
                    placeholder="请输入处理说明（选填）"
                    rows={3}
                    className="input-field-dark resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmAssign}
                    disabled={!assignedHandler}
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    确认派发
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
