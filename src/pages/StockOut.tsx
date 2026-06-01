import { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { api, StockOut as StockOutType, ApiResponse } from '@/lib/api';

export default function StockOut() {
  const [list, setList] = useState<StockOutType[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get<ApiResponse<StockOutType[]>>('/stock-out');
      setList(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/stock-out/${id}/approve`, {});
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.post(`/stock-out/${id}/reject`, {});
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, { text: string; className: string }> = {
      pending: { text: '待审批', className: 'bg-yellow-100 text-yellow-700' },
      completed: { text: '已出库', className: 'bg-green-100 text-green-700' },
      rejected: { text: '已拒绝', className: 'bg-red-100 text-red-700' },
    };
    return map[status] || { text: status, className: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索出库单/备件..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">出库单号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">关联工单</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">备件</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">库位</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">批次</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">数量</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">工程师</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => {
              const statusInfo = getStatusText(item.status);
              return (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{item.out_no}</td>
                  <td className="px-4 py-3">{item.wo_no || '-'}</td>
                  <td className="px-4 py-3">
                    <div>{item.part_name}</div>
                    <div className="text-xs text-gray-400">{item.sku}</div>
                  </td>
                  <td className="px-4 py-3">{item.location_name}</td>
                  <td className="px-4 py-3 font-mono text-sm">{item.batch_no || '-'}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">{item.engineer_name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${statusInfo.className}`}>
                      {statusInfo.text}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="text-green-600 hover:text-green-800"
                            title="审批通过"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="text-red-600 hover:text-red-800"
                            title="拒绝"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            暂无出库记录，工程师可在工单中申请领用备件
          </div>
        )}
      </div>
    </div>
  );
}
