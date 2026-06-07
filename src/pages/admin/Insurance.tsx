import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Shield, Plus } from 'lucide-react';

interface Policy {
  id: number;
  policy_number: string;
  type: string;
  order_id: number;
  premium: number;
  status: 'active' | 'pending' | 'expired' | 'claimed';
}

const statusLabels: Record<string, string> = {
  active: '生效中', pending: '待生效', expired: '已过期', claimed: '已理赔',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-gray-100 text-gray-600',
  claimed: 'bg-red-100 text-red-700',
};

export default function Insurance() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Policy[]>('/admin/insurance')
      .then(setPolicies)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAutoInsure = async () => {
    try {
      await api('/admin/insurance/auto-insure', { method: 'POST' });
      const data = await api<Policy[]>('/admin/insurance');
      setPolicies(data);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1E293B]">保险管理</h1>
        <button onClick={handleAutoInsure} className="flex items-center gap-2 bg-[#0F6CBD] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0D5DA8]">
          <Plus className="w-4 h-4" /> 自动投保
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (<div key={i} className="h-10 bg-gray-200 rounded" />))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">保单号</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">类型</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">订单ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">保费</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
              </tr>
            </thead>
            <tbody>
              {policies.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">暂无保险记录</td></tr>
              ) : (
                policies.map((policy) => (
                  <tr key={policy.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{policy.policy_number}</td>
                    <td className="py-3 px-4 flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-gray-400" />{policy.type}</td>
                    <td className="py-3 px-4 text-gray-500">#{policy.order_id}</td>
                    <td className="py-3 px-4">¥{policy.premium}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[policy.status]}`}>
                        {statusLabels[policy.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
