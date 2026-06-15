import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Grid3X3, LayoutList, Play, Users, ShieldCheck, Clock, Star, Zap, Crown } from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import VideoCard from '../components/VideoCard';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Empty from '../components/Empty';
import Badge from '../components/Badge';
import Button from '../components/Button';
import type { Course } from '../../shared/types';
import { cn } from '../lib/utils';

const categories = ['全部', '舞蹈', '音乐', '运动', '绘画', '摄影', '烹饪', '编程', '语言'];

type FeedTab = 'content' | 'courses';

const mockContentVideos = Array.from({ length: 20 }, (_, i) => ({
  id: `content-${i}`,
  title: [
    '30秒学会一个街舞小动作',
    '钢琴演奏片段欣赏',
    '晨间瑜伽5分钟跟练',
    '水彩画入门小技巧',
    '手机摄影构图分享',
    '快手甜点制作教程',
    'Python一行代码技巧',
    '英语口语每日一句',
    '吉他弹唱片段',
    '健身动作纠正',
  ][i % 10] + ` #干货分享`,
  creatorName: ['小明老师', '音乐达人', '瑜伽教练', '画家小王', '摄影师阿杰', '美食博主', '程序员老张', '英语老师', '吉他手', '健身教练'][i % 10],
  views: Math.floor(Math.random() * 50000) + 5000,
  likes: Math.floor(Math.random() * 5000) + 200,
  duration: `${Math.floor(Math.random() * 5) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
  category: ['舞蹈', '音乐', '运动', '绘画', '摄影', '烹饪', '编程', '语言'][i % 8],
}));

export default function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<FeedTab>(
    (searchParams.get('tab') as FeedTab) || 'courses'
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [contentVideos, setContentVideos] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '全部');
  const [priceFilter, setPriceFilter] = useState<string>('');
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const pageSize = 12;

  const priceOptions = [
    { label: '全部价格', value: '' },
    { label: '免费', value: 'free' },
    { label: '¥0-100', value: '0-100' },
    { label: '¥100-300', value: '100-300' },
    { label: '¥300+', value: '300+' },
    { label: '订阅制', value: 'subscription' },
  ];

  useEffect(() => {
    setPage(1);
    setCourses([]);
    setContentVideos([]);
    setHasMore(true);
    loadData(1, true);
  }, [activeCategory, searchKeyword, activeTab, priceFilter]);

  const loadData = async (pageNum: number, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const category = activeCategory === '全部' ? undefined : activeCategory;

      if (activeTab === 'courses') {
        const res = await api.courses.list({
          page: pageNum,
          pageSize,
          category,
          keyword: searchKeyword || undefined,
          status: 'published',
        });
        const data = (res as any).data;
        const items = data?.items || [];
        
        if (items.length > 0) {
          if (isInitial) {
            setCourses(items);
          } else {
            setCourses((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              const newItems = items.filter((c: Course) => !existingIds.has(c.id));
              return [...prev, ...newItems];
            });
          }
          setHasMore(items.length === pageSize);
        } else {
          const mockItems = generateMockCourses(category || '全部');
          const start = (pageNum - 1) * pageSize;
          const pageItems = mockItems.slice(start, start + pageSize);
          if (isInitial) {
            setCourses(pageItems);
          } else {
            setCourses((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              const newItems = pageItems.filter((c: Course) => !existingIds.has(c.id));
              return [...prev, ...newItems];
            });
          }
          setHasMore(start + pageSize < mockItems.length);
        }
      } else {
        const filteredVideos = category
          ? mockContentVideos.filter((v) => v.category === category)
          : mockContentVideos;
        const start = (pageNum - 1) * pageSize;
        const videos = filteredVideos.slice(start, start + pageSize);
        if (isInitial) {
          setContentVideos(videos);
        } else {
          setContentVideos((prev) => [...prev, ...videos]);
        }
        setHasMore(start + pageSize < filteredVideos.length);
      }
    } catch (error) {
      console.error('Failed to load:', error);
      if (activeTab === 'courses' && isInitial) {
        setCourses(generateMockCourses(activeCategory).slice(0, pageSize));
        setHasMore(generateMockCourses(activeCategory).length > pageSize);
      } else if (isInitial) {
        const filtered = activeCategory === '全部'
          ? mockContentVideos
          : mockContentVideos.filter((v) => v.category === activeCategory);
        setContentVideos(filtered.slice(0, pageSize));
        setHasMore(filtered.length > pageSize);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const generateMockCourses = (selectedCategory = '全部'): Course[] => {
    const courseTemplates: Record<string, { titles: string[]; basePrice: number; chapters: number }> = {
      '舞蹈': { titles: ['爵士舞零基础系统课', '街舞入门到精通', '古典舞身韵课', '拉丁舞初级教程', '现代舞编舞课', '中国舞考级课程'], basePrice: 299, chapters: 24 },
      '音乐': { titles: ['钢琴入门到精通', '吉他弹唱速成班', '小提琴基础课', '声乐演唱技巧', '电子音乐制作', '古筝入门教程'], basePrice: 199, chapters: 36 },
      '运动': { titles: ['瑜伽身心疗愈课', 'HIIT燃脂训练', '普拉提核心训练', '跑步姿势纠正', '力量增肌计划', '太极养生入门'], basePrice: 159, chapters: 16 },
      '绘画': { titles: ['水彩风景手绘课', '素描零基础系统课', '油画入门教程', '插画设计实战', '国画山水课', '彩铅动物绘'], basePrice: 199, chapters: 12 },
      '摄影': { titles: ['手机人像摄影大师班', '风光摄影技巧', '后期修图系统课', '商业人像布光', '短视频拍摄剪辑', '静物产品摄影'], basePrice: 129, chapters: 10 },
      '烹饪': { titles: ['法式甜点大师课', '家常菜100道', '烘焙零基础课', '川菜烹饪教程', '日料入门制作', '咖啡拉花技巧'], basePrice: 299, chapters: 30 },
      '编程': { titles: ['Python全栈开发·订阅', '前端工程师培养计划', 'Java后端架构课', '算法面试系统班', '移动端App开发', '人工智能入门'], basePrice: 0, chapters: 120 },
      '语言': { titles: ['商务英语提升课', '日语入门到N2', '韩语零基础入门', '法语发音教程', '德语基础会话', '雅思听力突破'], basePrice: 259, chapters: 48 },
    };

    const creators = [
      { name: '李老师', verified: true, rating: 4.9, followers: 12500 },
      { name: '王导师', verified: true, rating: 4.8, followers: 8600 },
      { name: '张教练', verified: false, rating: 4.7, followers: 5200 },
      { name: '刘教授', verified: true, rating: 4.9, followers: 28000 },
      { name: '陈老师', verified: true, rating: 4.6, followers: 3900 },
    ];

    const categories = selectedCategory === '全部'
      ? Object.keys(courseTemplates)
      : [selectedCategory];

    const courses: Course[] = [];
    let id = 0;

    categories.forEach((cat) => {
      const template = courseTemplates[cat];
      template.titles.forEach((title, idx) => {
        const creator = creators[idx % creators.length];
        const isSubscription = template.basePrice === 0;
        courses.push({
          id: `course-mock-${id++}`,
          creatorId: `creator-${cat}-${idx}`,
          title,
          description: `${title}，专业导师带你系统学习`,
          category: cat,
          price: isSubscription ? 0 : template.basePrice + idx * 30,
          isSubscription,
          subscriptionPrice: isSubscription ? 49 + idx * 10 : 0,
          coverImage: '',
          status: 'published',
          rating: 4.3 + Math.random() * 0.7,
          reviewCount: Math.floor(80 + Math.random() * 500),
          studentCount: Math.floor(500 + Math.random() * 10000),
          chapterCount: template.chapters + idx * 4,
          totalDuration: template.chapters * 20,
          createdAt: new Date(Date.now() - idx * 86400000 * 30).toISOString(),
          creator: {
            id: `creator-${cat}-${idx}`,
            username: creator.name,
            avatar: '',
            role: 'creator',
            verified: creator.verified,
            followerCount: creator.followers,
            followingCount: 0,
            rating: creator.rating,
            createdAt: '2024-01-01T00:00:00Z',
          },
          chapters: [],
        } as Course);
      });
    });

    return courses.sort(() => Math.random() - 0.5);
  };

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
        setPage((prev) => {
          const nextPage = prev + 1;
          loadData(nextPage);
          return nextPage;
        });
      }
    },
    [hasMore, loadingMore, loading]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  const handleTabChange = (tab: FeedTab) => {
    setActiveTab(tab);
    searchParams.set('tab', tab);
    setSearchParams(searchParams);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category === '全部') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  const formatCount = (count: number) => {
    if (count >= 10000) return (count / 10000).toFixed(1) + 'w';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      return `${hours}小时${mins % 60}分`;
    }
    return `${mins}分钟`;
  };

  if (loading && ((activeTab === 'courses' && courses.length === 0) || (activeTab === 'content' && contentVideos.length === 0))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg z-40 border-b border-zinc-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder={activeTab === 'courses' ? '搜索课程、创作者...' : '搜索视频、创作者...'}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full bg-zinc-100 border-2 border-transparent focus:border-primary-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <button
              className={cn(
                'p-3 rounded-full transition-colors',
                showPriceFilter && activeTab === 'courses'
                  ? 'bg-primary-500 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              )}
              onClick={() => setShowPriceFilter(!showPriceFilter)}
            >
              <Filter className="w-5 h-5" />
            </button>
            <div className="flex items-center rounded-full bg-zinc-100 p-1">
              <button
                className={cn(
                  'p-2 rounded-full transition-colors',
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-zinc-200'
                )}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-5 h-5 text-zinc-600" />
              </button>
              <button
                className={cn(
                  'p-2 rounded-full transition-colors',
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-zinc-200'
                )}
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="w-5 h-5 text-zinc-600" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex bg-zinc-100 rounded-2xl p-1">
              <button
                onClick={() => handleTabChange('content')}
                className={cn(
                  'px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                  activeTab === 'content'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                )}
              >
                <Play className="w-4 h-4 inline mr-1.5" />
                内容社区
              </button>
              <button
                onClick={() => handleTabChange('courses')}
                className={cn(
                  'px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                  activeTab === 'courses'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                )}
              >
                <Crown className="w-4 h-4 inline mr-1.5" />
                课程市场
              </button>
            </div>

            {activeTab === 'courses' && (
              <div className="flex items-center gap-2 ml-2 text-xs text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                <span>平台审核·交易保障</span>
              </div>
            )}
            {activeTab === 'content' && (
              <div className="flex items-center gap-2 ml-2 text-xs text-zinc-500">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>免费浏览·UGC内容</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                className={cn(
                  'whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  activeCategory === cat
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                )}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {showPriceFilter && activeTab === 'courses' && (
            <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 mt-2 animate-fade-in">
              <span className="text-sm text-zinc-500 whitespace-nowrap">价格：</span>
              {priceOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={cn(
                    'whitespace-nowrap px-3 py-1 rounded-full text-sm transition-all',
                    priceFilter === opt.value
                      ? 'bg-accent-500 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  )}
                  onClick={() => setPriceFilter(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'content' ? (
          <>
            {contentVideos.length === 0 ? (
              <Empty />
            ) : (
              <>
                <div
                  className={cn(
                    'grid gap-6 animate-fade-in-up',
                    viewMode === 'grid'
                      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                      : 'grid-cols-1 max-w-3xl mx-auto'
                  )}
                >
                  {contentVideos.map((video, index) => (
                    <div
                      key={video.id}
                      className={cn('animate-fade-in-up-delay-', (index % 5) + 1)}
                      style={{ animationFillMode: 'backwards' }}
                    >
                      <VideoCard
                        video={video}
                        className={viewMode === 'list' ? 'flex' : ''}
                      />
                    </div>
                  ))}
                </div>

                <div ref={observerRef} className="py-12 flex justify-center">
                  {loadingMore && <LoadingSpinner />}
                  {!hasMore && !loadingMore && contentVideos.length > 0 && (
                    <div className="text-zinc-400 text-sm">已加载全部内容</div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {courses.length === 0 ? (
              <Empty />
            ) : (
              <>
                <div className="grid gap-6 animate-fade-in-up grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {courses.map((course, index) => (
                    <div
                      key={course.id}
                      className={cn('animate-fade-in-up-delay-', (index % 5) + 1)}
                      style={{ animationFillMode: 'backwards' }}
                    >
                      <CourseCard
                        course={course}
                        variant={viewMode === 'list' ? 'compact' : 'default'}
                        showStatus={true}
                      />
                    </div>
                  ))}
                </div>

                <div ref={observerRef} className="py-12 flex justify-center">
                  {loadingMore && <LoadingSpinner />}
                  {!hasMore && !loadingMore && courses.length > 0 && (
                    <div className="text-zinc-400 text-sm">已加载全部课程</div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
