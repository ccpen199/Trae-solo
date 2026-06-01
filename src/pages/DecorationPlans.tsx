import React, { useState, useEffect } from 'react';
import { Palette, DollarSign, Square, Star } from 'lucide-react';
import { api } from '@/lib/api';

const DecorationPlans: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    style: 'all',
    budgetMin: '',
    budgetMax: '',
    areaMin: '',
    areaMax: '',
  });

  useEffect(() => {
    loadPlans();
  }, [filters]);

  const loadPlans = async () => {
    setLoading(true);
    const params: Record<string, any> = {};
    if (filters.style !== 'all') params.style = filters.style;
    if (filters.budgetMin) params.budgetMin = filters.budgetMin;
    if (filters.budgetMax) params.budgetMax = filters.budgetMax;
    if (filters.areaMin) params.areaMin = filters.areaMin;
    if (filters.areaMax) params.areaMax = filters.areaMax;

    const response = await api.tools.decorationPlans(params);
    if (response.success && response.data) {
      setPlans(response.data as any);
    }
    setLoading(false);
  };

  const styles = [
    { value: 'all', label: '全部风格' },
    { value: '现代简约', label: '现代简约' },
    { value: '北欧', label: '北欧' },
    { value: '新中式', label: '新中式' },
    { value: '美式', label: '美式' },
    { value: '欧式', label: '欧式' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Palette className="text-blue-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">装修方案库</h1>
          <p className="text-gray-500">按户型/预算/风格推荐本地合作装企</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">装修风格</label>
            <select
              value={filters.style}
              onChange={(e) => setFilters({ ...filters, style: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {styles.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">最低预算(万)</label>
            <input
              type="number"
              value={filters.budgetMin}
              onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="不限"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">最高预算(万)</label>
            <input
              type="number"
              value={filters.budgetMax}
              onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="不限"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">最小面积(㎡)</label>
            <input
              type="number"
              value={filters.areaMin}
              onChange={(e) => setFilters({ ...filters, areaMin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="不限"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">最大面积(㎡)</label>
            <input
              type="number"
              value={filters.areaMax}
              onChange={(e) => setFilters({ ...filters, areaMax: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="不限"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <div className="text-gray-500">暂无符合条件的装修方案</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-48 bg-gray-200">
                <img
                  src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20interior%20design%20living%20room%20decoration&image_size=square_hd"
                  alt={plan.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
                  {plan.style}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{plan.title}</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign size={16} className="mr-2 text-green-600" />
                    <span>预算：{plan.budget_min} - {plan.budget_max}万</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Square size={16} className="mr-2 text-blue-600" />
                    <span>面积：{plan.area_min} - {plan.area_max}㎡</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star size={16} className="mr-2 text-yellow-500" />
                    <span>{plan.company_name}</span>
                    <span className="ml-2 text-yellow-600 font-medium">{plan.company_rating}分</span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{plan.description}</p>

                {plan.features && (
                  <div className="flex flex-wrap gap-2">
                    {plan.features.split(',').slice(0, 3).map((feature: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DecorationPlans;
