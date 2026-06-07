import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Shield, MapPin, TrendingUp, Clock, Phone } from 'lucide-react';
import MarketItemCard from '@/components/MarketItemCard';
import type { MarketItem } from '@/types';

const mockItems: MarketItem[] = [
  { id: 1, title: '小米空气净化器 Pro H', description: '九成新，使用一年，功能完好，因搬家转让。配件齐全，带原装包装。', price: 800, originalPrice: 1699, seller: '业主小王', sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller1', seller_credit: 95, seller_trades: 28, pickup_available: true, transaction_status: 'completed', images: ['https://picsum.photos/seed/item1/400/300'], category: '家用电器', condition: 'good', location: '1号楼', createdAt: '2小时前', status: 'available' },
  { id: 2, title: 'iPad Air 4 256G 深空灰', description: '2021款，带Apple Pencil二代，贴膜带壳使用，无磕碰无划痕。', price: 3500, originalPrice: 5999, seller: '业主小李', sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller2', seller_credit: 88, seller_trades: 15, pickup_available: true, transaction_status: 'pending_pickup', images: ['https://picsum.photos/seed/item2/400/300'], category: '数码产品', condition: 'like-new', location: '3号楼', createdAt: '5小时前', status: 'available' },
  { id: 3, title: '儿童自行车 16寸', description: '品牌永久，适合4-8岁儿童，车身轻便，带辅助轮。孩子长大了用不上了。', price: 200, originalPrice: 450, seller: '幸福妈妈', sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller3', seller_credit: 92, seller_trades: 42, pickup_available: true, transaction_status: 'completed', images: ['https://picsum.photos/seed/item3/400/300'], category: '母婴儿童', condition: 'good', location: '2号楼', createdAt: '1天前', status: 'available' },
  { id: 4, title: '宜家三人沙发', description: '宜家奇维三人沙发，灰色布艺，可拆洗，使用两年，搬家低价转让。', price: 500, originalPrice: 1999, seller: '业主小张', sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller4', seller_credit: 75, seller_trades: 8, pickup_available: false, transaction_status: 'pending_payment', images: ['https://picsum.photos/seed/item4/400/300'], category: '家具家居', condition: 'good', location: '5号楼', createdAt: '2天前', status: 'reserved' },
  { id: 5, title: 'Kindle Paperwhite 5', description: '2021款，11代，32G，带保护套，使用很少，几乎全新。', price: 700, originalPrice: 1299, seller: '书友小刘', sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller5', seller_credit: 98, seller_trades: 56, pickup_available: true, transaction_status: 'completed', images: ['https://picsum.photos/seed/item5/400/300'], category: '图书文具', condition: 'like-new', location: '6号楼', createdAt: '3天前', status: 'available' },
  { id: 6, title: '跑步机 家用折叠款', description: '亿健跑步机，可折叠，带心率监测和多种运动模式，使用半年。', price: 1200, originalPrice: 2599, seller: '健身达人', sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller6', seller_credit: 82, seller_trades: 19, pickup_available: true, transaction_status: 'completed', images: ['https://picsum.photos/seed/item6/400/300'], category: '运动户外', condition: 'good', location: '8号楼', createdAt: '4天前', status: 'sold' },
];

const categories = [
  { value: 'all', label: '全部' },
  { value: '家用电器', label: '家用电器' },
  { value: '数码产品', label: '数码产品' },
  { value: '家具家居', label: '家具家居' },
  { value: '母婴儿童', label: '母婴儿童' },
  { value: '图书文具', label: '图书文具' },
  { value: '运动户外', label: '运动户外' },
];

const conditions = [
  { value: 'all', label: '全部成色' },
  { value: 'new', label: '全新' },
  { value: 'like-new', label: '几乎全新' },
  { value: 'good', label: '成色良好' },
  { value: 'fair', label: '有使用痕迹' },
];

const creditLevels = [
  { value: 'all', label: '全部信用' },
  { value: '90+', label: '90分以上' },
  { value: '80+', label: '80分以上' },
  { value: '70+', label: '70分以上' },
];

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [creditFilter, setCreditFilter] = useState('all');

  const todayNewCount = mockItems.filter(item => item.createdAt.includes('小时前')).length;

  const filteredItems = mockItems.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchCondition = conditionFilter === 'all' || item.condition === conditionFilter;
    let matchPrice = true;
    if (priceRange === '0-200') matchPrice = item.price <= 200;
    else if (priceRange === '200-500') matchPrice = item.price > 200 && item.price <= 500;
    else if (priceRange === '500-1000') matchPrice = item.price > 500 && item.price <= 1000;
    else if (priceRange === '1000+') matchPrice = item.price > 1000;
    let matchCredit = true;
    if (creditFilter === '90+') matchCredit = (item.seller_credit || 0) >= 90;
    else if (creditFilter === '80+') matchCredit = (item.seller_credit || 0) >= 80;
    else if (creditFilter === '70+') matchCredit = (item.seller_credit || 0) >= 70;
    return matchSearch && matchCategory && matchCondition && matchPrice && matchCredit;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">闲置集市</h1>
          <p className="text-gray-500 mt-1">邻里互助，物尽其用</p>
        </div>
        <button
          onClick={() => navigate('/items/create')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          发布闲置
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-green-800">放心交易保障</p>
            <p className="text-xs text-green-600">社区信用担保 · 线下自提 · 交易保障</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-blue-800">自提点</p>
            <p className="text-xs text-blue-600">小区物业服务中心 · 24小时开放</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-orange-800">今日上新</p>
            <p className="text-xs text-orange-600">今日新增 {todayNewCount} 件</p>
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 text-lg">线下自提点</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <div className="flex items-center gap-2 text-blue-700">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">物业服务中心大厅</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <Clock className="w-4 h-4" />
                <span className="text-sm">周一至周日 09:00-20:00</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <Phone className="w-4 h-4" />
                <span className="text-sm">物业前台 138-xxxx-xxxx</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input pl-10"
              placeholder="搜索您需要的物品..."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input min-w-[140px]"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="input min-w-[140px]"
            >
              {conditions.map((cond) => (
                <option key={cond.value} value={cond.value}>{cond.label}</option>
              ))}
            </select>
            <select
              value={creditFilter}
              onChange={(e) => setCreditFilter(e.target.value)}
              className="input min-w-[140px]"
            >
              {creditLevels.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="input min-w-[140px]"
            >
              <option value="all">全部价格</option>
              <option value="0-200">200元以下</option>
              <option value="200-500">200-500元</option>
              <option value="500-1000">500-1000元</option>
              <option value="1000+">1000元以上</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <MarketItemCard key={item.id} item={item} />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">暂无符合条件的物品</p>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
