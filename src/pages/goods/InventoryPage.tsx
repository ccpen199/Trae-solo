import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Search, Package, AlertTriangle, TrendingUp, Download, RefreshCw, Filter, Plus } from 'lucide-react';
import { getInventory, getInventorySummary, updateInventory } from '../../services/api';
import type { InventoryItem } from '../../../shared/types';

const warehouseColors: Record<string, string> = {
  '北京仓': '#059669',
  '上海仓': '#2563eb',
  '广州仓': '#f59e0b',
  '成都仓': '#8b5cf6',
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await getInventory();
      if (res.code === 0) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjust = async (item: InventoryItem, newStock: number) => {
    try {
      const res = await updateInventory(item.id, { stock: newStock });
      if (res.code === 0) {
        fetchInventory();
      }
    } catch (err) {
      console.error('Failed to update inventory:', err);
    }
  };

  const warehouses = ['all', '北京仓', '上海仓', '广州仓', '成都仓'];

  const summaryOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['入库量', '出库量'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['1日', '5日', '10日', '15日', '20日', '25日', '30日'],
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        name: '入库量',
        type: 'bar',
        data: [1200, 800, 1500, 900, 1100, 600, 1400],
        itemStyle: { color: '#059669', borderRadius: [4, 4, 0, 0] },
        barWidth: 12,
      },
      {
        name: '出库量',
        type: 'bar',
        data: [800, 600, 1100, 700, 900, 500, 1200],
        itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
        barWidth: 12,
      }
    ]
  };

  const warehouseOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            formatter: '{b}\n{c}件'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 12580, name: '北京仓', itemStyle: { color: '#059669' } },
          { value: 9876, name: '上海仓', itemStyle: { color: '#2563eb' } },
          { value: 8432, name: '广州仓', itemStyle: { color: '#f59e0b' } },
          { value: 6210, name: '成都仓', itemStyle: { color: '#8b5cf6' } },
        ]
      }
    ]
  };

  const filteredItems = items.filter(item => {
    const matchKeyword = !searchKeyword || item.productName.includes(searchKeyword);
    const matchWarehouse = selectedWarehouse === 'all' || item.warehouse === selectedWarehouse;
    const matchLowStock = !showLowStock || item.stock < item.minStock;
    return matchKeyword && matchWarehouse && matchLowStock;
  });

  const totalValue = items.reduce((sum, item) => sum + item.stock * item.price, 0);
  const lowStockCount = items.filter(item => item.stock < item.minStock).length;

  const stats = [
    { label: '总库存量', value: items.reduce((sum, i) => sum + i.stock, 0).toLocaleString(), icon: Package, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '库存总价值', value: `¥${(totalValue / 10000).toFixed(1)}万`, icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-100' },
    { label: '库存预警', value: lowStockCount, icon: AlertTriangle, color: 'text-danger-600', bg: 'bg-danger-100' },
    { label: '仓库数量', value: 4, icon: Package, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 animate-number">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">近30日出入库趋势</h3>
            <button onClick={fetchInventory} className="p-2 hover:bg-gray-100 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <ReactECharts option={summaryOption} style={{ height: 250 }} />
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">仓库库存分布</h3>
          <ReactECharts option={warehouseOption} style={{ height: 250 }} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索产品..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input pl-10 w-64"
            />
          </div>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="input w-40"
          >
            {warehouses.map(w => (
              <option key={w} value={w}>{w === 'all' ? '全部仓库' : w}</option>
            ))}
          </select>
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showLowStock ? 'bg-danger-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            仅显示预警
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            导出
          </button>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            入库登记
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">产品信息</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">所在仓库</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">当前库存</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">安全库存</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">库存价值</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">状态</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                        📦
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{
                      backgroundColor: `${warehouseColors[item.warehouse] || '#6b7280'}20`,
                      color: warehouseColors[item.warehouse] || '#6b7280'
                    }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: warehouseColors[item.warehouse] || '#6b7280' }}></span>
                      {item.warehouse}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{item.stock}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{item.minStock}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      ¥{(item.stock * item.price).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.stock < item.minStock ? (
                      <span className="flex items-center gap-1 text-xs text-danger-600 bg-danger-50 px-2 py-1 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        库存不足
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <Package className="w-3 h-3" />
                        正常
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleStockAdjust(item, item.stock + 10)}
                        className="px-3 py-1 text-xs bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100"
                      >
                        +入库
                      </button>
                      <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                        详情
                      </button>
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
