import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Building2,
  ShoppingBag,
  Plus,
  MapPin,
  Package,
  Clock,
  TrendingUp,
  ArrowUpDown,
  Flame,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

type SortOption = 'default' | 'sales' | 'price_asc' | 'price_desc';
type DeliveryFilter = 'all' | 'self_operated' | 'property_pickup';
type RadiusOption = '1' | '3' | '5' | 'all';

type StockStatus = 'low' | 'normal' | 'soldout';
type DeliveryType = 'self_operated' | 'property_pickup';

interface Product {
  id: number;
  name: string;
  category: string;
  imagePrompt: string;
  deliveryType: DeliveryType;
  stockStatus: StockStatus;
  stockText: string;
  sales: number;
  goodRate: number;
  currentPrice: number;
  originalPrice: number;
  saveAmount: number;
  deliveryPromise: string;
  pickupPoint?: string;
}

const categories = [
  { name: '全部', icon: ShoppingBag },
  { name: '生鲜水果', icon: Flame },
  { name: '日用百货', icon: Package },
  { name: '零食饮料', icon: TrendingUp },
  { name: '家居清洁', icon: Building2 },
  { name: '粮油调味', icon: Package },
  { name: '个护美妆', icon: Flame },
  { name: '母婴用品', icon: Package },
];

const products: Product[] = [
  {
    id: 1,
    name: '国产丹东草莓2斤',
    category: '生鲜水果',
    imagePrompt: 'fresh red strawberries in a clear plastic box premium quality',
    deliveryType: 'self_operated',
    stockStatus: 'low',
    stockText: '仅余8件',
    sales: 2846,
    goodRate: 99.2,
    currentPrice: 59.9,
    originalPrice: 89.9,
    saveAmount: 30,
    deliveryPromise: '自营仓·今日18:00前下单→明日达',
  },
  {
    id: 2,
    name: '佳沛阳光金奇异果6粒',
    category: '生鲜水果',
    imagePrompt: 'zespri golden kiwis six pieces fresh tropical fruit',
    deliveryType: 'self_operated',
    stockStatus: 'normal',
    stockText: '现货充足',
    sales: 1523,
    goodRate: 98.8,
    currentPrice: 49.9,
    originalPrice: 69.9,
    saveAmount: 20,
    deliveryPromise: '自营仓·今日18:00前下单→明日达',
  },
  {
    id: 3,
    name: '伊利金典纯牛奶250ml*12',
    category: '生鲜水果',
    imagePrompt: 'yili gold classic pure milk carton 250ml 12 pack',
    deliveryType: 'property_pickup',
    stockStatus: 'normal',
    stockText: '现货充足',
    sales: 5632,
    goodRate: 99.5,
    currentPrice: 55.9,
    originalPrice: 72.0,
    saveAmount: 16.1,
    deliveryPromise: '物业代收·3小时内送达3号楼代收点',
    pickupPoint: '朝阳家园3号楼物业代收',
  },
  {
    id: 4,
    name: '农夫山泉1.5L*12',
    category: '零食饮料',
    imagePrompt: 'nongfu spring mineral water 1.5L 12 bottles pack',
    deliveryType: 'self_operated',
    stockStatus: 'low',
    stockText: '仅余15份',
    sales: 8921,
    goodRate: 99.8,
    currentPrice: 32.9,
    originalPrice: 42.0,
    saveAmount: 9.1,
    deliveryPromise: '自营仓·今日18:00前下单→明日达',
  },
  {
    id: 5,
    name: '清风抽纸3层*24包',
    category: '日用百货',
    imagePrompt: 'breeze tissue paper 3 ply 24 packs household',
    deliveryType: 'property_pickup',
    stockStatus: 'normal',
    stockText: '现货充足',
    sales: 4287,
    goodRate: 99.1,
    currentPrice: 45.9,
    originalPrice: 59.9,
    saveAmount: 14,
    deliveryPromise: '物业代收·3小时内送达3号楼代收点',
    pickupPoint: '朝阳家园3号楼物业代收',
  },
  {
    id: 6,
    name: '维达卷纸4层*27卷',
    category: '日用百货',
    imagePrompt: 'vinda toilet paper 4 ply 27 rolls premium quality',
    deliveryType: 'self_operated',
    stockStatus: 'normal',
    stockText: '现货充足',
    sales: 6234,
    goodRate: 99.3,
    currentPrice: 69.9,
    originalPrice: 89.9,
    saveAmount: 20,
    deliveryPromise: '自营仓·今日18:00前下单→明日达',
  },
  {
    id: 7,
    name: '蓝月亮洗衣液3kg*2',
    category: '家居清洁',
    imagePrompt: 'blue moon liquid laundry detergent 3kg 2 bottles',
    deliveryType: 'property_pickup',
    stockStatus: 'low',
    stockText: '仅余5件',
    sales: 3156,
    goodRate: 98.9,
    currentPrice: 89.9,
    originalPrice: 119.0,
    saveAmount: 29.1,
    deliveryPromise: '物业代收·3小时内送达3号楼代收点',
    pickupPoint: '朝阳家园3号楼物业代收',
  },
  {
    id: 8,
    name: '三只松鼠坚果大礼包',
    category: '零食饮料',
    imagePrompt: 'three squirrels nuts gift pack variety mixed nuts',
    deliveryType: 'self_operated',
    stockStatus: 'normal',
    stockText: '现货充足',
    sales: 7823,
    goodRate: 99.4,
    currentPrice: 99.9,
    originalPrice: 158.0,
    saveAmount: 58.1,
    deliveryPromise: '自营仓·今日18:00前下单→明日达',
  },
  {
    id: 9,
    name: '良品铺子每日坚果',
    category: '零食饮料',
    imagePrompt: 'bestore daily nuts mixed nuts snack pack 30 days',
    deliveryType: 'self_operated',
    stockStatus: 'normal',
    stockText: '现货充足',
    sales: 5123,
    goodRate: 99.0,
    currentPrice: 79.9,
    originalPrice: 99.9,
    saveAmount: 20,
    deliveryPromise: '自营仓·今日18:00前下单→明日达',
  },
  {
    id: 10,
    name: '海天金标生抽1.28L',
    category: '粮油调味',
    imagePrompt: 'haitian golden label soy sauce 1.28L premium',
    deliveryType: 'property_pickup',
    stockStatus: 'normal',
    stockText: '现货充足',
    sales: 4521,
    goodRate: 99.6,
    currentPrice: 21.9,
    originalPrice: 28.0,
    saveAmount: 6.1,
    deliveryPromise: '物业代收·3小时内送达3号楼代收点',
    pickupPoint: '朝阳家园3号楼物业代收',
  },
  {
    id: 11,
    name: '金龙鱼五常大米5kg',
    category: '粮油调味',
    imagePrompt: 'arawana wuchang rice 5kg premium fragrant rice',
    deliveryType: 'self_operated',
    stockStatus: 'low',
    stockText: '仅余12袋',
    sales: 3892,
    goodRate: 99.7,
    currentPrice: 69.9,
    originalPrice: 89.9,
    saveAmount: 20,
    deliveryPromise: '自营仓·今日18:00前下单→明日达',
  },
  {
    id: 12,
    name: '鲁花花生油5L',
    category: '粮油调味',
    imagePrompt: 'luhua peanut oil 5L premium cooking oil',
    deliveryType: 'self_operated',
    stockStatus: 'normal',
    stockText: '现货充足',
    sales: 2781,
    goodRate: 99.2,
    currentPrice: 149.9,
    originalPrice: 179.9,
    saveAmount: 30,
    deliveryPromise: '自营仓·今日18:00前下单→明日达',
  },
  {
    id: 13,
    name: '帮宝适一级帮纸尿裤L48',
    category: '母婴用品',
    imagePrompt: 'pampers premium care diapers L size 48 pieces',
    deliveryType: 'property_pickup',
    stockStatus: 'normal',
    stockText: '现货充足',
    sales: 2134,
    goodRate: 98.7,
    currentPrice: 89.9,
    originalPrice: 119.0,
    saveAmount: 29.1,
    deliveryPromise: '物业代收·3小时内送达3号楼代收点',
    pickupPoint: '朝阳家园3号楼物业代收',
  },
  {
    id: 14,
    name: '花王妙而舒XL38',
    category: '母婴用品',
    imagePrompt: 'kao merries diapers XL size 38 pieces premium',
    deliveryType: 'self_operated',
    stockStatus: 'soldout',
    stockText: '已售罄',
    sales: 1987,
    goodRate: 99.1,
    currentPrice: 129.9,
    originalPrice: 159.9,
    saveAmount: 30,
    deliveryPromise: '自营仓·今日18:00前下单→明日达',
  },
  {
    id: 15,
    name: '全棉时代湿巾80抽*8',
    category: '母婴用品',
    imagePrompt: 'purcotton wet wipes 80 sheets 8 packs cotton',
    deliveryType: 'property_pickup',
    stockStatus: 'normal',
    stockText: '现货充足',
    sales: 3421,
    goodRate: 99.5,
    currentPrice: 79.9,
    originalPrice: 99.9,
    saveAmount: 20,
    deliveryPromise: '物业代收·3小时内送达3号楼代收点',
    pickupPoint: '朝阳家园3号楼物业代收',
  },
  {
    id: 16,
    name: '苏菲弹力贴身日用*30',
    category: '个护美妆',
    imagePrompt: 'sofy elastic fit sanitary napkins daily 30 pieces',
    deliveryType: 'self_operated',
    stockStatus: 'normal',
    stockText: '现货充足',
    sales: 4521,
    goodRate: 99.3,
    currentPrice: 39.9,
    originalPrice: 52.0,
    saveAmount: 12.1,
    deliveryPromise: '自营仓·今日18:00前下单→明日达',
  },
];

const inventoryCards = [
  {
    type: 'warehouse',
    title: '自营仓实时库存',
    subtitle: '今日送达·自营仓剩余128份',
    description: '朝阳社区前置仓 · 距您800m',
    stat1: { label: '今日已出库', value: '342', unit: '单' },
    stat2: { label: '配送时效', value: '次日', unit: '达' },
    color: 'from-blue-500 to-blue-600',
    icon: Truck,
  },
  {
    type: 'pickup',
    title: '朝阳家园3号楼物业代收',
    subtitle: '今日已入库42件·取件码24h有效',
    description: '3号楼1层物业室 · 营业时间 8:00-22:00',
    stat1: { label: '待取件', value: '18', unit: '件' },
    stat2: { label: '平均送达', value: '2.5', unit: '小时' },
    color: 'from-emerald-500 to-emerald-600',
    icon: Building2,
  },
  {
    type: 'pickup2',
    title: '朝阳家园5号楼丰巢柜',
    subtitle: '实时格口剩余38个·支持24h自取',
    description: '5号楼单元门旁 · 24小时自助取件',
    stat1: { label: '空闲格口', value: '38', unit: '个' },
    stat2: { label: '今日投递', value: '76', unit: '件' },
    color: 'from-purple-500 to-purple-600',
    icon: Package,
  },
];

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN');
}

function getStockBadgeClass(status: StockStatus): string {
  switch (status) {
    case 'low':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'soldout':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-green-100 text-green-700 border-green-200';
  }
}

function getStockIcon(status: StockStatus) {
  switch (status) {
    case 'low':
      return AlertTriangle;
    case 'soldout':
      return XCircle;
    default:
      return CheckCircle2;
  }
}

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [sort, setSort] = useState<SortOption>('default');
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>('all');
  const [radius, setRadius] = useState<RadiusOption>('5');

  const filteredProducts = products.filter((p) => {
    if (activeCategory !== 0 && p.category !== categories[activeCategory].name) {
      return false;
    }
    if (deliveryFilter === 'self_operated' && p.deliveryType !== 'self_operated') {
      return false;
    }
    if (deliveryFilter === 'property_pickup' && p.deliveryType !== 'property_pickup') {
      return false;
    }
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sort) {
      case 'sales':
        return b.sales - a.sales;
      case 'price_asc':
        return a.currentPrice - b.currentPrice;
      case 'price_desc':
        return b.currentPrice - a.currentPrice;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-52 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0">
          {categories.map((cat, idx) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(idx)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeCategory === idx
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                  : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'
              }`}
            >
              <cat.icon className={`w-4 h-4 ${activeCategory === idx ? 'text-white' : 'text-primary-500'}`} />
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4">
          <div className="card space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
                {([
                  { key: 'default', label: '综合' },
                  { key: 'sales', label: '销量' },
                  { key: 'price_asc', label: '价格↑' },
                  { key: 'price_desc', label: '价格↓' },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSort(opt.key)}
                    className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      sort === opt.key
                        ? 'bg-primary-50 text-primary-600 ring-1 ring-primary-200'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-gray-400" />
                {([
                  { key: 'all', label: '全部配送', icon: ShoppingBag },
                  { key: 'self_operated', label: '自营配送', icon: Truck },
                  { key: 'property_pickup', label: '物业代收', icon: Building2 },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setDeliveryFilter(opt.key)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border transition-all ${
                      deliveryFilter === opt.key
                        ? 'border-primary-300 bg-primary-50 text-primary-600 shadow-sm'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <opt.icon className="w-3 h-3" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-50 flex items-center gap-2 flex-wrap">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 mr-1">配送范围：</span>
              {([
                { key: '1', label: '1km内' },
                { key: '3', label: '3km内' },
                { key: '5', label: '5km内' },
                { key: 'all', label: '全区域' },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setRadius(opt.key)}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                    radius === opt.key
                      ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {inventoryCards.map((card) => (
              <div
                key={card.type}
                className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 text-white relative overflow-hidden shadow-lg`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <card.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{card.title}</h4>
                      <p className="text-xs text-white/80">{card.description}</p>
                    </div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 mb-3">
                    <p className="text-xs font-medium">{card.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold">{card.stat1.value}</span>
                        <span className="text-xs text-white/70">{card.stat1.unit}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-0.5">{card.stat1.label}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold">{card.stat2.value}</span>
                        <span className="text-xs text-white/70">{card.stat2.unit}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-0.5">{card.stat2.label}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {sortedProducts.map((p) => {
              const StockIcon = getStockIcon(p.stockStatus);
              const isSoldOut = p.stockStatus === 'soldout';
              return (
                <div
                  key={p.id}
                  className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-0.5 relative ${
                    isSoldOut ? 'opacity-80' : ''
                  }`}
                >
                  <Link to={`/products/${p.id}`} className="block">
                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(p.imagePrompt)}&image_size=square)`,
                        }}
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {p.deliveryType === 'self_operated' ? (
                          <span className="badge-blue text-[10px] px-2 py-0.5 shadow-sm">
                            自营
                          </span>
                        ) : (
                          <span className="badge-purple text-[10px] px-2 py-0.5 shadow-sm">
                            代收
                          </span>
                        )}
                      </div>
                      <div className="absolute top-2 right-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStockBadgeClass(p.stockStatus)}`}
                        >
                          <StockIcon className="w-2.5 h-2.5" />
                          {p.stockText}
                        </span>
                      </div>
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="bg-gray-900/80 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                            暂时售罄
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 space-y-2">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug min-h-[2.5rem]">
                        {p.name}
                      </h4>

                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span className="flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" />
                          月销{formatNumber(p.sales)}
                        </span>
                        <span className="w-px h-3 bg-gray-200" />
                        <span className="text-emerald-600 font-medium">
                          好评{p.goodRate}%
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-red-500">
                          ¥{p.currentPrice.toFixed(1)}
                        </span>
                        <span className="text-[11px] text-gray-400 line-through">
                          ¥{p.originalPrice.toFixed(1)}
                        </span>
                        <span className="ml-auto text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                          省¥{p.saveAmount.toFixed(1)}
                        </span>
                      </div>

                      <div className="flex items-start gap-1 pt-1">
                        <Clock className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-gray-500 leading-tight line-clamp-2">
                          {p.deliveryPromise}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className={`px-3 pb-3 transition-opacity duration-200 ${isSoldOut ? 'opacity-40 pointer-events-none' : ''}`}>
                    <button
                      disabled={isSoldOut}
                      className={`w-full flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-medium transition-all group-hover:shadow-md ${
                        isSoldOut
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      加入购物车
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
