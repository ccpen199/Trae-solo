import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  X,
  TrendingUp,
  Shield,
  MapPin,
  Building2,
  Ruler,
  Home,
  Gavel,
  Eye,
  Star,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Calculator,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useCompareStore } from '@/store';
import { mockProperties } from '@/mock/data';
import {
  formatPrice,
  formatPricePerSqm,
  calculateScore,
  cn,
  getRiskLevelLabel,
  getRiskLevelClass,
  getAuctionStatusLabel,
  getAuctionStatusClass,
} from '@/utils';
import type { Property } from '@/types';

const compareDimensions = [
  { key: 'basic', label: '基本信息', items: [
    { key: 'district', label: '所在区域', icon: MapPin },
    { key: 'area', label: '建筑面积', icon: Ruler },
    { key: 'rooms', label: '户型', icon: Home },
    { key: 'floor', label: '楼层', icon: Building2 },
    { key: 'orientation', label: '朝向', icon: MapPin },
    { key: 'buildingAge', label: '楼龄', icon: Building2 },
    { key: 'decoration', label: '装修', icon: Sparkles },
  ]},
  { key: 'price', label: '价格信息', items: [
    { key: 'startingPrice', label: '起拍价', icon: Gavel },
    { key: 'appraisalPrice', label: '评估价', icon: FileText },
    { key: 'deposit', label: '保证金', icon: Shield },
    { key: 'pricePerSqm', label: '起拍单价', icon: Calculator },
    { key: 'discountRate', label: '折扣率', icon: TrendingUp },
  ]},
  { key: 'auction', label: '拍卖信息', items: [
    { key: 'court', label: '执行法院', icon: Gavel },
    { key: 'status', label: '拍卖状态', icon: Clock },
    { key: 'bidCount', label: '报名人数', icon: Eye },
    { key: 'viewerCount', label: '关注人数', icon: Eye },
  ]},
  { key: 'risk', label: '风险评估', items: [
    { key: 'riskLevel', label: '风险等级', icon: AlertTriangle },
    { key: 'riskTags', label: '风险标签', icon: AlertTriangle },
  ]},
];

export default function Compare() {
  const { compareList, removeFromCompare, addToCompare, clearCompare, maxCompare } = useCompareStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['basic', 'price', 'auction', 'risk']);

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const availableProperties = mockProperties.filter(
    (p) => !compareList.find((c) => c.id === p.id)
  );

  const scores = useMemo(() => {
    return compareList.map((p) => calculateScore(p));
  }, [compareList]);

  const radarData = useMemo(() => {
    if (compareList.length === 0) return [];
    
    const dimensions = scores[0]?.dimensions.map((d) => d.name) || [];
    return dimensions.map((name) => {
      const item: Record<string, string | number> = { dimension: name };
      scores.forEach((s, i) => {
        const dim = s.dimensions.find((d) => d.name === name);
        if (dim) {
          item[`property${i}`] = (dim.score / dim.maxScore) * 100;
        }
      });
      return item;
    });
  }, [scores]);

  const getPropertyValue = (property: Property, key: string) => {
    switch (key) {
      case 'pricePerSqm':
        return formatPricePerSqm(property.startingPrice, property.area);
      case 'discountRate':
        return `${Math.round((1 - property.startingPrice / property.appraisalPrice) * 100)}%`;
      case 'startingPrice':
      case 'appraisalPrice':
      case 'deposit':
        return `¥${formatPrice(property[key])}`;
      case 'area':
        return `${property.area}㎡`;
      case 'rooms':
        return `${property.rooms}室2厅`;
      case 'buildingAge':
        return property.buildingAge ? `${property.buildingAge}年` : '-';
      case 'decoration':
        return property.decoration || '-';
      case 'status':
        return getAuctionStatusLabel(property.status);
      case 'riskLevel':
        return getRiskLevelLabel(property.riskLevel);
      case 'riskTags':
        return property.riskTags.length > 0 ? property.riskTags.join('、') : '无';
      case 'bidCount':
        return `${property.bidCount || 0}人`;
      case 'viewerCount':
        return `${property.viewerCount || 0}人`;
      default:
        return property[key as keyof Property] || '-';
    }
  };

  const isValueBetter = (key: string, value: any, allValues: any[]) => {
    if (key === 'startingPrice' || key === 'deposit' || key === 'pricePerSqm') {
      const numValues = allValues.map(v => parseFloat(v.replace(/[^\d.]/g, '')));
      const min = Math.min(...numValues);
      return parseFloat(value.replace(/[^\d.]/g, '')) === min && allValues.length > 1;
    }
    if (key === 'discountRate') {
      const numValues = allValues.map(v => parseInt(v));
      const max = Math.max(...numValues);
      return parseInt(value) === max && allValues.length > 1;
    }
    if (key === 'riskLevel') {
      const levels = { '低风险': 1, '中风险': 2, '高风险': 3 };
      const numValues = allValues.map(v => levels[v as keyof typeof levels] || 0);
      const min = Math.min(...numValues);
      return (levels[value as keyof typeof levels] || 0) === min && allValues.length > 1;
    }
    return false;
  };

  const colors = ['#0A2463', '#E0A458', '#2D6A4F'];

  return (
    <div className="min-h-screen bg-ink-50 pb-10">
      {/* Page Header */}
      <div className="hero-gradient py-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
              智能选房对比
            </h1>
            <p className="text-primary-200">
              已选择 <span className="text-gold-400 font-medium">{compareList.length}</span> / {maxCompare} 套标的进行对比
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container py-8">
        {/* Score Overview */}
        {compareList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl border border-ink-200 p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif font-bold text-xl text-ink-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-gold-500" />
                综合评分对比
              </h2>
              <button
                onClick={clearCompare}
                className="text-sm text-ink-500 hover:text-danger-600 transition-colors"
              >
                清空对比
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Radar Chart */}
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: '#4A5568', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#A0AEC0', fontSize: 10 }} />
                    {compareList.map((_, i) => (
                      <Radar
                        key={i}
                        name={`标的${i + 1}`}
                        dataKey={`property${i}`}
                        stroke={colors[i]}
                        fill={colors[i]}
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    ))}
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Score Bars */}
              <div className="space-y-4">
                {compareList.map((property, index) => (
                  <div
                  key={property.id}
                  className="bg-ink-50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors[index] }}
                      ></div>
                      <span className="font-medium text-ink-900 text-sm truncate max-w-[200px]">
                        {property.title}
                      </span>
                    </div>
                    <div className="text-2xl font-bold font-serif" style={{ color: colors[index] }}>
                      {scores[index]?.overall || 0}
                      <span className="text-sm text-ink-400 font-normal">分</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-ink-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${((scores[index]?.overall || 0) / 100) * 100}%`,
                        backgroundColor: colors[index],
                      }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {scores[index]?.dimensions.map((dim) => (
                      <div key={dim.name} className="text-center">
                        <div className="text-xs text-ink-500 mb-1">{dim.name.slice(0, 2)}</div>
                        <div className="text-sm font-medium text-ink-700">
                          {dim.score}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Compare Matrix */}
        <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
          {/* Property Headers */}
          <div className="grid grid-cols-4 border-b border-ink-200 bg-ink-50">
            <div className="p-4 font-medium text-ink-700 sticky left-0 bg-ink-50 z-10">
              对比维度
            </div>
            {compareList.map((property, index) => (
              <div
                key={property.id}
                className="p-4 border-l border-ink-200 relative"
              >
                <button
                  onClick={() => removeFromCompare(property.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-ink-100 text-ink-500 flex items-center justify-center hover:bg-danger-100 hover:text-danger-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <Link
                  to={`/detail/${property.id}`}
                  className="block"
                >
                  <div className="aspect-video rounded-lg overflow-hidden mb-3">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-medium text-ink-900 text-sm line-clamp-2 mb-2 hover:text-primary-600">
                    {property.title}
                  </h3>
                  <div className="text-lg font-bold text-primary-600 font-serif">
                    ¥{formatPrice(property.startingPrice)}
                  </div>
                </Link>
              </div>
            ))}
            {compareList.length < maxCompare && (
              <div className="p-4 border-l border-ink-200 flex items-center justify-center">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full aspect-[3/4] border-2 border-dashed border-ink-200 rounded-lg flex flex-col items-center justify-center text-ink-400 hover:border-primary-400 hover:text-primary-600 transition-colors"
                >
                  <Plus className="w-8 h-8 mb-1" />
                  <span className="text-sm">添加对比</span>
                </button>
              </div>
            )}
          </div>

          {/* Compare Categories */}
          {compareDimensions.map((category) => {
            const isExpanded = expandedCategories.includes(category.key);
            return (
              <div key={category.key} className="border-b border-ink-100 last:border-b-0">
                <button
                  onClick={() => toggleCategory(category.key)}
                  className="w-full grid grid-cols-4 bg-ink-50/50 hover:bg-ink-50 transition-colors"
                >
                  <div className="p-3 font-medium text-ink-800 flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-ink-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-ink-400" />
                    )}
                    {category.label}
                  </div>
                  <div className="col-span-3"></div>
                </button>

                {isExpanded && category.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  const allValues = compareList.map((p) => getPropertyValue(p, item.key));
                  return (
                    <div
                      key={item.key}
                      className={cn(
                        'grid grid-cols-4 hover:bg-ink-50/30 transition-colors',
                        itemIndex % 2 === 0 ? 'bg-white' : 'bg-ink-50/20'
                      )}
                    >
                      <div className="p-3 text-sm text-ink-600 flex items-center gap-2">
                        <Icon className="w-4 h-4 text-ink-400" />
                        {item.label}
                      </div>
                      {compareList.map((property) => {
                        const value = getPropertyValue(property, item.key);
                        const better = isValueBetter(item.key, value, allValues);
                        return (
                          <div
                            key={property.id}
                            className="p-3 border-l border-ink-100 text-sm text-center"
                          >
                            {item.key === 'status' ? (
                              <span className={cn('tag mx-auto', getAuctionStatusClass(property.status))}>
                                {value}
                              </span>
                            ) : item.key === 'riskLevel' ? (
                              <span className={cn('tag mx-auto', getRiskLevelClass(property.riskLevel))}>
                                {value}
                              </span>
                            ) : item.key === 'riskTags' ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {property.riskTags.length > 0 ? (
                                  property.riskTags.map((tag) => (
                                    <span key={tag} className="tag tag-warning text-xs">
                                      {tag}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-ink-400">-</span>
                                )}
                              </div>
                            ) : (
                              <span className={cn(
                                better && 'text-success-600 font-medium'
                              )}>
                                {value}
                                {better && <CheckCircle2 className="w-3.5 h-3.5 inline ml-1" />}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {compareList.length < maxCompare && (
                        <div className="p-3 border-l border-ink-100"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {compareList.length === 0 && (
          <div className="bg-white rounded-xl border border-ink-200 py-16 text-center">
            <div className="w-20 h-20 bg-ink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gavel className="w-10 h-10 text-ink-300" />
            </div>
            <h3 className="text-lg font-medium text-ink-700 mb-2">还没有添加对比标的</h3>
            <p className="text-sm text-ink-500 mb-6 max-w-sm mx-auto">
              从标的列表中选择最多 {maxCompare} 套房产进行多维度对比，帮您做出更明智的选择
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/list" className="btn-primary">
                去选房
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-secondary"
              >
                <Plus className="w-4 h-4 mr-2" />
                快速添加
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-ink-200 flex items-center justify-between">
              <h3 className="font-serif font-bold text-xl text-ink-900">
                添加对比标的
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-ink-400 hover:text-ink-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableProperties.map((property) => {
                  const isFull = compareList.length >= maxCompare;
                  return (
                    <div
                      key={property.id}
                      className={cn(
                        'border rounded-lg overflow-hidden transition-all',
                        isFull
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:border-primary-300 hover:shadow-md cursor-pointer'
                      )}
                      onClick={() => {
                        if (!isFull) {
                          addToCompare(property);
                          if (compareList.length + 1 >= maxCompare) {
                            setShowAddModal(false);
                          }
                        }
                      }}
                    >
                      <div className="flex">
                        <div className="w-24 h-24 flex-shrink-0">
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3 flex-1 min-w-0">
                          <h4 className="font-medium text-ink-900 text-sm line-clamp-2 mb-1">
                            {property.title}
                          </h4>
                          <p className="text-xs text-ink-500 line-clamp-1 mb-2">
                            {property.address}
                          </p>
                          <div className="text-primary-600 font-bold font-serif">
                            ¥{formatPrice(property.startingPrice)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {availableProperties.length === 0 && (
                <div className="text-center py-8 text-ink-500">
                  暂无可添加的标的
                </div>
              )}
            </div>

            <div className="p-4 bg-ink-50 border-t border-ink-200 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-primary"
              >
                完成
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
