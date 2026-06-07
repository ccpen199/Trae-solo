import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star } from 'lucide-react';
import MerchantCard from '@/components/MerchantCard';
import type { Merchant } from '@/types';

const mockMerchants: Merchant[] = [
  { id: 1, name: '阳光超市', category: '便民超市', rating: 4.8, address: '社区东门1号商铺', phone: '010-12345678', description: '提供日常生活用品、蔬菜水果、零食饮料等', image: 'https://picsum.photos/seed/shop1/200/200', businessHours: '07:00-22:00', isOpen: true },
  { id: 2, name: '美味餐厅', category: '餐饮美食', rating: 4.6, address: '社区西门2号商铺', phone: '010-87654321', description: '家常菜、川菜、粤菜，提供外卖服务', image: 'https://picsum.photos/seed/restaurant1/200/200', businessHours: '10:00-22:00', isOpen: true },
  { id: 3, name: '健康药房', category: '医疗健康', rating: 4.9, address: '社区南门3号商铺', phone: '010-11112222', description: '24小时营业，提供常用药品和医疗器械', image: 'https://picsum.photos/seed/pharmacy1/200/200', businessHours: '24小时', isOpen: true },
  { id: 4, name: '剪艺人生', category: '美容美发', rating: 4.5, address: '社区北门4号商铺', phone: '010-33334444', description: '专业理发、烫染、护理服务', image: 'https://picsum.photos/seed/hair1/200/200', businessHours: '09:00-21:00', isOpen: false },
  { id: 5, name: '优学教育', category: '教育培训', rating: 4.7, address: '商业街5号', phone: '010-55556666', description: '中小学课外辅导、兴趣班培训', image: 'https://picsum.photos/seed/edu1/200/200', businessHours: '08:00-20:00', isOpen: true },
  { id: 6, name: '快乐洗衣', category: '生活服务', rating: 4.4, address: '商业街6号', phone: '010-77778888', description: '干洗、水洗、皮具护理，上门取送', image: 'https://picsum.photos/seed/laundry1/200/200', businessHours: '08:00-20:00', isOpen: true },
];

const categories = [
  { value: 'all', label: '全部' },
  { value: '便民超市', label: '便民超市' },
  { value: '餐饮美食', label: '餐饮美食' },
  { value: '医疗健康', label: '医疗健康' },
  { value: '美容美发', label: '美容美发' },
  { value: '教育培训', label: '教育培训' },
  { value: '生活服务', label: '生活服务' },
];

const MerchantSquare: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyOpen, setOnlyOpen] = useState(false);

  const filteredMerchants = mockMerchants.filter((merchant) => {
    const matchSearch = merchant.name.toLowerCase().includes(searchText.toLowerCase()) ||
      merchant.description.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = categoryFilter === 'all' || merchant.category === categoryFilter;
    const matchOpen = !onlyOpen || merchant.isOpen;
    return matchSearch && matchCategory && matchOpen;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">商户广场</h1>
          <p className="text-gray-500 mt-1">发现周边优质商家，享受便利生活服务</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input pl-10"
            placeholder="搜索商家名称或描述..."
          />
        </div>
        <div className="flex items-center gap-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)}
              className="w-4 h-4 text-primary-500 rounded"
            />
            <span className="text-sm text-gray-700">仅显示营业中</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMerchants.map((merchant) => (
          <MerchantCard
            key={merchant.id}
            merchant={merchant}
            onClick={() => navigate(`/merchants/${merchant.id}`)}
          />
        ))}
      </div>

      {filteredMerchants.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">暂无符合条件的商家</p>
        </div>
      )}
    </div>
  );
};

export default MerchantSquare;
