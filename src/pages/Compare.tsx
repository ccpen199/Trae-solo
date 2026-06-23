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
  Wallet,
  UserCheck,
  Stamp,
  Zap,
  Award,
  BadgeDollarSign,
  ShieldCheck,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
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

function CandidateCard({ property, isFull, onAdd }: { property: Property; isFull: boolean; onAdd: () => void }) {
  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-all',
        isFull
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-primary-300 hover:shadow-md cursor-pointer'
      )}
      onClick={() => { if (!isFull) onAdd(); }}
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
          <p className="text-xs text-ink-500 line-clamp-1 mb-1">
            {property.address}
          </p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-ink-400">{property.district}</span>
            <span className="text-xs text-ink-300">|</span>
            <span className="text-xs text-ink-400">{property.rooms}室{property.halls}厅</span>
            <span className="text-xs text-ink-300">|</span>
            <span className="text-xs text-ink-400">{property.area}㎡</span>
          </div>
          <div className="text-primary-600 font-bold font-serif">
            ¥{formatPrice(property.startingPrice)}
          </div>
        </div>
      </div>
    </div>
  );
}

const previewMatrixRows = [
  { key: 'community', label: '小区名称', numeric: false },
  { key: 'rooms', label: '户型', numeric: false },
  { key: 'area', label: '面积', numeric: true, higherBetter: true },
  { key: 'startingPrice', label: '起拍价', numeric: true, higherBetter: false },
  { key: 'appraisalPrice', label: '评估价', numeric: true, higherBetter: false },
  { key: 'discountRate', label: '折扣率', numeric: true, higherBetter: true },
  { key: 'pricePerSqm', label: '单价/㎡', numeric: true, higherBetter: false },
  { key: 'buildingAge', label: '楼龄', numeric: true, higherBetter: false },
  { key: 'riskLevel', label: '风险等级', numeric: false },
  { key: 'bidCount', label: '报名人数', numeric: true, higherBetter: false },
];

function PreviewMatrixRow({ label, values, isOptimalList }: { label: string; values: React.ReactNode[]; isOptimalList: boolean[] }) {
  return (
    <div className="grid grid-cols-4 border-b border-ink-100 last:border-b-0 hover:bg-ink-50/30 transition-colors">
      <div className="p-3 text-sm text-ink-600 flex items-center gap-2 bg-ink-50/40">
        {label}
      </div>
      {values.map((val, idx) => (
        <div
          key={idx}
          className={cn(
            'p-3 border-l border-ink-100 text-sm text-center flex items-center justify-center gap-1',
            isOptimalList[idx] && 'bg-success-50 text-success-700 font-medium'
          )}
        >
          {val}
          {isOptimalList[idx] && <CheckCircle2 className="w-3.5 h-3.5 text-success-600 flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}

export default function Compare() {
  const { compareList, removeFromCompare, addToCompare, clearCompare, maxCompare, isInCompare } = useCompareStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['basic', 'price', 'auction', 'risk']);
  const [expandedDistricts, setExpandedDistricts] = useState<string[]>([]);

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleDistrict = (district: string) => {
    setExpandedDistricts((prev) =>
      prev.includes(district) ? prev.filter((d) => d !== district) : [...prev, district]
    );
  };

  const primaryDistrict = compareList.length > 0 ? compareList[0].district : null;

  const allAvailable = mockProperties.filter(
    (p) => !compareList.find((c) => c.id === p.id)
  );

  const sameDistrictProperties = useMemo(() => {
    if (!primaryDistrict) return allAvailable;
    return allAvailable.filter((p) => p.district === primaryDistrict);
  }, [allAvailable, primaryDistrict]);

  const otherDistrictProperties = useMemo(() => {
    if (!primaryDistrict) return [];
    return allAvailable.filter((p) => p.district !== primaryDistrict);
  }, [allAvailable, primaryDistrict]);

  const displayedAvailable = selectedDistrict
    ? allAvailable.filter((p) => p.district === selectedDistrict)
    : allAvailable;

  const districtsInAvailable = [...new Set(allAvailable.map((p) => p.district))];

  const gridCols = compareList.length >= maxCompare ? compareList.length + 1 : compareList.length + 2;

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
        return `${property.rooms}室${property.halls}厅`;
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

  const recommendedByDistrict = useMemo(() => {
    const districts = [...new Set(mockProperties.map((p) => p.district))];
    return districts.map((district) => {
      const list = mockProperties
        .filter((p) => p.district === district)
        .sort((a, b) => (b.appraisalPrice - b.startingPrice) / b.appraisalPrice - (a.appraisalPrice - a.startingPrice) / a.appraisalPrice)
        .slice(0, 3);
      return { district, list };
    }).filter((d) => d.list.length >= 2);
  }, []);

  const addTopFromDistrict = (district: string) => {
    const list = mockProperties
      .filter((p) => p.district === district)
      .sort((a, b) => (b.appraisalPrice - b.startingPrice) / b.appraisalPrice - (a.appraisalPrice - a.startingPrice) / a.appraisalPrice)
      .slice(0, maxCompare);
    list.forEach((p) => {
      if (!isInCompare(p.id) && compareList.length < maxCompare) {
        addToCompare(p);
      }
    });
  };

  const isValueBetter = (key: string, value: any, allValues: any[]) => {
    if (key === 'startingPrice' || key === 'deposit' || key === 'pricePerSqm') {
      const numValues = allValues.map(v => parseFloat((v || '').replace(/[^\d.]/g, '')));
      const min = Math.min(...numValues);
      return parseFloat((value || '').replace(/[^\d.]/g, '')) === min && allValues.length > 1;
    }
    if (key === 'discountRate') {
      const numValues = allValues.map(v => parseInt(v));
      const max = Math.max(...numValues);
      return parseInt(value) === max && allValues.length > 1;
    }
    if (key === 'area') {
      const numValues = allValues.map(v => parseFloat((v || '').replace(/[^\d.]/g, '')));
      const max = Math.max(...numValues);
      return parseFloat((value || '').replace(/[^\d.]/g, '')) === max && allValues.length > 1;
    }
    if (key === 'riskLevel') {
      const levels: Record<string, number> = { '低风险': 1, '中风险': 2, '高风险': 3 };
      const numValues = allValues.map(v => levels[v as keyof typeof levels] || 0);
      const min = Math.min(...numValues);
      return (levels[value as keyof typeof levels] || 0) === min && allValues.length > 1;
    }
    if (key === 'buildingAge') {
      const numValues = allValues.map(v => parseInt(v));
      const min = Math.min(...numValues);
      return parseInt(value) === min && allValues.length > 1;
    }
    return false;
  };

  const previewProperties = useMemo(() => {
    return ['p001', 'p008', 'p009'].map(id => mockProperties.find(p => p.id === id)!).filter(Boolean);
  }, []);

  const xuhuiProperties = useMemo(() => {
    return mockProperties.filter(p => p.district === '徐汇区').slice(0, 3);
  }, []);

  const yangpuProperties = useMemo(() => {
    return mockProperties.filter(p => p.district === '杨浦区').slice(0, 3);
  }, []);

  const addPreviewProperties = () => {
    previewProperties.forEach(p => {
      if (!isInCompare(p.id) && compareList.length < maxCompare) {
        addToCompare(p);
      }
    });
  };

  const isPreviewRowOptimal = (row: typeof previewMatrixRows[number], props: Property[]) => {
    const values = props.map(p => {
      switch (row.key) {
        case 'community': return p.title.split(' ').slice(1).join(' ');
        case 'rooms': return p.rooms;
        case 'area': return p.area;
        case 'startingPrice': return p.startingPrice;
        case 'appraisalPrice': return p.appraisalPrice;
        case 'discountRate': return (1 - p.startingPrice / p.appraisalPrice) * 100;
        case 'pricePerSqm': return p.startingPrice / p.area;
        case 'buildingAge': return p.buildingAge || 999;
        case 'riskLevel': return p.riskLevel;
        case 'bidCount': return p.bidCount || 0;
        default: return 0;
      }
    });

    if (!row.numeric) {
      if (row.key === 'riskLevel') {
        const levels: Record<string, number> = { 'low': 1, 'medium': 2, 'high': 3 };
        const numValues = values.map(v => levels[v as keyof typeof levels] || 0);
        const min = Math.min(...numValues);
        return values.map(v => (levels[v as keyof typeof levels] || 0) === min);
      }
      return values.map(() => false);
    }

    const numValues = values.map(v => Number(v));
    const optimal = row.higherBetter ? Math.max(...numValues) : Math.min(...numValues);
    return numValues.map(v => v === optimal);
  };

  const getPreviewCellValue = (row: typeof previewMatrixRows[number], p: Property) => {
    switch (row.key) {
      case 'community': return <span className="text-xs">{p.title.split(' ').slice(1).join(' ')}</span>;
      case 'rooms': return <span>{p.rooms}室{p.halls}厅</span>;
      case 'area': return <span>{p.area}㎡</span>;
      case 'startingPrice': return <span className="text-primary-600 font-medium">¥{formatPrice(p.startingPrice)}</span>;
      case 'appraisalPrice': return <span>¥{formatPrice(p.appraisalPrice)}</span>;
      case 'discountRate': return <span>{Math.round((1 - p.startingPrice / p.appraisalPrice) * 100)}%</span>;
      case 'pricePerSqm': return <span>{formatPricePerSqm(p.startingPrice, p.area)}</span>;
      case 'buildingAge': return <span>{p.buildingAge ? `${p.buildingAge}年` : '-'}</span>;
      case 'riskLevel': return <span className={cn('tag text-xs', getRiskLevelClass(p.riskLevel))}>{getRiskLevelLabel(p.riskLevel)}</span>;
      case 'bidCount': return <span>{p.bidCount || 0}人</span>;
      default: return '-';
    }
  };

  const aiRecommendations = useMemo(() => {
    if (compareList.length === 0) return null;

    const overallBestIdx = scores.indexOf(scores.reduce((a, b) => a.overall > b.overall ? a : b));
    const discountRates = compareList.map(p => (1 - p.startingPrice / p.appraisalPrice) * 100);
    const bestValueIdx = discountRates.indexOf(Math.max(...discountRates));
    const riskLevels = compareList.map(p => p.riskLevel);
    const riskScore: Record<string, number> = { 'low': 0, 'medium': 1, 'high': 2 };
    const lowestRiskIdx = riskLevels.indexOf(riskLevels.reduce((a, b) => (riskScore[a] || 99) < (riskScore[b] || 99) ? a : b));

    return {
      overallBest: {
        property: compareList[overallBestIdx],
        score: scores[overallBestIdx],
        reason: `综合评分最高，${scores[overallBestIdx].overall}分全方位领先`,
      },
      bestValue: {
        property: compareList[bestValueIdx],
        discount: discountRates[bestValueIdx],
        reason: `折扣率最高，省${formatPrice(compareList[bestValueIdx].appraisalPrice - compareList[bestValueIdx].startingPrice)}`,
      },
      lowestRisk: {
        property: compareList[lowestRiskIdx],
        risk: riskLevels[lowestRiskIdx],
        reason: getRiskLevelLabel(riskLevels[lowestRiskIdx]) + '，交易更安心',
      },
    };
  }, [compareList, scores]);

  const colors = ['#0A2463', '#E0A458', '#2D6A4F'];

  return (
    <div className="min-h-screen bg-ink-50 pb-10">
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
        {compareList.length === 0 && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl border border-ink-200 p-8 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold-200">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-ink-900 mb-3">
                智能选房对比矩阵
              </h2>
              <p className="text-base text-ink-500 max-w-lg mx-auto leading-relaxed">
                同区域最多3套标的并列，多维度参数差异高亮，一键识别最优标的
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl border border-ink-200 overflow-hidden shadow-sm"
            >
              <div className="bg-gradient-to-r from-primary-50 via-gold-50 to-primary-50 px-6 py-4 border-b border-ink-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink-900">浦东新区 · 同区域对比示例</h3>
                    <p className="text-xs text-ink-500">3套精选标的 · 多维度差异一眼识别</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-primary-600 text-white text-xs rounded-full font-medium">
                  预览模式
                </span>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[680px]">
                  <div className="grid grid-cols-4 bg-ink-50 border-b border-ink-200">
                    <div className="p-4 font-bold text-ink-700 bg-ink-100/50 text-sm">
                      对比维度
                    </div>
                    {previewProperties.map((p, idx) => (
                      <div key={p.id} className="p-4 border-l border-ink-200">
                        <div className="aspect-video rounded-lg overflow-hidden mb-2 relative">
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                          <span
                            className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: colors[idx] }}
                          >
                            {idx + 1}
                          </span>
                        </div>
                        <div className="text-xs text-ink-600 line-clamp-2 mb-1 min-h-[32px]">
                          {p.title.split(' ').slice(1).join(' ')}
                        </div>
                        <div className="text-sm font-bold" style={{ color: colors[idx] }}>
                          ¥{formatPrice(p.startingPrice)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {previewMatrixRows.map((row) => {
                    const optimalList = isPreviewRowOptimal(row, previewProperties);
                    const values = previewProperties.map(p => getPreviewCellValue(row, p));
                    return (
                      <PreviewMatrixRow
                        key={row.key}
                        label={row.label}
                        values={values}
                        isOptimalList={optimalList}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="bg-gradient-to-r from-gold-50 via-amber-50 to-gold-50 px-6 py-5 border-t border-gold-200">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-ink-900">对以上组合感兴趣？</p>
                      <p className="text-xs text-ink-500">一键将这3套标的加入对比，立即开始智能分析</p>
                    </div>
                  </div>
                  <button
                    onClick={addPreviewProperties}
                    className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-gold-500 to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-gold-200 hover:shadow-xl hover:from-gold-600 hover:to-amber-700 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    一键加入以上3套对比
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl border border-ink-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-ink-200 flex items-center justify-between">
                <h3 className="font-bold text-ink-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-gold-500" />
                  其他区域推荐组合
                  <span className="text-xs font-normal text-ink-400">点击展开查看详情</span>
                </h3>
                <div className="text-xs text-ink-400">共 {recommendedByDistrict.filter(d => d.district !== '浦东新区').length} 个区域</div>
              </div>

              <div className="divide-y divide-ink-100">
                {[
                  { district: '徐汇区', list: xuhuiProperties, color: 'from-rose-50 to-orange-50', accent: 'text-rose-600' },
                  { district: '杨浦区', list: yangpuProperties, color: 'from-emerald-50 to-teal-50', accent: 'text-emerald-600' },
                ].filter(group => group.list.length >= 2).map((group) => {
                  const expanded = expandedDistricts.includes(group.district);
                  return (
                    <div key={group.district}>
                      <button
                        onClick={() => toggleDistrict(group.district)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-ink-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br', group.color, 'flex items-center justify-center')}>
                            <MapPin className={cn('w-4 h-4', group.accent)} />
                          </div>
                          <div className="text-left">
                            <span className="font-medium text-ink-900">{group.district}</span>
                            <span className="text-xs text-ink-400 ml-2">{group.list.length}套精选</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex -space-x-2">
                            {group.list.slice(0, 3).map((p) => (
                              <img
                                key={p.id}
                                src={p.images[0]}
                                alt=""
                                className="w-8 h-8 rounded-full border-2 border-white object-cover"
                              />
                            ))}
                          </div>
                          {expanded ? (
                            <ChevronUp className="w-5 h-5 text-ink-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-ink-400" />
                          )}
                        </div>
                      </button>

                      {expanded && (
                        <div className={cn('px-6 pb-5 pt-1 bg-gradient-to-b', group.color, '/60')}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            {group.list.map((p, idx) => (
                              <div key={p.id} className="bg-white rounded-lg border border-ink-100 p-3 hover:shadow-md transition-shadow">
                                <div className="flex gap-3">
                                  <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden relative">
                                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                                    <span className="absolute top-1 left-1 w-4 h-4 bg-primary-600 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                                      {idx + 1}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-ink-900 line-clamp-2 mb-1">
                                      {p.title.split(' ').slice(1).join(' ')}
                                    </div>
                                    <div className="text-[11px] text-ink-400 mb-1">
                                      {p.rooms}室{p.halls}厅 · {p.area}㎡
                                    </div>
                                    <div className="text-sm font-bold text-primary-600 font-serif">
                                      ¥{formatPrice(p.startingPrice)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => addTopFromDistrict(group.district)}
                            className={cn('w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors', group.color, group.accent, 'hover:opacity-80 border border-current/30')}
                          >
                            <Plus className="w-4 h-4" />
                            一键加入{group.district}对比
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-center gap-4 pt-2"
            >
              <Link to="/list" className="btn-primary">
                浏览全部房源
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-secondary"
              >
                <Plus className="w-4 h-4 mr-2" />
                手动添加对比
              </button>
            </motion.div>
          </div>
        )}

        {compareList.length > 0 && (
          <>
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

            {aiRecommendations && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-xl p-6 mb-6 text-white shadow-xl"
              >
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 bg-gold-400 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-serif font-bold text-lg">AI 智能选房建议</h2>
                  <span className="ml-auto text-xs text-primary-200 bg-white/10 px-2.5 py-1 rounded-full">
                    基于多维度分析
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 bg-gold-400 rounded-md flex items-center justify-center">
                        <Award className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gold-200">综合最优推荐</span>
                    </div>
                    <div className="flex gap-3 mb-2">
                      <img
                        src={aiRecommendations.overallBest.property.images[0]}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover border-2 border-gold-300/50"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2 mb-1">
                          {aiRecommendations.overallBest.property.title}
                        </p>
                        <p className="text-xl font-bold font-serif text-gold-300">
                          ¥{formatPrice(aiRecommendations.overallBest.property.startingPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-primary-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold-300" />
                      <span>{aiRecommendations.overallBest.reason}</span>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 bg-emerald-400 rounded-md flex items-center justify-center">
                        <BadgeDollarSign className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-emerald-200">最具性价比</span>
                    </div>
                    <div className="flex gap-3 mb-2">
                      <img
                        src={aiRecommendations.bestValue.property.images[0]}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover border-2 border-emerald-300/50"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2 mb-1">
                          {aiRecommendations.bestValue.property.title}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-xl font-bold font-serif text-emerald-300">
                            {Math.round(aiRecommendations.bestValue.discount)}%
                          </p>
                          <span className="text-xs text-primary-200">折扣率</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-primary-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{aiRecommendations.bestValue.reason}</span>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 bg-sky-400 rounded-md flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-sky-200">风险最低</span>
                    </div>
                    <div className="flex gap-3 mb-2">
                      <img
                        src={aiRecommendations.lowestRisk.property.images[0]}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover border-2 border-sky-300/50"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2 mb-1">
                          {aiRecommendations.lowestRisk.property.title}
                        </p>
                        <p className="text-sm font-bold font-serif text-sky-300">
                          {getRiskLevelLabel(aiRecommendations.lowestRisk.risk)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-primary-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" />
                      <span>{aiRecommendations.lowestRisk.reason}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
              <div className="border-b border-ink-200 bg-ink-50" style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
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
                      <div className="aspect-video rounded-lg overflow-hidden mb-3 relative">
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                        <span
                          className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                          style={{ backgroundColor: colors[index] }}
                        >
                          {index + 1}
                        </span>
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

              {compareDimensions.map((category) => {
                const isExpanded = expandedCategories.includes(category.key);
                return (
                  <div key={category.key} className="border-b border-ink-100 last:border-b-0">
                    <button
                      onClick={() => toggleCategory(category.key)}
                      className="w-full bg-ink-50/50 hover:bg-ink-50 transition-colors"
                      style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
                    >
                      <div className="p-3 font-medium text-ink-800 flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-ink-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-ink-400" />
                        )}
                        {category.label}
                      </div>
                      <div style={{ gridColumn: `span ${gridCols - 1}` }}></div>
                    </button>

                    {isExpanded && category.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      const allValues = compareList.map((p) => getPropertyValue(p, item.key));
                      return (
                        <div
                          key={item.key}
                          className={cn(
                            'hover:bg-ink-50/30 transition-colors',
                            itemIndex % 2 === 0 ? 'bg-white' : 'bg-ink-50/20'
                          )}
                          style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
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
                                className={cn(
                                  'p-3 border-l border-ink-100 text-sm text-center',
                                  better && 'bg-success-50'
                                )}
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
                                    'inline-flex items-center gap-1',
                                    better && 'text-success-700 font-medium'
                                  )}>
                                    {value}
                                    {better && <CheckCircle2 className="w-3.5 h-3.5 text-success-600" />}
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-6 bg-white rounded-xl border border-ink-200 p-6"
            >
              <h2 className="font-serif font-bold text-xl text-ink-900 mb-6 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-primary-600" />
                交易流程闭环
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: Wallet,
                    title: '保证金监管',
                    status: compareList.some((p) => p.status === 'deposit' || p.status === 'bidding') ? 'active' : 'pending',
                    desc: '保证金通过银行第三方监管账户冻结，确保资金安全。竞拍未成功则全额退还。',
                    detail: compareList.filter((p) => p.status === 'deposit' || p.status === 'bidding').length > 0
                      ? `${compareList.filter((p) => p.status === 'deposit' || p.status === 'bidding').length}套标的需缴纳保证金`
                      : '暂无待缴纳保证金标的',
                  },
                  {
                    icon: UserCheck,
                    title: '资质审核',
                    status: 'pending',
                    desc: '竞买人需提供资金证明、征信报告，通过平台审核后方可参与竞价。',
                    detail: '请前往竞买中心完成资质认证',
                  },
                  {
                    icon: Stamp,
                    title: '成交确认',
                    status: compareList.some((p) => p.status === 'sold') ? 'active' : 'pending',
                    desc: '竞价成功后签署成交确认书，法院出具执行裁定书，完成过户登记。',
                    detail: compareList.some((p) => p.status === 'sold') ? '已有标的成交' : '暂无成交标的',
                  },
                ].map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.title}
                      className={cn(
                        'rounded-lg p-5 border-2 transition-all',
                        step.status === 'active'
                          ? 'border-primary-200 bg-primary-50/50'
                          : 'border-ink-100 bg-ink-50/30'
                      )}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          step.status === 'active' ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-400'
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-ink-900">{step.title}</h3>
                          <span className={cn(
                            'text-xs',
                            step.status === 'active' ? 'text-primary-600' : 'text-ink-400'
                          )}>
                            {step.status === 'active' ? '进行中' : '待办理'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-ink-500 mb-2 leading-relaxed">{step.desc}</p>
                      <p className="text-xs text-ink-400">{step.detail}</p>
                      <Link
                        to="/auction"
                        className="mt-3 inline-flex items-center text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        前往办理
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-ink-200 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-xl text-ink-900">
                  添加对比标的
                </h3>
                {primaryDistrict && (
                  <p className="text-sm text-ink-500 mt-1">
                    当前对比主区域：<span className="text-primary-600 font-medium">{primaryDistrict}</span>
                    · 推荐优先选择同区域标的
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-ink-400 hover:text-ink-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 pt-4 flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedDistrict(null)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-full transition-colors',
                  !selectedDistrict ? 'bg-primary-600 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                )}
              >
                全部区域
              </button>
              {districtsInAvailable.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDistrict(d)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-full transition-colors',
                    selectedDistrict === d ? 'bg-primary-600 text-white' : d === primaryDistrict ? 'bg-gold-50 text-gold-700 border border-gold-200' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                  )}
                >
                  {d}
                  {d === primaryDistrict && <span className="ml-1">★</span>}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto max-h-[55vh]">
              {primaryDistrict && sameDistrictProperties.length > 0 && !selectedDistrict && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-ink-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    同区域推荐 · {primaryDistrict}
                    <span className="text-xs text-ink-400">（对比更直观）</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sameDistrictProperties.map((property) => (
                      <CandidateCard key={property.id} property={property} isFull={compareList.length >= maxCompare} onAdd={() => {
                        addToCompare(property);
                        if (compareList.length + 1 >= maxCompare) setShowAddModal(false);
                      }} />
                    ))}
                  </div>
                </div>
              )}

              {(selectedDistrict ? displayedAvailable : otherDistrictProperties).length > 0 && (
                <div>
                  {primaryDistrict && !selectedDistrict && (
                    <h4 className="text-sm font-medium text-ink-800 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-ink-400" />
                      其他区域
                    </h4>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(selectedDistrict ? displayedAvailable : otherDistrictProperties).map((property) => (
                      <CandidateCard key={property.id} property={property} isFull={compareList.length >= maxCompare} onAdd={() => {
                        addToCompare(property);
                        if (compareList.length + 1 >= maxCompare) setShowAddModal(false);
                      }} />
                    ))}
                  </div>
                </div>
              )}

              {displayedAvailable.length === 0 && (
                <div className="text-center py-8 text-ink-500">
                  暂无可添加的标的
                </div>
              )}
            </div>

            <div className="p-4 bg-ink-50 border-t border-ink-200 flex items-center justify-between">
              <span className="text-sm text-ink-500">
                已选 {compareList.length} / {maxCompare} 套
              </span>
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
