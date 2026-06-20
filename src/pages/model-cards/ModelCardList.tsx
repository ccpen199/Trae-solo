import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Grid3X3, LayoutGrid, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import TemplateCard from '@/components/model-cards/TemplateCard';
import useModelCardStore from '@/store/useModelCardStore';
import { cn } from '@/lib/utils';

type PlatformFilter = 'All' | 'Instagram' | 'TikTok' | 'WeChat' | 'Professional' | 'Print';

const categories = [
  { id: 'all', label: '全部模板', count: 0 },
  { id: 'professional', label: '职业模卡', count: 0 },
  { id: 'social', label: '社交媒体', count: 0 },
  { id: 'business', label: '商务名片', count: 0 },
  { id: 'luxury', label: '高端定制', count: 0 },
  { id: 'ecommerce', label: '电商爆款', count: 0 },
  { id: 'acting', label: '演员Casting', count: 0 },
];

const ModelCardList: React.FC = () => {
  const navigate = useNavigate();
  const { templates, selectTemplate, initializeEditor } = useModelCardStore();

  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const platformFilters: PlatformFilter[] = ['All', 'Instagram', 'TikTok', 'WeChat', 'Professional', 'Print'];

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      if (platformFilter !== 'All' && template.platform !== platformFilter) return false;
      if (selectedCategory !== 'all' && template.category !== selectedCategory) return false;
      if (showPremiumOnly && !template.isPremium) return false;
      if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [templates, platformFilter, selectedCategory, showPremiumOnly, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    templates.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return categories.map(c => ({ ...c, count: counts[c.id] || 0 }));
  }, [templates]);

  const handleSelectTemplate = (templateId: string) => {
    selectTemplate(templateId);
    initializeEditor(templateId);
    navigate(`/model-cards/editor/${templateId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in-down">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-rose-500" />
                模卡模板库
              </h1>
              <p className="text-midnight-300">
                选择一个精美模板，快速创建你的专业模特卡
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-midnight-900/50 border border-midnight-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(viewMode === 'grid' && 'bg-midnight-800 text-white')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(viewMode === 'list' && 'bg-midnight-800 text-white')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="搜索模板名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
                size="lg"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={showPremiumOnly ? 'primary' : 'secondary'}
                onClick={() => setShowPremiumOnly(!showPremiumOnly)}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                高级模板
              </Button>
              <Button variant="outline" leftIcon={<SlidersHorizontal className="w-4 h-4" />}>
                筛选
              </Button>
            </div>
          </div>

          <Tabs defaultValue="All" className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-2 p-2">
              {platformFilters.map((platform) => (
                <TabsTrigger
                  key={platform}
                  value={platform}
                  onClick={() => setPlatformFilter(platform)}
                  className="px-4 py-2 data-[state=active]:shadow-none"
                >
                  {platform === 'All' ? '全部平台' : platform}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card variant="glass">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-rose-500" />
                  分类
                </h3>
                <div className="space-y-1">
                  {categoryCounts.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-300",
                        selectedCategory === category.id
                          ? "bg-rose-500/15 text-rose-400"
                          : "text-midnight-300 hover:bg-midnight-800/50 hover:text-white"
                      )}
                    >
                      <span className="text-sm font-medium">{category.label}</span>
                      <Badge variant={selectedCategory === category.id ? 'primary' : 'default'} size="sm">
                        {category.count}
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-4">我的模卡</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-midnight-800/50 border border-midnight-700 hover:border-rose-500/30 cursor-pointer transition-all duration-300">
                    <p className="text-sm font-medium text-white">林雨婷 - 职业模卡</p>
                    <p className="text-xs text-midnight-400 mt-1">3天前编辑</p>
                  </div>
                  <div className="p-3 rounded-lg bg-midnight-800/50 border border-midnight-700 hover:border-rose-500/30 cursor-pointer transition-all duration-300">
                    <p className="text-sm font-medium text-white">Instagram 博主卡</p>
                    <p className="text-xs text-midnight-400 mt-1">1周前编辑</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-4 text-rose-400">
                  查看全部
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {filteredTemplates.length > 0 ? (
              <div className={cn(
                "grid gap-6",
                viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
              )}>
                {filteredTemplates.map((template, index) => (
                  <div
                    key={template.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TemplateCard
                      template={template}
                      onClick={() => handleSelectTemplate(template.id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card variant="glass">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-midnight-800 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-midnight-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">未找到模板</h3>
                  <p className="text-midnight-400 mb-4">
                    尝试修改筛选条件或搜索关键词
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchQuery('');
                      setPlatformFilter('All');
                      setSelectedCategory('all');
                      setShowPremiumOnly(false);
                    }}
                  >
                    重置筛选
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelCardList;
