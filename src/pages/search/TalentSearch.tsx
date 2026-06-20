import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  Bookmark,
  Clock,
  BarChart3,
  List,
  GitCompare,
  Save,
  Trash2,
  Loader2,
  Sparkles,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import AdvancedFilterPanel from '@/components/search/AdvancedFilterPanel';
import MatchResultCard from '@/components/search/MatchResultCard';
import CompareView from '@/components/search/CompareView';
import { useArtistStore } from '@/store/useArtistStore';
import { calculateMatchScore } from '@/utils/matching';
import { mockSchedules } from '@/data/mockData';
import type {
  ExtendedSearchCriteria,
  MatchResult,
  SavedSearch,
} from '@shared/types';

const TalentSearch: React.FC = () => {
  const { artists, loading } = useArtistStore();

  const [criteria, setCriteria] = useState<ExtendedSearchCriteria>({});
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [recentSearches, setRecentSearches] = useState<SavedSearch[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');

  const performSearch = useCallback(() => {
    const requirements: Array<{
      field: string;
      operator: 'eq' | 'gte' | 'lte' | 'in' | 'between';
      value: string | number | boolean | (string | number)[] | undefined | Date;
    }> = [];

    if (criteria.gender && criteria.gender !== 'other') {
      requirements.push({ field: 'gender', operator: 'eq', value: criteria.gender });
    }
    if (criteria.ageMin !== undefined && criteria.ageMax !== undefined) {
      requirements.push({
        field: 'age',
        operator: 'between',
        value: [criteria.ageMin, criteria.ageMax],
      });
    }
    if (criteria.heightMin !== undefined && criteria.heightMax !== undefined) {
      requirements.push({
        field: 'height',
        operator: 'between',
        value: [criteria.heightMin, criteria.heightMax],
      });
    }
    if (criteria.weightMin !== undefined && criteria.weightMax !== undefined) {
      requirements.push({
        field: 'weight',
        operator: 'between',
        value: [criteria.weightMin, criteria.weightMax],
      });
    }

    const results = artists
      .map((artist) => {
        const artistSchedules = mockSchedules.filter(
          (s) => s.artistProfileId === artist.id
        );
        return calculateMatchScore(artist, requirements, criteria, artistSchedules);
      })
      .filter((result) => {
        if (criteria.bustMin !== undefined && result.artist.bust < criteria.bustMin) return false;
        if (criteria.bustMax !== undefined && result.artist.bust > criteria.bustMax) return false;
        if (criteria.waistMin !== undefined && result.artist.waist < criteria.waistMin) return false;
        if (criteria.waistMax !== undefined && result.artist.waist > criteria.waistMax) return false;
        if (criteria.hipsMin !== undefined && result.artist.hips < criteria.hipsMin) return false;
        if (criteria.hipsMax !== undefined && result.artist.hips > criteria.hipsMax) return false;
        if (criteria.eyeColor && result.artist.eyeColor !== criteria.eyeColor) return false;
        if (criteria.hairColor && result.artist.hairColor !== criteria.hairColor) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score);

    setMatchResults(results);
    setHasSearched(true);

    if (Object.keys(criteria).length > 0) {
      const recentSearch: SavedSearch = {
        id: 'recent-' + Date.now(),
        name: '最近搜索',
        criteria: criteria,
        createdAt: new Date(),
      };
      setRecentSearches((prev) => [recentSearch, ...prev.slice(0, 4)]);
    }
  }, [artists, criteria]);

  useEffect(() => {
    performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    setCriteria({});
    setMatchResults([]);
    setHasSearched(false);
  };

  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) return;
    const newSavedSearch: SavedSearch = {
      id: 'saved-' + Date.now(),
      name: saveSearchName,
      criteria: criteria,
      createdAt: new Date(),
    };
    setSavedSearches((prev) => [newSavedSearch, ...prev]);
    setSaveSearchName('');
    setSaveModalOpen(false);
  };

  const applySavedSearch = (saved: SavedSearch) => {
    setCriteria(saved.criteria as ExtendedSearchCriteria);
  };

  const deleteSavedSearch = (id: string) => {
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleCompare = (artistId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(artistId)) {
        return prev.filter((id) => id !== artistId);
      }
      if (prev.length >= 4) return prev;
      return [...prev, artistId];
    });
  };

  const compareResults = useMemo(() => {
    return matchResults.filter((mr) => compareIds.includes(mr.artist.id));
  }, [matchResults, compareIds]);

  const scoreDistribution = useMemo(() => {
    const ranges = [
      { name: '0-20', min: 0, max: 20, count: 0 },
      { name: '20-40', min: 20, max: 40, count: 0 },
      { name: '40-60', min: 40, max: 60, count: 0 },
      { name: '60-80', min: 60, max: 80, count: 0 },
      { name: '80-100', min: 80, max: 100, count: 0 },
    ];
    matchResults.forEach((mr) => {
      const range = ranges.find((r) => mr.score >= r.min && mr.score < r.max);
      if (range) range.count++;
    });
    return ranges;
  }, [matchResults]);

  const getBarColor = (name: string) => {
    if (name === '80-100') return '#10b981';
    if (name === '60-80') return '#3685ff';
    if (name === '40-60') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 animate-fade-in-down">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-rose-500" />
                <span className="text-gradient">人才智能匹配</span>
              </h1>
              <p className="text-midnight-300">
                多维度筛选，智能匹配最适合的演艺人才
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={() => setSaveModalOpen(true)}
                disabled={!hasSearched}
              >
                保存搜索
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Filter className="w-4 h-4" />}
                onClick={performSearch}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    搜索中...
                  </>
                ) : (
                  '立即匹配'
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_280px] gap-6">
          <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <AdvancedFilterPanel
              criteria={criteria}
              onChange={setCriteria}
              onSearch={performSearch}
              onReset={handleReset}
            />
          </div>

          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <Card variant="glass">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 sm:w-80">
                      <Input
                        placeholder="搜索艺人姓名、技能..."
                        leftIcon={<Search className="w-4 h-4" />}
                      />
                    </div>
                    <Badge variant="primary" size="md">
                      {matchResults.length} 个结果
                    </Badge>
                    {compareIds.length > 0 && (
                      <Badge variant="secondary" size="md">
                        <GitCompare className="w-3.5 h-3.5 mr-1" />
                        {compareIds.length}/4 已选择
                      </Badge>
                    )}
                  </div>

                  <Tabs
                    value={viewMode}
                    onValueChange={(v) => setViewMode(v as 'list' | 'compare')}
                  >
                    <TabsList>
                      <TabsTrigger value="list" className="flex items-center gap-2">
                        <List className="w-4 h-4" />
                        列表视图
                      </TabsTrigger>
                      <TabsTrigger
                        value="compare"
                        className="flex items-center gap-2"
                        disabled={compareIds.length < 2}
                      >
                        <GitCompare className="w-4 h-4" />
                        对比视图
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

            {viewMode === 'list' ? (
              <div className="space-y-4">
                {matchResults.length === 0 ? (
                  <Card variant="glass">
                    <CardContent className="p-12 text-center">
                      <Search className="w-16 h-16 text-midnight-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {hasSearched ? '未找到匹配结果' : '开始搜索人才'}
                      </h3>
                      <p className="text-midnight-300 max-w-md mx-auto">
                        {hasSearched
                          ? '尝试调整筛选条件，扩大搜索范围'
                          : '使用左侧筛选面板设置条件，或直接点击"立即匹配"开始搜索'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  matchResults.map((result, index) => (
                    <div
                      key={result.artist.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <MatchResultCard
                        matchResult={result}
                        rank={index + 1}
                        isSelected={compareIds.includes(result.artist.id)}
                        isComparing={true}
                        onSelectForCompare={() => toggleCompare(result.artist.id)}
                      />
                    </div>
                  ))
                )}
              </div>
            ) : (
              <CompareView
                matchResults={compareResults}
                onRemove={(id) => toggleCompare(id)}
                onClose={() => setViewMode('list')}
              />
            )}
          </div>

          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <Card variant="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-rose-500" />
                  匹配分数分布
                </CardTitle>
                <CardDescription>当前搜索结果的匹配度统计</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333366" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#8c8cb3"
                        tick={{ fill: '#8c8cb3', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#8c8cb3"
                        tick={{ fill: '#8c8cb3', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a2e',
                          border: '1px solid #333366',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: number) => [`${value} 人`, '数量']}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-midnight-700/50">
                  <div>
                    <p className="text-xs text-midnight-400 mb-1">平均匹配度</p>
                    <p className="text-xl font-bold text-sapphire-400">
                      {matchResults.length > 0
                        ? Math.round(
                            matchResults.reduce((sum, r) => sum + r.score, 0) / matchResults.length
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-midnight-400 mb-1">高匹配(≥80%)</p>
                    <p className="text-xl font-bold text-emerald-400">
                      {matchResults.filter((r) => r.score >= 80).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-rose-500" />
                  已保存搜索
                </CardTitle>
                <CardDescription>快速应用之前的筛选条件</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {savedSearches.length === 0 ? (
                  <p className="text-sm text-midnight-400 text-center py-4">
                    暂无保存的搜索
                  </p>
                ) : (
                  savedSearches.map((saved) => (
                    <div
                      key={saved.id}
                      className="group flex items-center justify-between p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50 hover:border-rose-500/30 transition-all cursor-pointer"
                      onClick={() => applySavedSearch(saved)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{saved.name}</p>
                        <p className="text-xs text-midnight-400 mt-0.5">
                          {format(new Date(saved.createdAt), 'MM月dd日', { locale: zhCN })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedSearch(saved.id);
                          }}
                          className="p-1.5 rounded-lg text-midnight-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-midnight-400" />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-500" />
                  最近搜索
                </CardTitle>
                <CardDescription>快速访问最近的搜索记录</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {recentSearches.length === 0 ? (
                  <p className="text-sm text-midnight-400 text-center py-4">
                    暂无搜索记录
                  </p>
                ) : (
                  recentSearches.map((recent) => {
                    const filterCount = Object.keys(recent.criteria).filter(
                      (k) => recent.criteria[k as keyof typeof recent.criteria] !== undefined
                    ).length;
                    return (
                      <div
                        key={recent.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50 hover:border-sapphire-500/30 transition-all cursor-pointer"
                        onClick={() => applySavedSearch(recent)}
                      >
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-sapphire-400" />
                          <div>
                            <p className="text-sm text-white">{filterCount} 个筛选条件</p>
                            <p className="text-xs text-midnight-400">
                              {format(new Date(recent.createdAt), 'HH:mm', { locale: zhCN })}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-midnight-400" />
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {saveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-midnight-800 border border-midnight-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
              <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-rose-500" />
                保存搜索条件
              </h3>
              <p className="text-sm text-midnight-300 mb-4">
                为当前筛选条件命名，方便下次快速使用
              </p>
              <Input
                label="搜索名称"
                placeholder="例如：上海时装周女模"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                className="mb-6"
              />
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setSaveModalOpen(false)}>
                  取消
                </Button>
                <Button variant="primary" onClick={handleSaveSearch}>
                  保存
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TalentSearch;
