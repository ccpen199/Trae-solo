import { useEffect, useState } from 'react';
import { Leaf, Plus, X, CheckCircle, Clock, Ticket, Eye, FileText, AlertTriangle, Gift } from 'lucide-react';
import dayjs from 'dayjs';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface TraceEvent {
  id: string;
  rightId: string;
  eventType: string;
  eventDesc: string;
  operator: string;
  operatorId: number;
  createdAt: string;
  remarks?: string;
}

interface GreenRight {
  id: string;
  name: string;
  type: 'green_certificate' | 'carbon_credit' | 'renewable_energy' | 'energy_saving';
  quantity: number;
  unit: string;
  issueDate: string;
  issuer: string;
  status: 'available' | 'used' | 'expired' | 'transferred';
  expiryDate: string;
  usedDate?: string;
  remarks?: string;
  value: number;
  trace: TraceEvent[];
  sourceProject?: string;
  verificationNo?: string;
}

const generateTrace = (rightId: string, status: string): TraceEvent[] => {
  const events: TraceEvent[] = [
    { id: 't1', rightId, eventType: 'issue', eventDesc: '权益发放', operator: '系统管理员', operatorId: 1, createdAt: '2026-05-01 10:00', remarks: '初始发放' },
    { id: 't2', rightId, eventType: 'verify', eventDesc: '数据核验', operator: '审计员-张工', operatorId: 2, createdAt: '2026-05-02 14:30', remarks: '数据来源真实有效' },
    { id: 't3', rightId, eventType: 'register', eventDesc: '区块链存证', operator: '系统', operatorId: 0, createdAt: '2026-05-02 15:00', remarks: '存证编号: BC' + rightId.toUpperCase() },
  ];

  if (status === 'used') {
    events.push(
      { id: 't4', rightId, eventType: 'apply_redeem', eventDesc: '用户申请核销', operator: '用户', operatorId: 3, createdAt: '2026-05-15 09:00', remarks: '申请用于消纳考核' },
      { id: 't5', rightId, eventType: 'approve_redeem', eventDesc: '核销审核通过', operator: '审核员-李工', operatorId: 4, createdAt: '2026-05-15 11:30', remarks: '材料齐全，同意核销' },
      { id: 't6', rightId, eventType: 'complete', eventDesc: '核销完成', operator: '系统', operatorId: 0, createdAt: '2026-05-15 14:00', remarks: '权益已核销，积分已发放' }
    );
  }

  if (status === 'transferred') {
    events.push(
      { id: 't4', rightId, eventType: 'transfer_out', eventDesc: '权益转出', operator: '用户', operatorId: 3, createdAt: '2026-05-18 10:00', remarks: '转让至XX公司' },
      { id: 't5', rightId, eventType: 'transfer_complete', eventDesc: '转让完成', operator: '系统', operatorId: 0, createdAt: '2026-05-18 16:00', remarks: '受让方已确认接收' }
    );
  }

  return events;
};

const mockRights: GreenRight[] = [
  { id: '1', name: '2026年5月绿色电力证书', type: 'green_certificate', quantity: 100, unit: 'MWh', issueDate: '2026-06-01', issuer: '国家能源局', status: 'available', expiryDate: '2027-06-01', value: 500, trace: generateTrace('1', 'available'), sourceProject: 'XX风电场', verificationNo: 'CSG-GC-2026-05001' },
  { id: '2', name: '2026年Q1碳减排量', type: 'carbon_credit', quantity: 50, unit: '吨', issueDate: '2026-04-15', issuer: '生态环境部', status: 'available', expiryDate: '2028-04-15', value: 2500, trace: generateTrace('2', 'available'), sourceProject: 'YY光伏电站', verificationNo: 'CSG-CC-2026-01002' },
  { id: '3', name: '2026年4月可再生能源消纳量', type: 'renewable_energy', quantity: 200, unit: 'MWh', issueDate: '2026-05-10', issuer: '电网公司', status: 'used', expiryDate: '2027-05-10', usedDate: '2026-05-20', remarks: '用于消纳责任权重考核', value: 800, trace: generateTrace('3', 'used'), sourceProject: '分布式光伏集群', verificationNo: 'CSG-RE-2026-04003' },
  { id: '4', name: '2025年度节能目标奖励', type: 'energy_saving', quantity: 30, unit: '吨标煤', issueDate: '2026-01-10', issuer: '发改委', status: 'available', expiryDate: '2027-01-10', value: 1500, trace: generateTrace('4', 'available'), sourceProject: '节能改造项目', verificationNo: 'CSG-ES-2026-01004' },
  { id: '5', name: '2025年12月绿色电力证书', type: 'green_certificate', quantity: 80, unit: 'MWh', issueDate: '2026-01-05', issuer: '国家能源局', status: 'expired', expiryDate: '2026-01-05', value: 400, trace: generateTrace('5', 'expired') },
  { id: '6', name: '2026年3月光伏项目减排量', type: 'carbon_credit', quantity: 25, unit: '吨', issueDate: '2026-04-20', issuer: '碳交易所', status: 'transferred', expiryDate: '2028-04-20', usedDate: '2026-05-15', remarks: '转让给XX公司', value: 1250, trace: generateTrace('6', 'transferred') },
];

const RIGHT_TYPES = [
  { key: 'green_certificate', label: '绿色电力证书' },
  { key: 'carbon_credit', label: '碳减排量' },
  { key: 'renewable_energy', label: '可再生能源消纳' },
  { key: 'energy_saving', label: '节能量' },
];

export default function GreenRights() {
  const { user } = useAuthStore();
  const [rights, setRights] = useState<GreenRight[]>(mockRights);
  const [loading, setLoading] = useState(true);
  const [showIssue, setShowIssue] = useState(false);
  const [showUse, setShowUse] = useState<GreenRight | null>(null);
  const [showTrace, setShowTrace] = useState<GreenRight | null>(null);
  const [issueForm, setIssueForm] = useState({ name: '', type: 'green_certificate' as GreenRight['type'], quantity: '', unit: '', issuer: '', expiryDate: '' });
  const [useRemark, setUseRemark] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<GreenRight[]>('/compliance/green-rights');
        setRights(res);
      } catch {
        setRights(mockRights);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleIssue = () => {
    const newRight: GreenRight = {
      id: 'gr' + Date.now(),
      name: issueForm.name,
      type: issueForm.type,
      quantity: parseFloat(issueForm.quantity),
      unit: issueForm.unit,
      issueDate: dayjs().format('YYYY-MM-DD'),
      issuer: issueForm.issuer,
      status: 'available',
      expiryDate: issueForm.expiryDate,
      value: parseFloat(issueForm.quantity) * 5,
      trace: generateTrace('gr' + Date.now(), 'available'),
    };
    setRights((prev) => [newRight, ...prev]);
    setShowIssue(false);
    setIssueForm({ name: '', type: 'green_certificate', quantity: '', unit: '', issuer: '', expiryDate: '' });
  };

  const handleUse = async (right: GreenRight) => {
    try {
      await api.post(`/compliance/green-rights/${right.id}/redeem`, { remark: useRemark });
    } catch {}
    setRights((prev) =>
      prev.map((r) => (r.id === right.id ? {
        ...r,
        status: 'used',
        usedDate: dayjs().format('YYYY-MM-DD'),
        remarks: useRemark || '已使用',
        trace: generateTrace(r.id, 'used'),
      } : r))
    );
    setShowUse(null);
    setUseRemark('');
  };

  const loadTrace = async (right: GreenRight) => {
    try {
      const res = await api.get<TraceEvent[]>(`/compliance/green-rights/${right.id}/trace`);
      setShowTrace({ ...right, trace: res });
    } catch {
      setShowTrace(right);
    }
  };

  const typeLabel = (t: string) => RIGHT_TYPES.find((x) => x.key === t)?.label || t;

  const statusBadge = (s: string) => {
    if (s === 'available') return 'badge-green';
    if (s === 'used' || s === 'transferred') return 'badge-blue';
    if (s === 'expired') return 'badge-red';
    return 'badge-gray';
  };
  const statusLabel = (s: string) => {
    if (s === 'available') return '可使用';
    if (s === 'used') return '已使用';
    if (s === 'transferred') return '已转让';
    if (s === 'expired') return '已过期';
    return s;
  };
  const eventTypeLabel = (e: string) => {
    const map: Record<string, string> = {
      issue: '发放',
      verify: '核验',
      register: '存证',
      apply_redeem: '申请核销',
      approve_redeem: '审核通过',
      complete: '完成',
      transfer_out: '转出',
      transfer_complete: '转让完成',
    };
    return map[e] || e;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  const totalAvailable = rights.filter((r) => r.status === 'available').reduce((s, r) => s + r.quantity, 0);
  const totalValue = rights.filter((r) => r.status === 'available').reduce((s, r) => s + r.value, 0);
  const expiringSoon = rights.filter((r) => r.status === 'available' && dayjs(r.expiryDate).diff(dayjs(), 'day') < 90).length;

  const filteredRights = rights.filter(r => {
    const statusMatch = statusFilter === 'all' || r.status === statusFilter;
    const typeMatch = typeFilter === 'all' || r.type === typeFilter;
    return statusMatch && typeMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <Leaf size={28} className="text-csg-green" />
          <div>
            <h1 className="page-title">绿色权益</h1>
            <p className="page-desc">管理和使用您的绿色电力、碳减排等权益，追踪全生命周期</p>
          </div>
        </div>
        <button onClick={() => setShowIssue(true)} className="btn-secondary flex items-center gap-1.5">
          <Plus size={16} /> 颁发权益
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="stat-label">可用权益总量</span>
              <span className="stat-value text-csg-green">{totalAvailable.toLocaleString()}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-csg-green/10 flex items-center justify-center">
              <Leaf size={20} className="text-csg-green" />
            </div>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">各类可用绿色权益合计</span>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="stat-label">绿色电力证书</span>
              <span className="stat-value">{rights.filter((r) => r.type === 'green_certificate' && r.status === 'available').reduce((s, r) => s + r.quantity, 0)} MWh</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-csg-amber/10 flex items-center justify-center">
              <Ticket size={20} className="text-csg-amber" />
            </div>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">可使用</span>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="stat-label">碳减排量</span>
              <span className="stat-value">{rights.filter((r) => r.type === 'carbon_credit' && r.status === 'available').reduce((s, r) => s + r.quantity, 0)} 吨</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Leaf size={20} className="text-blue-500" />
            </div>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">可使用</span>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="stat-label">可兑换积分</span>
              <span className="stat-value text-purple-600 dark:text-purple-400">{totalValue.toLocaleString()}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Gift size={20} className="text-purple-500" />
            </div>
          </div>
          {expiringSoon > 0 && (
            <span className="text-xs text-csg-amber flex items-center gap-1">
              <AlertTriangle size={12} /> {expiringSoon} 项即将到期
            </span>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">权益列表</h3>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-field text-sm py-1.5">
              <option value="all">全部状态</option>
              <option value="available">可使用</option>
              <option value="used">已使用</option>
              <option value="transferred">已转让</option>
              <option value="expired">已过期</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="select-field text-sm py-1.5">
              <option value="all">全部类型</option>
              {RIGHT_TYPES.map(t => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>权益名称</th>
                <th>类型</th>
                <th>数量</th>
                <th>价值(积分)</th>
                <th>来源项目</th>
                <th>颁发日期</th>
                <th>到期日期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRights.map((right) => (
                <tr key={right.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => loadTrace(right)}>
                  <td className="font-medium text-gray-900 dark:text-white">
                    {right.name}
                    {right.verificationNo && (
                      <p className="text-xs text-gray-400 font-normal">{right.verificationNo}</p>
                    )}
                  </td>
                  <td><span className="badge-blue">{typeLabel(right.type)}</span></td>
                  <td className="font-medium">{right.quantity} {right.unit}</td>
                  <td className="text-purple-600 dark:text-purple-400 font-medium">{right.value.toLocaleString()}</td>
                  <td className="text-sm text-gray-600 dark:text-gray-300">{right.sourceProject || '-'}</td>
                  <td>{dayjs(right.issueDate).format('YYYY-MM-DD')}</td>
                  <td>
                    <span className={dayjs(right.expiryDate).diff(dayjs(), 'day') < 90 && right.status === 'available' ? 'text-csg-amber font-medium' : ''}>
                      {dayjs(right.expiryDate).format('YYYY-MM-DD')}
                    </span>
                  </td>
                  <td>
                    <span className={`flex items-center gap-1 ${statusBadge(right.status)}`}>
                      {right.status === 'available' && <CheckCircle size={12} />}
                      {right.status !== 'available' && <Clock size={12} />}
                      {statusLabel(right.status)}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => loadTrace(right)}
                        className="px-2 py-1 rounded text-xs bg-csg-navy/10 text-csg-navy dark:bg-csg-navy/20 dark:text-csg-green hover:bg-csg-navy/20"
                      >
                        <Eye size={12} className="inline mr-0.5" /> 追踪
                      </button>
                      {right.status === 'available' ? (
                        <button
                          onClick={() => { setShowUse(right); setUseRemark(''); }}
                          className="px-2 py-1 rounded text-xs bg-csg-green/10 text-csg-green dark:bg-csg-green/20 hover:bg-csg-green/20"
                        >
                          核销
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showTrace && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{showTrace.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {typeLabel(showTrace.type)} · {showTrace.quantity} {showTrace.unit} · {showTrace.issuer}
                </p>
              </div>
              <button onClick={() => setShowTrace(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">权益编号</p>
                <p className="font-mono font-semibold">{showTrace.id.toUpperCase()}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">核验编号</p>
                <p className="font-mono font-semibold">{showTrace.verificationNo || '-'}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">颁发日期</p>
                <p className="font-semibold">{showTrace.issueDate}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">到期日期</p>
                <p className="font-semibold">{showTrace.expiryDate}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">来源项目</p>
                <p className="font-semibold">{showTrace.sourceProject || '-'}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">当前状态</p>
                <span className={statusBadge(showTrace.status)}>{statusLabel(showTrace.status)}</span>
              </div>
            </div>

            {showTrace.remarks && (
              <div className="p-4 rounded-lg bg-csg-navy/5 dark:bg-csg-navy/10 mb-5">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">备注：</span>{showTrace.remarks}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={18} className="text-csg-green" />
                全生命周期追踪
              </h4>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                {showTrace.trace.map((event, i) => (
                  <div key={event.id} className="relative pl-10 pb-6 last:pb-0">
                    <div className={`absolute left-1.5 w-5 h-5 rounded-full border-4 bg-csg-green border-csg-green/30`} />
                    <div className="p-4 rounded-lg bg-csg-green/5 dark:bg-csg-green/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">{eventTypeLabel(event.eventType)}</span>
                        <span className="text-xs badge-green">已完成</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{event.eventDesc}</p>
                      {event.remarks && (
                        <p className="text-xs text-csg-navy dark:text-csg-green mt-1">{event.remarks}</p>
                      )}
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>操作人：{event.operator}</span>
                        <span>{event.createdAt}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showIssue && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">颁发绿色权益</h3>
              <button onClick={() => setShowIssue(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">权益名称</label>
                <input type="text" value={issueForm.name} onChange={(e) => setIssueForm((p) => ({ ...p, name: e.target.value }))} className="input-field" placeholder="请输入权益名称" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类型</label>
                <select value={issueForm.type} onChange={(e) => setIssueForm((p) => ({ ...p, type: e.target.value as GreenRight['type'] }))} className="select-field">
                  {RIGHT_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">数量</label>
                  <input type="number" value={issueForm.quantity} onChange={(e) => setIssueForm((p) => ({ ...p, quantity: e.target.value }))} className="input-field" placeholder="数量" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">单位</label>
                  <input type="text" value={issueForm.unit} onChange={(e) => setIssueForm((p) => ({ ...p, unit: e.target.value }))} className="input-field" placeholder="如 吨、MWh" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">颁发机构</label>
                <input type="text" value={issueForm.issuer} onChange={(e) => setIssueForm((p) => ({ ...p, issuer: e.target.value }))} className="input-field" placeholder="请输入颁发机构" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">到期日期</label>
                <input type="date" value={issueForm.expiryDate} onChange={(e) => setIssueForm((p) => ({ ...p, expiryDate: e.target.value }))} className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowIssue(false)} className="btn-outline flex-1">取消</button>
              <button onClick={handleIssue} disabled={!issueForm.name || !issueForm.quantity || !issueForm.expiryDate} className="btn-secondary flex-1">颁发</button>
            </div>
          </div>
        </div>
      )}

      {showUse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">核销绿色权益</h3>
              <button onClick={() => setShowUse(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 mb-4">
              <p className="font-semibold text-gray-900 dark:text-white">{showUse.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {typeLabel(showUse.type)} · {showUse.quantity} {showUse.unit}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <span className="text-sm text-gray-600 dark:text-gray-300">可兑换积分</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">+{showUse.value.toLocaleString()}</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">核销说明</label>
              <textarea value={useRemark} onChange={(e) => setUseRemark(e.target.value)} className="input-field h-20 resize-none" placeholder="请输入核销说明（可选）" />
            </div>
            <div className="p-3 rounded-lg bg-csg-amber/5 dark:bg-csg-amber/10 border border-csg-amber/20 mb-4">
              <p className="text-xs text-csg-amber flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                核销后权益将转为已使用状态，积分将自动发放至您的账户，此操作不可撤销。
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowUse(null)} className="btn-outline flex-1">取消</button>
              <button onClick={() => handleUse(showUse)} className="btn-secondary flex-1 bg-csg-green hover:bg-csg-green/90">确认核销</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
