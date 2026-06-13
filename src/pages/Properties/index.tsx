import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Eye,
  EyeOff,
  Heart,
  Building2,
  Ruler,
  Banknote,
  ShieldCheck,
  Filter,
  ChevronDown,
  ChevronRight,
  Layers,
  Maximize2,
  Box,
  Flame,
  type LucideIcon,
} from 'lucide-react';
import type {
  Property,
  PropertyStatus,
  PropertyType,
  FireInspectionStatus,
} from '@/types';
import { mockProperties } from '@/mock';
import { cn } from '@/lib/utils';

const statusColorMap: Record<PropertyStatus, string> = {
  待出租: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  出租中: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  已租出: 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30',
  装修中: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  维护中: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

const fireStatusColorMap: Record<FireInspectionStatus, string> = {
  已通过: 'text-emerald-400',
  待验收: 'text-amber-400',
  整改中: 'text-rose-400',
  未申请: 'text-neutral-400',
};

const propertyTypes: PropertyType[] = ['写字楼', '商铺', '厂房', '产业园', '综合体'];
const propertyStatuses: PropertyStatus[] = ['待出租', '出租中', '已租出', '装修中', '维护中'];
const fireStatuses: FireInspectionStatus[] = ['已通过', '待验收', '整改中', '未申请'];
const districts = ['浦东新区', '朝阳区', '南山区', '工业园区', '余杭区', '锦江区', '天河区'];

type SpecItem = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  colorClass?: string;
};

function PropertyCard({ property, index }: { property: Property; index: number }) {
  const navigate = useNavigate();
  const thumbnail = property.images.find((img) => img.type === 'thumbnail');
  const hasVr = property.images.some((img) => img.isVr);

  const specItems: SpecItem[] = [
    { icon: Maximize2, label: '面积', value: property.spec.area, unit: '㎡' },
    { icon: Layers, label: '层高', value: property.spec.ceilingHeight, unit: 'm' },
    { icon: Box, label: '承重', value: property.spec.loadCapacity, unit: 'kg/㎡' },
    {
      icon: ShieldCheck,
      label: '消防',
      value: property.ownership.fireInspectionStatus,
      colorClass: fireStatusColorMap[property.ownership.fireInspectionStatus],
    },
  ];

  const parsePaymentMethod = (method: string) => {
    const cnNumMap: Record<string, string> = { '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6' };
    const match = method.match(/押([一二三四五六\d])付([一二三四五六\d])/);
    if (match) {
      return {
        deposit: cnNumMap[match[1]] || match[1],
        pay: cnNumMap[match[2]] || match[2],
      };
    }
    return { deposit: '1', pay: '3' };
  };

  const { deposit, pay } = parsePaymentMethod(property.rentClause.paymentMethod);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className="card-base group cursor-pointer"
      onClick={() => navigate(`/properties/${property.id}`)}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-56 md:w-64 shrink-0 overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail.url}
              alt={property.name}
              className="w-full h-48 sm:h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-48 sm:h-full bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center">
              <Building2 className="w-16 h-16 text-gold-400/40" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-transparent to-transparent" />

          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border backdrop-blur-sm',
                statusColorMap[property.status]
              )}
            >
              {property.status}
            </span>
          </div>

          {hasVr && (
            <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gold-500/20 border border-gold-500/40 text-gold-300 text-[11px] font-semibold backdrop-blur-sm">
              <Eye className="w-3 h-3" />
              VR全景
            </div>
          )}

          <button
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-primary-900/60 backdrop-blur-sm border border-gold-500/20 flex items-center justify-center text-neutral-300 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Heart className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-5 flex flex-col min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-neutral-100 group-hover:text-gold-300 transition-colors truncate">
                {property.name}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-neutral-400">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-gold-400/60" />
                <span className="truncate">
                  {property.location.city} · {property.location.district} · {property.location.address}
                </span>
              </div>
            </div>
            <span className="chip chip-gold shrink-0">
              <Building2 className="w-3 h-3" />
              {property.type}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {specItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-lg bg-primary-900/40 border border-gold-500/10 p-2.5 text-center"
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 mx-auto mb-1',
                      item.colorClass || 'text-gold-400/70'
                    )}
                  />
                  <p className="text-[10px] text-neutral-500">{item.label}</p>
                  <p
                    className={cn(
                      'text-sm font-semibold mt-0.5',
                      item.colorClass || 'text-neutral-100'
                    )}
                  >
                    {item.value}
                    {item.unit && (
                      <span className="text-[10px] text-neutral-400 font-normal ml-0.5">
                        {item.unit}
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-end gap-4">
            <div>
              <p className="text-[11px] text-neutral-500">租金单价</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
                  ¥{property.rentClause.monthlyRent}
                </span>
                <span className="text-xs text-neutral-400">
                  /{property.rentClause.rentUnit.replace('元/', '')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span className="inline-flex items-center gap-1">
                <Banknote className="w-3 h-3" />
                押{deposit}付{pay}
              </span>
              <span className="inline-flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400/70" />
                免租期{property.rentClause.freeRentDays}天
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {property.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="chip text-[11px] py-0.5">
                {tag}
              </span>
            ))}
            {property.tags.length > 4 && (
              <span className="chip text-[11px] py-0.5">+{property.tags.length - 4}</span>
            )}
          </div>

          <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-neutral-400">
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {property.totalViews.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5 text-gold-400/70" />
                VR {property.vrViews.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400/70" />
                意向 {property.intentionCount}
              </span>
            </div>
            <button
              className="btn-gold !py-1.5 !px-3.5 !text-xs"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/properties/${property.id}`);
              }}
            >
              查看详情
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

type FilterState = {
  keyword: string;
  type: PropertyType | '全部';
  areaRange: [number, number] | null;
  priceRange: [number, number] | null;
  district: string;
  fireStatus: FireInspectionStatus | '全部';
  hasVr: boolean | null;
};

const initialFilters: FilterState = {
  keyword: '',
  type: '全部',
  areaRange: null,
  priceRange: null,
  district: '全部',
  fireStatus: '全部',
  hasVr: null,
};

export default function Properties() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [showFilters, setShowFilters] = useState(true);

  const filteredProperties = useMemo(() => {
    return mockProperties.filter((p) => {
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        if (
          !p.name.toLowerCase().includes(kw) &&
          !p.location.address.toLowerCase().includes(kw) &&
          !p.code.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      if (filters.type !== '全部' && p.type !== filters.type) return false;
      if (filters.district !== '全部' && p.location.district !== filters.district) return false;
      if (filters.fireStatus !== '全部' && p.ownership.fireInspectionStatus !== filters.fireStatus)
        return false;
      if (filters.areaRange) {
        if (p.spec.area < filters.areaRange[0] || p.spec.area > filters.areaRange[1]) return false;
      }
      if (filters.priceRange) {
        if (p.rentClause.monthlyRent < filters.priceRange[0] || p.rentClause.monthlyRent > filters.priceRange[1])
          return false;
      }
      if (filters.hasVr !== null) {
        const hasVr = p.images.some((img) => img.isVr);
        if (hasVr !== filters.hasVr) return false;
      }
      return true;
    });
  }, [filters]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-mesh-tech p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <h1 className="text-2xl font-bold animate-shimmer-gold">房源管理</h1>
            <p className="mt-1 text-sm text-neutral-400">
              共 <span className="text-gold-300 font-semibold">{filteredProperties.length}</span> 套房源
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary">
              <Filter className="w-4 h-4" />
              批量操作
            </button>
            <button className="btn-gold" onClick={() => navigate('/properties/publish')}>
              <Ruler className="w-4 h-4" />
              发布房源
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="card-base p-4"
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="搜索房源名称、地址、编号..."
                  value={filters.keyword}
                  onChange={(e) => updateFilter('keyword', e.target.value)}
                  className="input-tech pl-10"
                />
              </div>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  'btn-primary !px-4',
                  showFilters && 'ring-2 ring-gold-400/50'
                )}
              >
                <Filter className="w-4 h-4" />
                高级筛选
                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-transform',
                    showFilters && 'rotate-180'
                  )}
                />
              </button>
              <button
                onClick={() => setFilters(initialFilters)}
                className="btn-primary !bg-transparent !border-neutral-500/30 hover:!border-gold-500/40"
              >
                重置
              </button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 pt-2 overflow-hidden"
              >
                <div className="divider-gold" />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      房源类型
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => updateFilter('type', e.target.value as FilterState['type'])}
                      className="input-tech"
                    >
                      <option value="全部">全部类型</option>
                      {propertyTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      所在区域
                    </label>
                    <select
                      value={filters.district}
                      onChange={(e) => updateFilter('district', e.target.value)}
                      className="input-tech"
                    >
                      <option value="全部">全部区域</option>
                      {districts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      消防验收状态
                    </label>
                    <select
                      value={filters.fireStatus}
                      onChange={(e) =>
                        updateFilter('fireStatus', e.target.value as FilterState['fireStatus'])
                      }
                      className="input-tech"
                    >
                      <option value="全部">全部状态</option>
                      {fireStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      VR全景
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateFilter('hasVr', null)}
                        className={cn(
                          'flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all',
                          filters.hasVr === null
                            ? 'bg-gold-500/15 border-gold-500/40 text-gold-300'
                            : 'bg-primary-900/40 border-neutral-500/20 text-neutral-400 hover:border-neutral-500/40'
                        )}
                      >
                        全部
                      </button>
                      <button
                        onClick={() => updateFilter('hasVr', true)}
                        className={cn(
                          'flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all',
                          filters.hasVr === true
                            ? 'bg-gold-500/15 border-gold-500/40 text-gold-300'
                            : 'bg-primary-900/40 border-neutral-500/20 text-neutral-400 hover:border-neutral-500/40'
                        )}
                      >
                        有VR
                      </button>
                      <button
                        onClick={() => updateFilter('hasVr', false)}
                        className={cn(
                          'flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all',
                          filters.hasVr === false
                            ? 'bg-gold-500/15 border-gold-500/40 text-gold-300'
                            : 'bg-primary-900/40 border-neutral-500/20 text-neutral-400 hover:border-neutral-500/40'
                        )}
                      >
                        无VR
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      面积区间 (㎡)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="最小"
                        value={filters.areaRange?.[0] ?? ''}
                        onChange={(e) => {
                          const min = e.target.value ? Number(e.target.value) : 0;
                          const max = filters.areaRange?.[1] ?? 100000;
                          updateFilter('areaRange', [min, max]);
                        }}
                        className="input-tech"
                      />
                      <span className="text-neutral-500">—</span>
                      <input
                        type="number"
                        placeholder="最大"
                        value={filters.areaRange?.[1] ?? ''}
                        onChange={(e) => {
                          const min = filters.areaRange?.[0] ?? 0;
                          const max = e.target.value ? Number(e.target.value) : 100000;
                          updateFilter('areaRange', [min, max]);
                        }}
                        className="input-tech"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      租金区间 (元/㎡·天)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="最小"
                        value={filters.priceRange?.[0] ?? ''}
                        onChange={(e) => {
                          const min = e.target.value ? Number(e.target.value) : 0;
                          const max = filters.priceRange?.[1] ?? 1000;
                          updateFilter('priceRange', [min, max]);
                        }}
                        className="input-tech"
                      />
                      <span className="text-neutral-500">—</span>
                      <input
                        type="number"
                        placeholder="最大"
                        value={filters.priceRange?.[1] ?? ''}
                        onChange={(e) => {
                          const min = filters.priceRange?.[0] ?? 0;
                          const max = e.target.value ? Number(e.target.value) : 1000;
                          updateFilter('priceRange', [min, max]);
                        }}
                        className="input-tech"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    房源状态
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['全部', ...propertyStatuses] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          // 状态筛选可以后续扩展，这里先做视觉效果
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary-900/40 border border-neutral-500/20 text-neutral-300 hover:border-gold-500/40 hover:text-gold-300 transition-all"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredProperties.map((property, index) => (
            <PropertyCard key={property.id} property={property} index={index} />
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card-base p-16 text-center"
          >
            <Building2 className="w-16 h-16 mx-auto text-neutral-500/40" />
            <p className="mt-4 text-neutral-400">没有找到符合条件的房源</p>
            <button
              onClick={() => setFilters(initialFilters)}
              className="btn-primary mt-4"
            >
              清空筛选条件
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
