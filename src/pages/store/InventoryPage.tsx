import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  Search,
  Plus,
  ChevronRight,
  History,
  Barcode,
  TrendingDown,
  TrendingUp,
  Filter,
  Download,
  Eye,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge, Tag } from '@/components/common/BadgeTagAvatar';
import { Tabs, Progress } from '@/components/common/UIComponents';
import { useInventoryStore } from '@/stores/inventoryStore';
import { cn, formatCurrency } from '@/utils/common';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function InventoryPage() {
  const { inventoryItems, lowStockItems, batches, fetchInventoryItems, fetchLowStockItems, fetchBatches, updateStock, isLoading } = useInventoryStore();
  const [activeTab, setActiveTab] = useState('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  useEffect(() => {
    fetchInventoryItems();
    fetchLowStockItems();
    fetchBatches();
  }, [fetchInventoryItems, fetchLowStockItems, fetchBatches]);

  const categories = [
    { id: 'medical', name: '药品', icon: '💊' },
    { id: 'nutrition', name: '营养品', icon: '🌿' },
    { id: 'supplies', name: '耗材', icon: '🧴' },
    { id: 'equipment', name: '设备', icon: '⚙️' },
  ];

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getItemBatches = (itemId: string) => {
    return batches.filter((b) => b.inventoryItemId === itemId);
  };

  const handleStockIn = (itemId: string, quantity: number, batchNo: string) => {
    updateStock(itemId, 'in', quantity, batchNo);
    setShowStockInModal(false);
  };

  const stockStatusColors: Record<string, string> = {
    normal: 'bg-green-100 text-green-700',
    low: 'bg-yellow-100 text-yellow-700',
    out: 'bg-red-100 text-red-700',
  };

  const stockStatusLabels: Record<string, string> = {
    normal: '库存充足',
    low: '库存预警',
    out: '缺货',
  };

  const totalValue = inventoryItems.reduce((sum, item) => sum + item.currentStock * item.costPrice, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">库存管理</h1>
          <p className="text-neutral-500 mt-1">库存预警与耗材批次追溯</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            导出报表
          </Button>
          <Button onClick={() => setShowStockInModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            入库登记
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '库存总价值', value: formatCurrency(totalValue), icon: Package, color: 'from-primary-500 to-primary-600', trend: '+12.5%' },
          { label: '库存预警', value: lowStockItems.length, icon: AlertTriangle, color: 'from-amber-500 to-orange-500', trend: '需补货' },
          { label: '库存品种', value: inventoryItems.length, icon: Barcode, color: 'from-mint-500 to-green-500', trend: '+2' },
          { label: '在途批次', value: batches.filter((b) => b.status === 'in_transit').length, icon: History, color: 'from-accent-500 to-accent-400', trend: '配送中' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hoverable>
              <CardContent>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className={cn(
                    'text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1',
                    stat.trend.startsWith('+') ? 'bg-green-100 text-green-600' :
                    stat.trend.startsWith('-') ? 'bg-red-100 text-red-600' :
                    'bg-amber-100 text-amber-600'
                  )}>
                    {stat.trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> :
                     stat.trend.startsWith('-') ? <TrendingDown className="w-3 h-3" /> : null}
                    {stat.trend}
                  </span>
                </div>
                <p className="text-sm text-neutral-500">{stat.label}</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {lowStockItems.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-amber-800">库存预警提醒</h4>
                <p className="text-sm text-amber-600">
                  以下物品库存不足，请及时补货：
                  {lowStockItems.slice(0, 3).map((item) => (
                    <Tag key={item.id} variant="warning" className="ml-2" size="sm">
                      {item.name} (剩余{item.currentStock})
                    </Tag>
                  ))}
                  {lowStockItems.length > 3 && (
                    <span className="ml-2 text-amber-600">等{lowStockItems.length}项</span>
                  )}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('low_stock')}>
                查看全部
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card padded={false}>
        <Tabs
          tabs={[
            { id: 'inventory', label: '库存列表' },
            { id: 'low_stock', label: `库存预警 (${lowStockItems.length})` },
            { id: 'batches', label: '批次追溯' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="px-6"
        />

        <div className="p-6">
          {activeTab !== 'batches' && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索物品名称、条码..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                        filterCategory === cat.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      )}
                    >
                      <span>{cat.icon}</span>
                      {cat.name}
                    </button>
                  ))}
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  更多筛选
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-neutral-500 border-b border-neutral-100">
                      <th className="pb-3 font-medium">物品信息</th>
                      <th className="pb-3 font-medium">分类</th>
                      <th className="pb-3 font-medium">当前库存</th>
                      <th className="pb-3 font-medium">库存状态</th>
                      <th className="pb-3 font-medium">单价</th>
                      <th className="pb-3 font-medium">批次数量</th>
                      <th className="pb-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'low_stock' ? lowStockItems : filteredItems).map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="w-12 h-12 rounded-xl object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setViewerImage(item.images[0])}
                            />
                            <div>
                              <p className="font-medium text-neutral-900">{item.name}</p>
                              <p className="text-xs text-neutral-500 flex items-center gap-1">
                                <Barcode className="w-3 h-3" />
                                {item.sku}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <Tag variant="neutral" size="sm">
                            {categories.find((c) => c.id === item.category)?.icon} {item.category}
                          </Tag>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="font-semibold text-neutral-900">{item.currentStock} {item.unit}</p>
                            <p className="text-xs text-neutral-500">安全库存: {item.minStock}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge className={stockStatusColors[item.stockStatus]} size="sm">
                            {stockStatusLabels[item.stockStatus]}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="font-medium text-neutral-900">{formatCurrency(item.sellingPrice)}</p>
                            <p className="text-xs text-neutral-400">成本: {formatCurrency(item.costPrice)}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-neutral-600">{getItemBatches(item.id).length} 批</span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedItem(item.id)}>
                              <Eye className="w-4 h-4 mr-1" />
                              批次
                            </Button>
                            <Button variant="ghost" size="sm">
                              <FileText className="w-4 h-4 mr-1" />
                              记录
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'batches' && (
            <div className="space-y-4">
              {batches.map((batch) => {
                const item = inventoryItems.find((i) => i.id === batch.inventoryItemId);
                return (
                  <motion.div
                    key={batch.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                    className="p-4 bg-neutral-50 rounded-xl hover:bg-white hover:shadow-soft transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {item && (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-neutral-900">{item?.name}</h4>
                            <Badge variant={
                              batch.status === 'in_stock' ? 'success' :
                              batch.status === 'in_transit' ? 'info' :
                              batch.status === 'expired' ? 'danger' : 'warning'
                            } size="sm">
                              {batch.status === 'in_stock' ? '在库' :
                               batch.status === 'in_transit' ? '在途' :
                               batch.status === 'expired' ? '已过期' : '已用完'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-neutral-500">
                            <span className="flex items-center gap-1">
                              <Barcode className="w-4 h-4" />
                              批次号: {batch.batchNo}
                            </span>
                            <span>数量: {batch.remainingQuantity}/{batch.initialQuantity}</span>
                            <span>有效期: {format(new Date(batch.expiryDate), 'yyyy-MM-dd', { locale: zhCN })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-neutral-500">入库时间</p>
                        <p className="font-medium text-neutral-900">
                          {format(new Date(batch.receivedDate), 'yyyy-MM-dd', { locale: zhCN })}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-neutral-200">
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span>供应商: {batch.supplier}</span>
                        <span>·</span>
                        <span>采购单号: {batch.purchaseOrderNo}</span>
                        <span>·</span>
                        <span>经办人: {batch.receivedBy}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {showStockInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowStockInModal(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-[480px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-semibold mb-6">入库登记</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">选择物品</label>
                <select className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none">
                  <option value="">请选择</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">入库数量</label>
                  <input
                    type="number"
                    placeholder="请输入数量"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">批次号</label>
                  <input
                    type="text"
                    placeholder="自动生成或手动输入"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">有效期</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">供应商</label>
                  <input
                    type="text"
                    placeholder="供应商名称"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowStockInModal(false)}>
                  取消
                </Button>
                <Button className="flex-1" onClick={() => handleStockIn('1', 10, 'BATCH-001')}>
                  确认入库
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {viewerImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setViewerImage(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative max-w-4xl max-h-[80vh]"
          >
            <img src={viewerImage} alt="预览" className="max-w-full max-h-[80vh] rounded-2xl" />
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              onClick={() => setViewerImage(null)}
            >
              ✕
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
