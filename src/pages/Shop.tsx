import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, SlidersHorizontal, Flame, TrendingUp, Tag } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@shared/types';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'all', label: '全部', icon: '🛒' },
  { id: 'food', label: '主粮', icon: '🍖' },
  { id: 'snack', label: '零食', icon: '🦴' },
  { id: 'health', label: '保健品', icon: '💊' },
  { id: 'daily', label: '日用品', icon: '🧴' },
  { id: 'toy', label: '玩具', icon: '🎾' },
  { id: 'medicine', label: '药品', icon: '💉' },
];

const mockProducts: Product[] = [
  {
    id: 'p1',
    merchantId: 'm1',
    name: '皇家幼犬粮 2kg 全价营养配方',
    category: '主粮',
    species: ['dog'],
    ageRange: '幼年',
    healthCondition: [],
    price: 158.0,
    stock: 156,
    isPrescription: false,
    images: [],
    description: '',
  },
  {
    id: 'p2',
    merchantId: 'm1',
    name: '猫砂膨润土除臭无尘 10L',
    category: '日用品',
    species: ['cat'],
    ageRange: '全年龄',
    healthCondition: [],
    price: 69.9,
    stock: 5,
    isPrescription: false,
    images: [],
    description: '',
  },
  {
    id: 'p3',
    merchantId: 'm2',
    name: '拜宠爽体外驱虫滴剂（犬用）',
    category: '驱虫药',
    species: ['dog'],
    ageRange: '成年',
    healthCondition: [],
    price: 128.0,
    stock: 89,
    isPrescription: true,
    images: [],
    description: '',
  },
  {
    id: 'p4',
    merchantId: 'm1',
    name: '宠物营养膏 猫狗通用 120g',
    category: '营养品',
    species: ['dog', 'cat'],
    ageRange: '全年龄',
    healthCondition: [],
    price: 45.0,
    stock: 234,
    isPrescription: false,
    images: [],
    description: '',
  },
  {
    id: 'p5',
    merchantId: 'm3',
    name: '狗狗磨牙棒零食 500g',
    category: '零食',
    species: ['dog'],
    ageRange: '全年龄',
    healthCondition: [],
    price: 39.9,
    stock: 456,
    isPrescription: false,
    images: [],
    description: '',
  },
  {
    id: 'p6',
    merchantId: 'm1',
    name: '猫罐头湿粮混合口味 12罐',
    category: '零食',
    species: ['cat'],
    ageRange: '成年',
    healthCondition: [],
    price: 118.0,
    stock: 178,
    isPrescription: false,
    images: [],
    description: '',
  },
  {
    id: 'p7',
    merchantId: 'm4',
    name: '宠物自动喂食器 智能定时',
    category: '日用品',
    species: ['dog', 'cat'],
    ageRange: '全年龄',
    healthCondition: [],
    price: 299.0,
    stock: 45,
    isPrescription: false,
    images: [],
    description: '',
  },
  {
    id: 'p8',
    merchantId: 'm2',
    name: '猫咪化毛膏 120g',
    category: '营养品',
    species: ['cat'],
    ageRange: '成年',
    healthCondition: [],
    price: 58.0,
    stock: 267,
    isPrescription: false,
    images: [],
    description: '',
  },
];

const banners = [
  { title: '新用户首单立减30元', desc: '全场通用，立即抢购', color: 'from-warm-400 to-warm-500' },
  { title: '处方药品专区', desc: '正品保障，极速发货', color: 'from-forest-400 to-forest-600' },
];

export default function Shop() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filteredProducts = mockProducts.filter((p) => {
    const matchesSearch = p.name.includes(search) || p.category.includes(search);
    const matchesCategory = category === 'all' || p.category === categories.find((c) => c.id === category)?.label;
    return matchesSearch && (category === 'all' || matchesCategory);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title">宠物商城</h1>
          <p className="section-subtitle">正品保障，为爱宠甄选好物</p>
        </div>
        <button className="btn-secondary relative">
          <ShoppingCart className="w-5 h-5" />
          购物车
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-warm-400 text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索商品..."
          className="input-field pl-12 pr-28"
        />
        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors">
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {banners.map((banner, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-3xl bg-gradient-to-br ${banner.color} text-white shadow-soft`}
          >
            <h3 className="font-display font-bold text-lg mb-1">{banner.title}</h3>
            <p className="text-sm text-white/80">{banner.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all font-medium',
              category === cat.id
                ? 'bg-forest-500 text-white shadow-soft'
                : 'bg-white text-gray-700 hover:bg-forest-50 border border-forest-100'
            )}
          >
            <span>{cat.icon}</span>
            <span className="text-sm">{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-500" />
          <div>
            <p className="font-semibold text-sm text-red-700">限时秒杀</p>
            <p className="text-xs text-red-500">低至5折</p>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-warm-50 to-warm-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-warm-500" />
          <div>
            <p className="font-semibold text-sm text-warm-600">热销榜单</p>
            <p className="text-xs text-warm-500">人气之选</p>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-forest-50 to-forest-100 flex items-center gap-2">
          <Tag className="w-5 h-5 text-forest-500" />
          <div>
            <p className="font-semibold text-sm text-forest-700">优惠券</p>
            <p className="text-xs text-forest-600">领券中心</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-gray-900">
            {category === 'all' ? '全部商品' : categories.find((c) => c.id === category)?.label}
          </h2>
          <span className="text-sm text-gray-500">{filteredProducts.length} 件商品</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
