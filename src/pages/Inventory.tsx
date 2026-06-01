import { useEffect, useState } from 'react';
import { Search, Download } from 'lucide-react';
import { api, StockItem, Transaction, ApiResponse } from '@/lib/api';

export default function Inventory() {
  const [tab, setTab] = useState<'stock' | 'transactions'>('stock');
  const [stock, setStock] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (tab === 'stock') {
      loadStock();
    } else {
      loadTransactions();
    }
  }, [tab, page]);

  const loadStock = async () => {
    try {
      const res = await api.get<ApiResponse<StockItem[]>>(`/inventory/stock?page=${page}&pageSize=20`);
      setStock(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await api.get<ApiResponse<Transaction[]>>(`/inventory/transactions?page=${page}&pageSize=20`);
      setTransactions(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const getTransTypeText = (type: string) => {
    const map: Record<string, { text: string; className: string }> = {
      in: { text: '入库', className: 'bg-green-100 text-green-700' },
      out: { text: '出库', className: 'bg-red-100 text-red-700' },
      return: { text: '退回', className: 'bg-blue-100 text-blue-700' },
      scrap: { text: '报废', className: 'bg-orange-100 text-orange-700' },
      transfer_in: { text: '调拨入', className: 'bg-purple-100 text-purple-700' },
      transfer_out: { text: '调拨出', className: 'bg-pink-100 text-pink-700' },
      take: { text: '盘点', className: 'bg-gray-100 text-gray-700' },
    };
    return map[type] || { text: type, className: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 bg-white rounded-lg p-1">
          <button
            onClick={() => { setTab('stock'); setPage(1); }}
            className={`px-4 py-2 rounded-md transition-colors ${
              tab === 'stock' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            当前库存
          </button>
          <button
            onClick={() => { setTab('transactions'); setPage(1); }}
            className={`px-4 py-2 rounded-md transition-colors ${
              tab === 'transactions' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            库存流水
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download size={16} />
            导出
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {tab === 'stock' ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">备件</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">库位</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">批次号</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">总数量</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">可用数量</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">单价</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">价值</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">到期日</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>{item.part_name}</div>
                    <div className="text-xs text-gray-400">{item.sku}</div>
                  </td>
                  <td className="px-4 py-3">{item.location_name}</td>
                  <td className="px-4 py-3 font-mono text-sm">{item.batch_no || '-'}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">
                    <span className={item.available_qty < 10 ? 'text-red-500 font-medium' : ''}>
                      {item.available_qty}
                    </span>
                  </td>
                  <td className="px-4 py-3">¥{item.unit_price.toFixed(2)}</td>
                  <td className="px-4 py-3 font-medium">
                    ¥{(item.available_qty * item.unit_price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">{item.expire_date || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">流水号</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">类型</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">关联单号</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">备件</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">库位</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">批次</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">数量变动</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">备注</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">时间</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => {
                const typeInfo = getTransTypeText(item.trans_type);
                return (
                  <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{item.trans_no}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm ${typeInfo.className}`}>
                        {typeInfo.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{item.ref_no || '-'}</td>
                    <td className="px-4 py-3">
                      <div>{item.part_name}</div>
                    </td>
                    <td className="px-4 py-3">{item.location_name || '-'}</td>
                    <td className="px-4 py-3 font-mono text-sm">{item.batch_no || '-'}</td>
                    <td className={`px-4 py-3 font-medium ${
                      item.qty_change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.qty_change > 0 ? '+' : ''}{item.qty_change}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {item.remark || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {item.created_at}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {((tab === 'stock' && stock.length === 0) ||
          (tab === 'transactions' && transactions.length === 0)) && (
          <div className="text-center py-12 text-gray-400">
            暂无数据
          </div>
        )}
      </div>
    </div>
  );
}
