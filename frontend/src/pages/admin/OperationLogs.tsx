import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../services/api';
import { useToastStore } from '../../store';
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  History,
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import dayjs from 'dayjs';

const OperationLogs: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, page_size: 20, total: 0 });
  const [filters, setFilters] = useState({ entity_type: '', operation_type: '', user_id: '' });
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [entityHistory, setEntityHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const entityTypes = [
    { value: '', label: '全部' },
    { value: 'user', label: '用户' },
    { value: 'device', label: '设备' },
    { value: 'goal', label: '目标' },
    { value: 'plan', label: '计划' },
    { value: 'workout', label: '运动记录' },
    { value: 'alert', label: '提醒' },
    { value: 'intervention', label: '干预' }
  ];

  const operationTypes = [
    { value: '', label: '全部' },
    { value: 'create', label: '创建' },
    { value: 'update', label: '更新' },
    { value: 'delete', label: '删除' },
    { value: 'approve', label: '审批' },
    { value: 'reject', label: '拒绝' },
    { value: 'cancel', label: '取消' },
    { value: 'sync', label: '同步' },
    { value: 'revoke', label: '撤销' }
  ];

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.page_size,
        ...(filters.entity_type && { entity_type: filters.entity_type }),
        ...(filters.operation_type && { operation_type: filters.operation_type }),
        ...(filters.user_id && { user_id: filters.user_id })
      };
      const response = await adminApi.getOperationLogs(params);
      if (response.data.success) {
        setLogs(response.data.data.list);
        setPagination((prev) => ({ ...prev, total: response.data.data.total }));
      }
    } catch (error) {
      addToast('error', '加载操作日志失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.page_size, filters, addToast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const loadEntityHistory = async (entityType: string, entityId: number) => {
    try {
      setHistoryLoading(true);
      const response = await adminApi.getEntityHistory(entityType, entityId);
      if (response.data.success) {
        setEntityHistory(response.data.data);
        setShowHistoryModal(true);
      }
    } catch (error) {
      addToast('error', '加载实体历史失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getOperationTypeLabel = (type: string) => {
    return operationTypes.find((t) => t.value === type)?.label || type;
  };

  const getEntityTypeLabel = (type: string) => {
    return entityTypes.find((t) => t.value === type)?.label || type;
  };

  const getStatusColor = (status: string) => {
    return status === 'success'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  };

  const renderJsonDiff = (oldValue: any, newValue: any) => {
    const oldStr = formatJson(oldValue || {});
    const newStr = formatJson(newValue || {});

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">旧值</p>
          <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-64 text-red-600">
            {oldStr}
          </pre>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">新值</p>
          <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-64 text-green-600">
            {newStr}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">操作日志</h2>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">筛选:</span>
          </div>
          <select
            value={filters.entity_type}
            onChange={(e) => handleFilterChange('entity_type', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {entityTypes.map((type) => (
              <option key={type.value} value={type.value}>
                实体类型: {type.label}
              </option>
            ))}
          </select>
          <select
            value={filters.operation_type}
            onChange={(e) => handleFilterChange('operation_type', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {operationTypes.map((type) => (
              <option key={type.value} value={type.value}>
                操作类型: {type.label}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="用户ID"
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-32"
            />
          </div>
          <button
            onClick={() => setFilters({ entity_type: '', operation_type: '', user_id: '' })}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            重置
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">实体类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">实体ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">动作</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      暂无操作日志
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-primary-600">
                              {log.operator_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{log.operator_name}</p>
                            <p className="text-xs text-gray-500">ID: {log.operator_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-xs font-medium">
                          {getOperationTypeLabel(log.operation_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getEntityTypeLabel(log.entity_type)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-mono">{log.entity_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {log.action || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(log.status)}`}>
                          {log.status === 'success' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {log.status === 'success' ? '成功' : '失败'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">
                          {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                        </p>
                        <p className="text-xs text-gray-400">{dayjs(log.created_at).fromNow()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedLog(log);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => loadEntityHistory(log.entity_type, log.entity_id)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="查看实体历史"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                共 {pagination.total} 条记录，第 {pagination.page} / {Math.ceil(pagination.total / pagination.page_size) || 1} 页
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page <= 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 px-2">{pagination.page}</span>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(Math.ceil(pagination.total / pagination.page_size) || 1, prev.page + 1)
                    }))
                  }
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.page_size)}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                操作日志详情
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-65px)]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">操作人</p>
                  <p className="text-sm font-medium text-gray-800">{selectedLog.operator_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">操作人ID</p>
                  <p className="text-sm font-medium text-gray-800 font-mono">{selectedLog.operator_id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">操作类型</p>
                  <p className="text-sm font-medium text-gray-800">
                    {getOperationTypeLabel(selectedLog.operation_type)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">状态</p>
                  <p className="text-sm font-medium text-gray-800">
                    {selectedLog.status === 'success' ? '成功' : '失败'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">实体类型</p>
                  <p className="text-sm font-medium text-gray-800">
                    {getEntityTypeLabel(selectedLog.entity_type)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">实体ID</p>
                  <p className="text-sm font-medium text-gray-800 font-mono">{selectedLog.entity_id}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">操作时间</p>
                  <p className="text-sm font-medium text-gray-800">
                    {dayjs(selectedLog.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </p>
                </div>
                {selectedLog.action && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">动作描述</p>
                    <p className="text-sm text-gray-800">{selectedLog.action}</p>
                  </div>
                )}
                {selectedLog.error_message && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">错误信息</p>
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      {selectedLog.error_message}
                    </p>
                  </div>
                )}
              </div>

              {(selectedLog.old_value || selectedLog.new_value) && (
                <div>
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    数据变更对比
                  </p>
                  {renderJsonDiff(selectedLog.old_value, selectedLog.new_value)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" />
                实体历史追溯
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-65px)]">
              {historyLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : entityHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-12">暂无历史记录</p>
              ) : (
                <div className="space-y-4">
                  {entityHistory.map((record, index) => (
                    <div key={record.id} className="relative pl-8 pb-4">
                      {index < entityHistory.length - 1 && (
                        <div className="absolute left-3 top-6 bottom-0 w-px bg-gray-200"></div>
                      )}
                      <div className="absolute left-0 top-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                              {getOperationTypeLabel(record.operation_type)}
                            </span>
                            <span className="text-sm text-gray-800 font-medium">
                              {record.operator_name}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss')}
                          </span>
                        </div>
                        {record.action && (
                          <p className="text-sm text-gray-600 mb-3">{record.action}</p>
                        )}
                        {(record.old_value || record.new_value) && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2">数据变更</p>
                            {renderJsonDiff(record.old_value, record.new_value)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationLogs;
