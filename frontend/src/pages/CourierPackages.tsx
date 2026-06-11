import { useState, useEffect } from 'react';
import { LogIn, LogOut, PenLine, Search, ArrowRight } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { Package, BRAND_MAP, PaginatedResult } from '../types';

type TabKey = 'inbound' | 'outbound' | 'sign';

const TABS: { key: TabKey; label: string; icon: typeof LogIn }[] = [
  { key: 'inbound', label: '入库', icon: LogIn },
  { key: 'outbound', label: '出库', icon: LogOut },
  { key: 'sign', label: '签收', icon: PenLine },
];

interface InboundForm {
  tracking_no: string;
  brand: string;
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  weight: string;
  fee: string;
}

const emptyInbound: InboundForm = {
  tracking_no: '',
  brand: '',
  sender_name: '',
  sender_phone: '',
  receiver_name: '',
  receiver_phone: '',
  weight: '',
  fee: '',
};

export default function CourierPackages() {
  const [activeTab, setActiveTab] = useState<TabKey>('inbound');
  const [inboundForm, setInboundForm] = useState<InboundForm>(emptyInbound);
  const [outboundTracking, setOutboundTracking] = useState('');
  const [signTracking, setSignTracking] = useState('');
  const [signedBy, setSignedBy] = useState('');
  const [recentPackages, setRecentPackages] = useState<Package[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRecent();
  }, []);

  const fetchRecent = async () => {
    try {
      const res = await api.get<any, { data: PaginatedResult<Package> }>('/packages', {
        params: { page: 1, pageSize: 10, sort: 'created_at:desc' },
      });
      setRecentPackages(res.data.list || []);
    } catch {
      setRecentPackages([]);
    }
  };

  const handleInbound = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/packages/inbound', {
        ...inboundForm,
        weight: Number(inboundForm.weight),
        fee: Number(inboundForm.fee),
      });
      setInboundForm(emptyInbound);
      fetchRecent();
      alert('入库成功');
    } catch (err: any) {
      alert(err.message || '入库失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOutbound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outboundTracking.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/packages/outbound', { tracking_no: outboundTracking.trim() });
      setOutboundTracking('');
      fetchRecent();
      alert('出库成功');
    } catch (err: any) {
      alert(err.message || '出库失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signTracking.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/packages/sign', {
        tracking_no: signTracking.trim(),
        signed_by: signedBy.trim(),
      });
      setSignTracking('');
      setSignedBy('');
      fetchRecent();
      alert('签收成功');
    } catch (err: any) {
      alert(err.message || '签收失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">包裹操作</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={activeTab === tab.key ? 'btn-primary flex items-center gap-2' : 'btn-outline flex items-center gap-2'}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="card mb-6">
        {activeTab === 'inbound' && (
          <form onSubmit={handleInbound} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">快递单号</label>
              <input
                type="text"
                value={inboundForm.tracking_no}
                onChange={e => setInboundForm(f => ({ ...f, tracking_no: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">品牌</label>
              <select
                value={inboundForm.brand}
                onChange={e => setInboundForm(f => ({ ...f, brand: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">请选择品牌</option>
                {Object.entries(BRAND_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">寄件人姓名</label>
              <input
                type="text"
                value={inboundForm.sender_name}
                onChange={e => setInboundForm(f => ({ ...f, sender_name: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">寄件人电话</label>
              <input
                type="text"
                value={inboundForm.sender_phone}
                onChange={e => setInboundForm(f => ({ ...f, sender_phone: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">收件人姓名</label>
              <input
                type="text"
                value={inboundForm.receiver_name}
                onChange={e => setInboundForm(f => ({ ...f, receiver_name: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">收件人电话</label>
              <input
                type="text"
                value={inboundForm.receiver_phone}
                onChange={e => setInboundForm(f => ({ ...f, receiver_phone: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">重量(kg)</label>
              <input
                type="number"
                step="0.01"
                value={inboundForm.weight}
                onChange={e => setInboundForm(f => ({ ...f, weight: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">费用(元)</label>
              <input
                type="number"
                step="0.01"
                value={inboundForm.fee}
                onChange={e => setInboundForm(f => ({ ...f, fee: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div className="col-span-2">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? '提交中...' : '确认入库'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'outbound' && (
          <form onSubmit={handleOutbound} className="max-w-md space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">快递单号</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={outboundTracking}
                  onChange={e => setOutboundTracking(e.target.value)}
                  placeholder="扫描或输入单号"
                  className="input-field pl-9"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-accent flex items-center gap-2" disabled={submitting}>
              <ArrowRight size={16} />
              {submitting ? '出库中...' : '确认出库'}
            </button>
          </form>
        )}

        {activeTab === 'sign' && (
          <form onSubmit={handleSign} className="max-w-md space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">快递单号</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={signTracking}
                  onChange={e => setSignTracking(e.target.value)}
                  placeholder="扫描或输入单号"
                  className="input-field pl-9"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">签收人</label>
              <input
                type="text"
                value={signedBy}
                onChange={e => setSignedBy(e.target.value)}
                placeholder="签收人姓名"
                className="input-field"
                required
              />
            </div>
            <button type="submit" className="btn-success flex items-center gap-2" disabled={submitting}>
              <PenLine size={16} />
              {submitting ? '签收中...' : '确认签收'}
            </button>
          </form>
        )}
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-3">最近操作</h2>
      {recentPackages.length === 0 ? (
        <div className="text-center py-8 text-gray-400">暂无操作记录</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="pb-2 pr-4">单号</th>
                <th className="pb-2 pr-4">品牌</th>
                <th className="pb-2 pr-4">状态</th>
                <th className="pb-2 pr-4">寄件人</th>
                <th className="pb-2 pr-4">收件人</th>
                <th className="pb-2">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {recentPackages.map(pkg => (
                <tr key={pkg.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2.5 pr-4 font-medium text-gray-800">{pkg.tracking_no}</td>
                  <td className="py-2.5 pr-4">{BRAND_MAP[pkg.brand] || pkg.brand}</td>
                  <td className="py-2.5 pr-4">
                    <StatusBadge status={pkg.status} type="package" />
                  </td>
                  <td className="py-2.5 pr-4">{pkg.sender_name}</td>
                  <td className="py-2.5 pr-4">{pkg.receiver_name}</td>
                  <td className="py-2.5 text-gray-500">{pkg.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
