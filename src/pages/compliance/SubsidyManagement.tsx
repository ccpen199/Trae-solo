import { useEffect, useState } from 'react';
import { DollarSign, Plus, X, CheckCircle, Clock, AlertCircle, FileText, ChevronRight, Eye, TrendingUp } from 'lucide-react';
import dayjs from 'dayjs';
import { api } from '@/lib/api';

interface TimelineEvent {
  status: string;
  label: string;
  time: string;
  operator: string;
  completed: boolean;
  remarks?: string;
}

interface Subsidy {
  id: string;
  name: string;
  category: string;
  amount: number;
  applicationDate: string;
  applicant: string;
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'paid';
  reviewDate?: string;
  paidDate?: string;
  remarks?: string;
  timeline: TimelineEvent[];
  supportingDocs?: string[];
  reviewComments?: string;
}

const generateTimeline = (status: string, applyDate: string): TimelineEvent[] => {
  const baseDate = dayjs(applyDate);
  const timeline: TimelineEvent[] = [
    { status: 'submitted', label: '提交申请', time: baseDate.format('YYYY-MM-DD HH:mm'), operator: '申请人', completed: true, remarks: '提交补贴申请及相关材料' },
  ];

  if (status !== 'draft') {
    timeline.push({ status: 'reviewed', label: '材料审核', time: baseDate.add(2, 'day').format('YYYY-MM-DD HH:mm'), operator: '审核员-张工', completed: true, remarks: '材料齐全，进入审批流程' });
  }

  if (status === 'approved' || status === 'paid' || status === 'rejected') {
    timeline.push({
      status: status === 'rejected' ? 'rejected' : 'approved',
      label: status === 'rejected' ? '审批驳回' : '审批通过',
      time: baseDate.add(5, 'day').format('YYYY-MM-DD HH:mm'),
      operator: '审批主管-李总',
      completed: true,
      remarks: status === 'rejected' ? '未达到补贴标准，不予通过' : '符合补贴条件，同意发放',
    });
  }

  if (status === 'paid') {
    timeline.push({ status: 'notified', label: '用户通知', time: baseDate.add(6, 'day').format('YYYY-MM-DD HH:mm'), operator: '系统通知', completed: true, remarks: '已发送审批通过短信通知' });
    timeline.push({ status: 'disbursed', label: '资金发放', time: baseDate.add(10, 'day').format('YYYY-MM-DD HH:mm'), operator: '财务部门', completed: true, remarks: '补贴资金已拨付至指定账户' });
    timeline.push({ status: 'completed', label: '流程完成', time: baseDate.add(11, 'day').format('YYYY-MM-DD HH:mm'), operator: '系统', completed: true, remarks: '补贴发放完成，流程结束' });
  }

  if (status === 'approved') {
    timeline.push({ status: 'notified', label: '用户通知', time: baseDate.add(6, 'day').format('YYYY-MM-DD HH:mm'), operator: '系统通知', completed: true, remarks: '已发送审批通过短信通知' });
    timeline.push({ status: 'disbursing', label: '待发放', time: '预计 ' + baseDate.add(10, 'day').format('YYYY-MM-DD'), operator: '财务部门', completed: false, remarks: '正在走财务付款流程' });
  }

  if (status === 'reviewing') {
    timeline.push({ status: 'reviewing', label: '审批中', time: '进行中', operator: '审批主管-李总', completed: false, remarks: '正在审核申请材料' });
  }

  return timeline;
};

const mockSubsidies: Subsidy[] = [
  { id: '1', name: '2026年Q2节能补贴', category: '节能补贴', amount: 25000, applicationDate: '2026-06-03', applicant: 'XX科技有限公司', status: 'reviewing', remarks: '正在审核材料', timeline: generateTimeline('reviewing', '2026-06-03'), supportingDocs: ['营业执照.pdf', '能耗报告.pdf'] },
  { id: '2', name: '分布式光伏并网补贴', category: '新能源补贴', amount: 80000, applicationDate: '2026-05-20', applicant: 'YY产业园', status: 'approved', reviewDate: '2026-06-01', remarks: '资料齐全，同意补贴申请', timeline: generateTimeline('approved', '2026-05-20'), supportingDocs: ['并网验收单.pdf', '发电量证明.pdf'] },
  { id: '3', name: '需求响应补贴', category: '需求响应', amount: 12000, applicationDate: '2026-05-15', applicant: 'ZZ制造有限公司', status: 'paid', reviewDate: '2026-05-25', paidDate: '2026-05-28', remarks: '补贴资金已拨付', timeline: generateTimeline('paid', '2026-05-15'), supportingDocs: ['响应记录.pdf', '负荷曲线.pdf'] },
  { id: '4', name: '绿色工厂专项补贴', category: '绿色制造', amount: 150000, applicationDate: '2026-05-05', applicant: 'HH建材集团', status: 'rejected', reviewDate: '2026-05-18', remarks: '未达到补贴标准，不予通过', timeline: generateTimeline('rejected', '2026-05-05'), reviewComments: '单位产值能耗未达到行业先进值，差距约8%' },
  { id: '5', name: '充电桩建设补贴', category: '新能源补贴', amount: 35000, applicationDate: '2026-04-28', applicant: 'XX科技有限公司', status: 'approved', reviewDate: '2026-05-10', timeline: generateTimeline('approved', '2026-04-28') },
  { id: '6', name: '峰谷移峰补贴', category: '电价补贴', amount: 8000, applicationDate: '2026-04-20', applicant: 'ZZ制造有限公司', status: 'paid', reviewDate: '2026-04-28', paidDate: '2026-05-02', timeline: generateTimeline('paid', '2026-04-20') },
];

export default function SubsidyManagement() {
  const [subsidies, setSubsidies] = useState<Subsidy[]>(mockSubsidies);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [showTimeline, setShowTimeline] = useState<Subsidy | null>(null);
  const [applyForm, setApplyForm] = useState({ name: '', category: '', amount: '', applicant: '' });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Subsidy[]>('/compliance/subsidies');
        setSubsidies(res);
      } catch {
        setSubsidies(mockSubsidies);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApply = () => {
    const newSubsidy: Subsidy = {
      id: 's' + Date.now(),
      name: applyForm.name,
      category: applyForm.category,
      amount: parseFloat(applyForm.amount),
      applicationDate: dayjs().format('YYYY-MM-DD'),
      applicant: applyForm.applicant,
      status: 'submitted',
      timeline: generateTimeline('submitted', dayjs().format('YYYY-MM-DD')),
    };
    setSubsidies((prev) => [newSubsidy, ...prev]);
    setShowApply(false);
    setApplyForm({ name: '', category: '', amount: '', applicant: '' });
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/compliance/subsidies/${id}/approve`);
    } catch {}
    setSubsidies((prev) =>
      prev.map((s) => (s.id === id ? {
        ...s,
        status: 'approved',
        reviewDate: dayjs().format('YYYY-MM-DD'),
        remarks: '审核通过',
        timeline: generateTimeline('approved', s.applicationDate),
      } : s))
    );
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/compliance/subsidies/${id}/reject`);
    } catch {}
    setSubsidies((prev) =>
      prev.map((s) => (s.id === id ? {
        ...s,
        status: 'rejected',
        reviewDate: dayjs().format('YYYY-MM-DD'),
        remarks: '审核未通过',
        timeline: generateTimeline('rejected', s.applicationDate),
      } : s))
    );
  };

  const loadTimeline = async (subsidy: Subsidy) => {
    try {
      const res = await api.get<TimelineEvent[]>(`/compliance/subsidies/${subsidy.id}/timeline`);
      setShowTimeline({ ...subsidy, timeline: res });
    } catch {
      setShowTimeline(subsidy);
    }
  };

  const statusBadge = (s: string) => {
    if (s === 'approved' || s === 'paid') return 'badge-green';
    if (s === 'rejected') return 'badge-red';
    if (s === 'reviewing') return 'badge-amber';
    if (s === 'submitted') return 'badge-blue';
    return 'badge-gray';
  };
  const statusLabel = (s: string) => {
    if (s === 'approved') return '已通过';
    if (s === 'paid') return '已拨付';
    if (s === 'rejected') return '已拒绝';
    if (s === 'reviewing') return '审核中';
    if (s === 'submitted') return '已提交';
    return '草稿';
  };

  const stats = {
    total: subsidies.length,
    pending: subsidies.filter(s => s.status === 'submitted' || s.status === 'reviewing').length,
    approved: subsidies.filter(s => s.status === 'approved' || s.status === 'paid').length,
    totalAmount: subsidies.filter(s => s.status === 'approved' || s.status === 'paid').reduce((sum, s) => sum + s.amount, 0),
  };

  const filteredSubsidies = subsidies.filter(s => {
    const statusMatch = statusFilter === 'all' || s.status === statusFilter;
    const categoryMatch = categoryFilter === 'all' || s.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <DollarSign size={28} className="text-csg-green" />
          <div>
            <h1 className="page-title">补贴管理</h1>
            <p className="page-desc">申请和管理各类能源补贴，追踪审批全流程</p>
          </div>
        </div>
        <button onClick={() => setShowApply(true)} className="btn-secondary flex items-center gap-1.5">
          <Plus size={16} /> 申请补贴
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <FileText size={18} className="text-csg-navy mb-1" />
          <span className="stat-label">申请总数</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card">
          <Clock size={18} className="text-csg-amber mb-1" />
          <span className="stat-label">待审核</span>
          <span className="stat-value text-csg-amber">{stats.pending}</span>
        </div>
        <div className="stat-card">
          <CheckCircle size={18} className="text-csg-green mb-1" />
          <span className="stat-label">已通过</span>
          <span className="stat-value text-csg-green">{stats.approved}</span>
        </div>
        <div className="stat-card">
          <TrendingUp size={18} className="text-csg-green mb-1" />
          <span className="stat-label">累计发放</span>
          <span className="stat-value text-csg-green">¥{stats.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">补贴申请列表</h3>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-field text-sm py-1.5">
              <option value="all">全部状态</option>
              <option value="submitted">已提交</option>
              <option value="reviewing">审核中</option>
              <option value="approved">已通过</option>
              <option value="paid">已拨付</option>
              <option value="rejected">已拒绝</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="select-field text-sm py-1.5">
              <option value="all">全部类别</option>
              <option value="节能补贴">节能补贴</option>
              <option value="新能源补贴">新能源补贴</option>
              <option value="需求响应">需求响应</option>
              <option value="绿色制造">绿色制造</option>
              <option value="电价补贴">电价补贴</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>补贴名称</th>
                <th>类别</th>
                <th>金额</th>
                <th>申请人</th>
                <th>申请日期</th>
                <th>状态</th>
                <th>进度</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubsidies.map((subsidy) => {
                const progress = Math.round((subsidy.timeline.filter(e => e.completed).length / subsidy.timeline.length) * 100);
                return (
                  <tr key={subsidy.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => loadTimeline(subsidy)}>
                    <td className="font-medium text-gray-900 dark:text-white">{subsidy.name}</td>
                    <td><span className="badge-blue">{subsidy.category}</span></td>
                    <td className="font-medium text-csg-green">¥{subsidy.amount.toLocaleString()}</td>
                    <td>{subsidy.applicant}</td>
                    <td>{dayjs(subsidy.applicationDate).format('YYYY-MM-DD')}</td>
                    <td>
                      <span className={`flex items-center gap-1 ${statusBadge(subsidy.status)}`}>
                        {(subsidy.status === 'approved' || subsidy.status === 'paid') && <CheckCircle size={12} />}
                        {subsidy.status === 'reviewing' && <Clock size={12} />}
                        {subsidy.status === 'rejected' && <AlertCircle size={12} />}
                        {statusLabel(subsidy.status)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-csg-green rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{progress}%</span>
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => loadTimeline(subsidy)}
                          className="px-2 py-1 rounded text-xs bg-csg-navy/10 text-csg-navy dark:bg-csg-navy/20 dark:text-csg-green hover:bg-csg-navy/20"
                        >
                          <Eye size={12} className="inline mr-0.5" /> 追踪
                        </button>
                        {subsidy.status === 'submitted' || subsidy.status === 'reviewing' ? (
                          <>
                            <button onClick={() => handleApprove(subsidy.id)} className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50">
                              通过
                            </button>
                            <button onClick={() => handleReject(subsidy.id)} className="px-2 py-1 rounded text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50">
                              拒绝
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showTimeline && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{showTimeline.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {showTimeline.applicant} · 申请金额 ¥{showTimeline.amount.toLocaleString()}
                </p>
              </div>
              <button onClick={() => setShowTimeline(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>

            <div className={`p-4 rounded-lg mb-5 ${
              showTimeline.status === 'paid' ? 'bg-csg-green/5 dark:bg-csg-green/10 border border-csg-green/20' :
              showTimeline.status === 'rejected' ? 'bg-csg-red/5 dark:bg-csg-red/10 border border-csg-red/20' :
              'bg-csg-amber/5 dark:bg-csg-amber/10 border border-csg-amber/20'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {showTimeline.status === 'paid' ? (
                    <CheckCircle size={20} className="text-csg-green" />
                  ) : showTimeline.status === 'rejected' ? (
                    <AlertCircle size={20} className="text-csg-red" />
                  ) : (
                    <Clock size={20} className="text-csg-amber" />
                  )}
                  <span className={`font-semibold ${
                    showTimeline.status === 'paid' ? 'text-csg-green' :
                    showTimeline.status === 'rejected' ? 'text-csg-red' :
                    'text-csg-amber'
                  }`}>
                    当前状态：{statusLabel(showTimeline.status)}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${statusBadge(showTimeline.status)}`}>
                  {Math.round((showTimeline.timeline.filter(e => e.completed).length / showTimeline.timeline.length) * 100)}% 完成
                </span>
              </div>
              {showTimeline.reviewComments && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  审批意见：{showTimeline.reviewComments}
                </p>
              )}
            </div>

            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
              {showTimeline.timeline.map((event, i) => (
                <div key={i} className="relative pl-10 pb-6 last:pb-0">
                  <div className={`absolute left-1.5 w-5 h-5 rounded-full border-4 ${
                    event.completed ? 'bg-csg-green border-csg-green/30' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  }`} />
                  <div className={`p-4 rounded-lg ${
                    event.completed ? 'bg-csg-green/5 dark:bg-csg-green/10' : 'bg-gray-50 dark:bg-gray-700/50'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold ${event.completed ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {event.label}
                      </span>
                      <span className={`text-xs ${event.completed ? 'badge-green' : 'badge-gray'}`}>
                        {event.completed ? '已完成' : '待处理'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{event.remarks}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>处理人：{event.operator}</span>
                      <span>{event.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {showTimeline.supportingDocs && showTimeline.supportingDocs.length > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">证明材料</h4>
                <div className="space-y-2">
                  {showTimeline.supportingDocs.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <FileText size={16} className="text-csg-navy" />
                      <span className="text-sm text-gray-600 dark:text-gray-300 flex-1">{doc}</span>
                      <button className="text-csg-navy hover:text-csg-green text-sm">下载</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showApply && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">申请补贴</h3>
              <button onClick={() => setShowApply(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">补贴名称</label>
                <input type="text" value={applyForm.name} onChange={(e) => setApplyForm((p) => ({ ...p, name: e.target.value }))} className="input-field" placeholder="请输入补贴名称" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类别</label>
                <select value={applyForm.category} onChange={(e) => setApplyForm((p) => ({ ...p, category: e.target.value }))} className="select-field">
                  <option value="">请选择</option>
                  <option value="节能补贴">节能补贴</option>
                  <option value="新能源补贴">新能源补贴</option>
                  <option value="需求响应">需求响应</option>
                  <option value="绿色制造">绿色制造</option>
                  <option value="电价补贴">电价补贴</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">申请金额 (元)</label>
                <input type="number" value={applyForm.amount} onChange={(e) => setApplyForm((p) => ({ ...p, amount: e.target.value }))} className="input-field" placeholder="请输入申请金额" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">申请单位</label>
                <input type="text" value={applyForm.applicant} onChange={(e) => setApplyForm((p) => ({ ...p, applicant: e.target.value }))} className="input-field" placeholder="请输入申请单位" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowApply(false)} className="btn-outline flex-1">取消</button>
              <button onClick={handleApply} disabled={!applyForm.name || !applyForm.category || !applyForm.amount} className="btn-secondary flex-1">提交申请</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
