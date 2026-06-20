import React, { useState, useMemo } from 'react';
import {
  Search,
  Grid3X3,
  List,
  SlidersHorizontal,
  MapPin,
  Calendar,
  X,
  ChevronDown,
  SortAsc,
  ArrowUpDown,
} from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import CastingCard from '@/components/castings/CastingCard';

import useCastingStore from '@/store/useCastingStore';
import { cn } from '@/lib/utils';
import type { Casting } from '@shared/types';

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'budget' | 'closing' | 'applications';

const categories = [
  { id: 'fashion', label: 'Fashion', labelZh: '时装秀场' },
  { id: 'commercial', label: 'Commercial', labelZh: '商业广告' },
  { id: 'film', label: 'Film', labelZh: '影视表演' },
  { id: 'live', label: 'Live Stream', labelZh: '直播带货' },
  { id: 'event', label: 'Event', labelZh: '活动展示' },
];

const statuses = [
  { id: 'published', label: '招募中' },
  { id: 'draft', label: '草稿' },
  { id: 'closed', label: '已关闭' },
  { id: 'completed', label: '已完成' },
];

const sortOptions: { id: SortOption; label: string }[] = [
  { id: 'newest', label: '最新发布' },
  { id: 'budget', label: '预算从高到低' },
  { id: 'closing', label: '即将截止' },
  { id: 'applications', label: '申请最多' },
];

const CastingList: React.FC = () => {
  const { castings, applications } = useCastingStore();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['published']);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 200000]);
  const [locationQuery, setLocationQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const getApplicationCount = (castingId: string): number => {
    return applications.filter((a) => a.castingId === castingId).length;
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
    );
  };

  const toggleStatus = (statusId: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(statusId) ? prev.filter((s) => s !== statusId) : [...prev, statusId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedStatuses(['published']);
    setBudgetRange([0, 200000]);
    setLocationQuery('');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  };

  const filteredCastings = useMemo(() => {
    let result = [...castings];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query)
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter((c) => {
        const castingCategory = c.category.toLowerCase();
        return selectedCategories.some((cat) => {
          if (cat === 'fashion') return castingCategory.includes('时装') || castingCategory.includes('fashion');
          if (cat === 'commercial') return castingCategory.includes('平面') || castingCategory.includes('广告') || castingCategory.includes('commercial');
          if (cat === 'film') return castingCategory.includes('影视') || castingCategory.includes('film');
          if (cat === 'live') return castingCategory.includes('直播') || castingCategory.includes('live');
          if (cat === 'event') return castingCategory.includes('活动') || castingCategory.includes('event') || castingCategory.includes('车展');
          return false;
        });
      });
    }

    if (selectedStatuses.length > 0) {
      result = result.filter((c) => selectedStatuses.includes(c.status));
    }

    result = result.filter(
      (c) => c.budgetMax >= budgetRange[0] && c.budgetMin <= budgetRange[1]
    );

    if (locationQuery) {
      result = result.filter((c) => c.location.includes(locationQuery));
    }

    if (dateFrom) {
      result = result.filter((c) => new Date(c.endDate) >= new Date(dateFrom));
    }
    if (dateTo) {
      result = result.filter((c) => new Date(c.startDate) <= new Date(dateTo));
    }

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'budget':
        result.sort((a, b) => b.budgetMax - a.budgetMax);
        break;
      case 'closing':
        result.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        break;
      case 'applications':
        result.sort((a, b) => getApplicationCount(b.id) - getApplicationCount(a.id));
        break;
    }

    return result;
  }, [castings, searchQuery, selectedCategories, selectedStatuses, budgetRange, locationQuery, dateFrom, dateTo, sortBy, applications]);

  const activeFilterCount =
    (selectedCategories.length > 0 ? 1 : 0) +
    (selectedStatuses.length !== 1 || !selectedStatuses.includes('published') ? 1 : 0) +
    (budgetRange[0] > 0 || budgetRange[1] < 200000 ? 1 : 0) +
    (locationQuery ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0);

  const FiltersSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-rose-400" />
          筛选条件
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-midnight-400 hover:text-rose-400 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              清除全部
            </button>
          )}
        </h3>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-midnight-200">分类</h4>
        <div className="space-y-2">
          {categories.map((cat) => (
            <Checkbox
              key={cat.id}
              id={`category-${cat.id}`}
              checked={selectedCategories.includes(cat.id)}
              onCheckedChange={() => toggleCategory(cat.id)}
              label={cat.labelZh}
              description={cat.label}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-midnight-200">状态</h4>
        <div className="space-y-2">
          {statuses.map((status) => (
            <Checkbox
              key={status.id}
              id={`status-${status.id}`}
              checked={selectedStatuses.includes(status.id)}
              onCheckedChange={() => toggleStatus(status.id)}
              label={status.label}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-midnight-200">预算范围</h4>
        <div className="px-1">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={budgetRange}
            onValueChange={(v) => setBudgetRange(v as [number, number])}
            min={0}
            max={200000}
            step={1000}
          >
            <Slider.Track className="bg-midnight-700 relative grow rounded-full h-1.5">
              <Slider.Range className="absolute bg-gradient-primary rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-4 h-4 rounded-full bg-white shadow-lg border-2 border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-2 focus:ring-offset-midnight-800 cursor-grab active:cursor-grabbing"
              aria-label="Min"
            />
            <Slider.Thumb
              className="block w-4 h-4 rounded-full bg-white shadow-lg border-2 border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-2 focus:ring-offset-midnight-800 cursor-grab active:cursor-grabbing"
              aria-label="Max"
            />
          </Slider.Root>
          <div className="flex justify-between mt-2 text-xs text-midnight-400">
            <span>¥{budgetRange[0].toLocaleString()}</span>
            <span>¥{budgetRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-midnight-200">地点</h4>
        <Input
          placeholder="搜索城市..."
          value={locationQuery}
          onChange={(e) => setLocationQuery(e.target.value)}
          variant="filled"
          size="sm"
          leftIcon={<MapPin className="w-4 h-4" />}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-midnight-200">日期范围</h4>
        <div className="space-y-2">
          <Input
            type="date"
            placeholder="开始日期"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            variant="filled"
            size="sm"
            leftIcon={<Calendar className="w-4 h-4" />}
          />
          <Input
            type="date"
            placeholder="结束日期"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            variant="filled"
            size="sm"
            leftIcon={<Calendar className="w-4 h-4" />}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">浏览试镜</h1>
          <p className="text-midnight-300">发现最新的模特招募机会，找到适合你的角色</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:hidden mb-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              onClick={() => setShowMobileFilters(true)}
              className="w-full"
            >
              筛选 {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </div>

          <Card variant="glass" className="hidden lg:block lg:w-72 flex-shrink-0 h-fit sticky top-20">
            <CardContent className="p-5">
              <FiltersSidebar />
            </CardContent>
          </Card>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="搜索试镜标题、描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  variant="filled"
                  leftIcon={<Search className="w-5 h-5" />}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<ArrowUpDown className="w-4 h-4" />}
                    rightIcon={<ChevronDown className="w-4 h-4" />}
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                  >
                    {sortOptions.find((s) => s.id === sortBy)?.label || '排序'}
                  </Button>
                  {showSortDropdown && (
                    <div className="absolute right-0 mt-2 w-44 bg-midnight-800 border border-midnight-700 rounded-xl shadow-xl z-10 overflow-hidden animate-fade-in">
                      {sortOptions.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSortBy(opt.id);
                            setShowSortDropdown(false);
                          }}
                          className={cn(
                            'w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2',
                            sortBy === opt.id
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'text-midnight-200 hover:bg-midnight-700/50'
                          )}
                        >
                          {sortBy === opt.id && <SortAsc className="w-3.5 h-3.5" />}
                          <span className={sortBy === opt.id ? '' : 'ml-5.5'}>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center p-1 bg-midnight-900/50 border border-midnight-700 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2 rounded-lg transition-all duration-200',
                      viewMode === 'grid'
                        ? 'bg-gradient-primary text-white shadow-button'
                        : 'text-midnight-400 hover:text-white hover:bg-midnight-800'
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-2 rounded-lg transition-all duration-200',
                      viewMode === 'list'
                        ? 'bg-gradient-primary text-white shadow-button'
                        : 'text-midnight-400 hover:text-white hover:bg-midnight-800'
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-midnight-400">
                找到 <span className="text-white font-semibold">{filteredCastings.length}</span> 个试镜
              </p>
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedCategories.length > 0 && (
                    <Badge variant="primary" size="sm" className="flex items-center gap-1">
                      {selectedCategories.length} 个分类
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-white"
                        onClick={() => setSelectedCategories([])}
                      />
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {filteredCastings.length === 0 ? (
              <Card variant="glass">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-midnight-800 flex items-center justify-center">
                    <Search className="w-8 h-8 text-midnight-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">没有找到匹配的试镜</h3>
                  <p className="text-midnight-400 mb-4">尝试调整筛选条件或清除部分过滤器</p>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    清除所有筛选
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCastings.map((casting, index) => (
                  <div
                    key={casting.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CastingCard
                      casting={casting}
                      viewMode="grid"
                      applicationCount={getApplicationCount(casting.id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCastings.map((casting, index) => (
                  <div
                    key={casting.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <CastingCard
                      casting={casting}
                      viewMode="list"
                      applicationCount={getApplicationCount(casting.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-midnight-900 border-l border-midnight-700 animate-slide-in-right overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">筛选条件</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 rounded-lg text-midnight-400 hover:bg-midnight-800 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FiltersSidebar />
              <div className="mt-8 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={clearFilters}>
                  重置
                </Button>
                <Button className="flex-1" onClick={() => setShowMobileFilters(false)}>
                  查看结果
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CastingList;
