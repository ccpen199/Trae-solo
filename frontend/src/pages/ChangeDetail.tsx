import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  FileJson,
  AlertTriangle,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/Toast';
import { changeApi } from '../api/client';
import type { ChangeOrder } from '../types';

export default function ChangeDetail() {
  const { id } = useParams<{ id: string }>();
  const [change, setChange] = useState<ChangeOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  useEffect(() => {
    if (id) {
      loadChange(parseInt(id));
    }
  }, [id]);

  const loadChange = async (changeId: number) => {
    setLoading(true);
    try {
      const data = await changeApi.get(changeId) as ChangeOrder;
      setChange(data);
    } catch {
      error('加载变更详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      await changeApi.approve(parseInt(id));
      success('变更已批准');
      loadChange(parseInt(id));
    } catch {
      error('批准失败');
    }
  };

  const handleReject = async () => {
    if (!id) return;
    try {
      await changeApi.reject(parseInt(id));
      success('变更已拒绝');
      loadChange(parseInt(id));
    } catch {
      error('拒绝失败');
    }
  };

  const handleExecute = async () => {
    if (!id) return;
    try {
      await changeApi.execute(parseInt(id));
      success('变更已执行');
      loadChange(parseInt(id));
    } catch {
      error('执行失败');
    }
  };

  const handleRollback = async () => {
    if (!id) return;
    try {
      await changeApi.rollback(parseInt(id));
      success('变更已回滚');
      loadChange(parseInt(id));
    } catch {
      error('回滚失败');
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

  if (!change) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">变更单不存在</p>
        <Link to="/changes" className="btn-primary mt-4 inline-block">
          返回列表
        </Link>
      </div>
    );
  }

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'config':
        return '⚙️';
      case 'permission':
        return '🔐';
      case 'secret':
        return '🔑';
      case 'application':
        return '📦';
      default:
        return '📝';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/changes"
          className="p-2 hover:bg-gray-100 rounded"
          title="返回列表"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getChangeTypeIcon(change.type)}</span>
            <h1 className="text-2xl font-bold text-gray-900">
              变更单 #{change.id}
            </h1>
          </div>
          <p className="text-gray-500 mt-1">
            <StatusBadge status={change.type} />
          </p>
        </div>
        <StatusBadge status={change.status} size="md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileJson className="w-5 h-5 text-navy-900" />
              变更内容
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm text-gray-500">状态</label>
                <p className="mt-1">
                  <StatusBadge status={change.status} />
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">操作者</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {change.operator?.username || '-'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">创建时间</label>
                <p className="font-medium mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {new Date(change.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">执行时间</label>
                <p className="font-medium mt-1">
                  {change.executedAt
                    ? new Date(change.executedAt).toLocaleString('zh-CN')
                    : '-'}
                </p>
              </div>
            </div>
            {change.affectedObjects && (
              <div className="mb-4">
                <label className="text-sm text-gray-500">影响对象</label>
                <p className="font-medium mt-1">{change.affectedObjects}</p>
              </div>
            )}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium mb-2">变更原因</h4>
              <p className="text-gray-700 bg-gray-50 p-4 rounded whitespace-pre-wrap">
                {change.reason || '暂无'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 text-red-600">变更前</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {change.oldValue || '-'}
              </pre>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 text-green-600">变更后</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {change.newValue || '-'}
              </pre>
            </div>
          </div>

          {change.recoveryPath && (
            <div className="card p-6 border-orange-200 bg-orange-50">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-orange-700">
                <RotateCcw className="w-5 h-5" />
                恢复路径
              </h3>
              <p className="text-orange-700">{change.recoveryPath}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">操作</h3>
            <div className="space-y-3">
              {change.status === 'pending' && (
                <>
                  <button
                    onClick={handleApprove}
                    className="btn-success w-full flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    批准变更
                  </button>
                  <button
                    onClick={handleReject}
                    className="btn-danger w-full flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    拒绝变更
                  </button>
                </>
              )}
              {change.status === 'approved' && (
                <button
                  onClick={handleExecute}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  执行变更
                </button>
              )}
              {change.status === 'executed' && (
                <button
                  onClick={handleRollback}
                  className="btn-warning w-full flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  回滚变更
                </button>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">审批流程</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">创建变更</p>
                  <p className="text-sm text-gray-500">
                    {change.operator?.username || '未知用户'} ·{' '}
                    {new Date(change.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              {change.status !== 'pending' && (
                <div className="flex items-start gap-3">
                  <div
                    className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                      change.status === 'rejected' ? 'bg-red-500' : 'bg-green-500'
                    }`}
                  />
                  <div>
                    <p className="font-medium">
                      {change.status === 'rejected' ? '拒绝变更' : '批准变更'}
                    </p>
                    <p className="text-sm text-gray-500">管理员 · 自动处理</p>
                  </div>
                </div>
              )}
              {(change.status === 'executed' || change.status === 'rolled_back') && (
                <div className="flex items-start gap-3">
                  <div
                    className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                      change.status === 'rolled_back' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <p className="font-medium">
                      {change.status === 'rolled_back' ? '回滚变更' : '执行变更'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {change.executedAt
                        ? new Date(change.executedAt).toLocaleString('zh-CN')
                        : '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {change.status === 'pending' && (
            <div className="card p-6 bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">待审批</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    此变更单需要管理员审批后才能执行
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
