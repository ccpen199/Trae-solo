import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  User,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { alertApi } from '../api/client';
import type { Alert, AlertStatus } from '../types';

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingRemark, setProcessingRemark] = useState('');
  const [showProcessing, setShowProcessing] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (id) {
      loadAlert(parseInt(id));
    }
  }, [id]);

  const loadAlert = async (alertId: number) => {
    setLoading(true);
    try {
      const data = await alertApi.get(alertId) as Alert;
      setAlert(data);
    } catch {
      error('加载告警详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: AlertStatus, remark?: string) => {
    if (!id || !alert) return;
    try {
      await alertApi.update(parseInt(id), {
        status,
        ...(remark && { content: alert.content + '\n\n处理备注: ' + remark }),
      });
      success('告警状态更新成功');
      loadAlert(parseInt(id));
      setShowProcessing(false);
      setProcessingRemark('');
    } catch {
      error('更新告警状态失败');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded w-1/4" />
        <div className="card p-6">
          <div className="h-64 bg-gray-100 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">告警不存在</p>
        <Link to="/alerts" className="btn-primary mt-4 inline-block">
          返回列表
        </Link>
      </div>
    );
  }

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'duplicate_execution':
        return '🔄';
      case 'permission_violation':
        return '🔒';
      case 'config_misuse':
        return '⚙️';
      case 'task_failure':
        return '❌';
      case 'data_leak':
        return '📤';
      default:
        return '⚠️';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/alerts"
          className="p-2 hover:bg-gray-100 rounded"
          title="返回列表"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getAlertTypeIcon(alert.type)}</span>
            <h1 className="text-2xl font-bold text-gray-900">{alert.title}</h1>
          </div>
          <p className="text-gray-500 mt-1">
            告警 #{alert.id} · 创建于{' '}
            {new Date(alert.createdAt).toLocaleString('zh-CN')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={alert.severity} size="md" />
          <StatusBadge status={alert.status} size="md" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-navy-900" />
              告警详情
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm text-gray-500">告警类型</label>
                <p className="font-medium mt-1">
                  <StatusBadge status={alert.type} />
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">严重程度</label>
                <p className="mt-1">
                  <StatusBadge status={alert.severity} />
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">负责人</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {alert.assignee?.username || '-'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">创建时间</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {new Date(alert.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium mb-2">告警内容</h4>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded">
                {alert.content || '暂无详细内容'}
              </p>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-navy-900" />
              建议动作
            </h3>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
              <p className="text-gray-700">
                {alert.suggestedAction || '暂无建议动作'}
              </p>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-navy-900" />
              关闭依据
            </h3>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-700">
                {alert.closeCriteria || '暂无关闭依据'}
              </p>
            </div>
          </div>

          {alert.closedAt && (
            <div className="card p-6 border-green-200 bg-green-50">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">已关闭</span>
                <span className="text-sm ml-2">
                  于 {new Date(alert.closedAt).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">处理操作</h3>
            <div className="space-y-3">
              {alert.status === 'open' && (
                <>
                  <button
                    onClick={() => setShowProcessing(true)}
                    className="btn-warning w-full flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    开始处理
                  </button>
                  <button
                    onClick={() => handleStatusChange('closed')}
                    className="btn-success w-full flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    关闭告警
                  </button>
                </>
              )}
              {alert.status === 'processing' && (
                <>
                  <button
                    onClick={() => handleStatusChange('closed')}
                    className="btn-success w-full flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    处理完成，关闭告警
                  </button>
                  <button
                    onClick={() => handleStatusChange('open')}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    退回待处理
                  </button>
                </>
              )}
              {alert.status === 'closed' && (
                <button
                  onClick={() => handleStatusChange('open')}
                  className="btn-warning w-full flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  重新打开
                </button>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">影响范围</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">关联应用</span>
                <span className="font-medium">电商平台</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">影响环境</span>
                <span className="font-medium">生产环境</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">影响版本</span>
                <span className="font-mono text-sm">v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showProcessing && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowProcessing(false)}
            />
            <div className="relative bg-white rounded shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">处理备注</h3>
              <textarea
                value={processingRemark}
                onChange={(e) => setProcessingRemark(e.target.value)}
                className="input min-h-[100px] mb-4"
                placeholder="请输入处理备注（可选）"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowProcessing(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={() => handleStatusChange('processing', processingRemark)}
                  className="btn-primary"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
