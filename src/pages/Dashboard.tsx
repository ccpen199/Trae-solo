import { useEffect, useState } from 'react';
import { Package, Box, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState<any>({});
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [topParts, setTopParts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, lowStockRes, woStatsRes, supplierRes] = await Promise.all([
        api.get<any>('/dashboard/stats'),
        api.get<any>('/dashboard/low-stock'),
        api.get<any>('/dashboard/work-order-stats'),
        api.get<any>('/dashboard/supplier-quality'),
      ]);
      setStats(statsRes.data);
      setLowStock(lowStockRes.data);
      setTopParts((woStatsRes as any).data.topParts || []);
      setSuppliers(supplierRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const statCards = [
    { label: '备件种类', value: stats.totalParts || 0, icon: Package, color: 'blue' },
    { label: '库存总量', value: stats.totalStock || 0, icon: Box, color: 'green' },
    { label: '库存价值', value: `¥${(stats.stockValue || 0).toFixed(2)}`, icon: DollarSign, color: 'purple' },
    { label: '缺货预警', value: stats.lowStockCount || 0, icon: AlertTriangle, color: 'red' },
    { label: '待入库', value: stats.pendingIn || 0, icon: ArrowDownToLine, color: 'orange' },
    { label: '待出库', value: stats.pendingOut || 0, icon: ArrowUpFromLine, color: 'cyan' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const colors: Record<string, string> = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            purple: 'bg-purple-500',
            red: 'bg-red-500',
            orange: 'bg-orange-500',
            cyan: 'bg-cyan-500',
          };
          return (
            <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`${colors[card.color]} p-3 rounded-lg text-white`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            缺货预警
          </h3>
          <div className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-gray-400 text-center py-4">暂无缺货预警</p>
            ) : (
              lowStock.slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-500 font-medium">{item.current_stock} / {item.safety_stock}</p>
                    <p className="text-sm text-gray-400">当前/安全库存</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">常用备件 TOP10</h3>
          <div className="space-y-3">
            {topParts.length === 0 ? (
              <p className="text-gray-400 text-center py-4">暂无数据</p>
            ) : (
              topParts.slice(0, 8).map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.use_count} 次</p>
                    <p className="text-sm text-gray-400">共 {item.total_qty} 件</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">供应商质量分析</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">供应商</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">交货次数</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">不合格</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">合格率</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">评级</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">{s.name}</td>
                  <td className="py-3 px-4">{s.total_deliveries}</td>
                  <td className="py-3 px-4">
                    <span className={s.failed_count > 0 ? 'text-red-500' : ''}>{s.failed_count}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={s.pass_rate < 90 ? 'text-red-500' : 'text-green-500'}>
                      {s.pass_rate}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((r) => (
                        <span
                          key={r}
                          className={r <= s.rating ? 'text-yellow-400' : 'text-gray-300'}
                        >★</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
