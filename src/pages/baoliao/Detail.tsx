import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Flag,
  MapPin,
  Navigation,
  Play,
  X,
  Send,
  Eye,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBaoliaoStore } from '@/stores/useBaoliaoStore';
import { useUserStore } from '@/stores/useUserStore';
import type { BaoliaoComment } from '@/types';
import Avatar from '@/components/common/Avatar';
import Tag from '@/components/common/Tag';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import CommentItem from '@/components/business/CommentItem';
import Loading, { Skeleton } from '@/components/common/Loading';
import Empty from '@/components/common/Empty';
import Modal from '@/components/common/Modal';

const categoryColors: Record<string, 'westlake' | 'honghua' | 'chaojing' | 'neutral'> = {
  traffic: 'westlake',
  environment: 'honghua',
  facility: 'chaojing',
  livelihood: 'westlake',
  emergency: 'neutral',
  other: 'neutral',
};

const sentimentVariants: Record<string, 'green' | 'neutral' | 'red'> = {
  positive: 'green',
  neutral: 'neutral',
  negative: 'red',
};

const sentimentLabels: Record<string, string> = {
  positive: '正面',
  neutral: '中性',
  negative: '负面',
};

const mockComments: BaoliaoComment[] = [
  {
    id: 'c1',
    baoliaoId: 'b001',
    userId: 'u002',
    user: {
      id: 'u002',
      phone: '13800138002',
      nickname: '惠州街坊',
      avatar: 'https://picsum.photos/seed/user2/100',
      role: 'user',
      points: 1580,
      level: 5,
      createdAt: new Date('2025-08-20'),
      lastLoginAt: new Date(),
      isSignedInToday: true,
    },
    content: '这个问题确实存在，我上周末也遇到了。建议景区可以和周边的商场、学校合作，节假日开放临时停车场。',
    likes: 28,
    createdAt: new Date('2026-06-15T10:30:00'),
  },
  {
    id: 'c2',
    baoliaoId: 'b001',
    userId: 'u003',
    user: {
      id: 'u003',
      phone: '13800138003',
      nickname: '山水之间',
      avatar: 'https://picsum.photos/seed/user3/100',
      role: 'creator',
      points: 3200,
      level: 8,
      createdAt: new Date('2025-06-15'),
      lastLoginAt: new Date(),
      isSignedInToday: true,
    },
    content: '支持楼主建议！西湖是惠州的名片，停车问题确实影响游客体验。希望相关部门能重视。',
    likes: 15,
    createdAt: new Date('2026-06-15T11:20:00'),
  },
  {
    id: 'c3',
    baoliaoId: 'b001',
    userId: 'u004',
    user: {
      id: 'u004',
      phone: '13800138004',
      nickname: '惠州政务',
      avatar: 'https://picsum.photos/seed/user4/100',
      role: 'government',
      points: 5000,
      level: 10,
      createdAt: new Date('2025-01-01'),
      lastLoginAt: new Date(),
      isSignedInToday: true,
    },
    content: '感谢您的建议！我们已将此问题反馈给惠州市文化广电旅游体育局和交警部门，正在研究节假日临时停车方案。预计今年内会有改善措施出台。',
    likes: 89,
    createdAt: new Date('2026-06-15T14:00:00'),
  },
];

export default function BaoliaoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useUserStore();
  const { baoliaos, currentBaoliao, loading, fetchBaoliaoById, likeBaoliao, addComment } = useBaoliaoStore();

  const [comments, setComments] = useState<BaoliaoComment[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (id) {
      fetchBaoliaoById(id);
      setComments(mockComments);
    }
  }, [id, fetchBaoliaoById]);

  const baoliao = currentBaoliao || baoliaos.find(b => b.id === id);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (baoliao) {
      setIsLikeAnimating(true);
      await likeBaoliao(baoliao.id);
      setTimeout(() => setIsLikeAnimating(false), 300);
    }
  };

  const handleFavorite = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setIsFavorited(!isFavorited);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: baoliao?.title,
        text: baoliao?.content,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  const handleSubmitComment = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!commentContent.trim() || !baoliao) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await addComment(baoliao.id, commentContent.trim());
      setComments([newComment, ...comments]);
      setCommentContent('');
    } catch (error) {
      console.error('评论失败:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  const handleNavigate = () => {
    if (baoliao) {
      const url = `https://maps.google.com/?q=${baoliao.location.lat},${baoliao.location.lng}`;
      window.open(url, '_blank');
    }
  };

  if (loading && !baoliao) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="sticky top-0 bg-white border-b border-neutral-100 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <Skeleton shape="circle" width="w-10" height="h-10" />
            <div className="flex-1">
              <Skeleton shape="text" lines={1} />
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <Skeleton shape="text" lines={2} />
          <Skeleton shape="rect" height="h-64" />
          <Skeleton shape="text" lines={5} />
          <Skeleton shape="rect" height="h-48" />
        </div>
      </div>
    );
  }

  if (!baoliao) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Empty
          title="爆料不存在"
          description="该爆料可能已被删除或不存在"
          action={{
            label: '返回列表',
            onClick: () => navigate('/baoliao'),
          }}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-neutral-50 pb-32"
    >
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors relative"
            >
              <MoreHorizontal className="w-5 h-5 text-neutral-600" />
              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-32 bg-white rounded-card shadow-lg border border-neutral-100 py-2"
                  >
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        alert('举报功能开发中');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                    >
                      <Flag className="w-4 h-4" />
                      举报
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleShare();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      分享
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {baoliao.status !== 'approved' && (
          <div className={cn(
            'mx-4 mt-4 rounded-xl p-4 flex items-start gap-3',
            baoliao.status === 'pending' && 'bg-chaojing-50 border border-chaojing-200',
            baoliao.status === 'rejected' && 'bg-red-50 border border-red-200'
          )}>
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
              baoliao.status === 'pending' && 'bg-chaojing-100 text-chaojing-600',
              baoliao.status === 'rejected' && 'bg-red-100 text-red-600'
            )}>
              {baoliao.status === 'pending' ? (
                <Clock className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={cn(
                'font-semibold mb-1',
                baoliao.status === 'pending' && 'text-chaojing-700',
                baoliao.status === 'rejected' && 'text-red-700'
              )}>
                {baoliao.status === 'pending' ? '📝 内容审核中' : '⛔ 内容未通过审核'}
              </h3>
              <p className={cn(
                'text-sm',
                baoliao.status === 'pending' && 'text-chaojing-600',
                baoliao.status === 'rejected' && 'text-red-600'
              )}>
                {baoliao.status === 'pending'
                  ? '您的爆料已提交，编辑正在进行初审。审核通过后将进入公共信息流，其他用户即可看到您的爆料内容。'
                  : `审核未通过原因：${baoliao.rejectReason || '内容不符合社区规范，请修改后重新发布。'}`
                }
              </p>
              {baoliao.status === 'pending' && (
                <div className="mt-3 flex items-center gap-2 text-xs text-chaojing-600 bg-chaojing-100/50 rounded-lg px-3 py-2">
                  <Gift className="w-4 h-4" />
                  <span>审核通过后可获得 <span className="font-bold">+20 小红花积分</span> 奖励！</span>
                </div>
              )}
            </div>
          </div>
        )}

        {baoliao.status === 'approved' && baoliao.reviewedAt && (
          <div className="mx-4 mt-4 rounded-xl p-4 bg-honghua-50 border border-honghua-200 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-honghua-100 text-honghua-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-honghua-700 mb-1">✅ 审核已通过</h3>
              <p className="text-sm text-honghua-600">
                您的爆料于 {formatDate(baoliao.reviewedAt)} 通过审核，已进入公共信息流。
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-honghua-600 bg-honghua-100/50 rounded-lg px-3 py-2">
                <Gift className="w-4 h-4" />
                <span>已获得 <span className="font-bold">+20 小红花积分</span> 奖励！</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar size="md" name={baoliao.user.nickname} src={baoliao.user.avatar} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-800">{baoliao.user.nickname}</span>
                  {baoliao.user.role !== 'user' && (
                    <Badge variant="westlake">
                      {baoliao.user.role === 'government' ? '官方' : baoliao.user.role === 'creator' ? '创作者' : '管理员'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-neutral-400">{formatDate(baoliao.createdAt)}</p>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-neutral-800 mb-4 leading-snug">
            {baoliao.title}
          </h1>

          <p className="text-neutral-700 leading-relaxed mb-6 whitespace-pre-wrap">
            {baoliao.content}
          </p>

          {baoliao.images.length > 0 && (
            <div className="mb-6">
              {baoliao.images.length === 1 ? (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="relative rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => handleImageClick(0)}
                >
                  <img
                    src={baoliao.images[0]}
                    alt={baoliao.title}
                    className="w-full max-h-96 object-cover"
                  />
                </motion.div>
              ) : baoliao.images.length <= 4 ? (
                <div className="grid grid-cols-2 gap-2">
                  {baoliao.images.map((img, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      className="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => handleImageClick(index)}
                    >
                      <img
                        src={img}
                        alt={`${baoliao.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {baoliao.images.slice(0, 5).map((img, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      className="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => handleImageClick(index)}
                    >
                      <img
                        src={img}
                        alt={`${baoliao.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {index === 4 && baoliao.images.length > 5 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-xl font-bold">+{baoliao.images.length - 5}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {baoliao.video && (
            <div className="mb-6">
              <div
                className="relative rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => alert('视频播放功能开发中')}
              >
                <div className="aspect-video bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:bg-white/30 transition-colors"
                  >
                    <Play className="w-8 h-8 text-white ml-1" />
                  </motion.div>
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-white text-xs flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  视频
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Tag color={categoryColors[baoliao.category] || 'neutral'} size="md">
              {baoliao.categoryName}
            </Tag>
            <Badge variant={sentimentVariants[baoliao.sentiment]}>
              {sentimentLabels[baoliao.sentiment]}
            </Badge>
          </div>

          <div className="bg-neutral-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-westlake-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-westlake-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-800 mb-1">{baoliao.location.address}</p>
                <p className="text-sm text-neutral-500 mb-3">{baoliao.location.district}</p>
                <div className="relative rounded-lg overflow-hidden mb-3">
                  <img
                    src={`https://picsum.photos/seed/map${baoliao.id}/600/200`}
                    alt="位置地图"
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                    </motion.div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNavigate}
                  leftIcon={<Navigation className="w-4 h-4" />}
                >
                  导航前往
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-4 border-t border-b border-neutral-100">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1 text-neutral-400">
                <Eye className="w-4 h-4" />
                <span className="text-sm">{baoliao.views}</span>
              </div>
              <div className="flex items-center gap-1 text-neutral-400">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">{baoliao.comments}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLike}
                className={cn(
                  'flex items-center gap-1 px-3 py-2 rounded-full transition-colors',
                  baoliao.isLiked ? 'text-red-500' : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                <motion.div
                  animate={isLikeAnimating ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart className={cn('w-5 h-5', baoliao.isLiked && 'fill-current')} />
                </motion.div>
                <span className="text-sm font-medium">{baoliao.likes}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFavorite}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  isFavorited ? 'text-yellow-500' : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                <Bookmark className={cn('w-5 h-5', isFavorited && 'fill-current')} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="p-2 rounded-full text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="bg-white mt-4 px-4 py-6">
          <h2 className="font-semibold text-lg text-neutral-800 mb-4">
            评论 <span className="text-neutral-400 font-normal">({comments.length})</span>
          </h2>

          {comments.length === 0 ? (
            <Empty
              title="暂无评论"
              description="快来发表第一条评论吧"
              className="py-8"
            />
          ) : (
            <div className="divide-y divide-neutral-100">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}

          {comments.length > 0 && (
            <button className="w-full py-3 text-center text-sm text-westlake-600 hover:text-westlake-700 transition-colors">
              加载更多评论
            </button>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 p-4 pb-6">
        <div className="max-w-2xl mx-auto flex items-end gap-3">
          <Avatar size="sm" name="我" src={isLoggedIn ? undefined : ''} />
          <div className="flex-1 relative">
            <textarea
              ref={commentInputRef}
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={isLoggedIn ? '写下你的评论...' : '登录后发表评论'}
              disabled={!isLoggedIn}
              className="w-full px-4 py-2.5 pr-12 border border-neutral-200 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-westlake-500 text-sm bg-neutral-50 disabled:opacity-50"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentContent.trim() || isSubmittingComment || !isLoggedIn}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-westlake-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-westlake-600 transition-colors"
            >
              {isSubmittingComment ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showImageModal && (
          <Modal
            isOpen={showImageModal}
            onClose={() => setShowImageModal(false)}
            className="bg-black/90"
            hideCloseButton
          >
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="relative w-full max-w-4xl px-4">
                <motion.img
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={baoliao.images[currentImageIndex]}
                  alt={`${baoliao.title} ${currentImageIndex + 1}`}
                  className="w-full max-h-[80vh] object-contain"
                />

                {baoliao.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev - 1 + baoliao.images.length) % baoliao.images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev + 1) % baoliao.images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ArrowLeft className="w-6 h-6 rotate-180" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      {baoliao.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={cn(
                            'w-2 h-2 rounded-full transition-all',
                            index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
