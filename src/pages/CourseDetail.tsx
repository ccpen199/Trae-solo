import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, ChevronDown, ChevronUp, Star, Users, Clock, Check, Share2,
  Heart, MoreHorizontal, Lock, User, Shield, FileCheck, Eye,
  AlertCircle, Info, FileText, Receipt, Landmark, RefreshCw,
  BadgeCheck, Crown, XCircle, AlertTriangle, CreditCard, Percent,
  ArrowLeft, Search, HelpCircle, CircleDot, Wallet, CheckCircle2,
  Calendar, Hash, ExternalLink, Sparkles, Zap, BookOpen, Award,
  MessageCircle, Download, Clock3, Coins, TrendingUp, X, ChevronRight,
  Copy, CheckCircle, Check as CheckIcon
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import Empty from '../components/Empty';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { cn } from '../lib/utils';
import type { Course, Chapter, Review } from '../../shared/types';

interface PurchasedCourseInfo {
  type: 'one_time' | 'subscription';
  purchaseDate: string;
  orderNo: string;
  amount: number;
  payTime: string;
  payMethod: string;
  progress?: number;
  lastChapterId?: string;
  lastChapterTitle?: string;
  expiresAt?: string;
}

interface PurchasedCoursesMap {
  [courseId: string]: PurchasedCourseInfo;
}

const PURCHASED_COURSES_KEY = 'skillverse:purchasedCourses';

const getPurchasedCourses = (): PurchasedCoursesMap => {
  try {
    const raw = localStorage.getItem(PURCHASED_COURSES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const getPurchasedCourse = (courseId: string): PurchasedCourseInfo | null => {
  const all = getPurchasedCourses();
  return all[courseId] || null;
};

const setPurchasedCourse = (courseId: string, data: PurchasedCourseInfo) => {
  try {
    const all = getPurchasedCourses();
    all[courseId] = data;
    localStorage.setItem(PURCHASED_COURSES_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
};

const normalizeCourseId = (courseId: string): string => {
  if (courseId.startsWith('course-mock-')) {
    const num = parseInt(courseId.replace('course-mock-', ''), 10);
    return `course-${(num % 8) + 1}`;
  }
  return courseId;
};

interface MockCourseTemplate {
  title: string;
  description: string;
  category: string;
  price: number;
  subscriptionPrice: number;
  isSubscription: boolean;
  chapters: { title: string; duration: number; isFree: boolean }[];
}

const mockCourseTemplates: Record<string, MockCourseTemplate> = {
  'course-1': {
    title: '爵士舞零基础系统课',
    description: '从零基础开始，系统学习爵士舞的基本动作、节奏感和舞台表现力。包含24个章节，由浅入深，让你轻松掌握爵士舞技巧，展现自信舞姿。',
    category: '舞蹈',
    price: 299,
    subscriptionPrice: 49,
    isSubscription: true,
    chapters: [
      { title: '课程介绍与热身准备', duration: 8, isFree: true },
      { title: '基础站姿与身体隔离', duration: 15, isFree: true },
      { title: '头部与肩部律动训练', duration: 20, isFree: false },
      { title: '胸部与胯部基础动作', duration: 25, isFree: false },
      { title: '基础步伐组合练习', duration: 30, isFree: false },
      { title: '手臂线条与身体波浪', duration: 25, isFree: false },
    ],
  },
  'course-2': {
    title: '钢琴入门到精通',
    description: '从零开始学习钢琴，涵盖识谱、指法、节奏、和弦等核心技能。适合钢琴初学者，循序渐进带你进入音乐的殿堂。',
    category: '音乐',
    price: 399,
    subscriptionPrice: 59,
    isSubscription: true,
    chapters: [
      { title: '钢琴基础知识与坐姿', duration: 10, isFree: true },
      { title: '五线谱识谱入门', duration: 18, isFree: true },
      { title: '右手基本指法练习', duration: 22, isFree: false },
      { title: '左手和弦基础', duration: 25, isFree: false },
      { title: '双手配合初步训练', duration: 30, isFree: false },
      { title: '简单曲目演奏练习', duration: 35, isFree: false },
    ],
  },
  'course-3': {
    title: '瑜伽身心疗愈课',
    description: '结合传统瑜伽与现代身心科学，通过体式、呼吸、冥想三大维度，帮助你释放压力，提升身体柔韧性与内心平静。',
    category: '运动',
    price: 199,
    subscriptionPrice: 39,
    isSubscription: true,
    chapters: [
      { title: '瑜伽入门与呼吸基础', duration: 12, isFree: true },
      { title: '热身体式与关节活动', duration: 15, isFree: true },
      { title: '太阳致敬式详解', duration: 25, isFree: false },
      { title: '站立体式正位练习', duration: 30, isFree: false },
      { title: '坐姿体式与前屈练习', duration: 25, isFree: false },
      { title: '放松体式与冥想引导', duration: 20, isFree: false },
    ],
  },
  'course-4': {
    title: '水彩风景手绘课',
    description: '从零开始学习水彩画，掌握水彩晕染、调色、构图等核心技法。从简单静物到风景写生，循序渐进激发你的艺术潜能。',
    category: '绘画',
    price: 259,
    subscriptionPrice: 45,
    isSubscription: true,
    chapters: [
      { title: '水彩工具介绍与选择', duration: 10, isFree: true },
      { title: '基础调色技法演示', duration: 18, isFree: true },
      { title: '湿画法与干画法', duration: 22, isFree: false },
      { title: '简单静物写生练习', duration: 28, isFree: false },
      { title: '天空与云彩画法', duration: 25, isFree: false },
      { title: '完整风景作品创作', duration: 35, isFree: false },
    ],
  },
  'course-5': {
    title: '手机人像摄影大师班',
    description: '用手机也能拍出大片！系统讲解人像摄影构图、光线运用、情绪引导、后期修图等技巧，让你随时随地拍出精美照片。',
    category: '摄影',
    price: 159,
    subscriptionPrice: 35,
    isSubscription: true,
    chapters: [
      { title: '手机摄影基础设置', duration: 8, isFree: true },
      { title: '人像构图黄金法则', duration: 15, isFree: true },
      { title: '自然光与人造光运用', duration: 20, isFree: false },
      { title: '拍摄角度与姿势引导', duration: 25, isFree: false },
      { title: '背景选择与环境营造', duration: 22, isFree: false },
      { title: '人像后期调色技巧', duration: 30, isFree: false },
    ],
  },
  'course-6': {
    title: '法式甜点大师课',
    description: '在家也能做出专业级法式甜点！从基础酥皮到经典慕斯，详细讲解每一个步骤和技巧，让你变身甜品达人。',
    category: '烹饪',
    price: 299,
    subscriptionPrice: 49,
    isSubscription: true,
    chapters: [
      { title: '烘焙工具与材料介绍', duration: 10, isFree: true },
      { title: '基础打发与搅拌技巧', duration: 18, isFree: true },
      { title: '法式酥皮制作详解', duration: 30, isFree: false },
      { title: '卡仕达酱与奶油制作', duration: 25, isFree: false },
      { title: '马卡龙制作全流程', duration: 40, isFree: false },
      { title: '慕斯蛋糕装饰技巧', duration: 35, isFree: false },
    ],
  },
  'course-7': {
    title: 'Python全栈开发·订阅',
    description: '从Python基础语法到Web开发全流程实战，涵盖Django、Flask、数据库、前端等技术栈，助你成为全栈工程师。',
    category: '编程',
    price: 0,
    subscriptionPrice: 79,
    isSubscription: true,
    chapters: [
      { title: 'Python环境搭建与Hello World', duration: 12, isFree: true },
      { title: '变量、数据类型与运算符', duration: 20, isFree: true },
      { title: '流程控制与函数定义', duration: 28, isFree: false },
      { title: '面向对象编程基础', duration: 35, isFree: false },
      { title: '文件操作与异常处理', duration: 25, isFree: false },
      { title: 'Django框架快速入门', duration: 40, isFree: false },
    ],
  },
  'course-8': {
    title: '商务英语提升课',
    description: '专为职场人士打造的商务英语课程，涵盖邮件写作、会议沟通、商务谈判、演讲展示等核心场景，提升你的职场竞争力。',
    category: '语言',
    price: 359,
    subscriptionPrice: 55,
    isSubscription: true,
    chapters: [
      { title: '商务英语发音与语调', duration: 15, isFree: true },
      { title: '商务邮件写作基础', duration: 20, isFree: true },
      { title: '电话与视频会议英语', duration: 25, isFree: false },
      { title: '商务谈判常用表达', duration: 30, isFree: false },
      { title: '职场演讲与展示技巧', duration: 35, isFree: false },
      { title: '跨文化沟通注意事项', duration: 25, isFree: false },
    ],
  },
};

const getDefaultMockCourse = (courseId: string): { course: Course; chapters: Chapter[] } => {
  const normalizedId = normalizeCourseId(courseId);
  const template = mockCourseTemplates[normalizedId] || mockCourseTemplates['course-1'];

  const chapters: Chapter[] = template.chapters.map((ch, idx) => ({
    id: `chapter-${idx + 1}`,
    courseId: normalizedId,
    title: ch.title,
    duration: ch.duration,
    order: idx + 1,
    isFree: ch.isFree,
    videoUrl: '#',
  }));

  const course: Course = {
    id: normalizedId,
    creatorId: `creator-${template.category}-1`,
    title: template.title,
    description: template.description,
    category: template.category,
    price: template.price,
    isSubscription: template.isSubscription,
    subscriptionPrice: template.subscriptionPrice,
    coverImage: '',
    status: 'published',
    rating: 4.7,
    reviewCount: 256,
    studentCount: 5000 + Math.floor(Math.random() * 5000),
    chapterCount: chapters.length,
    totalDuration: chapters.reduce((sum, ch) => sum + ch.duration, 0),
    createdAt: new Date().toISOString(),
    creator: {
      id: `creator-${template.category}-1`,
      username: [
        '李老师', '王导师', '张教练', '刘教授', '陈老师',
        '赵大师', '周专家', '吴讲师',
      ][parseInt(normalizedId.replace('course-', ''), 10) % 8],
      avatar: '',
      role: 'creator',
      verified: true,
      followerCount: 5000 + Math.floor(Math.random() * 10000),
      followingCount: 0,
      rating: 4.6 + Math.random() * 0.4,
      createdAt: '2024-01-01T00:00:00Z',
    },
    chapters: [],
  } as Course;

  return { course, chapters };
};

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const normalizedId = id ? normalizeCourseId(id) : 'course-1';
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [chaptersExpanded, setChaptersExpanded] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [purchaseType, setPurchaseType] = useState<'one_time' | 'subscription' | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [showSettlementInfo, setShowSettlementInfo] = useState(false);
  const [lastWatchedChapter, setLastWatchedChapter] = useState<string | null>(null);
  const [watchedFreeChapters, setWatchedFreeChapters] = useState<string[]>([]);
  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null);
  const [accessInfo, setAccessInfo] = useState<{
    type: 'none' | 'one_time' | 'subscription';
    purchaseDate?: string;
    expiresAt?: string;
    progress?: number;
    lastChapterId?: string;
    lastChapterTitle?: string;
  }>({ type: 'none' });
  const [orderInfo, setOrderInfo] = useState<{
    orderNo: string;
    payTime: string;
    payMethod: string;
    amount: number;
  } | null>(null);
  const [settlementInfo, setSettlementInfo] = useState<{
    orderAmount: number;
    platformFee: number;
    taxAmount: number;
    creatorNet: number;
    settlementStatus: 'pending';
    transactionId: string;
  } | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showTaxDetails, setShowTaxDetails] = useState(false);
  const [tradeChainStep, setTradeChainStep] = useState(0);

  useEffect(() => {
    if (normalizedId) {
      const purchased = getPurchasedCourse(normalizedId);

      if (purchased) {
        setHasAccess(true);
        setAccessInfo({
          type: purchased.type,
          purchaseDate: purchased.purchaseDate,
          expiresAt: purchased.expiresAt || (purchased.type === 'subscription'
            ? new Date(Date.now() + 30 * 86400000).toLocaleDateString()
            : undefined),
          progress: purchased.progress || 0,
          lastChapterId: purchased.lastChapterId,
          lastChapterTitle: purchased.lastChapterTitle,
        });
        setLastWatchedChapter(purchased.lastChapterId || null);

        setOrderInfo({
          orderNo: purchased.orderNo,
          payTime: purchased.payTime,
          payMethod: purchased.payMethod,
          amount: purchased.amount,
        });

        const amount = purchased.amount;
        setSettlementInfo({
          orderAmount: amount,
          platformFee: amount * 0.15,
          taxAmount: amount * 0.85 * 0.06,
          creatorNet: amount * 0.85 * 0.94,
          settlementStatus: 'pending',
          transactionId: purchased.orderNo,
        });
      }

      loadCourseData();
    }
  }, [normalizedId]);

  const loadCourseData = async () => {
    if (!normalizedId) return;
    setLoading(true);

    const fallback = getDefaultMockCourse(normalizedId);
    const minDelay = new Promise(resolve => setTimeout(resolve, 500));

    try {
      const results = await Promise.allSettled([
        api.courses.getById(normalizedId),
        api.courses.getChapters(normalizedId),
        api.courses.getReviews(normalizedId, { pageSize: 10 }),
        isAuthenticated
          ? api.courses.getAccess(normalizedId).catch(() => ({ data: { hasAccess: false } }))
          : Promise.resolve({ data: { hasAccess: false } }),
        minDelay,
      ]);

      const [courseRes, chaptersRes, reviewsRes, accessRes] = results;

      let loadedCourse: Course | null = null;
      let loadedChapters: Chapter[] = [];
      let loadedReviews: Review[] = [];
      let apiHasAccess = false;

      if (courseRes.status === 'fulfilled' && (courseRes.value as any)?.data) {
        loadedCourse = (courseRes.value as any).data;
      } else {
        loadedCourse = fallback.course;
      }

      if (chaptersRes.status === 'fulfilled' && (chaptersRes.value as any)?.data?.length > 0) {
        loadedChapters = (chaptersRes.value as any).data;
      } else {
        loadedChapters = fallback.chapters;
      }

      if (reviewsRes.status === 'fulfilled' && (reviewsRes.value as any)?.data?.items?.length > 0) {
        loadedReviews = (reviewsRes.value as any).data.items;
      } else {
        loadedReviews = [
          {
            id: 'review-1',
            courseId: normalizedId,
            userId: 'u1',
            rating: 5,
            content: '老师讲得非常详细，零基础也能跟上，强烈推荐！',
            createdAt: '2024-01-15T10:30:00Z',
            user: {
              id: 'u1',
              username: '学员小王',
              avatar: '',
              role: 'user' as const,
              followerCount: 0,
              followingCount: 0,
              rating: 0,
              verified: false,
              createdAt: new Date().toISOString(),
            },
          },
          {
            id: 'review-2',
            courseId: normalizedId,
            userId: 'u2',
            rating: 4,
            content: '课程内容很充实，就是节奏稍快，需要反复观看。',
            createdAt: '2024-01-10T15:20:00Z',
            user: {
              id: 'u2',
              username: '学习爱好者',
              avatar: '',
              role: 'user' as const,
              followerCount: 0,
              followingCount: 0,
              rating: 0,
              verified: false,
              createdAt: new Date().toISOString(),
            },
          },
        ];
      }

      if (accessRes.status === 'fulfilled' && (accessRes.value as any)?.data?.hasAccess) {
        apiHasAccess = true;
      }

      const purchased = getPurchasedCourse(normalizedId);
      const finalHasAccess = !!purchased || apiHasAccess || hasAccess;

      setCourse(loadedCourse);
      setChapters(loadedChapters);
      setReviews(loadedReviews);
      setHasAccess(finalHasAccess);

      if (purchased && !apiHasAccess && isAuthenticated) {
        api.courses.getAccess(normalizedId).catch(() => {});
      }
    } catch (error) {
      console.error('Failed to load course:', error);
      setCourse(fallback.course);
      setChapters(fallback.chapters);
      setReviews([
        {
          id: 'review-1',
          courseId: normalizedId,
          userId: 'u1',
          rating: 5,
          content: '老师讲得非常详细，零基础也能跟上，强烈推荐！',
          createdAt: '2024-01-15T10:30:00Z',
          user: {
            id: 'u1',
            username: '学员小王',
            avatar: '',
            role: 'user' as const,
            followerCount: 0,
            followingCount: 0,
            rating: 0,
            verified: false,
            createdAt: new Date().toISOString(),
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!normalizedId) return;

    const formData = new FormData(e.currentTarget);
    const rating = parseInt(formData.get('rating') as string);
    const content = formData.get('content') as string;

    setReviewLoading(true);
    try {
      await api.courses.addReview(normalizedId, rating, content);
      await loadCourseData();
      e.currentTarget.reset();
    } catch (error: any) {
      alert(error?.message || '评价失败');
    } finally {
      setReviewLoading(false);
    }
  };

  const reviewRecords = [
    {
      time: '2024-06-01 10:30:00',
      operator: '系统AI审核',
      status: 'passed',
      message: '初审通过：标题、描述、封面图合规',
    },
    {
      time: '2024-06-01 11:15:00',
      operator: '系统AI审核',
      status: 'passed',
      message: '章节视频内容合规检测通过',
    },
    {
      time: '2024-06-01 14:20:00',
      operator: '平台审核员-张敏',
      status: 'passed',
      message: '人工复核通过，讲师资质验证合格',
    },
    {
      time: '2024-06-01 14:30:00',
      operator: '系统',
      status: 'published',
      message: '课程正式上线发布',
    },
  ];

  const subscriptionBenefits = [
    { icon: Play, title: '全站畅学', desc: '超过10,000+课程免费观看' },
    { icon: Crown, title: '会员专属', desc: '订阅制专属精品课程' },
    { icon: Users, title: '私教答疑', desc: '讲师1对1社群答疑服务' },
    { icon: FileText, title: '资料下载', desc: '课程配套资料&源码下载' },
    { icon: BadgeCheck, title: '证书认证', desc: '结业后颁发平台电子证书' },
    { icon: RefreshCw, title: '无忧退款', desc: '7天内不满意全额退款' },
  ];

  const handlePurchase = async (type: 'one_time' | 'subscription') => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!normalizedId || !course) return;

    if (!course?.price && !course?.subscriptionPrice) {
      alert('课程配置异常，请联系客服');
      return;
    }

    setPurchaseType(type);
    setShowPaymentModal(true);
  };

  const confirmPurchase = async () => {
    if (!normalizedId || !purchaseType || !course) return;
    setPurchasing(true);
    try {
      await api.courses.purchase(normalizedId, purchaseType).catch(() => {});
      setHasAccess(true);
      const now = new Date();
      const timestamp = Date.now();
      const orderNo = generateSkillOrderNo(timestamp);
      const amount = purchaseType === 'subscription' ? (course.subscriptionPrice || 0) : (course.price || 0);
      const payMethods = ['微信支付', '支付宝'];
      const payMethod = payMethods[Math.floor(Math.random() * payMethods.length)];
      const expiresAt = purchaseType === 'subscription'
        ? new Date(Date.now() + 30 * 86400000).toLocaleDateString()
        : undefined;

      const purchasedData: PurchasedCourseInfo = {
        type: purchaseType,
        purchaseDate: now.toLocaleDateString(),
        orderNo,
        amount,
        payTime: now.toLocaleString(),
        payMethod,
        progress: 0,
        lastChapterId: chapters[0]?.id,
        lastChapterTitle: chapters[0]?.title,
        expiresAt,
      };
      setPurchasedCourse(normalizedId, purchasedData);

      setAccessInfo({
        type: purchaseType,
        purchaseDate: now.toLocaleDateString(),
        expiresAt,
        progress: 0,
        lastChapterId: chapters[0]?.id,
        lastChapterTitle: chapters[0]?.title,
      });
      
      setOrderInfo({
        orderNo,
        payTime: now.toLocaleString(),
        payMethod,
        amount,
      });

      setSettlementInfo({
        orderAmount: amount,
        platformFee: amount * 0.15,
        taxAmount: amount * 0.85 * 0.06,
        creatorNet: amount * 0.85 * 0.94,
        settlementStatus: 'pending',
        transactionId: orderNo,
      });
      
      setLastWatchedChapter(chapters[0]?.id || null);
      setShowPaymentModal(false);
      setTradeChainStep(0);
      setShowSuccessModal(true);
      
      const steps = [400, 800, 1200, 1600, 2000];
      steps.forEach((delay, idx) => {
        setTimeout(() => {
          setTradeChainStep(idx + 1);
        }, delay);
      });
    } catch (error: any) {
      alert(error?.message || '购买失败，请重试');
    } finally {
      setPurchasing(false);
    }
  };

  const generateSkillOrderNo = (timestamp?: number): string => {
    const ts = timestamp || Date.now();
    return `SKILL${ts}`;
  };

  const copyOrderNoToClipboard = async (orderNo: string) => {
    try {
      await navigator.clipboard.writeText(orderNo);
      setCopiedOrderNo(true);
      setTimeout(() => setCopiedOrderNo(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = orderNo;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedOrderNo(true);
      setTimeout(() => setCopiedOrderNo(false), 2000);
    }
  };

  const getPayMethodIcon = (method: string) => {
    if (method.includes('微信')) return { bg: 'bg-green-100', color: 'text-green-600', label: '微信支付' };
    if (method.includes('支付宝')) return { bg: 'bg-blue-100', color: 'text-blue-600', label: '支付宝' };
    if (method.includes('银行')) return { bg: 'bg-purple-100', color: 'text-purple-600', label: '银行卡' };
    return { bg: 'bg-zinc-100', color: 'text-zinc-600', label: method };
  };

  const handleChapterClick = (chapter: Chapter, index: number) => {
    if (hasAccess || chapter.isFree) {
      setActiveChapter(activeChapter === index ? null : index);
      if (hasAccess) {
        setLastWatchedChapter(chapter.id);
        const progress = Math.round(((index + 1) / chapters.length) * 100);
        setAccessInfo(prev => {
          const newInfo = {
            ...prev,
            lastChapterId: chapter.id,
            lastChapterTitle: chapter.title,
            progress,
          };
          const purchased = getPurchasedCourse(normalizedId);
          if (purchased) {
            setPurchasedCourse(normalizedId, {
              ...purchased,
              lastChapterId: chapter.id,
              lastChapterTitle: chapter.title,
              progress,
            });
          }
          return newInfo;
        });
      }
      if (chapter.isFree && !hasAccess && !watchedFreeChapters.includes(chapter.id)) {
        setWatchedFreeChapters(prev => [...prev, chapter.id]);
      }
    } else {
      setShowLockedModal(true);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsFollowing(!isFollowing);
    alert(isFollowing ? '已取消关注' : '关注成功！新课程将第一时间通知您');
  };

  const freeChaptersCount = chapters.filter(c => c.isFree).length;
  const lockedChaptersCount = chapters.length - freeChaptersCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="relative aspect-video bg-zinc-900 animate-pulse" />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <div className="h-8 bg-zinc-200 rounded-lg w-3/4 animate-pulse" />
                <div className="h-4 bg-zinc-200 rounded w-1/2 animate-pulse" />
                <div className="h-4 bg-zinc-200 rounded w-2/3 animate-pulse" />
              </div>
              <div className="card p-6 space-y-4">
                <div className="h-6 bg-zinc-200 rounded w-1/4 animate-pulse" />
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 bg-zinc-200 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-200 rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-zinc-200 rounded w-1/2 animate-pulse" />
                    </div>
                    <div className="w-16 h-3 bg-zinc-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="card p-6 space-y-4">
                <div className="h-5 bg-zinc-200 rounded w-1/3 animate-pulse" />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-200 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-200 rounded w-1/2 animate-pulse" />
                    <div className="h-3 bg-zinc-200 rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="card p-6 space-y-4">
                <div className="h-5 bg-zinc-200 rounded w-1/3 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-200 rounded w-full animate-pulse" />
                  <div className="h-4 bg-zinc-200 rounded w-5/6 animate-pulse" />
                  <div className="h-4 bg-zinc-200 rounded w-4/6 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-zinc-200 p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="h-10 bg-zinc-200 rounded w-32 animate-pulse" />
            <div className="h-12 bg-zinc-200 rounded-full w-32 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (loading && !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const safeCourse = course!;
  const totalDuration = chapters.reduce((sum, ch) => sum + ch.duration, 0);

  return (
    <div className="min-h-screen bg-zinc-50 pb-32">
      <div className="relative aspect-video bg-zinc-900 animate-fade-in-up">
        <img
          src={course.coverImage || `https://picsum.photos/1280/720?random=${course.id}`}
          alt={course.title}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-zinc-900/40" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <button className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all hover:scale-110">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </button>
        </div>

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button
              className={`p-2 rounded-full backdrop-blur-sm transition-colors ${isLiked ? 'bg-red-500 text-white' : 'bg-black/30 text-white hover:bg-black/50'}`}
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2">
          {hasAccess ? (
            <>
              <div className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-full flex items-center gap-1.5 shadow-lg shadow-green-500/30">
                <CheckCircle className="w-4 h-4" />
                交易已完成
              </div>
              <div className="px-3 py-1 bg-green-500/90 text-white text-sm rounded-full flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4" />
                {accessInfo.type === 'subscription' ? '会员 · 剩余约21天' : '已购买 · 永久有效'}
              </div>
            </>
          ) : chapters[0]?.isFree ? (
            <div className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">
              可免费试看
            </div>
          ) : null}
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-zinc-200 z-50 animate-fade-in-up-delay-1">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center gap-6">
              {hasAccess ? (
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex-1 px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-green-800">学习进度卡</span>
                      </div>
                      <span className="text-sm font-medium text-green-700">
                        已学 {Math.round(((accessInfo.progress || 0) / 100) * chapters.length)}/{chapters.length} 节
                      </span>
                    </div>
                    <div className="h-2.5 bg-green-200/60 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${accessInfo.progress || 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-green-600">
                      <span>进度 {accessInfo.progress || 0}%</span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {accessInfo.type === 'subscription' ? '会员期内有效' : '永久有效'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:shadow-lg hover:shadow-green-500/30 hover:scale-[1.02] transition-all duration-300 font-semibold"
                    onClick={() => {
                      const idx = accessInfo.lastChapterId
                        ? chapters.findIndex(c => c.id === accessInfo.lastChapterId)
                        : 0;
                      setActiveChapter(idx >= 0 ? idx : 0);
                    }}
                  >
                    <Play className="w-5 h-5" fill="white" />
                    <div className="text-left">
                      <div className="text-xs text-green-100">继续学习</div>
                      <div className="text-sm font-medium truncate max-w-[180px]">
                        {accessInfo.lastChapterTitle || chapters[0]?.title || '开始学习'}
                      </div>
                    </div>
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary-600">
                      {course.price > 0 ? `¥${course.price}` : course.isSubscription ? '订阅制' : '免费'}
                    </span>
                    {course.isSubscription && course.subscriptionPrice && (
                      <span className="text-sm text-zinc-500">或 ¥{course.subscriptionPrice}/月</span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-500">
                    已有 {course.studentCount} 人购买
                  </div>
                </div>
              )}

              {!hasAccess && (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-md flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    已试看 {watchedFreeChapters.length}/{freeChaptersCount} 节
                  </span>
                  {!isAuthenticated && (
                    <span className="px-2 py-1 bg-red-50 text-red-600 rounded-md flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      请先登录再购买
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {hasAccess ? (
                <div className="flex items-center gap-2">
                  {accessInfo.type !== 'subscription' && (
                    <button
                      className="btn-secondary text-sm"
                      onClick={() => setShowRefundModal(true)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      申请退款
                    </button>
                  )}
                  <button
                    className="btn-secondary text-sm"
                    onClick={() => setShowOrderDetailModal(true)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    订单详情
                  </button>
                </div>
              ) : (
                <>
                  {course.isSubscription && course.subscriptionPrice && (
                    <button
                      className="btn-secondary px-6 py-3"
                      onClick={() => handlePurchase('subscription')}
                      disabled={purchasing}
                    >
                      <Crown className="w-4 h-4 mr-2 text-amber-500" />
                      {purchasing && purchaseType === 'subscription' ? (
                        <LoadingSpinner size="sm" />
                      ) : `订阅 ¥${course.subscriptionPrice}/月`}
                    </button>
                  )}
                  {course.price > 0 && (
                    <button
                      className="btn-primary px-8 py-3"
                      onClick={() => handlePurchase('one_time')}
                      disabled={purchasing}
                    >
                      {purchasing && purchaseType === 'one_time' ? (
                        <LoadingSpinner size="sm" />
                      ) : '立即购买'}
                    </button>
                  )}
                  {course.price === 0 && !course.isSubscription && (
                    <button
                      className="btn-primary px-8 py-3"
                      onClick={() => handlePurchase('one_time')}
                      disabled={purchasing}
                    >
                      免费获取
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="animate-fade-in-up-delay-1">
              <h1 className="text-3xl font-bold text-zinc-900 mb-4">{course.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 mb-6">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                  <span className="font-medium text-zinc-700">{course.rating?.toFixed(1) || '0.0'}</span>
                  <span>({course.reviewCount} 评价)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{course.studentCount} 人学习</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{chapters.length} 章节 · {totalDuration} 分钟</span>
                </div>
                {course.category && (
                  <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-medium">
                    {course.category}
                  </span>
                )}
              </div>

              {course.description && (
                <div className="prose max-w-none text-zinc-600 leading-relaxed">
                  <p>{course.description}</p>
                </div>
              )}
            </div>

            <div className="card p-6 animate-fade-in-up-delay-2">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setChaptersExpanded(!chaptersExpanded)}
              >
                <h2 className="text-xl font-semibold text-zinc-900">课程章节</h2>
                <button className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  {chaptersExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {chaptersExpanded && (
                <div className="mt-4 space-y-2">
                  {chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all relative group ${
                        activeChapter === index
                          ? 'bg-primary-50 border-2 border-primary-200'
                          : 'hover:bg-zinc-50 border-2 border-transparent'
                      } ${!chapter.isFree && !hasAccess ? 'opacity-90' : ''}`}
                      onClick={() => handleChapterClick(chapter, index)}
                      onMouseEnter={() => setHoveredChapter(chapter.id)}
                      onMouseLeave={() => setHoveredChapter(null)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        chapter.isFree || hasAccess
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-zinc-100 text-zinc-400'
                      }`}>
                        {chapter.isFree || hasAccess ? (
                          <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400 text-sm">第{chapter.order}节</span>
                          {chapter.isFree && (
                            <Badge variant="success" size="sm">
                              <Play className="w-3 h-3 mr-0.5" fill="currentColor" />
                              试看
                            </Badge>
                          )}
                          {!chapter.isFree && !hasAccess && (
                            <Badge variant="default" size="sm">
                              <Lock className="w-3 h-3 mr-0.5" />
                              锁定
                            </Badge>
                          )}
                          {hasAccess && lastWatchedChapter === chapter.id && (
                            <Badge variant="primary" size="sm">
                              <Clock3 className="w-3 h-3 mr-0.5" />
                              上次观看
                            </Badge>
                          )}
                        </div>
                        <h3 className={`font-medium ${
                          !chapter.isFree && !hasAccess ? 'text-zinc-500' : 'text-zinc-900'
                        }`}>
                          {chapter.title}
                        </h3>
                      </div>

                      <div className="text-sm text-zinc-500">{chapter.duration} 分钟</div>

                      {!chapter.isFree && !hasAccess && hoveredChapter === chapter.id && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-800 text-white text-xs rounded-lg whitespace-nowrap z-10 animate-fade-in">
                          购买后观看
                          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-800 rotate-45" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-6 animate-fade-in-up-delay-3">
              <h2 className="text-xl font-semibold text-zinc-900 mb-6">学员评价</h2>

              <div className="flex items-center gap-8 mb-8 pb-6 border-b border-zinc-100">
                <div className="text-center">
                  <div className="text-5xl font-bold text-zinc-900">{course.rating?.toFixed(1) || '0.0'}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= Math.round(course.rating || 0) ? 'text-amber-500' : 'text-zinc-200'}`}
                        fill="currentColor"
                      />
                    ))}
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">{course.reviewCount} 条评价</div>
                </div>
              </div>

              {isAuthenticated && hasAccess && (
                <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-zinc-50 rounded-xl">
                  <h3 className="font-medium text-zinc-900 mb-3">发表评价</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-zinc-600">评分：</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <label key={star} className="cursor-pointer">
                        <input type="radio" name="rating" value={star} className="sr-only" defaultChecked={star === 5} />
                        <Star className="w-6 h-6 text-amber-500 hover:scale-110 transition-transform" fill="currentColor" />
                      </label>
                    ))}
                  </div>
                  <textarea
                    name="content"
                    rows={3}
                    placeholder="分享你的学习体验..."
                    className="input-field mb-3"
                    required
                  />
                  <button type="submit" className="btn-primary" disabled={reviewLoading}>
                    {reviewLoading ? <LoadingSpinner size="sm" /> : '提交评价'}
                  </button>
                </form>
              )}

              <div className="space-y-6">
                {reviews.map((review, index) => (
                  <div key={review.id} className="flex gap-4 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <img
                      src={review.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userId}`}
                      alt={review.user?.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-zinc-900">{review.user?.username || '用户'}</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-amber-500' : 'text-zinc-200'}`}
                              fill="currentColor"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-zinc-600 mb-1">{review.content}</p>
                      <div className="text-xs text-zinc-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6 animate-fade-in-up-delay-2">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">讲师介绍</h3>
              <div
                className="flex items-center gap-4 mb-4 cursor-pointer"
                onClick={() => navigate(`/creator/${course.creatorId}`)}
              >
                <img
                  src={course.creator?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${course.creatorId}`}
                  alt={course.creator?.username}
                  className="w-14 h-14 rounded-full ring-2 ring-primary-100"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-zinc-900">{course.creator?.username || '创作者'}</span>
                    {course.creator?.verified && (
                      <span className="w-4 h-4 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-500">
                    <User className="w-3 h-3 inline mr-1" />
                    {course.creator?.followerCount || 0} 粉丝
                  </div>
                </div>
              </div>

              {course.creator?.bio && (
                <p className="text-sm text-zinc-600 mb-4">{course.creator.bio}</p>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-zinc-900">{course.creator?.rating?.toFixed(1) || '0.0'}</div>
                  <div className="text-xs text-zinc-500">评分</div>
                </div>
                <div className="w-px h-8 bg-zinc-200" />
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-zinc-900">{course.creator?.followerCount || 0}</div>
                  <div className="text-xs text-zinc-500">粉丝</div>
                </div>
                <div className="w-px h-8 bg-zinc-200" />
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-zinc-900">{course.chapterCount || chapters.length}</div>
                  <div className="text-xs text-zinc-500">本课程章节</div>
                </div>
              </div>

              <button
                className={cn(
                  'w-full mt-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
                  isFollowing
                    ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                )}
                onClick={handleFollow}
              >
                <Check className={cn('w-4 h-4', !isFollowing && 'hidden')} />
                {isFollowing ? '已关注' : '+ 关注讲师'}
              </button>
            </div>

            <div className="card p-6 animate-fade-in-up-delay-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-100/50 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">内容合规审核</h3>
                    <p className="text-xs text-zinc-500">双审核机制保障</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 rounded-lg">
                  <BadgeCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-700 font-medium">
                    本课程已通过合规审核
                  </span>
                </div>

                <div className="space-y-3">
                  {reviewRecords.map((record, index) => (
                    <div key={index} className="flex items-start gap-3 relative pl-4">
                      {index < reviewRecords.length - 1 && (
                        <div className="absolute left-[11px] top-5 bottom-[-12px] w-px bg-zinc-200" />
                      )}
                      <div className={cn(
                        'w-3 h-3 rounded-full mt-1.5 flex-shrink-0 -ml-4 z-10 border-2 border-white',
                        record.status === 'passed' ? 'bg-green-500' :
                        record.status === 'published' ? 'bg-primary-500' : 'bg-zinc-300'
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-800">
                            {record.operator}
                          </span>
                          <span className="text-xs text-zinc-400 flex-shrink-0 ml-2">
                            {record.time.split(' ')[1]}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{record.message}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{record.time.split(' ')[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {hasAccess && (
              <div className="card p-6 animate-fade-in-up-delay-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-100/60 to-transparent rounded-bl-full" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          权益已生效
                        </h3>
                        <p className="text-xs text-zinc-500">
                          生效时间：{accessInfo.purchaseDate || new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <CheckIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-green-800 text-sm">永久有效</div>
                        <div className="text-xs text-green-600">课程内容终身可观看，支持多端同步</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <CheckIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-green-800 text-sm">可开发票</div>
                        <div className="text-xs text-green-600">支持电子普通发票和增值税专票</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <CheckIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-green-800 text-sm">学习进度</div>
                        <div className="text-xs text-green-600">云端自动保存学习进度，随时续接</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <CheckIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-green-800 text-sm">答疑支持</div>
                        <div className="text-xs text-green-600">专属学习社群，讲师在线答疑</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hasAccess && orderInfo && (
              <div className="card p-6 animate-fade-in-up-delay-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-zinc-900">订单信息</h3>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          已完成
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">购买凭证与交易记录</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOrderDetailModal(true)}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    查看详情
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      交易单号
                    </span>
                    <button
                      onClick={() => copyOrderNoToClipboard(orderInfo.orderNo)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors group"
                    >
                      <span className="font-mono font-medium text-zinc-800 text-xs">
                        {orderInfo.orderNo}
                      </span>
                      {copiedOrderNo ? (
                        <CheckIcon className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600" />
                      )}
                      {copiedOrderNo && (
                        <span className="text-xs text-green-600 font-medium">已复制</span>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      支付时间
                    </span>
                    <span className="font-medium text-zinc-800 text-xs">
                      {orderInfo.payTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      支付方式
                    </span>
                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${getPayMethodIcon(orderInfo.payMethod).bg} ${getPayMethodIcon(orderInfo.payMethod).color}`}>
                      <Wallet className="w-3.5 h-3.5" />
                      {getPayMethodIcon(orderInfo.payMethod).label}
                    </span>
                  </div>
                  <div className="h-px bg-zinc-100 my-1" />
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-700 font-medium">实付金额</span>
                    <span className="font-bold text-primary-600">
                      ¥{orderInfo.amount.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="w-full mt-2 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-blue-700 rounded-xl text-sm font-medium hover:from-blue-100 hover:to-indigo-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-4 h-4" />
                    查看电子凭证
                  </button>
                </div>
              </div>
            )}

            {!hasAccess && course.isSubscription && course.subscriptionPrice && (
              <div className="card p-6 animate-fade-in-up-delay-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100/50 to-transparent rounded-bl-full" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-semibold text-zinc-900">
                      买断 vs 订阅
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`p-3 rounded-xl border-2 transition-all ${
                      purchaseType === 'one_time' || !purchaseType
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}>
                      <div className="text-sm font-bold text-zinc-900 mb-1">买断</div>
                      <div className="text-xl font-bold text-primary-600 mb-2">
                        ¥{course.price}
                      </div>
                      <div className="text-xs text-zinc-500 mb-3">
                        一次购买，永久有效
                      </div>
                      <ul className="space-y-1.5">
                        <li className="flex items-center gap-1.5 text-xs text-zinc-600">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          本课程全部内容
                        </li>
                        <li className="flex items-center gap-1.5 text-xs text-zinc-600">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          永久观看权限
                        </li>
                        <li className="flex items-center gap-1.5 text-xs text-zinc-600">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          资料下载
                        </li>
                        <li className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          全站课程
                        </li>
                        <li className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          新课免费
                        </li>
                      </ul>
                    </div>
                    
                    <div className={`p-3 rounded-xl border-2 relative overflow-hidden transition-all ${
                      purchaseType === 'subscription'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50 hover:border-amber-300'
                    }`}>
                      <div className="absolute top-0 right-0">
                        <div className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-medium">
                          推荐
                        </div>
                      </div>
                      <div className="text-sm font-bold text-zinc-900 mb-1 flex items-center gap-1">
                        <Crown className="w-4 h-4 text-amber-500" />
                        订阅会员
                      </div>
                      <div className="text-xl font-bold text-amber-600 mb-2">
                        ¥{course.subscriptionPrice}
                        <span className="text-xs font-normal text-amber-500">/月</span>
                      </div>
                      <div className="text-xs text-zinc-500 mb-3">
                        全站畅学，新课免费
                      </div>
                      <ul className="space-y-1.5">
                        <li className="flex items-center gap-1.5 text-xs text-zinc-600">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          全站 10,000+ 课程
                        </li>
                        <li className="flex items-center gap-1.5 text-xs text-zinc-600">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          新课免费更新
                        </li>
                        <li className="flex items-center gap-1.5 text-xs text-zinc-600">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          社群答疑
                        </li>
                        <li className="flex items-center gap-1.5 text-xs text-zinc-600">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          专属证书
                        </li>
                        <li className="flex items-center gap-1.5 text-xs text-zinc-600">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          资料下载
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        purchaseType === 'one_time'
                          ? 'bg-primary-500 text-white'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                      onClick={() => handlePurchase('one_time')}
                    >
                      立即买断
                    </button>
                    <button
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        purchaseType === 'subscription'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                      onClick={() => handlePurchase('subscription')}
                    >
                      <Crown className="w-4 h-4 inline mr-1" />
                      开通会员
                    </button>
                  </div>
                </div>
              </div>
            )}

            {hasAccess && accessInfo.type === 'subscription' && (
              <div className="card p-6 animate-fade-in-up-delay-2 relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <div className="absolute top-3 right-3">
                  <Badge variant="accent" size="sm">
                    <Crown className="w-3 h-3 mr-1" />
                    会员中
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">订阅会员</h3>
                    <p className="text-xs text-amber-600">全站课程免费学</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">到期时间</span>
                    <span className="font-medium text-zinc-900">{accessInfo.expiresAt}</span>
                  </div>
                  <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                      style={{ width: '70%' }}
                    />
                  </div>
                  <div className="text-xs text-amber-600 text-right">
                    剩余约 21 天
                  </div>
                </div>
                <div className="p-3 bg-white/60 rounded-xl mb-4">
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">续费优惠</span>
                  </div>
                  <p className="text-xs text-amber-600 mt-1">
                    现在续费立享 8 折优惠，再送 7 天会员
                  </p>
                </div>
                <button className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all">
                  立即续费
                </button>
              </div>
            )}

            {hasAccess && settlementInfo && (
              <div className="card p-6 animate-fade-in-up-delay-3">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Landmark className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900">创作者结算与税务</h3>
                      <p className="text-xs text-zinc-500">全链路可视化 · 单号：{settlementInfo.transactionId}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mb-5">
                  <div className="relative pl-10 pb-5">
                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute left-3.5 top-8 bottom-0 w-px bg-green-200" />
                    <div className="pt-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-800">Step 1 · 交易完成</span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">已完成</span>
                        </div>
                        <span className="text-xs text-zinc-500">{orderInfo?.payTime || '刚刚'}</span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-1">用户支付成功，资金进入平台托管账户</p>
                      <p className="text-xs text-green-700 font-medium mt-1">
                        <Coins className="w-3 h-3 inline mr-1" />
                        交易金额：¥{settlementInfo.orderAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-10 pb-5">
                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute left-3.5 top-8 bottom-0 w-px bg-blue-200" />
                    <div className="pt-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-800">Step 2 · 平台服务费扣除</span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">已完成</span>
                        </div>
                        <span className="text-xs text-zinc-500">实时扣除</span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-1">平台技术服务与运营成本（费率 15%）</p>
                      <p className="text-xs text-red-600 font-medium mt-1">
                        <Percent className="w-3 h-3 inline mr-1" />
                        扣除金额：-¥{settlementInfo.platformFee.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-10 pb-5">
                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center z-10">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute left-3.5 top-8 bottom-0 w-px bg-zinc-200" />
                    <div className="pt-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-800">Step 3 · 税务代缴准备</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">进行中</span>
                        </div>
                        <span className="text-xs text-zinc-500">预计次月15日前</span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-1">平台按国家法规代缴创作者税费（增值税预征 6%）</p>
                      <p className="text-xs text-amber-700 font-medium mt-1">
                        <Receipt className="w-3 h-3 inline mr-1" />
                        预计税额：¥{settlementInfo.taxAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-10">
                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-zinc-400 flex items-center justify-center z-10">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-700">Step 4 · 创作者结算</span>
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs font-medium rounded-full">待处理</span>
                        </div>
                        <span className="text-xs text-zinc-500">T+1 工作日</span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-1">结算至创作者可提现余额，支持多渠道提现</p>
                      <p className="text-xs text-green-700 font-medium mt-1">
                        <Wallet className="w-3 h-3 inline mr-1" />
                        预计到账：¥{settlementInfo.creatorNet.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowTaxDetails(!showTaxDetails)}
                  className="w-full py-2.5 mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  {showTaxDetails ? '收起税务代缴明细' : '展开税务代缴明细'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showTaxDetails ? 'rotate-180' : ''}`} />
                </button>

                {showTaxDetails && (
                  <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-3 animate-fade-in">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">应纳税所得额计算</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          订单金额 ¥{settlementInfo.orderAmount.toFixed(2)} - 平台服务费 ¥{settlementInfo.platformFee.toFixed(2)}
                          = <span className="font-medium">¥{(settlementInfo.orderAmount - settlementInfo.platformFee).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Percent className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">适用税率（增值税预征）</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          按照国家税务总局规定，个人提供服务适用 <span className="font-medium">6% 增值税预征率</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Coins className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">预计个税金额</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          应纳税所得额 × 6% = <span className="font-bold text-amber-700">¥{settlementInfo.taxAmount.toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">申报时间说明</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          平台将于 <span className="font-medium">次月 15 日前</span> 代为完成税务申报，并提供完税凭证
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <BadgeCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">开票信息</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          平台已代扣代缴相关税费，<span className="font-medium">创作者无需自行申报</span>。
                          如需发票，可在订单详情中申请开具电子普通发票。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      订单实付金额
                    </span>
                    <span className="font-semibold text-zinc-800">
                      ¥{settlementInfo.orderAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      平台服务费 (15%)
                    </span>
                    <span className="font-semibold text-red-600">
                      -¥{settlementInfo.platformFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg">
                    <span className="text-zinc-600 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-amber-600" />
                      预估税务代缴
                    </span>
                    <span className="font-semibold text-amber-700">
                      -¥{settlementInfo.taxAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-px bg-zinc-100 my-1" />
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                    <span className="text-zinc-700 font-medium flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-green-600" />
                      创作者实际收入
                    </span>
                    <span className="font-bold text-green-700 text-xl">
                      ¥{settlementInfo.creatorNet.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setShowInvoiceModal(true)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Receipt className="w-4 h-4" />
                    申请开票
                  </button>
                  <button
                    onClick={() => setShowOrderDetailModal(true)}
                    className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded-xl hover:bg-zinc-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    订单详情
                  </button>
                </div>

                {showSettlementInfo && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-3 animate-fade-in">
                    <div className="flex items-start gap-2">
                      <Clock3 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-purple-800">T+1 结算规则</p>
                        <p className="text-xs text-purple-600 mt-0.5">
                          用户支付成功后，资金进入平台托管账户。次日（T+1）自动结算至创作者可提现余额。
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-purple-800">提现方式</p>
                        <p className="text-xs text-purple-600 mt-0.5">
                          支持支付宝、微信钱包、银行卡提现。单笔最低提现金额 100 元。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!hasAccess && (
              <div className="card p-6 animate-fade-in-up-delay-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Landmark className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900">资金结算透明</h3>
                      <p className="text-xs text-zinc-500">预估结算 · 公开透明</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSettlementInfo(!showSettlementInfo)}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Info className="w-3 h-3" />
                    结算说明
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      商品金额
                    </span>
                    <span className="font-semibold text-zinc-800">
                      ¥{(course?.price || course?.subscriptionPrice || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      平台服务费 (15%)
                    </span>
                    <span className="font-semibold text-red-600">
                      -¥{((course?.price || course?.subscriptionPrice || 0) * 0.15).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg">
                    <span className="text-zinc-600 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-amber-600" />
                      <span>
                        预估税务代缴
                        <span className="text-xs text-amber-500 ml-1">(创作者收入 × 6%)</span>
                      </span>
                    </span>
                    <span className="font-semibold text-amber-700">
                      -¥{((course?.price || course?.subscriptionPrice || 0) * 0.85 * 0.06).toFixed(2)}
                    </span>
                  </div>
                  <div className="h-px bg-zinc-100 my-1" />
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                    <span className="text-zinc-700 font-medium flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-green-600" />
                      创作者预计收入
                    </span>
                    <span className="font-bold text-green-700 text-xl">
                      ¥{((course?.price || course?.subscriptionPrice || 0) * 0.85 * 0.94).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-start gap-2 mb-2">
                    <FileCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-amber-800">税务准备状态</span>
                  </div>
                  <p className="text-xs text-amber-600">
                    平台将按国家法规代缴创作者个人所得税，预计次月申报。
                    如需发票，购买后可在订单详情中申请开具。
                  </p>
                </div>

                {showSettlementInfo && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-3 animate-fade-in">
                    <div className="flex items-start gap-2">
                      <Clock3 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-purple-800">T+1 结算规则</p>
                        <p className="text-xs text-purple-600 mt-0.5">
                          用户支付成功后，资金进入平台托管账户。次日（T+1）自动结算至创作者可提现余额。
                          如遇退款纠纷，资金将冻结直至纠纷解决。
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-purple-800">提现方式</p>
                        <p className="text-xs text-purple-600 mt-0.5">
                          支持支付宝、微信钱包、银行卡提现。单笔最低提现金额 100 元，每月 1-3 日为集中提现日，
                          T+1 工作日到账。
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-purple-800">开票流程说明</p>
                        <p className="text-xs text-purple-600 mt-0.5">
                          1. 购买后在订单详情中点击「申请开票」<br />
                          2. 支持电子普通发票和纸质发票<br />
                          3. 电子发票 1-3 个工作日发送至邮箱<br />
                          4. 开票金额以实际支付金额为准
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      购买后7天内且学习进度≤30%，支持<u>无理由全额退款</u>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="card p-6 animate-fade-in-up-delay-3">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">购买须知</h3>
              <ul className="space-y-3 text-sm text-zinc-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>购买后永久有效，可随时观看</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>支持手机、平板、电脑多端同步</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>7天内不满意可申请退款</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>专属学习社群答疑</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && course && purchaseType && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-zinc-900">
                {purchaseType === 'subscription' ? '开通会员' : '确认购买'}
              </h3>
              <p className="text-sm text-zinc-500 mt-0.5">
                SkillVerse 平台交易服务协议
              </p>
            </div>
            <button
              onClick={() => setShowPaymentModal(false)}
              disabled={purchasing}
              className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
            >
              <XCircle className="w-5 h-5 text-zinc-500" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary-50 to-amber-50 rounded-2xl">
              <img
                src={course.coverImage || 'https://via.placeholder.com/80x80/e2e8f0/94a3b8'}
                alt=""
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80/e2e8f0/94a3b8'; }}
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-zinc-900 truncate">{course.title}</h4>
                <p className="text-sm text-zinc-500 mt-1">
                  {course.chapterCount || chapters.length} 章节 · {freeChaptersCount} 节可试看
                </p>
                <div className="mt-2">
                  <Badge variant="success" size="sm">
                    <BadgeCheck className="w-3 h-3 mr-1" />
                    合规审核通过
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-500">
                  {purchaseType === 'subscription' ? '月度订阅' : '永久买断'}
                </span>
                <span className="text-sm font-medium text-zinc-800">
                  ¥{purchaseType === 'subscription' ? course.subscriptionPrice : course.price}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-500">平台服务费(15%)</span>
                <span className="text-sm text-zinc-400 line-through">
                  ¥{((purchaseType === 'subscription' ? course.subscriptionPrice! : course.price) * 0.15).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-500">平台补贴优惠</span>
                <span className="text-sm text-green-600">¥0.00</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-zinc-100">
                <span className="text-base font-semibold text-zinc-900">应付金额</span>
                <span className="text-2xl font-bold text-primary-600">
                  ¥{purchaseType === 'subscription' ? course.subscriptionPrice : course.price}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-50 rounded-2xl">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-green-100 flex items-center justify-center mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs font-medium text-zinc-800">7天无理由退款</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-primary-100 flex items-center justify-center mb-2">
                <FileCheck className="w-5 h-5 text-primary-600" />
                </div>
                <p className="text-xs font-medium text-zinc-800">全程资金托管</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-purple-100 flex items-center justify-center mb-2">
                <Receipt className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-xs font-medium text-zinc-800">支持开票</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 space-y-1">
                  <p><span className="font-medium">税务代缴说明：</span></p>
                  <p>本商品已含税。平台将按国家法规代缴创作者个人所得税（预估6%），结算后15个工作日内，平台代为申报。如需个人开票，请至「我的-发票」申请电子发票。</p>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input type="checkbox" defaultChecked className="mt-0.5 w-4 h-4 rounded text-primary-500" />
              <span className="text-xs text-zinc-600">
                我已阅读并同意 <u className="text-primary-600">《用户服务协议</u> 和 <u className="text-primary-600">《交易保障条款</u></span>
              </label>
            </div>

            <div className="p-6 border-t border-zinc-100 space-y-3">
              <button
                className="w-full py-3.5 rounded-xl btn-primary text-base font-semibold disabled:opacity-60"
                onClick={confirmPurchase}
                disabled={purchasing}
              >
                {purchasing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  支付中...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  立即支付 ¥{purchaseType === 'subscription' ? course.subscriptionPrice : course.price}
                </>
              )}
              </button>
              <button
                className="w-full py-3 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                onClick={() => setShowPaymentModal(false)}
                disabled={purchasing}
              >
                取消支付
              </button>
              <p className="text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3" />
                交易全程银行级加密，由 SkillVerse 提供担保
              </p>
            </div>
          </div>
        </div>
      )}

      {showRefundModal && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">申请退款</h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center"
              >
                <XCircle className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-green-50 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700 text-sm">符合 7 天无理由退款</span>
                </div>
                <p className="text-xs text-green-600">预计 3-5 个工作日原路返回</p>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">退款原因</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full h-28 p-3 rounded-xl border border-zinc-200 text-sm resize-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  placeholder="请描述退款原因..."
                />
              </div>
              <div className="pt-2 space-y-2">
                <button
                  className="w-full py-3 rounded-xl btn-primary disabled:opacity-60"
                  onClick={() => { setShowRefundModal(false); alert('退款申请已提交，平台将在1-3个工作日审核'); }}
                  disabled={!refundReason.trim()}
                >
                  提交退款申请
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce-in">
                <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">交易全链路已承接</h3>
              <p className="text-green-100 text-sm">
                {accessInfo.type === 'subscription' ? '会员已开通，所有权益即刻生效' : '购买成功，课程权益即刻生效'}
              </p>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-3">
                {[
                  { step: 1, title: '订单创建', icon: FileText },
                  { step: 2, title: '资金托管', icon: Landmark },
                  { step: 3, title: '权益生效', icon: Shield },
                  { step: 4, title: '服务费扣除', icon: Percent },
                  { step: 5, title: '创作者结算登记', icon: Wallet },
                ].map((item) => {
                  const IconComp = item.icon;
                  const isDone = tradeChainStep >= item.step;
                  const isCurrent = tradeChainStep === item.step - 1;
                  return (
                    <div key={item.step} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isDone
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-blue-100 text-blue-600 animate-pulse'
                          : 'bg-zinc-100 text-zinc-400'
                      }`}>
                        {isDone ? (
                          <CheckIcon className="w-5 h-5" />
                        ) : (
                          <IconComp className="w-4.5 h-4.5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={`font-medium text-sm ${
                          isDone ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-zinc-400'
                        }`}>
                          {item.step}. {item.title}
                        </span>
                      </div>
                      {isDone && (
                        <span className="text-xs text-green-600 font-medium">✓ 已完成</span>
                      )}
                      {isCurrent && (
                        <span className="text-xs text-blue-600 font-medium">处理中...</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {tradeChainStep >= 5 && orderInfo && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-100 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">交易单号</span>
                    <span className="font-mono text-zinc-700 text-xs">{orderInfo.orderNo}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">支付金额</span>
                    <span className="font-bold text-primary-600">¥{orderInfo.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">支付方式</span>
                    <span className="text-zinc-700 text-xs">{orderInfo.payMethod}</span>
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-700 text-center">
                  您可以随时在订单详情中查看交易进度
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all"
                  onClick={() => setShowSuccessModal(false)}
                >
                  <Play className="w-5 h-5 inline mr-2" fill="white" />
                  开始学习
                </button>
                <button
                  className="w-full py-2.5 text-sm text-zinc-600 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors flex items-center justify-center gap-2"
                  onClick={() => {
                    setShowSuccessModal(false);
                    setShowOrderDetailModal(true);
                  }}
                >
                  <FileText className="w-4 h-4" />
                  查看订单详情
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLockedModal && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="relative bg-gradient-to-br from-primary-500 to-purple-600 p-6 text-center">
              <button
                onClick={() => setShowLockedModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 mx-auto mb-3 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">开通会员解锁全部内容</h3>
              <p className="text-primary-100 text-sm">
                已观看 {watchedFreeChapters.length}/{freeChaptersCount} 节试看内容
              </p>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-3 mb-3">
                  <Crown className="w-6 h-6 text-amber-500" />
                  <div>
                    <div className="font-bold text-zinc-900">解锁后可获得</div>
                  </div>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-zinc-700">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>全部 {chapters.length} 章节高清视频</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-zinc-700">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>课程配套资料下载</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-zinc-700">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>专属学习社群答疑</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-zinc-700">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>结业后颁发电子证书</span>
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  className="py-3 rounded-xl border-2 border-primary-500 text-primary-600 font-semibold hover:bg-primary-50 transition-colors"
                  onClick={() => {
                    setShowLockedModal(false);
                    handlePurchase('one_time');
                  }}
                >
                  <div className="text-sm">买断课程</div>
                  <div className="text-xs text-primary-500">¥{course?.price}</div>
                </button>
                <button
                  className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all relative overflow-hidden"
                  onClick={() => {
                    setShowLockedModal(false);
                    handlePurchase('subscription');
                  }}
                >
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg">
                    推荐
                  </div>
                  <div className="text-sm">订阅会员</div>
                  <div className="text-xs text-amber-100">¥{course?.subscriptionPrice}/月</div>
                </button>
              </div>

              <p className="text-center text-xs text-zinc-400">
                支持7天无理由退款 · 平台资金托管保障
              </p>
            </div>
          </div>
        </div>
      )}

      {showOrderDetailModal && orderInfo && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-zinc-900">订单详情</h3>
              <button
                onClick={() => setShowOrderDetailModal(false)}
                className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="p-4 bg-green-50 rounded-xl border border-green-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-green-800">支付成功</div>
                  <div className="text-xs text-green-600">{orderInfo.payTime}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-zinc-900 text-sm">商品信息</h4>
                <div className="p-3 bg-zinc-50 rounded-xl flex items-center gap-3">
                  <img
                    src={course?.coverImage || `https://picsum.photos/80/80?random=${course?.id}`}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-zinc-900 text-sm truncate">{course?.title}</div>
                    <div className="text-xs text-zinc-500">
                      {accessInfo.type === 'subscription' ? '月度会员' : '永久课程'}
                    </div>
                  </div>
                  <div className="font-bold text-primary-600">
                    ¥{orderInfo.amount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-zinc-900 text-sm">订单信息</h4>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">订单编号</span>
                    <span className="font-mono text-zinc-700 text-xs">{orderInfo.orderNo}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">创建时间</span>
                    <span className="text-zinc-700">{orderInfo.payTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">支付方式</span>
                    <span className="text-zinc-700">{orderInfo.payMethod}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">订单类型</span>
                    <span className="text-zinc-700">
                      {accessInfo.type === 'subscription' ? '订阅会员' : '课程购买'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-zinc-900 text-sm">金额明细</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">商品金额</span>
                    <span className="text-zinc-700">¥{orderInfo.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">优惠金额</span>
                    <span className="text-green-600">-¥0.00</span>
                  </div>
                  <div className="h-px bg-zinc-100 my-1" />
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-900">实付金额</span>
                    <span className="text-lg font-bold text-primary-600">¥{orderInfo.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                  onClick={() => {
                    setShowOrderDetailModal(false);
                    setShowInvoiceModal(true);
                  }}
                >
                  <Receipt className="w-4 h-4" />
                  申请发票
                </button>
                <button
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                  onClick={() => navigate('/orders')}
                >
                  <FileText className="w-4 h-4" />
                  全部订单
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReceiptModal && orderInfo && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  电子凭证预览
                </h3>
                <p className="text-sm text-zinc-500 mt-0.5">交易收据 · 可用于报销</p>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/50 to-transparent rounded-bl-full" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                        <BadgeCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900">SkillVerse 交易凭证</div>
                        <div className="text-xs text-zinc-500">电子收据 · 具有同等法律效力</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      交易完成
                    </span>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">交易单号</span>
                      <button
                        onClick={() => copyOrderNoToClipboard(orderInfo.orderNo)}
                        className="flex items-center gap-1 hover:bg-white/60 px-2 py-0.5 rounded transition-colors"
                      >
                        <span className="font-mono text-zinc-800 font-medium text-xs">{orderInfo.orderNo}</span>
                        {copiedOrderNo ? (
                          <CheckIcon className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-zinc-400" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">商品名称</span>
                      <span className="text-zinc-800 font-medium max-w-[200px] truncate text-right">{course?.title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">购买类型</span>
                      <span className="text-zinc-800 font-medium">
                        {accessInfo.type === 'subscription' ? '月度会员订阅' : '课程永久购买'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">支付方式</span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${getPayMethodIcon(orderInfo.payMethod).bg} ${getPayMethodIcon(orderInfo.payMethod).color} text-xs font-medium`}>
                        <Wallet className="w-3 h-3" />
                        {getPayMethodIcon(orderInfo.payMethod).label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">支付时间</span>
                      <span className="text-zinc-800 text-xs">{orderInfo.payTime}</span>
                    </div>
                  </div>

                  <div className="h-px bg-blue-200/50 my-4 border-t border-dashed border-blue-300/50" />

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-700 font-semibold">实付金额</span>
                    <span className="text-2xl font-bold text-blue-600">¥{orderInfo.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl space-y-2 text-xs text-zinc-600">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                  <p>本电子凭证由 SkillVerse 平台自动生成，可作为交易凭证使用。</p>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                  <p>如需开具正式发票，请点击下方「申请开票」按钮，支持电子普通发票和增值税专用发票。</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  className="py-2.5 rounded-xl border border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                  onClick={() => {
                    alert('凭证已下载');
                  }}
                >
                  <Download className="w-4 h-4" />
                  下载凭证
                </button>
                <button
                  className="py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                  onClick={() => {
                    setShowReceiptModal(false);
                    setShowInvoiceModal(true);
                  }}
                >
                  <Receipt className="w-4 h-4" />
                  申请开票
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInvoiceModal && orderInfo && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-zinc-900">申请开票</h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">开票信息</span>
                </div>
                <div className="space-y-1.5 text-xs text-amber-700">
                  <div className="flex justify-between">
                    <span>订单号</span>
                    <span className="font-mono">{orderInfo.orderNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>可开票金额</span>
                    <span className="font-semibold">¥{orderInfo.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>支付时间</span>
                    <span>{orderInfo.payTime}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">发票类型</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="py-2.5 px-3 rounded-xl border-2 border-primary-500 bg-primary-50 text-primary-700 text-sm font-medium">
                      电子普通发票
                    </button>
                    <button className="py-2.5 px-3 rounded-xl border-2 border-zinc-200 text-zinc-600 text-sm font-medium hover:border-zinc-300 transition-colors">
                      增值税专票
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">发票抬头</label>
                  <input
                    type="text"
                    placeholder="请输入发票抬头（个人/公司名称）"
                    defaultValue="个人"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">税号（选填）</label>
                  <input
                    type="text"
                    placeholder="企业请填写纳税人识别号"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">接收邮箱</label>
                  <input
                    type="email"
                    placeholder="请输入接收电子发票的邮箱"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">开票内容</label>
                  <input
                    type="text"
                    defaultValue="教育咨询服务费"
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    电子发票将在 1-3 个工作日内发送至您的邮箱。
                    如需纸质发票，请联系客服申请，邮费到付。
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  className="w-full py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/30 transition-all"
                  onClick={() => {
                    setShowInvoiceModal(false);
                    alert('发票申请已提交，预计 1-3 个工作日内发送至您的邮箱');
                  }}
                >
                  <Receipt className="w-4 h-4 inline mr-2" />
                  提交开票申请
                </button>
                <button
                  className="w-full py-2.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                  onClick={() => setShowInvoiceModal(false)}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
      `}</style>
    </div>
  );
}
