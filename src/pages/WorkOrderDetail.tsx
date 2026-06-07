import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workOrderApi } from '../utils/api';
import {
  WO_TYPE_MAP, WO_TYPE_COLOR,
  WO_STATUS_MAP, WO_STATUS_COLOR,
  WO_PRIORITY_MAP, WO_PRIORITY_COLOR,
  formatDateTime
} from '../utils/constants';
import {
  ChevronLeft, ClipboardList, MapPin, User, Phone, Clock,
  AlertTriangle, CheckCircle2, Play, Send, MessageSquare, UserPlus
} from 'lucide-react';

const WorkOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [assignAgentId, setAssignAgentId] = useState(2);

  useEffect(() => { loadDetail(); }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await workOrderApi.get(parseInt(id!));
      setData(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAssign = async () => {
    setActionLoading(true);
    try {
      await workOrderApi.assign(parseInt(id!), assignAgentId);
      setShowAssign(false);
      loadDetail();
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await workOrderApi.start(parseInt(id!));
      loadDetail();
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const handleComplete = async () => {
    if (!resultText.trim()) { alert('请填写处理结果'); return; }
    setActionLoading(true);
    try {
      await workOrderApi.complete(parseInt(id!), resultText);
      setResultText('');
      loadDetail();
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">加载中...</div>;
  if (!data) return <div className="p-8 text-center text-gray-500">工单不存在</div>;

  const { workOrder, sla, logs } = data;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/work-orders')} className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800">工单详情</h2>
            <span className={`px-2 py-0.5 text-xs rounded-full ${WO_TYPE_COLOR[workOrder.type]}`}>
              {WO_TYPE_MAP[workOrder.type]}
            </span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${WO_PRIORITY_COLOR[workOrder.priority]}`}>
              {WO_PRIORITY_MAP[workOrder.priority]}
            </span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${WO_STATUS_COLOR[workOrder.status]}`}>
              {WO_STATUS_MAP[workOrder.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500">工单编号：WO-{workOrder.id.toString().padStart(6, '0')}</p>
        </div>
      </div>

      {/* SLA Banner */}
      {workOrder.status !== 'completed' && (
        <div className={`rounded-xl p-5 ${
          workOrder.isOverdue ? 'bg-red-50 border border-red-200' :
          sla.remainingHours < 4 ? 'bg-accent-50 border border-accent-200' :
          'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {workOrder.isOverdue ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : sla.remainingHours < 4 ? (
                <Clock className="w-8 h-8 text-accent-600" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              )}
              <div>
                <h4 className={`font-semibold ${
                  workOrder.isOverdue ? 'text-red-800' :
                  sla.remainingHours < 4 ? 'text-accent-800' :
                  'text-green-800'
                }`}>
                  {workOrder.isOverdue ? '⚠️ 工单已超时' :
                   sla.remainingHours < 4 ? '⏰ 即将超时' :
                   '✅ SLA时效正常'}
                </h4>
                <p className={`text-sm ${
                  workOrder.isOverdue ? 'text-red-700' :
                  sla.remainingHours < 4 ? 'text-accent-700' :
                  'text-green-700'
                }`}>
                  要求 {sla.slaHours} 小时内完成，截止 {formatDateTime(workOrder.deadline)}
                  {!workOrder.isOverdue && `，剩余 ${sla.remainingHours} 小时`}
                </p>
              </div>
            </div>
            <div className="w-48">
              <div className="flex justify-between text-xs mb-1">
                <span>完成进度</span>
                <span>{Math.round(sla.progress)}%</span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    workOrder.isOverdue ? 'bg-red-500' :
                    sla.remainingHours < 4 ? 'bg-accent-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, sla.progress)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary-600" /> 问题描述
            </h4>
            <p className="text-gray-700 leading-relaxed">{workOrder.description}</p>
          </div>

          {/* Action buttons */}
          {workOrder.status !== 'completed' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h4 className="font-semibold text-gray-800 mb-4">操作</h4>
              <div className="flex flex-wrap gap-3">
                {workOrder.status === 'pending' && (
                  <button
                    onClick={() => setShowAssign(true)}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" /> 派单
                  </button>
                )}
                {(workOrder.status === 'assigned' || workOrder.status === 'pending') && (
                  <button
                    onClick={handleStart}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" /> 开始处理
                  </button>
                )}
                {workOrder.status === 'in_progress' && (
                  <div className="w-full space-y-3">
                    <textarea
                      value={resultText}
                      onChange={e => setResultText(e.target.value)}
                      placeholder="请填写处理结果..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      onClick={handleComplete}
                      disabled={actionLoading || !resultText.trim()}
                      className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> 完成工单
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assign Modal */}
          {showAssign && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">工单派单</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择处理人ID</label>
                    <div className="space-y-2 text-sm text-gray-500">
                      <div>2 - 李明（自营经纪人）</div>
                      <div>3 - 王芳（加盟经纪人）</div>
                    </div>
                    <input
                      type="number"
                      value={assignAgentId}
                      onChange={e => setAssignAgentId(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setShowAssign(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
                  <button onClick={handleAssign} disabled={actionLoading} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">确认派单</button>
                </div>
              </div>
            </div>
          )}

          {/* Activity log */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-600" /> 处理日志
            </h4>
            <div className="space-y-4">
              {logs.map((log: any) => (
                <div key={log.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                    {log.action === 'create' ? <ClipboardList className="w-5 h-5" /> :
                     log.action === 'assign' ? <UserPlus className="w-5 h-5" /> :
                     log.action === 'start' ? <Play className="w-5 h-5" /> :
                     log.action === 'complete' ? <CheckCircle2 className="w-5 h-5" /> :
                     <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">
                        {({
                          create: '创建工单',
                          assign: '分配工单',
                          start: '开始处理',
                          complete: '完成工单'
                        } as any)[log.action] || log.action}
                      </span>
                      <span className="text-xs text-gray-400">
                        操作人：{log.operator_name || '系统'}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {formatDateTime(log.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{log.remark}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" /> 关联房源
            </h5>
            <div className="space-y-2 text-sm">
              <div className="font-medium text-gray-800">{workOrder.property_name}</div>
              <div className="text-gray-500">{workOrder.property_address}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-600" /> 报修人
            </h5>
            <div className="space-y-2 text-sm">
              <div className="font-medium text-gray-800">{workOrder.reporter_name}</div>
              <div className="text-gray-500 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {workOrder.reporter_phone}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-600" /> 处理人
            </h5>
            {workOrder.assignee_name ? (
              <div className="space-y-2 text-sm">
                <div className="font-medium text-gray-800">{workOrder.assignee_name}</div>
                <div className="text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {workOrder.assignee_phone}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> 暂未派单
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-600" /> 时间信息
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">创建时间</span>
                <span className="text-gray-800">{formatDateTime(workOrder.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">截止时间</span>
                <span className="text-gray-800">{formatDateTime(workOrder.deadline)}</span>
              </div>
              {workOrder.completed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">完成时间</span>
                  <span className="text-green-600 font-medium">{formatDateTime(workOrder.completed_at)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">SLA时效</span>
                <span className="text-gray-800">{workOrder.sla_hours} 小时</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderDetail;
