import { useState, useEffect } from 'react';
import { Search, PackagePlus, Filter, X } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { Package, BRAND_MAP, PACKAGE_STATUS_MAP, PACKAGE_TYPE_MAP, PaginatedResult } from '../types';

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

const emptyInboundForm: InboundForm = {
  tracking_no: '',
  brand: '',
  sender_name: '',
  sender_phone: '',
  receiver_name: '',
  receiver_phone: '',
  weight: '',
  fee: '',
};

export default function BranchManager() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [inboundForm, setInboundForm] = useState<InboundForm>(emptyInboundForm);
  const [signModal, setSignModal] = useState<Package | null>(null);
  const [signedBy, setSignedBy] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ total: 0, inboundToday: 0, outboundToday: 0, exceptionCount: 0 });

  const pageSize = 15;

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize };
      if (brandFilter) params.brand = brandFilter;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (keyword) params.keyword = keyword;
      const res = await api.get<any, { data: PaginatedResult<Package> }>('/packages', { params });
      const list = res.data.list || [];
      setPackages(list);
      setTotal(res.data.total || 0);
      computeStats(list);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (list: Package[]) => {
    const total = list.length;
    const inboundToday = list.filter(p => p.status === 'inbound').length;
    const outboundToday = list.filter(p => p.status === 'outbound').length;
    const exceptionCount = list.filter(p => p.status === 'exception').length;
    setStats({ total, inboundToday, outboundToday, exceptionCount });
  };

  useEffect(() => {
    fetchPackages();
  }, [page, brandFilter, statusFilter, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPackages();
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
      setShowInboundModal(false);
      setInboundForm(emptyInboundForm);
      fetchPackages();
    } catch (err: any) {
      alert(err.message || '入库失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSign = async () => {
    if (!signModal || !signedBy.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/packages/sign', {
        tracking_no: signModal.tracking_no,
        signed_by: signedBy.trim(),
      });
      setSignModal(null);
      setSignedBy('');
      fetchPackages();
    } catch (err: any) {
      alert(err.message || '签收失败');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">包裹管理</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowInboundModal(true)}>
          <PackagePlus size={16} />
          入库
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-xs text-gray-500 mb-1">总包裹数</div>
          <div className="text-xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-gray-500 mb-1">今日入库</div>
          <div className="text-xl font-bold text-blue-600">{stats.inboundToday}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-gray-500 mb-1">今日出库</div>
          <div className="text-xl font-bold text-cyan-600">{stats.outboundToday}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-gray-500 mb-1">异常件</div>
          <div className="text-xl font-bold text-red-600">{stats.exceptionCount}</div>
        </div>
      </div>

      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-gray-500 mb-1">搜索</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="单号/寄件人/收件人"
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
          </div>
          <div className="w-36">
            <label className="block text-xs text-gray-500 mb-1">品牌</label>
            <select
              value={brandFilter}
              onChange={e => { setBrandFilter(e.target.value); setPage(1); }}
              className="input-field py-2 text-sm"
            >
              <option value="">全部品牌</option>
              {Object.entries(BRAND_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <label className="block text-xs text-gray-500 mb-1">状态</label>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field py-2 text-sm"
            >
              <option value="">全部状态</option>
              {Object.entries(PACKAGE_STATUS_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <label className="block text-xs text-gray-500 mb-1">类型</label>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="input-field py-2 text-sm"
            >
              <option value="">全部类型</option>
              {Object.entries(PACKAGE_TYPE_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary py-2 text-sm flex items-center gap-1">
            <Filter size={14} />
            筛选
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 pr-3">单号</th>
                  <th className="pb-2 pr-3">品牌</th>
                  <th className="pb-2 pr-3">类型</th>
                  <th className="pb-2 pr-3">状态</th>
                  <th className="pb-2 pr-3">寄件人</th>
                  <th className="pb-2 pr-3">收件人</th>
                  <th className="pb-2 pr-3">重量</th>
                  <th className="pb-2 pr-3">费用</th>
                  <th className="pb-2 pr-3">创建时间</th>
                  <th className="pb-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {packages.map(pkg => (
                  <tr key={pkg.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 pr-3 font-medium text-gray-800">{pkg.tracking_no}</td>
                    <td className="py-2.5 pr-3">{BRAND_MAP[pkg.brand] || pkg.brand}</td>
                    <td className="py-2.5 pr-3">{PACKAGE_TYPE_MAP[pkg.type] || pkg.type}</td>
                    <td className="py-2.5 pr-3"><StatusBadge status={pkg.status} type="package" /></td>
                    <td className="py-2.5 pr-3">{pkg.sender_name}</td>
                    <td className="py-2.5 pr-3">{pkg.receiver_name}</td>
                    <td className="py-2.5 pr-3">{pkg.weight}kg</td>
                    <td className="py-2.5 pr-3">¥{pkg.fee.toFixed(2)}</td>
                    <td className="py-2.5 pr-3 text-gray-500">{pkg.created_at}</td>
                    <td className="py-2.5">
                      {pkg.status === 'outbound' && (
                        <button
                          className="btn-success text-xs px-2 py-1"
                          onClick={() => { setSignModal(pkg); setSignedBy(''); }}
                        >
                          签收
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                上一页
              </button>
              <span className="text-sm text-gray-500">{page} / {totalPages} (共 {total} 条)</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {showInboundModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">包裹入库</h2>
              <button onClick={() => setShowInboundModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInbound} className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">快递单号</label>
                <input type="text" value={inboundForm.tracking_no} onChange={e => setInboundForm(f => ({ ...f, tracking_no: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">品牌</label>
                <select value={inboundForm.brand} onChange={e => setInboundForm(f => ({ ...f, brand: e.target.value }))} className="input-field" required>
                  <option value="">请选择</option>
                  {Object.entries(BRAND_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">寄件人姓名</label>
                <input type="text" value={inboundForm.sender_name} onChange={e => setInboundForm(f => ({ ...f, sender_name: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">寄件人电话</label>
                <input type="text" value={inboundForm.sender_phone} onChange={e => setInboundForm(f => ({ ...f, sender_phone: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">收件人姓名</label>
                <input type="text" value={inboundForm.receiver_name} onChange={e => setInboundForm(f => ({ ...f, receiver_name: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">收件人电话</label>
                <input type="text" value={inboundForm.receiver_phone} onChange={e => setInboundForm(f => ({ ...f, receiver_phone: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">重量(kg)</label>
                <input type="number" step="0.01" value={inboundForm.weight} onChange={e => setInboundForm(f => ({ ...f, weight: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">费用(元)</label>
                <input type="number" step="0.01" value={inboundForm.fee} onChange={e => setInboundForm(f => ({ ...f, fee: e.target.value }))} className="input-field" required />
              </div>
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" className="btn-outline" onClick={() => setShowInboundModal(false)}>取消</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? '提交中...' : '确认入库'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {signModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">签收包裹</h2>
              <button onClick={() => setSignModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">单号: {signModal.tracking_no}</p>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">签收人</label>
              <input type="text" value={signedBy} onChange={e => setSignedBy(e.target.value)} className="input-field" placeholder="签收人姓名" required />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setSignModal(null)}>取消</button>
              <button className="btn-success" onClick={handleSign} disabled={submitting || !signedBy.trim()}>
                {submitting ? '签收中...' : '确认签收'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
