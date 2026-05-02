import React, { useState, useEffect } from 'react';
import { packageApi } from '../services/api';
import { useAppStore } from '../store';

const PackageList: React.FC = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { setSelectedPackage, selectedPackage } = useAppStore();

  useEffect(() => {
    fetchPackages();
  }, [selectedCategory]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const response = await packageApi.getAll(category);
      setPackages(response.data);
    } catch (error) {
      console.error('获取套餐列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    all: '全部',
    basic: '基础套餐',
    standard: '标准套餐',
    premium: '高端套餐',
    custom: '专项套餐',
  };

  const getCategoryTag = (category: string) => {
    const tags: Record<string, { text: string; color: string }> = {
      basic: { text: '基础', color: 'bg-blue-100 text-blue-800' },
      standard: { text: '标准', color: 'bg-green-100 text-green-800' },
      premium: { text: '高端', color: 'bg-purple-100 text-purple-800' },
      custom: { text: '专项', color: 'bg-orange-100 text-orange-800' },
    };
    return tags[category] || tags.basic;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">体检套餐</h1>
        <div className="flex gap-2">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const tag = getCategoryTag(pkg.category);
          const isSelected = selectedPackage?.id === pkg.id;

          return (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg)}
              className={`bg-white rounded-xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-transparent hover:border-gray-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{pkg.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${tag.color}`}>
                    {tag.text}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {pkg.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-gray-500 text-sm">
                    <span>预计时长: {pkg.estimatedDuration}分钟</span>
                  </div>
                  <div className="text-gray-500 text-sm">
                    <span>包含{pkg.items.length}项检查</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-red-600">¥{pkg.price}</span>
                    <span className="text-sm text-gray-400 line-through">¥{pkg.originalPrice}</span>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    {isSelected ? '已选择' : '立即预约'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {packages.length === 0 && (
        <div className="text-center py-20">
          <div className="text-gray-500">暂无套餐信息</div>
        </div>
      )}
    </div>
  );
};

export default PackageList;
