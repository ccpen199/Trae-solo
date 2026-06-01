import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, AlertTriangle, Filter, CheckCircle, ArrowUpRight, User, MapPin,
  Clock, DollarSign, Handshake, FileCheck, Star, RefreshCw, Luggage,
  Heart, Wrench, AlertOctagon, Send, X
} from 'lucide-react';
import { api, exceptionTypeMap, priorityMap, statusMap } from '@/lib/api';

const exceptionTypeConfig: Record<string, {
  icon: any;
  color: string;
  requiredFields: string[];
  optionalFields: string[];
  description: string;
}> = {
  baggage_delay: {
    icon: Luggage,
    color: 'bg-orange-100 text-orange-700',
    requiredFields: ['arrived', 'assistanceContent', 'passengerConfirmed', 'resolution'],
    optionalFields: ['compensation', 'reviewNote', 'satisfactionScore'],
    description: '行李延误处理：需要到场确认、协助查询、旅客确认',
  },
  special_assistance: {
    icon: Heart,
    color: 'bg-pink-100 text-pink-700',
    requiredFields: ['arrived', 'assistanceContent', 'passengerConfirmed', 'resolution'],
    optionalFields: ['transferred', 'reviewNote', 'satisfactionScore'],
    description: '特殊旅客协助：需要到场、全程协助、旅客确认',
  },
  facility_fault: {
    icon: Wrench,
    color: 'bg-amber-100 text-amber-700',
    requiredFields: ['arrived', 'assistanceContent', 'reviewNote', 'resolution'],
    optionalFields: ['transferred'],
    description: '设施故障处理：需要到场检查、协助处置、复查确认',
  },
  complaint_escalation: {
    icon: AlertOctagon,
    color: 'bg-red-100 text-red-700',
    requiredFields: ['arrived', 'assistanceContent', 'passengerConfirmed', 'reviewNote', 'resolution'],
    optionalFields: ['transferred', 'compensation', 'satisfactionScore'],
    description: '投诉升级处理：需要到场、全程记录、补偿协商、旅客确认、复查',
  },
  mis_assignment: {
    icon: Send,
    color: 'bg-purple-100 text-purple-700',
    requiredFields: ['transferred', 'transferReason', 'resolution'],
    optionalFields: ['reviewNote'],
    description: '误派单处理：需要转交给正确人员、说明原因',
  },
  other: {
    icon: AlertTriangle,
    color: 'bg-slate-100 text-slate-700',
    requiredFields: ['resolution'],
    optionalFields: ['arrived', 'assistanceContent', 'transferred', 'compensation', 'passengerConfirmed', 'reviewNote', 'satisfactionScore'],
    description: '其他异常处理',
  },
};

export default function ExceptionQueue() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [filters, setFilters] = useState({ status: '', type: '', priority: '' });
  const [resolveData, setResolveData] = useState<{ id: string; item: any; show: boolean }>({ id: '', item: null, show: false });
  const [formData, setFormData] = useState<any>({
    arrived: false,
    arrivalTime: '',
    assistanceContent: '',
    transferred: false,
    transferTo: '',
    transferReason: '',
    compensationType: '',
    compensationAmount: '',
    compensationDetail: '',
    passengerConfirmed: false,
    confirmationMethod: 'manual',
    passengerSignature: '',
    reviewNote: '',
    satisfactionScore: 0,
    resolution: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  async function loadData() {
    setLoading(true);
    try {
      const params: any = { ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const res = await api.exceptionQueue(params);
      setData(res.data);
    } catch (e) {
      console.error('Load exception queue failed:', e);
    } finally {
      setLoading(false);
    }
  }

  function openResolveModal(item: any) {
    setResolveData({ id: item.id, item, show: true });
    setFormData({
      arrived: false,
      arrivalTime: new Date().toISOString().slice(0, 16),
      assistanceContent: '',
      transferred: false,
      transferTo: '',
      transferReason: '',
      compensationType: '',
      compensationAmount: '',
      compensationDetail: '',
      passengerConfirmed: false,
      confirmationMethod: 'manual',
      passengerSignature: '',
      reviewNote: '',
      satisfactionScore: 0,
      resolution: '',
    });
  }

  function isFormValid() {
    const typeConfig = exceptionTypeConfig[resolveData.item?.type] || exceptionTypeConfig.other;
    for (const field of typeConfig.requiredFields) {
      if (field === 'arrived' && !formData.arrived) return false;
      if (field === 'assistanceContent' && !formData.assistanceContent.trim()) return false;
      if (field === 'passengerConfirmed' && !formData.passengerConfirmed) return false;
      if (field === 'transferred' && (!formData.transferred || !formData.transferTo)) return false;
      if (field === 'transferReason' && !formData.transferReason.trim()) return false;
      if (field === 'reviewNote' && !formData.reviewNote.trim()) return false;
      if (field === 'resolution' && !formData.resolution.trim()) return false;
    }
    return true;
  }

  async function handleResolve() {
    if (!isFormValid()) {
      alert('请填写所有必填项');
      return;
    }
    setSubmitting(true);
    try {
      const submitData: any = {
        resolution: formData.resolution,
      };
      if (formData.arrived) {
        submitData.arrived = true;
        submitData.arrivalTime = formData.arrivalTime;
      }
      if (formData.assistanceContent) {
        submitData.assistanceContent = formData.assistanceContent;
      }
      if (formData.transferred && formData.transferTo) {
        submitData.transferred = true;
        submitData.transferTo = formData.transferTo;
        submitData.transferReason = formData.transferReason;
      }
      if (formData.compensationType) {
        submitData.compensationType = formData.compensationType;
        submitData.compensationAmount = formData.compensationAmount ? Number(formData.compensationAmount) : 0;
        submitData.compensationDetail = formData.compensationDetail;
      }
      if (formData.passengerConfirmed) {
        submitData.passengerConfirmed = true;
        submitData.confirmationMethod = formData.confirmationMethod;
        submitData.passengerSignature = formData.passengerSignature;
      }
      if (formData.reviewNote) {
        submitData.reviewNote = formData.reviewNote;
      }
      if (formData.satisfactionScore > 0) {
        submitData.satisfactionScore = formData.satisfactionScore;
      }

      await api.resolveException(resolveData.id, submitData);
      alert('解决成功，处理环节已记录');
      setResolveData({ id: '', item: null, show: false });
      loadData();
    } catch (e: any) {
      alert(e.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  }

  const statusColors: Record<string, string> = {
    open: 'bg-red-100 text-red-700',
    processing: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-slate-100 text-slate-700',
  };

  const statusLabels: Record<string, string> = {
    open: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  };

  const currentType = resolveData.item?.type || 'other';
  const typeConfig = exceptionTypeConfig[currentType];
  const TypeIcon = typeConfig?.icon || AlertTriangle;

  function FieldLabel({ field, required }: { field: string; required?: boolean }) {
    const labels: Record<string, string> = {
      arrived: '到场登记',
      arrivalTime: '到场时间',
      assistanceContent: '协助内容',
      transferred: '跨部门转交',
      transferTo: '转交给',
      transferReason: '转交原因',
      compensationType: '补偿类型',
      compensationAmount: '补偿金额',
      compensationDetail: '补偿说明',
      passengerConfirmed: '旅客确认',
      confirmationMethod: '确认方式',
      passengerSignature: '旅客签名',
      reviewNote: '复查记录',
      satisfactionScore: '满意度评分',
      resolution: '解决方案',
    };
    return (
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {labels[field] || field}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">异常队列</h2>
          <p className="text-sm text-slate-500 mt-1">处理特殊工单和升级事件</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['open', 'processing', 'resolved', 'closed'].map(status => (
          <div key={status} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">{statusLabels[status]}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {data.filter(d => d.status === status).length}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-600">筛选条件</span>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">状态</label>
            <select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">异常类型</label>
            <select
              value={filters.type}
              onChange={e => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              {Object.entries(exceptionTypeMap).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">优先级</label>
            <select
              value={filters.priority}
              onChange={e => setFilters({ ...filters, priority: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              {Object.entries(priorityMap).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>暂无异常数据</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {data.map((item: any) => {
              const ItemIcon = exceptionTypeConfig[item.type]?.icon || AlertTriangle;
              return (
                <div key={item.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.status === 'open' ? 'bg-red-100 text-red-600' :
                        item.status === 'resolved' ? 'bg-green-100 text-green-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        <ItemIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[item.status]}`}>
                            {statusLabels[item.status]}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${priorityMap[item.priority]?.color}`}>
                            {priorityMap[item.priority]?.label}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${exceptionTypeConfig[item.type]?.color || 'bg-slate-100 text-slate-600'}`}>
                            {exceptionTypeMap[item.type] || item.type}
                          </span>
                          {item.escalated && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3" />
                              已升级
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-slate-800 mb-1">
                          {item.passengerName} · {item.serviceType}
                        </p>
                        {item.description && (
                          <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                        )}
                        {item.resolution && (
                          <div className="bg-green-50 text-green-700 text-sm p-2 rounded-lg mb-2">
                            <span className="font-medium">解决方案：</span>{item.resolution}
                          </div>
                        )}
                        {item.status === 'resolved' && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {item.arrived && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1"><Clock className="w-3 h-3" />已到场</span>}
                            {item.assistance_recorded && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded flex items-center gap-1"><Handshake className="w-3 h-3" />已协助</span>}
                            {item.transferred && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded flex items-center gap-1"><Send className="w-3 h-3" />已转交</span>}
                            {item.compensation_provided && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1"><DollarSign className="w-3 h-3" />已补偿</span>}
                            {item.passenger_confirmed && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded flex items-center gap-1"><FileCheck className="w-3 h-3" />已确认</span>}
                            {item.reviewed && <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle className="w-3 h-3" />已复查</span>}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.terminal}-{item.area}
                          </span>
                          {item.flightNo && <span>航班：{item.flightNo}</span>}
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.assignedToName}
                          </span>
                          <span>{new Date(item.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        to={`/tickets/${item.ticketId}`}
                        className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        查看工单
                      </Link>
                      {item.status !== 'resolved' && item.status !== 'closed' && (
                        <button
                          onClick={() => openResolveModal(item)}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          解决
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {resolveData.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
                  <TypeIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    处理异常：{exceptionTypeMap[currentType]}
                  </h3>
                  <p className="text-xs text-slate-500">{typeConfig.description}</p>
                </div>
              </div>
              <button
                onClick={() => setResolveData({ id: '', item: null, show: false })}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">旅客：</span>{resolveData.item?.passengerName}
                  <span className="mx-2">|</span>
                  <span className="font-medium">工单：</span>{resolveData.item?.ticketId}
                  <span className="mx-2">|</span>
                  <span className="font-medium">位置：</span>{resolveData.item?.terminal}-{resolveData.item?.area}
                </p>
                {resolveData.item?.description && (
                  <p className="text-sm text-blue-600 mt-1">
                    <span className="font-medium">异常描述：</span>{resolveData.item.description}
                  </p>
                )}
              </div>

              <div className="space-y-5">
                {typeConfig.requiredFields.includes('arrived') && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-slate-700">到场登记</span>
                      <label className="flex items-center gap-2 ml-auto cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.arrived}
                          onChange={e => setFormData({ ...formData, arrived: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-slate-600">已到场</span>
                      </label>
                    </div>
                    {formData.arrived && (
                      <div className="mt-3">
                        <FieldLabel field="arrivalTime" required />
                        <input
                          type="datetime-local"
                          value={formData.arrivalTime}
                          onChange={e => setFormData({ ...formData, arrivalTime: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {typeConfig.requiredFields.includes('assistanceContent') && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Handshake className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-medium text-slate-700">协助内容</span>
                    </div>
                    <FieldLabel field="assistanceContent" required />
                    <textarea
                      value={formData.assistanceContent}
                      onChange={e => setFormData({ ...formData, assistanceContent: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="请详细描述协助过程和处理内容..."
                    />
                  </div>
                )}

                {(typeConfig.requiredFields.includes('transferred') || typeConfig.optionalFields.includes('transferred')) && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Send className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-slate-700">跨部门转交</span>
                      <label className="flex items-center gap-2 ml-auto cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.transferred}
                          onChange={e => setFormData({ ...formData, transferred: e.target.checked })}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span className="text-sm text-slate-600">已转交</span>
                      </label>
                    </div>
                    {formData.transferred && (
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <FieldLabel field="transferTo" required={typeConfig.requiredFields.includes('transferred')} />
                          <input
                            type="text"
                            value={formData.transferTo}
                            onChange={e => setFormData({ ...formData, transferTo: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="接收人ID或姓名"
                          />
                        </div>
                        <div>
                          <FieldLabel field="transferReason" required={typeConfig.requiredFields.includes('transferReason')} />
                          <input
                            type="text"
                            value={formData.transferReason}
                            onChange={e => setFormData({ ...formData, transferReason: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="转交原因"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(typeConfig.requiredFields.includes('compensationType') || typeConfig.optionalFields.includes('compensation')) && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="font-medium text-slate-700">补偿方案</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <FieldLabel field="compensationType" />
                        <select
                          value={formData.compensationType}
                          onChange={e => setFormData({ ...formData, compensationType: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">无</option>
                          <option value="cash">现金补偿</option>
                          <option value="voucher">代金券</option>
                          <option value="miles">里程补偿</option>
                          <option value="meal">餐饮安排</option>
                          <option value="hotel">酒店安排</option>
                          <option value="transport">交通安排</option>
                          <option value="apology">口头/书面道歉</option>
                          <option value="other">其他</option>
                        </select>
                      </div>
                      <div>
                        <FieldLabel field="compensationAmount" />
                        <input
                          type="number"
                          value={formData.compensationAmount}
                          onChange={e => setFormData({ ...formData, compensationAmount: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="金额（元）"
                        />
                      </div>
                      <div>
                        <FieldLabel field="compensationDetail" />
                        <input
                          type="text"
                          value={formData.compensationDetail}
                          onChange={e => setFormData({ ...formData, compensationDetail: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="说明"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(typeConfig.requiredFields.includes('passengerConfirmed') || typeConfig.optionalFields.includes('passengerConfirmed')) && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="font-medium text-slate-700">旅客确认</span>
                      <label className="flex items-center gap-2 ml-auto cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.passengerConfirmed}
                          onChange={e => setFormData({ ...formData, passengerConfirmed: e.target.checked })}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span className="text-sm text-slate-600">已确认</span>
                      </label>
                    </div>
                    {formData.passengerConfirmed && (
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <FieldLabel field="confirmationMethod" required />
                          <select
                            value={formData.confirmationMethod}
                            onChange={e => setFormData({ ...formData, confirmationMethod: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="manual">手工确认</option>
                            <option value="signature">电子签名</option>
                            <option value="phone">电话确认</option>
                            <option value="sms">短信确认</option>
                          </select>
                        </div>
                        <div>
                          <FieldLabel field="passengerSignature" />
                          <input
                            type="text"
                            value={formData.passengerSignature}
                            onChange={e => setFormData({ ...formData, passengerSignature: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="旅客姓名/标识"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {typeConfig.optionalFields.includes('satisfactionScore') && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Star className="w-4 h-4 text-yellow-600" />
                      </div>
                      <span className="font-medium text-slate-700">满意度评分</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(score => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setFormData({ ...formData, satisfactionScore: formData.satisfactionScore === score ? 0 : score })}
                          className={`p-2 rounded-lg transition-colors ${
                            formData.satisfactionScore >= score
                              ? 'text-yellow-500 bg-yellow-50'
                              : 'text-slate-300 hover:text-slate-400'
                          }`}
                        >
                          <Star className="w-6 h-6" fill={formData.satisfactionScore >= score ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-slate-500">
                        {formData.satisfactionScore > 0 ? `${formData.satisfactionScore} 分` : '未评分'}
                      </span>
                    </div>
                  </div>
                )}

                {(typeConfig.requiredFields.includes('reviewNote') || typeConfig.optionalFields.includes('reviewNote')) && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="font-medium text-slate-700">复查记录</span>
                    </div>
                    <FieldLabel field="reviewNote" required={typeConfig.requiredFields.includes('reviewNote')} />
                    <textarea
                      value={formData.reviewNote}
                      onChange={e => setFormData({ ...formData, reviewNote: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="质量复查、后续跟进记录..."
                    />
                  </div>
                )}

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-medium text-slate-700">解决方案</span>
                  </div>
                  <FieldLabel field="resolution" required />
                  <textarea
                    value={formData.resolution}
                    onChange={e => setFormData({ ...formData, resolution: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="请详细描述最终的解决方案和处理结果..."
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-700">
                    <span className="font-medium">必填项提示：</span>
                    带 <span className="text-red-500">*</span> 标记的字段为必填项，请确保全部填写后提交。
                    所有处理环节将自动记录到工单操作日志中，可在工单详情中追溯。
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setResolveData({ id: '', item: null, show: false })}
                disabled={submitting}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleResolve}
                disabled={!isFormValid() || submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> 提交中...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> 确认解决</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
