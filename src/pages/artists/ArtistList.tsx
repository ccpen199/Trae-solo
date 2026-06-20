import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  ChevronDown,
  X,
  ArrowUpDown,
  Sparkles,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import ArtistCard from '@/components/artists/ArtistCard';
import Empty from '@/components/Empty';
import { useArtistStore } from '@/store/useArtistStore';
import { mockArtists } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { ArtistProfile, SearchCriteria } from '@shared/types';

type SortOption = 'match' | 'newest' | 'popular';

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'match', label: '匹配度', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'newest', label: '最新入驻', icon: <Clock className="w-4 h-4" /> },
  { value: 'popular', label: '最受欢迎', icon: <TrendingUp className="w-4 h-4" /> },
];

const contractStatusOptions = [
  { value: 'available', label: '可接通告' },
  { value: 'signed', label: '已签约' },
  { value: 'exclusive', label: '专属合约' },
  { value: 'unavailable', label: '暂不可用' },
];

const allSkills = [
  'T台走秀',
  '平面拍摄',
  '影视表演',
  '舞蹈',
  '钢琴',
  '健身',
  '游泳',
  '篮球',
  '淘宝直播',
  '美妆',
  '穿搭',
  '短视频拍摄',
  '主持',
  '声乐',
  '吉他',
  '瑜伽',
  '茶艺',
  '街舞',
  '滑板',
  '摄影',
  '珠宝展示',
  '高尔夫',
  '马术',
  '拳击',
  'DJ',
  '唱歌',
  '绘画',
];

const ArtistList: React.FC = () => {
  const navigate = useNavigate();
  const { searchArtists, setSearchCriteria, loading } = useArtistStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('match');
  const [showFilters, setShowFilters] = useState(true);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const [filters, setFilters] = useState<SearchCriteria>({
    gender: undefined,
    ageMin: 16,
    ageMax: 40,
    heightMin: 150,
    heightMax: 200,
    location: '',
    skills: [],
    contractStatus: undefined,
  });

  const [displayedArtists, setDisplayedArtists] = useState<ArtistProfile[]>(mockArtists);

  useEffect(() => {
    const performSearch = async () => {
      const criteria: SearchCriteria = {
        ...filters,
      };
      setSearchCriteria(criteria);
      const results = await searchArtists(criteria);

      let sorted = [...results];
      if (sortBy === 'newest') {
        sorted.sort((a, b) => b.id.localeCompare(a.id));
      } else if (sortBy === 'popular') {
        sorted.sort(() => Math.random() - 0.5);
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        sorted = sorted.filter(
          (a) =>
            a.realName.toLowerCase().includes(query) ||
            a.stageName.toLowerCase().includes(query) ||
            a.location.toLowerCase().includes(query) ||
            a.skills.some((s) => s.toLowerCase().includes(query))
        );
      }

      setDisplayedArtists(sorted);
    };

    performSearch();
  }, [filters, sortBy, searchQuery, searchArtists, setSearchCriteria]);

  const handleFilterChange = <K extends keyof SearchCriteria>(
    key: K,
    value: SearchCriteria[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSkill = (skill: string) => {
    setFilters((prev) => {
      const currentSkills = prev.skills || [];
      const newSkills = currentSkills.includes(skill)
        ? currentSkills.filter((s) => s !== skill)
        : [...currentSkills, skill];
      return { ...prev, skills: newSkills };
    });
  };

  const clearFilters = () => {
    setFilters({
      gender: undefined,
      ageMin: 16,
      ageMax: 40,
      heightMin: 150,
      heightMax: 200,
      location: '',
      skills: [],
      contractStatus: undefined,
    });
    setSearchQuery('');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.gender) count++;
    if (filters.ageMin !== 16 || filters.ageMax !== 40) count++;
    if (filters.heightMin !== 150 || filters.heightMax !== 200) count++;
    if (filters.location) count++;
    if (filters.skills && filters.skills.length > 0) count++;
    if (filters.contractStatus) count++;
    return count;
  }, [filters]);

  const handleArtistClick = (artist: ArtistProfile) => {
    navigate(`/artists/${artist.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 animate-fade-in-down">
          <h1 className="text-3xl font-bold text-white mb-2">人才库</h1>
          <p className="text-midnight-300">
            发现最适合你项目的优秀模特与艺人
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-6 animate-fade-in-up">
          <div className="flex-1">
            <Input
              size="lg"
              placeholder="搜索艺人姓名、艺名、技能或城市..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              rightIcon={
                searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-midnight-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )
              }
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              leftIcon={<Filter className="w-4 h-4" />}
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              筛选
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 rounded-full text-white text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <div className="relative">
              <Button
                variant="secondary"
                leftIcon={<ArrowUpDown className="w-4 h-4" />}
                rightIcon={<ChevronDown className="w-4 h-4" />}
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              >
                {sortOptions.find((o) => o.value === sortBy)?.label}
              </Button>
              {sortDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-midnight-800 border border-midnight-700 shadow-xl z-50 overflow-hidden animate-scale-in">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setSortDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                        sortBy === option.value
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'text-midnight-200 hover:bg-midnight-700/50'
                      )}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {showFilters && (
            <Card
              variant="glass"
              className="w-72 flex-shrink-0 h-fit animate-slide-in-left sticky top-24"
            >
              <CardContent className="p-5 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-rose-500" />
                    筛选条件
                  </h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-midnight-400 hover:text-rose-400 transition-colors"
                    >
                      清除全部
                    </button>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-midnight-200 mb-3">性别</h4>
                  <div className="flex gap-2">
                    {[
                      { value: 'male', label: '男' },
                      { value: 'female', label: '女' },
                      { value: 'other', label: '其他' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleFilterChange(
                            'gender',
                            filters.gender === option.value ? undefined : option.value
                          )
                        }
                        className={cn(
                          'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300',
                          filters.gender === option.value
                            ? 'bg-gradient-primary text-white shadow-button'
                            : 'bg-midnight-700/50 text-midnight-300 border border-midnight-600 hover:border-midnight-500'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-midnight-200 mb-3">
                    年龄范围 <span className="text-rose-400">{filters.ageMin} - {filters.ageMax}岁</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-midnight-400 w-8">最小</span>
                      <input
                        type="range"
                        min="16"
                        max="60"
                        value={filters.ageMin}
                        onChange={(e) =>
                          handleFilterChange('ageMin', Math.min(Number(e.target.value), filters.ageMax!))
                        }
                        className="flex-1 accent-rose-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-midnight-400 w-8">最大</span>
                      <input
                        type="range"
                        min="16"
                        max="60"
                        value={filters.ageMax}
                        onChange={(e) =>
                          handleFilterChange('ageMax', Math.max(Number(e.target.value), filters.ageMin!))
                        }
                        className="flex-1 accent-rose-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-midnight-200 mb-3">
                    身高范围 <span className="text-sapphire-400">{filters.heightMin} - {filters.heightMax}cm</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-midnight-400 w-8">最矮</span>
                      <input
                        type="range"
                        min="140"
                        max="220"
                        value={filters.heightMin}
                        onChange={(e) =>
                          handleFilterChange('heightMin', Math.min(Number(e.target.value), filters.heightMax!))
                        }
                        className="flex-1 accent-sapphire-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-midnight-400 w-8">最高</span>
                      <input
                        type="range"
                        min="140"
                        max="220"
                        value={filters.heightMax}
                        onChange={(e) =>
                          handleFilterChange('heightMax', Math.max(Number(e.target.value), filters.heightMin!))
                        }
                        className="flex-1 accent-sapphire-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-midnight-200 mb-3">所在城市</h4>
                  <Input
                    size="sm"
                    placeholder="搜索城市..."
                    value={filters.location || ''}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    leftIcon={<MapPin className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-midnight-200 mb-3">
                    技能特长 {filters.skills && filters.skills.length > 0 && (
                      <Badge variant="primary" size="sm" className="ml-2">
                        {filters.skills.length}
                      </Badge>
                    )}
                  </h4>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                    {allSkills.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300',
                          filters.skills?.includes(skill)
                            ? 'bg-sapphire-500/20 text-sapphire-300 border border-sapphire-500/40'
                            : 'bg-midnight-700/50 text-midnight-300 border border-midnight-600 hover:border-midnight-500'
                        )}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-midnight-200 mb-3">合约状态</h4>
                  <div className="space-y-2">
                    {contractStatusOptions.map((option) => (
                      <Checkbox
                        key={option.value}
                        checked={filters.contractStatus === option.value}
                        onCheckedChange={(checked) =>
                          handleFilterChange(
                            'contractStatus',
                            checked ? option.value : undefined
                          )
                        }
                        label={option.label}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-midnight-300">
                共找到 <span className="text-white font-semibold">{displayedArtists.length}</span> 位艺人
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-xl bg-midnight-800/50 animate-pulse"
                  />
                ))}
              </div>
            ) : displayedArtists.length === 0 ? (
              <Empty
                title="未找到匹配的艺人"
                description="尝试调整筛选条件或清除部分筛选器"
                action={
                  <Button onClick={clearFilters}>清除筛选条件</Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {displayedArtists.map((artist, index) => (
                  <div
                    key={artist.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ArtistCard
                      artist={artist}
                      matchScore={sortBy === 'match' ? Math.floor(Math.random() * 30 + 70) : undefined}
                      onClick={() => handleArtistClick(artist)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistList;
