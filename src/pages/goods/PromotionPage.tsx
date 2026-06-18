import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Plus, Search, Filter, TrendingUp, Percent, Clock, CheckCircle, XCircle, Edit, Eye } from 'lucide-react';
import { getPromotions, createPromotion, updatePromotion } from '../../services/api';
import type { Promotion } from '../../../shared/types';

const typeConfig: Record<string, { label: string; color: string }> = {
  discount: { label: '折扣', color: 'bg-green-100 text-green-700' },
  coupon: { label: '优惠券', color: 'bg-amber-100 text-amber-700' },
  gift: { label: '买赠', color: 'bg-purple-100 text-purple-700' },
  full_reduction: { label: '满减', color: 'bg-blue-100 text-blue-700' },
};

export default function PromotionPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const res = await getPromotions();
      if (res.code === 0) {
        setPromotions(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: Partial<Promotion>) => {
    try {
      const res = await createPromotion(data as Promotion);
      if (res.code === 0) {
        fetchPromotions();
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error('Failed to create promotion:', err);
    }
  };

  const handleToggleStatus = async (promo: Promotion, newStatus: 'active' | 'paused' | 'ended') => {
    try {
      const res = await updatePromotion(promo.id, { status: newStatus });
      if (res.code === 0) {
        fetchPromotions();
      }
    } catch (err) {
      console.error('Failed to update promotion:', err);
    }
  };

  const effectOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['优惠金额', '带动销售额', '使用人次'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['6.1', '6.5', '6.10', '6.15', '6.20', '6.25', '6.30'],
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        name: '优惠金额',
        type: 'bar',
        stack: 'total',
        data: [2.5, 3.2, 4.8, 3.5, 5.2, 4.1, 6.8],
        itemStyle: { color: '#059669' },
      },
      {
        name: '带动销售额',
        type: 'bar',
        stack: 'total',
        data: [12.5, 15.2, 22.8, 18.5, 25.2, 20.1, 32.8],
        itemStyle: { color: '#2563eb' },
      },
      {
        name: '使用人次',
        type: 'line',
        yAxisIndex: 0,
        smooth: true,
        data: [120, 158, 245, 189, 278, 220, 365],
        itemStyle: { color: '#f59e0b' },
        lineStyle: { width: 3 },
      }
    ]
  };

  const stats = [
    { label: '进行中活动', value: promotions.filter(p => p.status === 'active').length, icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '累计优惠金额', value: '¥128.5万', icon: Percent, color: 'text-danger-600', bg: 'bg-danger-100' },
    { label: 'ROI回报率', value: '1:4.2', icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-100' },
    { label: '预计到期', value: 3, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const statusFilters = [
    { key: 'all', label: '全部' },
    { key: 'active', label: '进行中' },
    { key: 'paused', label: '已暂停' },
    { key: 'ended', label: '已结束' },
  ];

  const filteredPromotions = promotions.filter(p => {
    const matchKeyword = !searchKeyword || p.name.includes(searchKeyword);
    const matchStatus = activeStatus === 'all' || p.status === activeStatus;
    return matchKeyword && matchStatus;
  });

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

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">活动效果分析</h3>
        <ReactECharts option={effectOption} style={{ height: 280 }} />
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索活动..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input pl-10 w-64"
            />
          </div>
          <div className="flex gap-2">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveStatus(f.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeStatus === f.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          创建活动
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPromotions.map((promo) => (
          <div key={promo.id} className="card overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${typeConfig[promo.type]?.color}`}>
                  {typeConfig[promo.type]?.label}
                </span>
                {promo.status === 'active' ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    进行中
                  </span>
                ) : promo.status === 'paused' ? (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    已暂停
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    <XCircle className="w-3 h-3" />
                    已结束
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{promo.name}</h4>
              <p className="text-sm text-gray-500 line-clamp-2">{promo.description}</p>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">活动时间</span>
                <span className="font-medium text-gray-900">
                  {new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">优惠力度</span>
                <span className="font-medium text-danger-600">{promo.discountValue}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">使用数量</span>
                <span className="font-medium text-gray-900">{promo.usedCount} / {promo.totalCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">已优惠金额</span>
                <span className="font-medium text-primary-600">¥{promo.totalDiscount.toLocaleString()}</span>
              </div>
              
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                  style={{ width: `${(promo.usedCount / promo.totalCount) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex gap-2 pt-2">
                {promo.status === 'active' ? (
                  <button
                    onClick={() => handleToggleStatus(promo, 'paused')}
                    className="flex-1 px-3 py-2 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100"
                  >
                    暂停
                  </button>
                ) : promo.status === 'paused' ? (
                  <button
                    onClick={() => handleToggleStatus(promo, 'active')}
                    className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100"
                  >
                    启用
                  </button>
                ) : null}
                <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">创建促销活动</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动名称</label>
                <input type="text" className="input w-full" placeholder="请输入活动名称" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动类型</label>
                <select className="input w-full">
                  <option value="discount">折扣</option>
                  <option value="coupon">优惠券</option>
                  <option value="gift">买赠</option>
                  <option value="full_reduction">满减</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                  <input type="date" className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                  <input type="date" className="input w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">规则配置</label>
                <textarea className="input w-full h-24" placeholder="请输入活动规则，例如：满200减20"></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary flex-1">
                  取消
                </button>
                <button onClick={() => handleCreate({
                  name: '新活动',
                  type: 'discount',
                  startTime: new Date().toISOString(),
                  endTime: new Date().toISOString(),
                  rules: [],
                  status: 'active',
                } as Omit<Promotion, 'id'>)} className="btn btn-primary flex-1">
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
