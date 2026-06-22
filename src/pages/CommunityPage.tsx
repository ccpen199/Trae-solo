import { useState } from 'react';
import {
  Heart,
  MessageCircle,
  TrendingUp,
  Clock,
  Users,
  ChevronDown,
  Search,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/Avatar';
import { Tag } from '@/components/ui/Tag';
import { communityWorks } from '@/mock/data/community';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';

const categoryTabs = [
  { value: 'hot', label: '热门', icon: TrendingUp },
  { value: 'latest', label: '最新', icon: Clock },
  { value: 'following', label: '关注', icon: Users },
];

const filterTags = [
  '全部',
  '相册',
  '台历',
  '马克杯',
  '手机壳',
  '明信片',
  'LOMO卡',
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('hot');
  const [activeTag, setActiveTag] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [works, setWorks] = useState(communityWorks);
  const [loading, setLoading] = useState(false);

  const { user } = useUserStore();

  const handleLike = (workId: string) => {
    setWorks((prev) =>
      prev.map((work) =>
        work.id === workId
          ? {
              ...work,
              isLiked: !work.isLiked,
              likes: work.isLiked ? work.likes - 1 : work.likes + 1,
            }
          : work
      )
    );
  };

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const masonryWorks = works.map((work, index) => ({
    ...work,
    heightClass: index % 3 === 0 ? 'aspect-[3/4]' : index % 3 === 1 ? 'aspect-[4/5]' : 'aspect-[1/1]',
  }));

  return (
    <div className="space-y-6">
      <div className="text-center py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-paper-900">
          创意社区
        </h1>
        <p className="mt-3 text-paper-500 max-w-md mx-auto">
          发现更多精彩作品，与创作者一起分享灵感
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索作品、创作者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                {categoryTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    <tab.icon className="w-4 h-4 mr-1.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-paper-400 flex-shrink-0" />
            {filterTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                  activeTag === tag
                    ? 'bg-brand-500 text-white'
                    : 'bg-paper-100 text-paper-600 hover:bg-paper-200'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
        {masonryWorks.map((work) => (
          <Card
            key={work.id}
            hoverable
            className="overflow-hidden group"
          >
            <div className={cn('relative overflow-hidden bg-paper-100', work.heightClass)}>
              <img
                src={work.thumbnailUrl || work.imageUrl}
                alt={work.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <h3 className="font-display font-semibold text-white text-lg line-clamp-2">
                  {work.title}
                </h3>
                {work.tags && work.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {work.tags.slice(0, 3).map((tag, idx) => (
                      <Tag
                        key={idx}
                        size="sm"
                        className="bg-white/20 text-white border-0 backdrop-blur-sm"
                      >
                        #{tag}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>

              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(work.id);
                    }}
                    className={cn(
                      'p-2 rounded-full backdrop-blur-sm transition-colors',
                      work.isLiked
                        ? 'bg-brand-500 text-white'
                        : 'bg-black/40 text-white hover:bg-black/60'
                    )}
                  >
                    <Heart className={cn('w-4 h-4', work.isLiked && 'fill-current')} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-3">
                <Avatar
                  src={work.authorAvatar}
                  alt={work.authorName}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-paper-900 truncate">
                    {work.authorName}
                  </p>
                  <p className="text-xs text-paper-400">{work.productType}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => handleLike(work.id)}
                  className={cn(
                    'flex items-center gap-1.5 text-sm transition-colors',
                    work.isLiked
                      ? 'text-brand-500'
                      : 'text-paper-500 hover:text-brand-500'
                  )}
                >
                  <Heart className={cn('w-4 h-4', work.isLiked && 'fill-current')} />
                  <span>{work.likes}</span>
                </button>
                <div className="flex items-center gap-1.5 text-sm text-paper-500">
                  <MessageCircle className="w-4 h-4" />
                  <span>{work.comments}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button
          variant="secondary"
          size="lg"
          onClick={loadMore}
          isLoading={loading}
        >
          {!loading && (
            <>
              加载更多
              <ChevronDown className="w-4 h-4 ml-1" />
            </>
          )}
          {loading && '加载中...'}
        </Button>
      </div>
    </div>
  );
}
