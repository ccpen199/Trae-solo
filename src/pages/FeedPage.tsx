import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Grid3X3,
  LayoutList,
  Play,
  Users,
  ShieldCheck,
  Zap,
  Crown,
  Heart,
  Bookmark,
  Share2,
  MessageCircle,
  X,
  User,
  BadgeCheck,
  ChevronRight,
  Send,
  ThumbsUp,
} from 'lucide-react';
import { api } from '../utils/api';
import VideoCard from '../components/VideoCard';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Empty from '../components/Empty';
import Badge from '../components/Badge';
import Button from '../components/Button';
import RatingStars from '../components/RatingStars';
import type { Course, PaginatedResponse, ApiResponse } from '../../shared/types';
import { cn } from '../lib/utils';

const categories = ['全部', '舞蹈', '音乐', '运动', '绘画', '摄影', '烹饪', '编程', '语言'];

type FeedTab = 'content' | 'courses';

interface Comment {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  likes: number;
  createdAt: string;
}

interface ContentVideo {
  id: string;
  title: string;
  creatorName: string;
  creatorId: string;
  creatorVerified: boolean;
  views: number;
  likes: number;
  commentCount: number;
  duration: string;
  category: string;
  collection?: {
    name: string;
    totalCount: number;
  };
  price?: number;
  audited: boolean;
  type: 'video' | 'course';
  courseId?: string;
  comments?: Comment[];
}

const mockComments: Comment[] = [
  {
    id: 'comment-1',
    user: { id: 'u1', name: '学习小能手', avatar: '' },
    content: '这个技巧太实用了！跟着练了一遍，感觉进步很大～',
    likes: 128,
    createdAt: '2小时前',
  },
  {
    id: 'comment-2',
    user: { id: 'u2', name: '艺术爱好者', avatar: '' },
    content: '老师讲得好细致，期待更多教程！',
    likes: 56,
    createdAt: '5小时前',
  },
  {
    id: 'comment-3',
    user: { id: 'u3', name: '初学者小白', avatar: '' },
    content: '请问有没有完整的系统课程呀？想深入学习一下',
    likes: 23,
    createdAt: '1天前',
  },
  {
    id: 'comment-4',
    user: { id: 'u4', name: '资深学员', avatar: '' },
    content: '已购买完整课程，内容超值！推荐大家也去看看',
    likes: 89,
    createdAt: '2天前',
  },
  {
    id: 'comment-5',
    user: { id: 'u5', name: '路人甲', avatar: '' },
    content: '第一次看这个老师的视频，讲得真不错，关注了',
    likes: 34,
    createdAt: '3天前',
  },
];

const generateMockComments = (videoId: string): Comment[] => {
  const count = 3 + (parseInt(videoId.replace('content-', '')) % 3);
  return mockComments.slice(0, count).map((c, i) => ({
    ...c,
    id: `${videoId}-comment-${i}`,
  }));
};

const mockContentVideos: ContentVideo[] = Array.from({ length: 20 }, (_, i) => {
  const creatorIndex = i % 10;
  const courseId = `course-${(creatorIndex % 8) + 1}`;
  return {
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
    creatorId: `creator-${['舞蹈', '音乐', '运动', '绘画', '摄影', '烹饪', '编程', '语言', '音乐', '运动'][i % 10]}-${i % 6}`,
    creatorVerified: i % 3 === 0,
    views: Math.floor(Math.random() * 50000) + 5000,
    likes: Math.floor(Math.random() * 5000) + 200,
    commentCount: Math.floor(Math.random() * 500) + 20,
    duration: `${Math.floor(Math.random() * 5) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    category: ['舞蹈', '音乐', '运动', '绘画', '摄影', '烹饪', '编程', '语言'][i % 8],
    collection: i % 4 === 0 ? {
      name: ['街舞入门系列', '钢琴名曲集', '瑜伽晨练系列', '水彩基础课'][i % 4],
      totalCount: 6 + (i % 5) * 3,
    } : undefined,
    price: i % 3 === 0 ? 0 : (i % 5 === 0 ? 29 + (i % 10) * 10 : undefined),
    audited: i % 2 === 0,
    type: i % 5 === 0 ? 'course' : 'video',
    courseId,
    comments: generateMockComments(`content-${i}`),
  };
});

export default function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FeedTab>(
    (searchParams.get('tab') as FeedTab) || 'content'
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [guideCourses, setGuideCourses] = useState<Course[]>([]);
  const [contentVideos, setContentVideos] = useState<ContentVideo[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '全部');
  const [priceFilter, setPriceFilter] = useState<string>('');
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ContentVideo | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [navigatingCourse, setNavigatingCourse] = useState(false);
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
    loadGuideCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
    setCourses([]);
    setContentVideos([]);
    setHasMore(true);
    loadData(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, searchKeyword, activeTab, priceFilter]);

  const loadGuideCourses = async () => {
    try {
      const res = await api.courses.list({
        page: 1,
        pageSize: 12,
        status: 'published',
      });
      const items = (res as ApiResponse<PaginatedResponse<Course>>)?.data?.items || [];
      if (items.length > 0) {
        setGuideCourses(items);
      }
    } catch (error) {
      console.error('Failed to load guide courses:', error);
    }
  };

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
        const apiRes = res as ApiResponse<PaginatedResponse<Course>>;
        const data = apiRes?.data;
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
    let id = 1;

    categories.forEach((cat) => {
      const template = courseTemplates[cat];
      template.titles.forEach((title, idx) => {
        const creator = creators[idx % creators.length];
        const isSubscription = template.basePrice === 0;
        if (id > 8) return;
        courses.push({
          id: `course-${id++}`,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleVideoClick = (video: ContentVideo) => {
    setSelectedVideo(video);
    setIsLiked(false);
    setIsBookmarked(false);
    setCommentInput('');
    document.body.style.overflow = 'hidden';
  };

  const handleCloseModal = () => {
    setSelectedVideo(null);
    document.body.style.overflow = '';
  };

  const getCreatorOtherVideos = (video: ContentVideo) => {
    return mockContentVideos
      .filter((v) => v.creatorId === video.creatorId && v.id !== video.id)
      .slice(0, 4);
  };

  const getCreatorCourse = (video: ContentVideo) => {
    const matched = guideCourses.find((c) => c.category === video.category);
    if (matched) return matched;
    const allCourses = generateMockCourses(video.category);
    return allCourses.find(
      (c) => c.creator?.username === video.creatorName
    ) || allCourses[0];
  };

  const handleCourseClick = (courseId: string) => {
    setNavigatingCourse(true);
    setTimeout(() => {
      handleCloseModal();
      setNavigatingCourse(false);
      navigate(`/courses/${courseId}`);
    }, 500);
  };

  const handleCreatorClick = (creatorId: string) => {
    handleCloseModal();
    navigate(`/creator/${creatorId}`);
  };

  if (loading && ((activeTab === 'courses' && courses.length === 0) || (activeTab === 'content' && contentVideos.length === 0))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-500',
      activeTab === 'content' ? 'bg-green-50/50' : 'bg-purple-50/50'
    )}>
      <div className={cn(
        'sticky top-0 backdrop-blur-lg z-40 border-b transition-all duration-500',
        activeTab === 'content'
          ? 'bg-green-50/90 border-green-200'
          : 'bg-purple-50/90 border-purple-200'
      )}>
        <div className="container mx-auto px-4 py-4">
          <div className={cn(
            'mb-4 px-5 py-4 rounded-2xl flex items-center justify-between',
            activeTab === 'content'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20'
              : 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-500/20'
          )}>
            <div className="flex items-center gap-3">
              {activeTab === 'content' ? (
                <Zap className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
              <div>
                <h2 className="text-lg font-bold">
                  {activeTab === 'content' ? '内容社区 · UGC短视频' : '课程市场 · 系统付费课'}
                </h2>
                <p className="text-sm opacity-90">
                  {activeTab === 'content' ? '免费浏览·创作者自发分享' : '平台审核·交易保障·资金托管'}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {activeTab === 'content' ? (
                <>
                  <Badge variant="accent" className="bg-white/20 text-white border-white/30">
                    <Users className="w-3.5 h-3.5 mr-1" />
                    10w+ 创作者
                  </Badge>
                  <Badge variant="accent" className="bg-white/20 text-white border-white/30">
                    <Play className="w-3.5 h-3.5 mr-1" />
                    50w+ 视频
                  </Badge>
                </>
              ) : (
                <>
                  <Badge variant="accent" className="bg-white/20 text-white border-white/30">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    平台审核
                  </Badge>
                  <Badge variant="accent" className="bg-white/20 text-white border-white/30">
                    <Crown className="w-3.5 h-3.5 mr-1" />
                    品质保障
                  </Badge>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder={activeTab === 'courses' ? '搜索课程、创作者...' : '搜索视频、创作者...'}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full bg-white/80 border-2 border-transparent focus:border-primary-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <button
              className={cn(
                'p-3 rounded-full transition-colors',
                showPriceFilter && activeTab === 'courses'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/80 text-zinc-600 hover:bg-white'
              )}
              onClick={() => setShowPriceFilter(!showPriceFilter)}
            >
              <Filter className="w-5 h-5" />
            </button>
            <div className="flex items-center rounded-full bg-white/80 p-1">
              <button
                className={cn(
                  'p-2 rounded-full transition-colors',
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/60'
                )}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-5 h-5 text-zinc-600" />
              </button>
              <button
                className={cn(
                  'p-2 rounded-full transition-colors',
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/60'
                )}
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="w-5 h-5 text-zinc-600" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex bg-white/60 rounded-2xl p-1">
              <button
                onClick={() => handleTabChange('content')}
                className={cn(
                  'px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-1.5',
                  activeTab === 'content'
                    ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/80'
                )}
              >
                <Play className="w-4 h-4" />
                内容社区
              </button>
              <button
                onClick={() => handleTabChange('courses')}
                className={cn(
                  'px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-1.5',
                  activeTab === 'courses'
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-white/80'
                )}
              >
                <Crown className="w-4 h-4" />
                课程市场
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                className={cn(
                  'whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  activeCategory === cat
                    ? activeTab === 'content'
                      ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                      : 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                    : 'bg-white/60 text-zinc-600 hover:bg-white/80'
                )}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {showPriceFilter && activeTab === 'courses' && (
            <div className="flex items-center gap-2 pt-3 border-t border-purple-200 mt-2 animate-fade-in">
              <span className="text-sm text-zinc-500 whitespace-nowrap">价格：</span>
              {priceOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={cn(
                    'whitespace-nowrap px-3 py-1 rounded-full text-sm transition-all',
                    priceFilter === opt.value
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/60 text-zinc-600 hover:bg-white/80'
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
                    'grid gap-5 animate-fade-in-up',
                    viewMode === 'grid'
                      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                      : 'grid-cols-1 max-w-3xl mx-auto gap-4'
                  )}
                >
                  {contentVideos.map((video, index) => (
                    <div
                      key={video.id}
                      className={cn('animate-fade-in-up-delay-', (index % 5) + 1)}
                      style={{ animationFillMode: 'backwards' }}
                      onClick={() => handleVideoClick(video)}
                    >
                      <VideoCard
                        video={video}
                        className={cn(
                          viewMode === 'list' ? 'flex' : '',
                          'hover:scale-[1.02] transition-transform'
                        )}
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

      {selectedVideo && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={handleCloseModal}
          />

          <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-6xl md:mx-4 bg-zinc-900 md:rounded-2xl overflow-hidden animate-slide-up">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="h-full flex flex-col lg:flex-row">
              <div className="flex-1 flex flex-col min-h-0">
                <div className="relative aspect-video bg-black flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600/30 via-zinc-800 to-zinc-900 flex items-center justify-center">
                    <button className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors group">
                      <Play className="w-10 h-10 text-white ml-1 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <Badge variant="primary" className="bg-green-500/90 text-white border-0">
                      {selectedVideo?.category}
                    </Badge>
                    <span className="text-white/80 text-sm bg-black/50 px-2 py-1 rounded">
                      {selectedVideo?.duration}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-white p-6 min-h-0">
                  <h1 className="text-xl font-bold text-zinc-900 mb-4">
                    {selectedVideo?.title}
                  </h1>

                  <div
                    className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-100 cursor-pointer hover:bg-zinc-50 -mx-2 px-2 py-2 rounded-xl transition-colors"
                    onClick={() => handleCreatorClick(selectedVideo?.creatorId || '')}
                  >
                    <div className="relative">
                      {selectedVideo?.creatorVerified ? (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                          {selectedVideo?.creatorName?.charAt(0)}
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600 font-bold text-lg">
                          {selectedVideo?.creatorName?.charAt(0)}
                        </div>
                      )}
                      {selectedVideo?.creatorVerified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-white">
                          <BadgeCheck className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900">{selectedVideo?.creatorName}</span>
                      </div>
                      <p className="text-sm text-zinc-500">{formatCount(selectedVideo?.views || 0)} 次观看</p>
                    </div>
                    <Button size="sm" variant="primary" className="bg-green-500 hover:bg-green-600">
                      + 关注
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    <button
                      onClick={() => setIsLiked(!isLiked)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-full transition-all',
                        isLiked
                          ? 'bg-red-50 text-red-500'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      )}
                    >
                      <Heart className={cn('w-5 h-5', isLiked && 'fill-red-500')} />
                      <span className="text-sm font-medium">
                        {formatCount((selectedVideo?.likes || 0) + (isLiked ? 1 : 0))}
                      </span>
                    </button>
                    <button
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-full transition-all',
                        isBookmarked
                          ? 'bg-green-50 text-green-500'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      )}
                    >
                      <Bookmark className={cn('w-5 h-5', isBookmarked && 'fill-green-500')} />
                      <span className="text-sm font-medium">收藏</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all">
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm font-medium">分享</span>
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 text-zinc-600">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {formatCount(selectedVideo?.commentCount || 0)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-green-500" />
                      评论 ({selectedVideo?.comments?.length || 0})
                    </h3>

                    <div className="flex gap-3 mb-6">
                      <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-zinc-500" />
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="说点什么..."
                          className="flex-1 px-4 py-2 rounded-full bg-zinc-100 text-sm outline-none focus:ring-2 focus:ring-green-500/30 focus:bg-white transition-all"
                        />
                        <button
                          className={cn(
                            'p-2.5 rounded-full transition-all',
                            commentInput.trim()
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                          )}
                          disabled={!commentInput.trim()}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedVideo?.comments?.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-medium">
                              {comment.user.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-zinc-900">
                                {comment.user.name}
                              </span>
                              <span className="text-xs text-zinc-400">{comment.createdAt}</span>
                            </div>
                            <p className="text-sm text-zinc-700 mb-2">{comment.content}</p>
                            <button className="flex items-center gap-1 text-xs text-zinc-500 hover:text-green-500 transition-colors">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{comment.likes}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-80 bg-zinc-50 border-t lg:border-t-0 lg:border-l border-zinc-200 overflow-y-auto max-h-80 lg:max-h-none">
                <div className="p-4">
                  <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                    <Play className="w-4 h-4 text-green-500" />
                    创作者其他视频
                  </h3>
                  <div className="space-y-3">
                    {getCreatorOtherVideos(selectedVideo).map((video) => (
                      <div
                        key={video.id}
                        className="flex gap-3 cursor-pointer group"
                        onClick={() => {
                          setSelectedVideo(video);
                          setIsLiked(false);
                          setIsBookmarked(false);
                        }}
                      >
                        <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-zinc-200 flex-shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-zinc-300 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white/80" />
                          </div>
                          <span className="absolute bottom-1 right-1 text-xs text-white bg-black/60 px-1 rounded">
                            {video.duration}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-zinc-900 line-clamp-2 group-hover:text-green-600 transition-colors">
                            {video.title}
                          </h4>
                          <p className="text-xs text-zinc-500 mt-1">
                            {formatCount(video.views)} 次观看
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 border-t border-zinc-200">
                  <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    TA 的完整课程
                  </h3>
                  {navigatingCourse ? (
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-zinc-200 p-6 flex flex-col items-center justify-center">
                      <LoadingSpinner size="md" />
                      <p className="mt-3 text-sm text-zinc-500">正在加载课程...</p>
                    </div>
                  ) : (
                    (() => {
                      const course = getCreatorCourse(selectedVideo);
                      return (
                        <div
                          className="bg-white rounded-xl overflow-hidden shadow-sm border border-zinc-200 cursor-pointer hover:shadow-md transition-shadow group"
                          onClick={() => handleCourseClick(course?.id || '')}
                        >
                          <div className="relative aspect-video bg-gradient-to-br from-purple-400 to-violet-500">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play className="w-10 h-10 text-white/60" />
                            </div>
                            <div className="absolute top-2 left-2">
                              <Badge variant="accent" size="sm" className="bg-amber-500 text-white border-0">
                                <Crown className="w-3 h-3 mr-0.5" />
                                系统课
                              </Badge>
                            </div>
                          </div>
                          <div className="p-3">
                            <h4 className="text-sm font-semibold text-zinc-900 line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors">
                              {course?.title}
                            </h4>
                            <div className="flex items-center gap-2 mb-2">
                              <RatingStars rating={course?.rating || 4.8} size="sm" showValue />
                              <span className="text-xs text-zinc-500">
                                ({course?.reviewCount || 0}评价)
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-lg font-bold text-purple-600">
                                  {course?.price === 0
                                    ? course?.isSubscription && course?.subscriptionPrice
                                      ? `¥${course.subscriptionPrice}/月`
                                      : '免费'
                                    : `¥${course?.price}`}
                                </span>
                              </div>
                              <span className="text-xs text-zinc-500">
                                {course?.chapterCount || 0} 章节
                              </span>
                            </div>
                            <button className="w-full mt-3 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-violet-600 transition-all">
                              查看课程详情
                              <ChevronRight className="w-4 h-4 inline ml-0.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
