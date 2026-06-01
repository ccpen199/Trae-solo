import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2, ArrowLeft, User, Phone, MapPin, FileText, Clock, AlertTriangle,
  CheckCircle, Send, Upload, MessageSquare, Star, RefreshCw
} from 'lucide-react';
import { api, statusMap, priorityMap, exceptionTypeMap, serviceTypes } from '@/lib/api';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [showAssign, setShowAssign] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showException, setShowException] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAssist, setShowAssist] = useState(false);
  const [showCompensation, setShowCompensation] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadData();
    loadUsers();
  }, [id]);

  async function loadData() {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.ticket(id);
      setData(res.data);
    } catch (e) {
      console.error('Load ticket failed:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const res = await api.users();
      setUsers(res.data);
    } catch (e) {
      console.error('Load users failed:', e);
    }
  }

  async function handleAction(action: string, payload?: any) {
    if (!id) return;
    setActionLoading(action);
    try {
      let res: any;
      switch (action) {
        case 'accept':
          res = await api.acceptTicket(id, 'u-cs-1', '客服');
          break;
        case 'arrive':
          res = await api.arriveTicket(id, 'u-staff-1', '地服人员');
          break;
        case 'complete':
          res = await api.completeTicket(id, 'u-staff-1', '地服人员');
          break;
        case 'assign':
          res = await api.assignTicket(id, formData.userId, 'u-admin', '管理员');
          setShowAssign(false);
          break;
        case 'transfer':
          res = await api.transferTicket(id, { ...formData, operatorId: 'u-admin', operatorName: '管理员' });
          setShowTransfer(false);
          break;
        case 'exception':
          res = await api.exceptionTicket(id, { ...formData, operatorId: 'u-admin', operatorName: '管理员' });
          setShowException(false);
          break;
        case 'escalate':
          res = await api.escalateTicket(id);
          break;
        case 'feedback':
          res = await api.feedbackTicket(id, { ...formData, callerId: 'u-cs-1' });
          setShowFeedback(false);
          break;
        case 'assist':
          res = await api.assistTicket(id, { ...formData, operatorId: 'u-staff-1', operatorName: '地服人员' });
          setShowAssist(false);
          break;
        case 'confirm':
          res = await api.confirmTicket(id);
          break;
        case 'compensation':
          res = await api.compensationTicket(id, { ...formData, operatorId: 'u-admin', operatorName: '管理员' });
          setShowCompensation(false);
          break;
      }
      alert(res?.message || '操作成功');
      loadData();
    } catch (e: any) {
      alert(e.message || '操作失败');
    } finally {
      setActionLoading('');
      setFormData({});
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!id || !e.target.files) return;
    setActionLoading('upload');
    try {
      const res = await api.uploadAttachment(id, e.target.files, 'u-cs-1', '客服');
      alert(res.success ? '上传成功' : '上传失败');
      loadData();
    } catch (e: any) {
      alert(e.message || '上传失败');
    } finally {
      setActionLoading('');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-slate-500">工单不存在</div>;
  }

  const { ticket, logs, attachments, transfers, assistance, compensation, feedback } = data;

  function formatTime(t: string) {
    if (!t) return '-';
    return new Date(t).toLocaleString('zh-CN');
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">工单详情</h2>
            <p className="text-sm text-slate-500 mt-1 font-mono">{ticket.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${priorityMap[ticket.priority]?.color}`}>
            {priorityMap[ticket.priority]?.label}
          </span>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusMap[ticket.status]?.color}`}>
            {statusMap[ticket.status]?.label}
          </span>
          {ticket.isException && (
            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700">
              异常单
            </span>
          )}
          <button
            onClick={loadData}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="刷新"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              工单信息
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">服务类型</p>
                <p className="font-medium text-slate-800">{ticket.serviceType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">服务分类</p>
                <p className="font-medium text-slate-800">{ticket.serviceCategory || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">航班号</p>
                <p className="font-medium text-slate-800">{ticket.flightNo || '-'}</p>
                {ticket.airline && <p className="text-xs text-slate-500">{ticket.airline}</p>}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">座位号</p>
                <p className="font-medium text-slate-800">{ticket.seatNo || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500 mb-1">问题描述</p>
                <p className="text-slate-700 bg-slate-50 rounded-lg p-3">{ticket.description}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              旅客信息
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">姓名</p>
                <p className="font-medium text-slate-800">{ticket.passengerName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">联系电话</p>
                <p className="font-medium text-slate-800">{ticket.passengerPhone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">证件号</p>
                <p className="font-medium text-slate-800">{ticket.passengerIdCard || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              位置信息
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">航站楼</p>
                <p className="font-medium text-slate-800">{ticket.terminal}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">具体位置</p>
                <p className="font-medium text-slate-800">{ticket.area}</p>
              </div>
            </div>
          </div>

          {assistance && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                协助记录
              </h3>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">到场时间</p>
                    <p className="font-medium text-slate-800">{formatTime(assistance.arrivalTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">协助时长（分钟）</p>
                    <p className="font-medium text-slate-800">{assistance.assistanceDuration || '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-slate-500 mb-1">协助内容</p>
                    <p className="text-slate-700 bg-slate-50 rounded-lg p-3">{assistance.assistanceContent || '-'}</p>
                  </div>
                  {assistance.crossDepartment && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">跨部门协作</p>
                      <p className="font-medium text-slate-800">{assistance.crossDepartment}</p>
                    </div>
                  )}
                  {assistance.compensationOffered && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">补偿方案</p>
                      <p className="font-medium text-slate-800">{assistance.compensationOffered}</p>
                    </div>
                  )}
                </div>
                {assistance.passengerConfirmation ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">旅客已确认 · {formatTime(assistance.confirmedAt)}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAction('confirm')}
                    disabled={actionLoading === 'confirm'}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                  >
                    {actionLoading === 'confirm' ? '确认中...' : '旅客确认服务'}
                  </button>
                )}
              </div>
            </div>
          )}

          {compensation && compensation.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-600" />
                补偿方案
              </h3>
              <div className="space-y-3">
                {compensation.map((c: any) => (
                  <div key={c.id} className="border border-slate-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-800">{c.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.status === 'approved' ? 'bg-green-100 text-green-600' :
                        c.status === 'rejected' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {c.status === 'approved' ? '已批准' : c.status === 'rejected' ? '已拒绝' : '待审批'}
                      </span>
                    </div>
                    {c.amount && <p className="text-sm text-slate-600">金额：¥{c.amount}</p>}
                    {c.description && <p className="text-sm text-slate-600">{c.description}</p>}
                    <p className="text-xs text-slate-400 mt-2">{formatTime(c.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {feedback && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                回访记录
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">满意度：</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star
                        key={n}
                        className={`w-5 h-5 ${n <= feedback.satisfaction ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{feedback.satisfaction}分</span>
                </div>
                {feedback.feedbackText && (
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{feedback.feedbackText}</p>
                )}
                {feedback.followUpNeeded && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    需要跟进：{feedback.followUpDetail || '无具体说明'}
                  </div>
                )}
                <p className="text-xs text-slate-400">回访时间：{formatTime(feedback.callTime)}</p>
              </div>
            </div>
          )}

          {transfers && transfers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-600" />
                转交记录
              </h3>
              <div className="space-y-3">
                {transfers.map((t: any) => (
                  <div key={t.id} className="border-l-4 border-purple-400 pl-4 py-2">
                    <p className="font-medium text-slate-800">
                      {t.fromUserName || '系统'} → {t.toUserName}
                    </p>
                    {t.reason && <p className="text-sm text-slate-600">{t.reason}</p>}
                    <p className="text-xs text-slate-400 mt-1">{formatTime(t.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {attachments && attachments.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Upload className="w-4 h-4 text-slate-600" />
                附件 ({attachments.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {attachments.map((a: any) => (
                  <div key={a.id} className="border border-slate-100 rounded-lg p-3 text-center hover:bg-slate-50">
                    <FileIcon className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                    <p className="text-xs text-slate-600 truncate">{a.fileName}</p>
                    <p className="text-xs text-slate-400">{(a.fileSize / 1024).toFixed(1)} KB</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              操作日志
            </h3>
            <div className="space-y-4">
              {logs.map((log: any) => (
                <div key={log.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                      {log.operatorName?.[0] || '系'}
                    </div>
                    <div className="w-px flex-1 bg-slate-200 mt-2" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{log.operatorName}</span>
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{log.action}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{log.detail}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatTime(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-700 mb-4">处理人员</h3>
            {ticket.assignedToName ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  {ticket.assignedToName[0]}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{ticket.assignedToName}</p>
                  <p className="text-xs text-slate-500">{ticket.assignedToQueue || ticket.assignedToRole}</p>
                  <p className="text-xs text-slate-400">{ticket.assignedToPhone}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">暂未分配</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-700 mb-4">时间线</h3>
            <div className="space-y-3 text-sm">
              <TimeLineItem label="创建时间" time={ticket.createdAt} icon={Clock} />
              {ticket.assignedAt && <TimeLineItem label="派单时间" time={ticket.assignedAt} icon={Send} />}
              {ticket.acceptedAt && <TimeLineItem label="接单时间" time={ticket.acceptedAt} icon={CheckCircle} />}
              {ticket.arrivedAt && <TimeLineItem label="到场时间" time={ticket.arrivedAt} icon={MapPin} />}
              {ticket.completedAt && <TimeLineItem label="完成时间" time={ticket.completedAt} icon={CheckCircle} />}
              {ticket.slaDeadline && (
                <TimeLineItem
                  label="SLA 截止"
                  time={ticket.slaDeadline}
                  icon={AlertTriangle}
                  warning={new Date(ticket.slaDeadline) < new Date()}
                />
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-700 mb-4">操作</h3>
            <div className="space-y-3">
              {ticket.status === 'pending' && (
                <button
                  onClick={() => setShowAssign(true)}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  派单
                </button>
              )}
              {ticket.status === 'assigned' && (
                <button
                  onClick={() => handleAction('accept')}
                  disabled={!!actionLoading}
                  className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {actionLoading === 'accept' ? '接单中...' : '接单处理'}
                </button>
              )}
              {ticket.status === 'processing' && !ticket.arrivedAt && (
                <button
                  onClick={() => handleAction('arrive')}
                  disabled={!!actionLoading}
                  className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {actionLoading === 'arrive' ? '登记中...' : '登记到场'}
                </button>
              )}
              {ticket.status === 'processing' && (
                <button
                  onClick={() => setShowAssist(true)}
                  className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  记录协助
                </button>
              )}
              {['processing', 'transferred'].includes(ticket.status) && (
                <button
                  onClick={() => handleAction('complete')}
                  disabled={!!actionLoading}
                  className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {actionLoading === 'complete' ? '处理中...' : '完成工单'}
                </button>
              )}
              {ticket.status !== 'completed' && ticket.status !== 'closed' && ticket.status !== 'cancelled' && (
                <>
                  <button
                    onClick={() => setShowTransfer(true)}
                    className="w-full px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    转交工单
                  </button>
                  <button
                    onClick={() => setShowException(true)}
                    className="w-full px-4 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    标记异常
                  </button>
                </>
              )}
              {ticket.isException && (
                <button
                  onClick={() => handleAction('escalate')}
                  disabled={!!actionLoading}
                  className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {actionLoading === 'escalate' ? '处理中...' : '升级处理'}
                </button>
              )}
              {ticket.status === 'completed' && !feedback && (
                <button
                  onClick={() => setShowFeedback(true)}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  旅客回访
                </button>
              )}
              {!feedback && (
                <button
                  onClick={() => setShowCompensation(true)}
                  className="w-full px-4 py-2.5 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  申请补偿
                </button>
              )}
              <div className="relative">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="detail-upload"
                />
                <label
                  htmlFor="detail-upload"
                  className="w-full px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  {actionLoading === 'upload' ? '上传中...' : '上传附件'}
                </label>
              </div>
            </div>
          </div>

          {ticket.satisfactionScore && (
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-sm border border-amber-100 p-6">
              <h3 className="font-semibold text-amber-800 mb-2">旅客满意度</h3>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    className={`w-8 h-8 ${n <= ticket.satisfactionScore ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-200'}`}
                  />
                ))}
                <span className="text-2xl font-bold text-amber-700">{ticket.satisfactionScore}.0</span>
              </div>
              {ticket.satisfactionFeedback && (
                <p className="text-sm text-amber-700 mt-2">{ticket.satisfactionFeedback}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {showAssign && (
        <Modal title="派单" onClose={() => setShowAssign(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">选择处理人员</label>
              <select
                value={formData.userId || ''}
                onChange={e => setFormData({ ...formData, userId: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.queue || u.role})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAssign(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">取消</button>
              <button
                onClick={() => handleAction('assign')}
                disabled={!formData.userId || actionLoading === 'assign'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {actionLoading === 'assign' ? '处理中...' : '确认派单'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showTransfer && (
        <Modal title="转交工单" onClose={() => setShowTransfer(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">转交人员</label>
              <select
                value={formData.toUserId || ''}
                onChange={e => setFormData({ ...formData, toUserId: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.queue || u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">转交原因</label>
              <textarea
                value={formData.reason || ''}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="请说明转交原因"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowTransfer(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">取消</button>
              <button
                onClick={() => handleAction('transfer')}
                disabled={!formData.toUserId || actionLoading === 'transfer'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {actionLoading === 'transfer' ? '处理中...' : '确认转交'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showException && (
        <Modal title="标记异常" onClose={() => setShowException(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">异常类型</label>
              <select
                value={formData.type || ''}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                {Object.entries(exceptionTypeMap).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">优先级</label>
              <select
                value={formData.priority || 'normal'}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(priorityMap).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">异常说明</label>
              <textarea
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="请详细说明异常情况"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowException(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">取消</button>
              <button
                onClick={() => handleAction('exception')}
                disabled={!formData.type || actionLoading === 'exception'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {actionLoading === 'exception' ? '处理中...' : '确认标记'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showFeedback && (
        <Modal title="旅客回访" onClose={() => setShowFeedback(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">满意度评分</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFormData({ ...formData, satisfaction: n })}
                    className={`p-2 rounded-lg transition-colors ${formData.satisfaction >= n ? 'bg-yellow-100' : 'hover:bg-slate-100'}`}
                  >
                    <Star className={`w-8 h-8 ${formData.satisfaction >= n ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">回访反馈</label>
              <textarea
                value={formData.feedbackText || ''}
                onChange={e => setFormData({ ...formData, feedbackText: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="请记录旅客的反馈意见"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="followup"
                checked={!!formData.followUpNeeded}
                onChange={e => setFormData({ ...formData, followUpNeeded: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="followup" className="text-sm text-slate-600">需要跟进处理</label>
            </div>
            {formData.followUpNeeded && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">跟进说明</label>
                <input
                  type="text"
                  value={formData.followUpDetail || ''}
                  onChange={e => setFormData({ ...formData, followUpDetail: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="请说明需要跟进的内容"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="resolved"
                checked={formData.resolved !== false}
                onChange={e => setFormData({ ...formData, resolved: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="resolved" className="text-sm text-slate-600">问题已解决</label>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowFeedback(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">取消</button>
              <button
                onClick={() => handleAction('feedback')}
                disabled={!formData.satisfaction || actionLoading === 'feedback'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {actionLoading === 'feedback' ? '提交中...' : '提交回访'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showAssist && (
        <Modal title="记录协助内容" onClose={() => setShowAssist(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">协助内容 <span className="text-red-500">*</span></label>
              <textarea
                value={formData.assistanceContent || ''}
                onChange={e => setFormData({ ...formData, assistanceContent: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="请详细描述为旅客提供的协助内容"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">协助时长（分钟）</label>
                <input
                  type="number"
                  value={formData.assistanceDuration || ''}
                  onChange={e => setFormData({ ...formData, assistanceDuration: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">使用工具</label>
                <input
                  type="text"
                  value={formData.toolsUsed || ''}
                  onChange={e => setFormData({ ...formData, toolsUsed: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：轮椅、雨伞等"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">跨部门协作</label>
              <input
                type="text"
                value={formData.crossDepartment || ''}
                onChange={e => setFormData({ ...formData, crossDepartment: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="例如：联系了安保部、行李查询等"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">补偿方案</label>
              <input
                type="text"
                value={formData.compensationOffered || ''}
                onChange={e => setFormData({ ...formData, compensationOffered: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="例如：提供休息室、代金券等"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAssist(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">取消</button>
              <button
                onClick={() => handleAction('assist')}
                disabled={!formData.assistanceContent || actionLoading === 'assist'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {actionLoading === 'assist' ? '保存中...' : '保存记录'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showCompensation && (
        <Modal title="申请补偿" onClose={() => setShowCompensation(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">补偿类型 <span className="text-red-500">*</span></label>
              <select
                value={formData.type || ''}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">请选择</option>
                <option value="现金补偿">现金补偿</option>
                <option value="代金券">代金券</option>
                <option value="休息室">休息室</option>
                <option value="升舱">升舱</option>
                <option value="里程补偿">里程补偿</option>
                <option value="礼品">礼品</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">金额（元）</label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="请输入金额，选填"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">补偿说明 <span className="text-red-500">*</span></label>
              <textarea
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="请详细说明补偿原因和方案"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCompensation(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">取消</button>
              <button
                onClick={() => handleAction('compensation')}
                disabled={!formData.type || !formData.description || actionLoading === 'compensation'}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {actionLoading === 'compensation' ? '提交中...' : '提交申请'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TimeLineItem({ label, time, icon: Icon, warning }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${warning ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-sm font-medium ${warning ? 'text-red-600' : 'text-slate-700'}`}>
          {new Date(time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function X(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  );
}

function Gift(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="8" width="18" height="4" rx="1"/>
      <path d="M12 8v13"/>
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
    </svg>
  );
}

function FileIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
      <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
    </svg>
  );
}
