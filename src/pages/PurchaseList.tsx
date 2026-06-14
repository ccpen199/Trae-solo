import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  Trash2,
  Download,
  ChevronDown,
  MapPin,
  Phone,
  Package,
  Calculator,
  Plus,
  Check,
  Star,
  ExternalLink,
  Home,
  ChevronRight,
  Minus,
  X,
} from 'lucide-react';
import { mockMaterials } from '@/mock/data';
import { useAppStore } from '@/store';
import type { Material, LocalSupplier } from '@shared/types';

const CATEGORIES = ['全部', '瓷砖', '地板', '卫浴', '橱柜', '门窗', '乳胶漆'];

interface TableRowItem {
  material: Material;
  quantity: number;
  selected: boolean;
  expanded: boolean;
}

function getBestPrice(material: Material): { price: number; channel: 'jd' | 'tmall' | 'local'; supplier?: LocalSupplier } {
  const prices: Array<{ price: number; channel: 'jd' | 'tmall' | 'local'; supplier?: LocalSupplier }> = [];
  if (material.jdPrice) prices.push({ price: material.jdPrice, channel: 'jd' });
  if (material.tmallPrice) prices.push({ price: material.tmallPrice, channel: 'tmall' });
  if (material.localSuppliers && material.localSuppliers.length > 0) {
    const minLocal = material.localSuppliers.reduce((min, s) => (s.price < min.price ? s : min), material.localSuppliers[0]);
    prices.push({ price: minLocal.price, channel: 'local', supplier: minLocal });
  }
  return prices.reduce((best, p) => (p.price < best.price ? p : best), prices[0]);
}

function getLocalBestSupplier(material: Material): LocalSupplier | null {
  if (!material.localSuppliers || material.localSuppliers.length === 0) return null;
  return material.localSuppliers.reduce((min, s) => (s.price < min.price ? s : min), material.localSuppliers[0]);
}

export default function PurchaseList() {
  const { addToPurchaseList, purchaseList } = useAppStore();

  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tableItems, setTableItems] = useState<TableRowItem[]>(() =>
    mockMaterials.map((m) => ({
      material: m,
      quantity: 1,
      selected: false,
      expanded: false,
    }))
  );
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcArea, setCalcArea] = useState('');
  const [calcDoors, setCalcDoors] = useState('');
  const [calcWindows, setCalcWindows] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const filteredItems = useMemo(() => {
    return tableItems.filter((item) => {
      const matchCategory = activeCategory === '全部' || item.material.category === activeCategory;
      const keyword = searchKeyword.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        item.material.name.toLowerCase().includes(keyword) ||
        item.material.brand.toLowerCase().includes(keyword) ||
        (item.material.model || '').toLowerCase().includes(keyword);
      return matchCategory && matchSearch;
    });
  }, [tableItems, activeCategory, searchKeyword]);

  const allSelected = filteredItems.length > 0 && filteredItems.every((i) => i.selected);
  const selectedCount = filteredItems.filter((i) => i.selected).length;

  const updateItem = (id: string, patch: Partial<TableRowItem>) => {
    setTableItems((prev) => prev.map((it) => (it.material.id === id ? { ...it, ...patch } : it)));
  };

  const toggleSelectAll = () => {
    const newSelected = !allSelected;
    const filteredIds = new Set(filteredItems.map((i) => i.material.id));
    setTableItems((prev) =>
      prev.map((it) => (filteredIds.has(it.material.id) ? { ...it, selected: newSelected } : it))
    );
  };

  const handleBatchDelete = () => {
    if (selectedCount === 0) return;
    const keepIds = new Set(filteredItems.filter((i) => !i.selected).map((i) => i.material.id));
    setTableItems((prev) => prev.filter((it) => keepIds.has(it.material.id) || !filteredItems.some((f) => f.material.id === it.material.id)));
    showToast(`已删除 ${selectedCount} 项商品`);
  };

  const handleExport = () => {
    const selected = tableItems.filter((i) => i.selected);
    const data = selected.length > 0 ? selected : tableItems;
    const headers = ['商品名称', '品牌', '型号', '分类', '规格', '用量', '京东价', '天猫价', '本地最优价'];
    const rows = data.map((it) => {
      const best = getBestPrice(it.material);
      return [
        it.material.name,
        it.material.brand,
        it.material.model || '',
        it.material.category,
        it.material.specs || '',
        `${it.quantity}${it.material.unit}`,
        it.material.jdPrice ? `¥${it.material.jdPrice}` : '-',
        it.material.tmallPrice ? `¥${it.material.tmallPrice}` : '-',
        `¥${best.price}`,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '采购清单比价.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('导出成功');
  };

  const handleAddToList = (item: TableRowItem) => {
    addToPurchaseList({
      id: item.material.id,
      materialId: item.material.id,
      name: item.material.name,
      brand: item.material.brand,
      model: item.material.model,
      quantity: item.quantity,
      unit: item.material.unit,
    });
    showToast(`已添加 ${item.material.name} 到采购清单`);
  };

  const handleAddCalcResult = (category: string, qty: number, unit: string) => {
    const mat = mockMaterials.find((m) => m.category === category);
    if (!mat) return;
    addToPurchaseList({
      id: mat.id,
      materialId: mat.id,
      name: mat.name,
      brand: mat.brand,
      model: mat.model,
      quantity: qty,
      unit,
    });
    showToast(`已添加计算结果到采购清单`);
  };

  const calcResults = useMemo(() => {
    const area = parseFloat(calcArea) || 0;
    const doors = parseInt(calcDoors) || 0;
    const windows = parseInt(calcWindows) || 0;
    if (area <= 0) return null;
    const tileQty = Math.ceil((area * 1.1) / 0.64);
    const floorQty = Math.ceil(area * 1.05);
    const wallArea = Math.max(0, area * 2.5 - doors * 1.8 - windows * 1.5);
    const paintQty = Math.ceil(wallArea / 35);
    return { tileQty, floorQty, paintQty, wallArea };
  }, [calcArea, calcDoors, calcWindows]);

  const summary = useMemo(() => {
    const items = tableItems.filter((i) => i.selected);
    const data = items.length > 0 ? items : tableItems;
    let jdTotal = 0;
    let tmallTotal = 0;
    let localTotal = 0;
    let bestTotal = 0;
    let maxTotal = 0;
    data.forEach((it) => {
      const qty = it.quantity;
      const jd = it.material.jdPrice || 0;
      const tmall = it.material.tmallPrice || 0;
      const localSup = getLocalBestSupplier(it.material);
      const local = localSup?.price || 0;
      jdTotal += jd * qty;
      tmallTotal += tmall * qty;
      localTotal += local * qty;
      const best = getBestPrice(it.material).price;
      bestTotal += best * qty;
      const prices = [jd, tmall, local].filter((p) => p > 0);
      maxTotal += (prices.length > 0 ? Math.max(...prices) : 0) * qty;
    });
    return {
      totalCount: tableItems.length,
      selectedCount: tableItems.filter((i) => i.selected).length,
      jdTotal,
      tmallTotal,
      localTotal,
      bestTotal,
      saved: Math.max(0, maxTotal - bestTotal),
    };
  }, [tableItems]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        <nav className="flex items-center text-sm text-gray-500 mb-3">
          <Link to="/" className="flex items-center hover:text-primary transition-colors">
            <Home className="w-4 h-4 mr-1" />
            首页
          </Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">我的采购清单</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-heading flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-teal-700" />
              我的采购清单
            </h1>
            <p className="text-gray-500">多渠道一键比价，智能推荐最优采购方案</p>
          </div>
          <button
            onClick={() => setShowCalculator(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <Calculator className="w-5 h-5 text-orange-500" />
            <span className="font-medium">材料用量计算器</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeCategory === cat
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索商品名称、品牌、型号..."
                  className="pl-10 pr-4 py-2 w-72 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <button
                    onClick={toggleSelectAll}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      allSelected
                        ? 'bg-teal-700 border-teal-700 text-white'
                        : 'border-gray-300 hover:border-teal-700'
                    }`}
                  >
                    {allSelected && <Check className="w-3 h-3" />}
                  </button>
                  <span className="text-sm text-gray-600">
                    全选 {selectedCount > 0 && <span className="text-teal-700 font-medium">（已选 {selectedCount}）</span>}
                  </span>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBatchDelete}
                  disabled={selectedCount === 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600"
                >
                  <Trash2 className="w-4 h-4" />
                  批量删除
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  导出
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <span className="sr-only">选择</span>
                  </th>
                  <th className="px-4 py-3 text-left w-24">商品图片</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">名称/品牌型号</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-20">分类</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-44">规格参数</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-32">用量</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-32">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-4 h-4 bg-red-500 text-white text-xs rounded flex items-center justify-center font-bold">京</span>
                      京东价
                    </span>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-32">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-4 h-4 bg-orange-500 text-white text-xs rounded flex items-center justify-center font-bold">猫</span>
                      天猫价
                    </span>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-36">本地市场价</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-44">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => {
                  const best = getBestPrice(item.material);
                  const localBest = getLocalBestSupplier(item.material);
                  const jdIsBest = best.channel === 'jd';
                  const tmallIsBest = best.channel === 'tmall';
                  const localIsBest = best.channel === 'local';

                  return (
                    <>
                      <tr key={item.material.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <button
                            onClick={() => updateItem(item.material.id, { selected: !item.selected })}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              item.selected
                                ? 'bg-teal-700 border-teal-700 text-white'
                                : 'border-gray-300 hover:border-teal-700'
                            }`}
                          >
                            {item.selected && <Check className="w-3 h-3" />}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            {item.material.image ? (
                              <img
                                src={item.material.image}
                                alt={item.material.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-900 mb-1">{item.material.name}</div>
                          <div className="text-sm text-gray-500">
                            <span className="text-orange-500 font-medium">{item.material.brand}</span>
                            {item.material.model && <span className="ml-2">· {item.material.model}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-block px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-md">
                            {item.material.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{item.material.specs || '-'}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                              <button
                                onClick={() =>
                                  updateItem(item.material.id, {
                                    quantity: Math.max(1, item.quantity - 1),
                                  })
                                }
                                className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3 py-1.5 text-center font-medium min-w-[40px] text-sm border-x border-gray-200">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateItem(item.material.id, { quantity: item.quantity + 1 })}
                                className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="ml-2 text-sm text-gray-500">{item.material.unit}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {item.material.jdPrice ? (
                            <div
                              className={`inline-flex flex-col items-center px-3 py-2 rounded-lg ${
                                jdIsBest ? 'bg-emerald-50 ring-2 ring-emerald-200' : ''
                              }`}
                            >
                              <div className={`font-bold ${jdIsBest ? 'text-emerald-600' : 'text-gray-800'}`}>
                                ¥{item.material.jdPrice.toLocaleString()}
                              </div>
                              {jdIsBest && (
                                <span className="inline-flex items-center gap-0.5 mt-0.5 text-xs font-medium text-emerald-600">
                                  <Star className="w-3 h-3 fill-current" />
                                  最优价
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {item.material.tmallPrice ? (
                            <div
                              className={`inline-flex flex-col items-center px-3 py-2 rounded-lg ${
                                tmallIsBest ? 'bg-emerald-50 ring-2 ring-emerald-200' : ''
                              }`}
                            >
                              <div className={`font-bold ${tmallIsBest ? 'text-emerald-600' : 'text-gray-800'}`}>
                                ¥{item.material.tmallPrice.toLocaleString()}
                              </div>
                              {tmallIsBest && (
                                <span className="inline-flex items-center gap-0.5 mt-0.5 text-xs font-medium text-emerald-600">
                                  <Star className="w-3 h-3 fill-current" />
                                  最优价
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {localBest ? (
                            <div
                              className={`inline-flex flex-col items-center px-3 py-2 rounded-lg cursor-pointer ${
                                localIsBest ? 'bg-emerald-50 ring-2 ring-emerald-200' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => updateItem(item.material.id, { expanded: !item.expanded })}
                            >
                              <div className={`font-bold ${localIsBest ? 'text-emerald-600' : 'text-gray-800'}`}>
                                ¥{localBest.price.toLocaleString()}
                              </div>
                              <span className="inline-flex items-center gap-0.5 mt-0.5 text-xs text-gray-500">
                                {localIsBest && (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium mr-1">
                                    <Star className="w-3 h-3 fill-current" />
                                    最优
                                  </span>
                                )}
                                <ChevronDown
                                  className={`w-3 h-3 transition-transform ${item.expanded ? 'rotate-180' : ''}`}
                                />
                                {item.material.localSuppliers?.length || 0}家门店
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleAddToList(item)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              加入清单
                            </button>
                            <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" />
                              详情
                            </button>
                            <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors">
                              替换
                            </button>
                          </div>
                        </td>
                      </tr>
                      {item.expanded && item.material.localSuppliers && item.material.localSuppliers.length > 0 && (
                        <tr key={`${item.material.id}-expanded`} className="bg-gray-50">
                          <td colSpan={10} className="px-4 py-0">
                            <div className="py-4 border-t border-dashed border-gray-200">
                              <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-teal-700" />
                                附近建材市场门店（{item.material.localSuppliers.length}家）
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {item.material.localSuppliers.map((sup) => (
                                  <div
                                    key={sup.id}
                                    className={`p-4 rounded-xl border ${
                                      sup.price === localBest?.price
                                        ? 'border-emerald-200 bg-emerald-50/50'
                                        : 'border-gray-200 bg-white'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{sup.marketName}</span>
                                        {sup.price === localBest?.price && (
                                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                                            <Star className="w-3 h-3 fill-current" />
                                            最优
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-lg font-bold text-emerald-600">
                                        ¥{sup.price.toLocaleString()}
                                      </div>
                                    </div>
                                    <div className="space-y-1.5 text-sm text-gray-600">
                                      <div className="flex items-start gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <span>{sup.address}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        <span>{sup.phone}</span>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                          <Package className="w-3.5 h-3.5 text-gray-400" />
                                          库存：{sup.stock.toLocaleString()} {item.material.unit}
                                        </span>
                                        <span className="text-teal-700 font-medium">
                                          距离 {(Math.random() * 5 + 0.5).toFixed(1)} km
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Search className="w-10 h-10 text-gray-300" />
                      </div>
                      <div className="text-gray-500">暂无匹配的商品</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"></div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-teal-700" />
                费用汇总
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>商品总数</span>
                  <span className="font-medium">{summary.totalCount} 件</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>已选数量</span>
                  <span className="font-medium">{summary.selectedCount} 件</span>
                </div>
                <div className="border-t border-gray-100 my-3 pt-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-4 bg-red-500 text-white text-xs rounded flex items-center justify-center font-bold">京</span>
                      京东渠道合计
                    </span>
                    <span className="font-semibold text-gray-800">¥{summary.jdTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-4 bg-orange-500 text-white text-xs rounded flex items-center justify-center font-bold">猫</span>
                      天猫渠道合计
                    </span>
                    <span className="font-semibold text-gray-800">¥{summary.tmallTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      本地渠道合计
                    </span>
                    <span className="font-semibold text-gray-800">¥{summary.localTotal.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                      最优方案总金额
                    </span>
                    <span className="text-2xl font-bold text-emerald-600">
                      ¥{summary.bestTotal.toLocaleString()}
                    </span>
                  </div>
                  {summary.saved > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-emerald-600">可节省金额</span>
                      <span className="font-semibold text-orange-500">
                        省 ¥{summary.saved.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button className="w-full mt-5 py-3 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                生成采购计划
              </button>
              <div className="mt-3 text-xs text-center text-gray-400">
                当前清单已有 {purchaseList.length} 件商品
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCalculator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-orange-500" />
                材料用量计算器
              </h3>
              <button
                onClick={() => setShowCalculator(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">房间面积（㎡）</label>
                <input
                  type="number"
                  value={calcArea}
                  onChange={(e) => setCalcArea(e.target.value)}
                  placeholder="请输入房间或全屋面积"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">门数量</label>
                  <input
                    type="number"
                    value={calcDoors}
                    onChange={(e) => setCalcDoors(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">窗户数量</label>
                  <input
                    type="number"
                    value={calcWindows}
                    onChange={(e) => setCalcWindows(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {calcResults && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs text-gray-500 font-medium">计算公式说明</div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                    <div className="pb-3 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-gray-800">瓷砖用量</span>
                        <button
                          onClick={() => handleAddCalcResult('瓷砖', calcResults.tileQty, '片')}
                          className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          添加
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        公式：面积 × 1.1（损耗） ÷ 0.64（800×800每片㎡）
                      </div>
                      <div className="text-xl font-bold text-teal-700">{calcResults.tileQty} 片</div>
                    </div>
                    <div className="pb-3 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-gray-800">地板用量</span>
                        <button
                          onClick={() => handleAddCalcResult('地板', calcResults.floorQty, '㎡')}
                          className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          添加
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">公式：面积 × 1.05（损耗）</div>
                      <div className="text-xl font-bold text-teal-700">{calcResults.floorQty} ㎡</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-gray-800">乳胶漆用量</span>
                        <button
                          onClick={() => handleAddCalcResult('乳胶漆', calcResults.paintQty, '桶')}
                          className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          添加
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        墙面面积：{calcResults.wallArea.toFixed(1)} ㎡（扣除门窗），每桶涂刷约 35 ㎡
                      </div>
                      <div className="text-xl font-bold text-teal-700">{calcResults.paintQty} 桶（5L装）</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="px-5 py-3 bg-gray-900/90 text-white text-sm font-medium rounded-xl shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
