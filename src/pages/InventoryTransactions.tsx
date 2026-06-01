import { useEffect, useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, RotateCcw, Trash2, ArrowLeftRight } from 'lucide-react';
import { api, ApiResponse } from '@/lib/api';

const txnTypeMap: Record<string, { label: string; icon: any; color: string }> = {
  stock_in: { label: '入库', icon: ArrowDownRight, color: 'text-green-600 bg-green-50' },
  stock_out: { label: '出库', icon: ArrowUpRight, color: 'text-blue-600 bg-blue-50' },
  return: { label: '退回', icon: RotateCcw, color: 'text-orange-600 bg-orange-50' },
  scrap: { label: '报废', icon: Trash2, color: 'text-red-600 bg-red-50' },
  transfer: { label: '调拨', icon: ArrowLeftRight, color: 'text-purple-600 bg-purple-50' },
};

export default function InventoryTransactions() {
  const [list, setList] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      const res = await api.get<ApiResponse<any[]>>('/inventory/transactions' + (filter !== 'all' ? `?type=${filter}` : ''));
      setList(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredList = filter === 'all' ? list : list.filter(item => item.txn_type === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {['all', 'stock_in', 'stock_out', 'return', 'scrap', 'transfer'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                filter === type ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              {type === 'all' ? '全部' : txnTypeMap[type]?.label || type}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索流水..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">流水号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">类型</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">备件</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">数量</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">库位</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">关联单号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">操作人</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">时间</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((item) => {
              const typeInfo = txnTypeMap[item.txn_type] || { label: item.txn_type, icon: ArrowDownRight, color: 'text-gray-600 bg-gray-50' };
              const Icon = typeInfo.icon;
              return (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.txn_no}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm flex items-center gap-1 w-fit ${typeInfo.color}`}>
                      <Icon size={14} />
                      {typeInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.part_name}</div>
                    <div className="text-xs text-gray-400">{item.sku || ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={item.change_qty > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {item.change_qty > 0 ? '+' : ''}{item.change_qty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.location_name || '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.ref_no || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{item.operator_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{item.created_at}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredList.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            暂无流水记录
          </div>
        )}
      </div>
    </div>
  );
}
