import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaseApi } from '../utils/api';
import {
  LEASE_STATUS_MAP, LEASE_STATUS_COLOR,
  formatDate
} from '../utils/constants';
import { KeyRound, Eye, User, Calendar, AlertTriangle } from 'lucide-react';

const LeaseList: React.FC = () => {
  const navigate = useNavigate();
  const [leases, setLeases] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLeases(); }, [page, statusFilter]);

  const loadLeases = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const res = await leaseApi.list(params);
      setLeases(res.list);
      setTotal(res.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getExpiryWarning = (lease: any) => {
    const end = new Date(lease.end_date);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: '已过期', color: 'text-red-600', bg: 'bg-red-50' };
    if (days <= 30) return { text: `还有 ${days} 天到期`, color: 'text-accent-600', bg: 'bg-accent-50' };
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">租约管理</h2>
          <p className="text-sm text-gray-500">租约周期、租金划扣、押金托管一体化管理</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{total}</div>
              <div className="text-sm text-gray-500">租约总数</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{leases.filter(l => l.status === 'active').length}</div>
              <div className="text-sm text-gray-500">履行中</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{leases.filter(l => l.status === 'expired').length}</div>
              <div className="text-sm text-gray-500">已到期</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                {leases.filter(l => {
                  const end = new Date(l.end_date);
                  const now = new Date();
                  const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return days > 0 && days <= 30 && l.status === 'active';
                }).length}
              </div>
              <div className="text-sm text-gray-500">30天内到期</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <span className="text-sm text-gray-500">状态筛选：</span>
          <div className="flex gap-2">
            <button onClick={() => setStatusFilter('')} className={`px-3 py-1.5 text-sm rounded-lg ${!statusFilter ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>全部</button>
            {Object.entries(LEASE_STATUS_MAP).map(([k, v]) => (
              <button key={k} onClick={() => setStatusFilter(k)} className={`px-3 py-1.5 text-sm rounded-lg ${statusFilter === k ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{v}</button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">房源</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">租客</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">租期</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">月租金</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">押金</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">押金状态</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leases.map(lease => {
                const warning = getExpiryWarning(lease);
                return (
                  <tr key={lease.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800">{lease.property_name}</div>
                      <div className="text-xs text-gray-500">{lease.property_address}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-gray-800">{lease.tenant_name}</div>
                      <div className="text-xs text-gray-500">{lease.tenant_phone}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-gray-800">{formatDate(lease.start_date)} ~ {formatDate(lease.end_date)}</div>
                      {warning && (
                        <div className={`text-xs mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${warning.bg} ${warning.color}`}>
                          <AlertTriangle className="w-3 h-3" /> {warning.text}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-800">¥ {lease.monthly_rent.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-800">¥ {lease.deposit.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        lease.deposit_status === 'refunded' ? 'bg-green-100 text-green-700' :
                        lease.deposit_status === 'deducted' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {({ held: '托管中', partial_refund: '部分退还', refunded: '已退还', deducted: '已扣除' } as any)[lease.deposit_status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${LEASE_STATUS_COLOR[lease.status]}`}>
                        {LEASE_STATUS_MAP[lease.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => navigate(`/leases/${lease.id}`)}
                        className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" /> 详情
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && leases.length === 0 && (
          <div className="p-12 text-center text-gray-500">暂无租约记录</div>
        )}
      </div>
    </div>
  );
};

export default LeaseList;
