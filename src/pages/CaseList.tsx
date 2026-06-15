import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Home,
  Ruler,
  Palette,
  Wallet,
  Building,
  X,
  Filter,
  ArrowUpDown,
  ShieldCheck,
  Star,
  Truck,
  Info,
  FileCheck,
  Award,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import CaseCard from '@/components/CaseCard';
import { mockCases, mockMaterials } from '@/mock/data';
import type { Case } from '@shared/types';

const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '重庆', '苏州', '天津'];

const houseTypes = [
  { label: '一居', value: '一室' },
  { label: '两居', value: '两室' },
  { label: '三居', value: '三室' },
  { label: '四居及以上', value: '四室' },
  { label: '复式/LOFT', value: 'LOFT' },
  { label: '别墅', value: '别墅' },
];

const styles = [
  '现代简约', '北欧风格', '新中式', '日式', '美式', '法式',
  '轻奢风格', '工业风', '极简主义', 'ins风', '欧式古典', '地中海',
];

const roomOptions = [1, 2, 3, 4, 5];

const sortOptions = [
  { value: 'newest', label: '最新发布' },
  { value: 'views', label: '热度最高' },
  { value: 'score', label: '评分最高' },
  { value: 'similarity', label: '相似度' },
];

const chineseNumMap: Record<string, number> = {
  '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
};

function extractRoomCount(houseType?: string, layout?: string): number | null {
  const text = (houseType || layout || '') as string;
  if (!text) return null;

  const digitMatch = text.match(/(\d+)\s*室/);
  if (digitMatch) {
    const num = parseInt(digitMatch[1], 10);
    if (num >= 1 && num <= 10) return num;
  }

  const chineseMatch = text.match(/([一两二三四五六七八九十])\s*室/);
  if (chineseMatch) {
    return chineseNumMap[chineseMatch[1]] || null;
  }

  const digitRoomMatch = text.match(/(\d+)\s*居/);
  if (digitRoomMatch) {
    const num = parseInt(digitRoomMatch[1], 10);
    if (num >= 1 && num <= 10) return num;
  }

  const chineseRoomMatch = text.match(/([一两二三四五六七八九十])\s*居/);
  if (chineseRoomMatch) {
    return chineseNumMap[chineseRoomMatch[1]] || null;
  }

  return null;
}

interface Filters {
  cities: string[];
  houseTypes: string[];
  styles: string[];
  rooms: number[];
  minArea: number;
  maxArea: number;
  minBudget: number;
  maxBudget: number;
  evidenceLevel: '' | 'complete' | 'good' | 'basic';
  minDesignerScore: number;
  localSupply: '' | 'available' | 'partial';
  acceptanceReview: '' | 'supervisor' | 'owner';
}

const defaultFilters: Filters = {
  cities: [],
  houseTypes: [],
  styles: [],
  rooms: [],
  minArea: 0,
  maxArea: 300,
  minBudget: 0,
  maxBudget: 1000000,
  evidenceLevel: '',
  minDesignerScore: 0,
  localSupply: '',
  acceptanceReview: '',
};

const numToChineseMap: Record<number, string> = {
  1: '一', 2: '两', 3: '三', 4: '四', 5: '五',
  6: '六', 7: '七', 8: '八', 9: '九', 10: '十',
};

function getPrimaryRoomCount(filters: Filters): number | null {
  if (filters.rooms.length > 0) {
    return filters.rooms[0];
  }
  if (filters.houseTypes.length > 0) {
    for (const ht of filters.houseTypes) {
      const count = extractRoomCount(ht);
      if (count) return count;
    }
  }
  return null;
}

function getResultDescription(filters: Filters, count: number): {
  type: 'small' | 'few' | 'normal';
  title: string;
  description: string;
} {
  const primaryRoom = getPrimaryRoomCount(filters);
  const hasSingleRoomType =
    (filters.rooms.length === 1) ||
    (filters.rooms.length === 0 && filters.houseTypes.length === 1 && !!extractRoomCount(filters.houseTypes[0]));

  if (primaryRoom === 1 && hasSingleRoomType) {
    return {
      type: 'small',
      title: '小户型精选',
      description: `为您匹配 ${count} 个一居室真实施工案例。数据持续扩盘中，建议同时参考相近面积的两居室方案。`,
    };
  }

  if (primaryRoom && hasSingleRoomType && primaryRoom >= 2 && primaryRoom <= 5) {
    const chineseNum = numToChineseMap[primaryRoom] || `${primaryRoom}`;
    return {
      type: 'normal',
      title: `${chineseNum}居精选`,
      description: `为您匹配 ${count} 个${chineseNum}居室真实施工案例，均已通过质量审核。`,
    };
  }

  if (count < 5) {
    return {
      type: 'few',
      title: '匹配结果较少',
      description: `当前筛选条件下匹配 ${count} 个案例。您可以：①放宽筛选条件 ②查看相似户型 ③扩大城市范围`,
    };
  }

  return {
    type: 'normal',
    title: '筛选结果',
    description: `为您找到 ${count} 个符合条件的真实装修案例，均已通过质量审核。`,
  };
}

export default function CaseList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlCity = searchParams.get('city');
  const urlKeyword = searchParams.get('keyword');

  const [filters, setFilters] = useState<Filters>({
    ...defaultFilters,
    cities: urlCity ? [urlCity] : [],
  });
  const [searchKeyword, setSearchKeyword] = useState(urlKeyword || '');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    setSearchKeyword(urlKeyword || '');
    setCurrentPage(1);
  }, [urlKeyword]);

  const toggleArrayItem = <T extends string | number>(arr: T[], item: T): T[] => {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  };

  const filteredCases = useMemo(() => {
    let result: Case[] = [...mockCases];

    if (filters.cities.length > 0) {
      result = result.filter((c) => filters.cities.includes(c.city));
    }

    if (filters.houseTypes.length > 0) {
      result = result.filter((c) =>
        filters.houseTypes.some((ht) => {
          const cHouseType = c.houseType || '';
          const cLayout = c.layout || '';
          if (ht === 'LOFT' || ht === '别墅') {
            return cHouseType.includes(ht) || cLayout.includes(ht);
          }
          const roomCountFromHt = extractRoomCount(ht);
          const roomCountFromCase = extractRoomCount(cHouseType, cLayout) ?? c.bedrooms ?? c.rooms ?? 0;
          if (roomCountFromHt) {
            if (ht === '四室') {
              return roomCountFromCase >= 4;
            }
            return roomCountFromCase === roomCountFromHt;
          }
          return cHouseType.includes(ht) || cLayout.includes(ht);
        })
      );
    }

    if (filters.styles.length > 0) {
      result = result.filter((c) => filters.styles.includes(c.style));
    }

    if (filters.rooms.length > 0) {
      result = result.filter((c) => {
        const roomCount = extractRoomCount(c.houseType, c.layout) ?? c.bedrooms ?? c.rooms ?? 0;
        if (filters.rooms.includes(5)) {
          return roomCount >= 5;
        }
        return filters.rooms.includes(roomCount);
      });
    }

    result = result.filter((c) => c.area >= filters.minArea && c.area <= filters.maxArea);
    result = result.filter((c) => c.budget >= filters.minBudget && c.budget <= filters.maxBudget);

    if (filters.evidenceLevel) {
      result = result.filter((c) => {
        const evidenceScore = [!!c.floorPlanSvg, !!c.electricPlanSvg, (c.acceptancePhotos?.length ?? 0) > 0, (c.materials?.length ?? 0) > 0].filter(Boolean).length;
        if (filters.evidenceLevel === 'complete') return evidenceScore === 4;
        if (filters.evidenceLevel === 'good') return evidenceScore >= 3;
        if (filters.evidenceLevel === 'basic') return evidenceScore >= 2;
        return true;
      });
    }

    if (filters.minDesignerScore > 0) {
      result = result.filter((c) => (c.qualityScore || 0) >= filters.minDesignerScore);
    }

    if (filters.localSupply) {
      result = result.filter((c) => {
        const localSupplyCount = (c.materials || []).filter((m) => {
          const mockMat = mockMaterials.find((mm) => mm.id === m.materialId);
          return (mockMat?.localSuppliers?.length ?? 0) > 0;
        }).length;
        if (filters.localSupply === 'available') return localSupplyCount >= 3;
        if (filters.localSupply === 'partial') return localSupplyCount >= 1;
        return true;
      });
    }

    if (filters.acceptanceReview) {
      result = result.filter((c) => {
        const acceptanceCount = c.acceptancePhotos?.length ?? 0;
        const stageCount = new Set(c.acceptancePhotos?.map((p) => p.stage)).size;
        if (filters.acceptanceReview === 'supervisor') {
          return stageCount >= 2 && acceptanceCount >= 6;
        }
        if (filters.acceptanceReview === 'owner') {
          return acceptanceCount >= 4;
        }
        return true;
      });
    }

    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(kw) ||
          c.city.toLowerCase().includes(kw) ||
          c.style.toLowerCase().includes(kw) ||
          (c.district || '').toLowerCase().includes(kw) ||
          (c.tags || []).some((t) => t.toLowerCase().includes(kw))
      );
    }

    switch (sortBy) {
      case 'views':
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'score':
        result.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
        break;
      case 'similarity':
        result.sort((a, b) => (b.qualityScore || 0) + (b.views || 0) / 1000 - ((a.qualityScore || 0) + (a.views || 0) / 1000));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [filters, searchKeyword, sortBy]);

  const totalPages = Math.ceil(filteredCases.length / pageSize);
  const paginatedCases = filteredCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const similarCases = useMemo(() => {
    const currentRoomCount = getPrimaryRoomCount(filters);

    if (!currentRoomCount || filteredCases.length >= 3) return [];

    const filteredIds = new Set(filteredCases.map((c) => c.id));
    const similar = mockCases.filter((c) => {
      if (filteredIds.has(c.id)) return false;
      const caseRoomCount = extractRoomCount(c.houseType, c.layout) ?? c.bedrooms ?? c.rooms ?? 0;
      return caseRoomCount === currentRoomCount + 1 || caseRoomCount === currentRoomCount - 1 ||
        (c.houseType?.includes('LOFT'));
    }).slice(0, 2);

    return similar;
  }, [filteredCases, filters]);

  const activeFilterCount =
    filters.cities.length +
    filters.houseTypes.length +
    filters.styles.length +
    filters.rooms.length +
    (filters.minArea > 0 || filters.maxArea < 300 ? 1 : 0) +
    (filters.minBudget > 0 || filters.maxBudget < 1000000 ? 1 : 0) +
    (filters.evidenceLevel !== '' ? 1 : 0) +
    (filters.minDesignerScore > 0 ? 1 : 0) +
    (filters.localSupply !== '' ? 1 : 0) +
    (filters.acceptanceReview !== '' ? 1 : 0);

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSearchKeyword('');
    setCurrentPage(1);
  };

  const getActiveFilters = () => {
    const activeFilters: Array<{ key: string; label: string; value: string | number }> = [];

    filters.cities.forEach((city) => {
      activeFilters.push({ key: `city-${city}`, label: '城市', value: city });
    });

    filters.houseTypes.forEach((ht) => {
      const htLabel = houseTypes.find((h) => h.value === ht)?.label || ht;
      activeFilters.push({ key: `housetype-${ht}`, label: '户型', value: htLabel });
    });

    filters.rooms.forEach((room) => {
      activeFilters.push({ key: `room-${room}`, label: '居室', value: `${room}室` });
    });

    filters.styles.forEach((style) => {
      activeFilters.push({ key: `style-${style}`, label: '风格', value: style });
    });

    if (filters.minArea > 0 || filters.maxArea < 300) {
      activeFilters.push({
        key: 'area',
        label: '面积',
        value: `${filters.minArea}-${filters.maxArea}㎡`,
      });
    }

    if (filters.minBudget > 0 || filters.maxBudget < 1000000) {
      activeFilters.push({
        key: 'budget',
        label: '预算',
        value: `${formatBudget(filters.minBudget)}-${formatBudget(filters.maxBudget)}`,
      });
    }

    if (filters.evidenceLevel) {
      const evidenceLabels: Record<string, string> = { complete: '完整', good: '良好', basic: '一般' };
      activeFilters.push({ key: 'evidence', label: '证据完整度', value: evidenceLabels[filters.evidenceLevel] });
    }

    if (filters.minDesignerScore > 0) {
      activeFilters.push({ key: 'designerScore', label: '设计师评分', value: `${filters.minDesignerScore}+` });
    }

    if (filters.localSupply) {
      const supplyLabels: Record<string, string> = { available: '供应充足', partial: '部分供应' };
      activeFilters.push({ key: 'localSupply', label: '本地建材供应', value: supplyLabels[filters.localSupply] });
    }

    if (filters.acceptanceReview) {
      const reviewLabels: Record<string, string> = { supervisor: '有监理复查', owner: '有业主验收' };
      activeFilters.push({ key: 'acceptanceReview', label: '验收复查', value: reviewLabels[filters.acceptanceReview] });
    }

    return activeFilters;
  };

  const removeFilter = (key: string) => {
    const [type, value] = key.split('-');
    setCurrentPage(1);

    switch (type) {
      case 'city':
        setFilters((f) => ({ ...f, cities: f.cities.filter((c) => c !== value) }));
        break;
      case 'housetype':
        setFilters((f) => ({ ...f, houseTypes: f.houseTypes.filter((ht) => ht !== value) }));
        break;
      case 'room':
        setFilters((f) => ({ ...f, rooms: f.rooms.filter((r) => r !== Number(value)) }));
        break;
      case 'style':
        setFilters((f) => ({ ...f, styles: f.styles.filter((s) => s !== value) }));
        break;
      case 'area':
        setFilters((f) => ({ ...f, minArea: 0, maxArea: 300 }));
        break;
      case 'budget':
        setFilters((f) => ({ ...f, minBudget: 0, maxBudget: 1000000 }));
        break;
      case 'evidence':
        setFilters((f) => ({ ...f, evidenceLevel: '' }));
        break;
      case 'designerScore':
        setFilters((f) => ({ ...f, minDesignerScore: 0 }));
        break;
      case 'localSupply':
        setFilters((f) => ({ ...f, localSupply: '' }));
        break;
      case 'acceptanceReview':
        setFilters((f) => ({ ...f, acceptanceReview: '' }));
        break;
    }
  };

  const activeFilters = getActiveFilters();
  const indexedCaseCount = 148632;
  const avgQualityScore =
    filteredCases.length > 0
      ? filteredCases.reduce((sum, item) => sum + (item.qualityScore || 0), 0) / filteredCases.length
      : 0;
  const recheckRecordCount = filteredCases.reduce(
    (sum, item) => sum + (item.acceptancePhotos?.length || 0),
    0
  );
  const fullDeliveryCount = filteredCases.filter(
    (item) =>
      !!item.floorPlanSvg &&
      !!item.electricPlanSvg &&
      !!item.waterPlanSvg &&
      (item.acceptancePhotos?.length || 0) > 0 &&
      (item.materials?.length || 0) > 0
  ).length;

  const formatBudget = (budget: number) => {
    if (budget >= 10000) {
      return `${(budget / 10000).toFixed(0)}万`;
    }
    return `${budget}元`;
  };

  const FilterSection = ({
    title,
    icon: Icon,
    children,
  }: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
  }) => (
    <div className="pb-5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <span className="font-semibold text-gray-900 dark:text-white text-sm">{title}</span>
      </div>
      {children}
    </div>
  );

  const ChipButton = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
        active
          ? 'bg-primary text-white border-primary shadow-sm'
          : 'bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary hover:text-primary dark:hover:border-primary-400 dark:hover:text-primary-400'
      }`}
    >
      {children}
    </button>
  );

  const FilterPanel = () => (
    <div className="space-y-5">
      <FilterSection title="城市" icon={MapPin}>
        <div className="flex flex-wrap gap-2">
          {cities.map((city) => (
            <ChipButton
              key={city}
              active={filters.cities.includes(city)}
              onClick={() => {
                setFilters((f) => ({ ...f, cities: toggleArrayItem(f.cities, city) }));
                setCurrentPage(1);
              }}
            >
              {city}
            </ChipButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="户型" icon={Home}>
        <div className="flex flex-wrap gap-2">
          {houseTypes.map((ht) => (
            <ChipButton
              key={ht.value}
              active={filters.houseTypes.includes(ht.value)}
              onClick={() => {
                setFilters((f) => ({ ...f, houseTypes: toggleArrayItem(f.houseTypes, ht.value) }));
                setCurrentPage(1);
              }}
            >
              {ht.label}
            </ChipButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="居室数" icon={Building}>
        <div className="flex flex-wrap gap-2">
          {roomOptions.map((room) => (
            <ChipButton
              key={room}
              active={filters.rooms.includes(room)}
              onClick={() => {
                setFilters((f) => ({ ...f, rooms: toggleArrayItem(f.rooms, room) }));
                setCurrentPage(1);
              }}
            >
              {room}室
            </ChipButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="面积区间" icon={Ruler}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={300}
              value={filters.minArea}
              onChange={(e) => {
                const val = Math.min(Number(e.target.value), filters.maxArea);
                setFilters((f) => ({ ...f, minArea: val }));
                setCurrentPage(1);
              }}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={300}
              value={filters.maxArea}
              onChange={(e) => {
                const val = Math.max(Number(e.target.value), filters.minArea);
                setFilters((f) => ({ ...f, maxArea: val }));
                setCurrentPage(1);
              }}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <span className="px-3 py-1 bg-gray-50 dark:bg-slate-700 rounded-lg font-medium">
              {filters.minArea}㎡
            </span>
            <span className="text-gray-400">—</span>
            <span className="px-3 py-1 bg-gray-50 dark:bg-slate-700 rounded-lg font-medium">
              {filters.maxArea}㎡
            </span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="风格" icon={Palette}>
        <div className="flex flex-wrap gap-2">
          {styles.map((style) => (
            <ChipButton
              key={style}
              active={filters.styles.includes(style)}
              onClick={() => {
                setFilters((f) => ({ ...f, styles: toggleArrayItem(f.styles, style) }));
                setCurrentPage(1);
              }}
            >
              {style}
            </ChipButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="预算区间" icon={Wallet}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={filters.minBudget / 10000}
              onChange={(e) => {
                const val = Math.min(Number(e.target.value) * 10000, filters.maxBudget);
                setFilters((f) => ({ ...f, minBudget: val }));
                setCurrentPage(1);
              }}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={filters.maxBudget / 10000}
              onChange={(e) => {
                const val = Math.max(Number(e.target.value) * 10000, filters.minBudget);
                setFilters((f) => ({ ...f, maxBudget: val }));
                setCurrentPage(1);
              }}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <span className="px-3 py-1 bg-gray-50 dark:bg-slate-700 rounded-lg font-medium text-accent">
              {formatBudget(filters.minBudget)}
            </span>
            <span className="text-gray-400">—</span>
            <span className="px-3 py-1 bg-gray-50 dark:bg-slate-700 rounded-lg font-medium text-accent">
              {formatBudget(filters.maxBudget)}
            </span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="证据完整度" icon={ShieldCheck}>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '完整', value: 'complete' as const },
            { label: '良好', value: 'good' as const },
            { label: '一般', value: 'basic' as const },
            { label: '不限', value: '' as const },
          ].map((opt) => (
            <ChipButton
              key={opt.value}
              active={filters.evidenceLevel === opt.value}
              onClick={() => {
                setFilters((f) => ({ ...f, evidenceLevel: opt.value }));
                setCurrentPage(1);
              }}
            >
              {opt.label}
            </ChipButton>
          ))}
        </div>
        <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-2 flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5 text-primary" />
            可交付资料包含：
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <span><span className="font-medium">完整：</span>户型图SVG · 水电点位图 · 验收照片集 · 建材清单 · 施工时间线 · 质量报告</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span><span className="font-medium">良好：</span>户型图SVG · 水电点位图 · 验收照片 · 主要建材清单</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span><span className="font-medium">一般：</span>户型图 · 基本建材信息 · 部分验收记录</span>
            </div>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="设计师评分" icon={Star}>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '4.5+', value: 4.5 },
            { label: '4.0+', value: 4.0 },
            { label: '3.5+', value: 3.5 },
            { label: '不限', value: 0 },
          ].map((opt) => (
            <ChipButton
              key={opt.value}
              active={filters.minDesignerScore === opt.value}
              onClick={() => {
                setFilters((f) => ({ ...f, minDesignerScore: opt.value }));
                setCurrentPage(1);
              }}
            >
              {opt.label}
            </ChipButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="本地建材供应" icon={Truck}>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '供应充足', value: 'available' as const },
            { label: '部分供应', value: 'partial' as const },
            { label: '不限', value: '' as const },
          ].map((opt) => (
            <ChipButton
              key={opt.value}
              active={filters.localSupply === opt.value}
              onClick={() => {
                setFilters((f) => ({ ...f, localSupply: opt.value }));
                setCurrentPage(1);
              }}
            >
              {opt.label}
            </ChipButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="验收复查" icon={CheckCircle2}>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '有监理复查', value: 'supervisor' as const },
            { label: '有业主验收', value: 'owner' as const },
            { label: '全部', value: '' as const },
          ].map((opt) => (
            <ChipButton
              key={opt.value}
              active={filters.acceptanceReview === opt.value}
              onClick={() => {
                setFilters((f) => ({ ...f, acceptanceReview: opt.value }));
                setCurrentPage(1);
              }}
            >
              {opt.label}
            </ChipButton>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          <span>包含隐蔽工程、泥木、油漆三阶段验收记录</span>
        </div>
      </FilterSection>

      {activeFilterCount > 0 && (
        <button
          onClick={resetFilters}
          className="w-full py-2.5 text-sm text-gray-500 hover:text-primary border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary transition-colors duration-200 flex items-center justify-center gap-1"
        >
          <X className="w-4 h-4" />
          清除全部筛选 ({activeFilterCount})
        </button>
      )}
    </div>
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 4) {
          pages.push(1, 2, 3, 4, 5, '...', totalPages);
        } else if (currentPage >= totalPages - 3) {
          pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-center gap-1 sm:gap-2 mt-10">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-2 sm:px-3 sm:py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) =>
          typeof page === 'string' ? (
            <span key={`dots-${idx}`} className="px-2 text-gray-400">
              {page}
            </span>
          ) : (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`min-w-[40px] h-10 px-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                currentPage === page
                  ? 'bg-primary text-white shadow-md'
                  : 'border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-2 sm:px-3 sm:py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="搜索城市、小区、风格、户型..."
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              />
            </div>
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl relative"
            >
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-gray-900 dark:text-white">筛选条件</span>
                </div>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium text-white bg-primary rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    共找到
                  </span>
                  <span className="font-bold text-lg text-primary">
                    {filteredCases.length}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    个案例
                  </span>
                  {filters.rooms.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full ml-2">
                      居室：{filters.rooms.map((r) => `${r}室`).join('、')}
                    </span>
                  )}
                  {filters.houseTypes.length > 0 && filters.rooms.length === 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full ml-2">
                      户型：{filters.houseTypes.map((ht) => {
                        const label = houseTypes.find((h) => h.value === ht)?.label || ht;
                        return label;
                      }).join('、')}
                    </span>
                  )}
                </div>

                <div className="w-full text-sm text-gray-500 dark:text-gray-400">
                  {searchKeyword ? (
                    <span>
                      搜索结果 / 查询结果：关键词“{searchKeyword}”，筛选后匹配 {filteredCases.length} 个真实装修案例
                    </span>
                  ) : activeFilterCount > 0 ? (
                    <span>
                      筛选结果 / 查询结果：当前筛选条件匹配 {filteredCases.length} 个真实装修案例
                    </span>
                  ) : (
                    <span>请输入搜索关键词或使用筛选条件查看查询结果</span>
                  )}
                </div>

                {filteredCases.length > 0 && (
                  <div className="w-full">
                    {(() => {
                      const resultDesc = getResultDescription(filters, filteredCases.length);
                      const bgColorMap = {
                        small: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800',
                        few: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
                        normal: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800',
                      };
                      const textColorMap = {
                        small: 'text-amber-800 dark:text-amber-200',
                        few: 'text-blue-800 dark:text-blue-200',
                        normal: 'text-green-800 dark:text-green-200',
                      };
                      const iconColorMap = {
                        small: 'text-amber-500',
                        few: 'text-blue-500',
                        normal: 'text-green-500',
                      };
                      const IconComponent = resultDesc.type === 'small' ? Lightbulb :
                        resultDesc.type === 'few' ? Info : CheckCircle2;

                      return (
                        <div className={`flex items-start gap-2 p-3 border rounded-xl ${bgColorMap[resultDesc.type]}`}>
                          <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColorMap[resultDesc.type]}`} />
                          <div className={`text-sm ${textColorMap[resultDesc.type]}`}>
                            <span className="font-medium">{resultDesc.title}：</span>
                            {resultDesc.description}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 p-3">
                    <div className="text-xs text-teal-700 dark:text-teal-300">全量案例索引</div>
                    <div className="text-lg font-bold text-teal-900 dark:text-teal-100">{indexedCaseCount.toLocaleString()}+</div>
                    <div className="text-xs text-teal-700 dark:text-teal-300">当前筛选可复核样本 {filteredCases.length} 个</div>
                  </div>
                  <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 p-3">
                    <div className="text-xs text-orange-700 dark:text-orange-300">质量评分来源</div>
                    <div className="text-lg font-bold text-orange-700 dark:text-orange-200">{avgQualityScore.toFixed(2)}分</div>
                    <div className="text-xs text-orange-700 dark:text-orange-300">完整度/照片质量/数据准确/设计复查加权</div>
                  </div>
                  <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 p-3">
                    <div className="text-xs text-purple-700 dark:text-purple-300">验收复查记录</div>
                    <div className="text-lg font-bold text-purple-800 dark:text-purple-100">{recheckRecordCount}条</div>
                    <div className="text-xs text-purple-700 dark:text-purple-300">隐蔽工程、泥木、油漆节点可追溯</div>
                  </div>
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3">
                    <div className="text-xs text-blue-700 dark:text-blue-300">可交付资料完整度</div>
                    <div className="text-lg font-bold text-blue-800 dark:text-blue-100">{filteredCases.length ? Math.round((fullDeliveryCount / filteredCases.length) * 100) : 0}%</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">户型SVG/水电图/建材型号/PDF包</div>
                  </div>
                </div>

                <div className="w-full flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    数据完整度：
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setFilters((f) => ({ ...f, evidenceLevel: f.evidenceLevel === 'complete' ? '' : 'complete' }));
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
                        filters.evidenceLevel === 'complete'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary hover:text-primary'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      完整证据链
                    </button>
                    <button
                      onClick={() => {
                        setFilters((f) => ({ ...f, evidenceLevel: f.evidenceLevel === 'good' ? '' : 'good' }));
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
                        filters.evidenceLevel === 'good'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary hover:text-primary'
                      }`}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      有验收照片
                    </button>
                    <button
                      onClick={() => {
                        const hasMaterials = filters.evidenceLevel === 'basic';
                        setFilters((f) => ({ ...f, evidenceLevel: hasMaterials ? '' : 'basic' }));
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
                        filters.evidenceLevel === 'basic'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary hover:text-primary'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      有建材清单
                    </button>
                  </div>
                </div>

                <div className="w-full flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                  <Info className="w-3.5 h-3.5" />
                  <span>质量评分基于：设计创意+施工质量+材料品牌+业主反馈 四维度综合评估</span>
                </div>

                {activeFilters.length > 0 && (
                  <div className="w-full flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Filter className="w-4 h-4 text-primary" />
                      当前筛选：
                    </span>
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      {activeFilters.map((filter) => (
                        <span
                          key={filter.key}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                        >
                          <span className="text-primary/70">{filter.label}：</span>
                          {filter.value}
                          <button
                            onClick={() => removeFilter(filter.key)}
                            className="ml-1 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-primary border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary transition-colors"
                    >
                      <X className="w-4 h-4" />
                      清除全部筛选
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-primary hover:text-primary transition-colors duration-200"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                      {sortOptions.find((o) => o.value === sortBy)?.label}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${sortDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {sortDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-20 animate-fade-in">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              setSortDropdownOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                              sortBy === option.value
                                ? 'text-primary bg-primary-50 dark:bg-primary-900/20 font-medium'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="inline-flex items-center bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600 p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md transition-all duration-200 ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-slate-600 text-primary shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-primary'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md transition-all duration-200 ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-slate-600 text-primary shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-primary'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {paginatedCases.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {paginatedCases.map((caseItem) => (
                    viewMode === 'grid' ? (
                      <CaseCard key={caseItem.id} caseData={caseItem} />
                    ) : (
                      <div
                        key={caseItem.id}
                        className="card flex flex-col sm:flex-row overflow-hidden cursor-pointer group"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/cases/${caseItem.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            navigate(`/cases/${caseItem.id}`);
                          }
                        }}
                      >
                        <div className="sm:w-64 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
                          <img
                            src={caseItem.coverImage}
                            alt={caseItem.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex-1 p-5">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-1">
                            {caseItem.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                            {caseItem.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm mb-4">
                            <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-primary" />
                              {caseItem.city} · {caseItem.district}
                            </span>
                            <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                              <Home className="w-4 h-4 text-primary" />
                              {caseItem.houseType}
                            </span>
                            <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                              <Ruler className="w-4 h-4 text-primary" />
                              {caseItem.area}㎡
                            </span>
                            <span className="text-accent font-semibold flex items-center gap-1">
                              <Wallet className="w-4 h-4" />
                              {formatBudget(caseItem.budget)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                            <span className="px-3 py-1 text-xs font-medium text-primary bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300 rounded-full">
                              {caseItem.style}
                            </span>
                            <div className="flex items-center gap-2">
                              <img
                                src={caseItem.designerAvatar}
                                alt={caseItem.designerName}
                                className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {caseItem.designerName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/cases/${caseItem.id}`);
                              }}
                              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-600"
                            >
                              查看详情
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>

                {similarCases.length > 0 && (
                  <div className="mt-10">
                    <div className="flex items-center gap-2 mb-5">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        为您推荐相近户型参考
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        （{similarCases.length}个相近户型案例供参考）
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {similarCases.map((caseItem) => (
                        <div key={caseItem.id} className="relative">
                          <div className="absolute top-3 left-3 z-10">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white text-xs font-medium rounded-full shadow-sm">
                              <Info className="w-3 h-3" />
                              相近参考
                            </span>
                          </div>
                          <CaseCard caseData={caseItem} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Pagination />
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">未找到匹配案例</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">请调整筛选条件或尝试以下推荐</p>

                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {filters.rooms.length > 0 && (
                    <button
                      onClick={() => setFilters((f) => ({ ...f, rooms: [] }))}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-sm font-medium hover:bg-orange-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      清除居室筛选
                    </button>
                  )}
                  {filters.houseTypes.length > 0 && (
                    <button
                      onClick={() => setFilters((f) => ({ ...f, houseTypes: [] }))}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      清除户型筛选
                    </button>
                  )}
                  {filters.cities.length > 0 && (
                    <button
                      onClick={() => setFilters((f) => ({ ...f, cities: [] }))}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-teal-50 text-teal-600 rounded-full text-sm font-medium hover:bg-teal-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      清除城市筛选
                    </button>
                  )}
                  {filters.styles.length > 0 && (
                    <button
                      onClick={() => setFilters((f) => ({ ...f, styles: [] }))}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-sm font-medium hover:bg-purple-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      清除风格筛选
                    </button>
                  )}
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    查看全部案例
                  </button>
                </div>

                <div className="max-w-md mx-auto">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">热门推荐</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => setFilters(() => ({ ...defaultFilters, rooms: [3] }))}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      3室热门
                    </button>
                    <button
                      onClick={() => setFilters(() => ({ ...defaultFilters, styles: ['现代简约'] }))}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      现代简约
                    </button>
                    <button
                      onClick={() => setFilters(() => ({ ...defaultFilters, houseTypes: ['LOFT'] }))}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      LOFT
                    </button>
                    <button
                      onClick={() => setFilters(() => ({ ...defaultFilters, cities: ['北京'] }))}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      北京案例
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-slate-800 shadow-2xl animate-slide-in-right overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <span className="font-semibold text-gray-900 dark:text-white">筛选条件</span>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium text-white bg-primary rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <FilterPanel />
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:border-primary hover:text-primary transition-colors"
              >
                重置
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-lg"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
