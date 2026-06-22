import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Users,
  Share2,
  Heart,
  MessageCircle,
  Send,
  Camera,
  Award,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useCircleStore } from '@/stores/useCircleStore';
import { useUserStore } from '@/stores/useUserStore';
import { mockUsers } from '@/data/mockUsers';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Tag from '@/components/common/Tag';
import Badge from '@/components/common/Badge';
import TextArea from '@/components/common/TextArea';
import Empty from '@/components/common/Empty';
import Loading from '@/components/common/Loading';
import CommentItem from '@/components/business/CommentItem';
import { formatDuration } from '@/utils/date';
import type { Activity, BaoliaoComment } from '@/types';

const statusConfig: Record<string, { label: string; variant: 'westlake' | 'honghua' | 'chaojing' | 'neutral' }> = {
  upcoming: { label: '即将开始', variant: 'westlake' },
  ongoing: { label: '进行中', variant: 'honghua' },
  ended: { label: '已结束', variant: 'neutral' },
  cancelled: { label: '已取消', variant: 'neutral' },
};

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activities, fetchActivities, registerActivity, unregisterActivity } = useCircleStore();
  const { user: currentUser, isLoggedIn } = useUserStore();
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const [comments, setComments] = useState<BaoliaoComment[]>([
    {
      id: 'cmt001',
      baoliaoId: '',
      userId: 'u002',
      user: mockUsers[1],
      content: '这个活动太棒了！期待已久，终于可以参加了～',
      likes: 12,
      createdAt: new Date(Date.now() - 3600000 * 2),
    },
    {
      id: 'cmt002',
      baoliaoId: '',
      userId: 'u003',
      user: mockUsers[2],
      content: '请问活动需要自带什么装备吗？',
      likes: 5,
      createdAt: new Date(Date.now() - 3600000),
    },
  ]);

  const activity = useMemo(() => {
    return activities.find(a => a.id === id);
  }, [activities, id]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    await fetchActivities();
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!activity) return;
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setActionLoading(true);
    if (activity.isRegistered) {
      await unregisterActivity(activity.id);
    } else {
      await registerActivity(activity.id);
    }
    setActionLoading(false);
  };

  const handleSubmitComment = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!commentText.trim() || !currentUser) return;
    
    const newComment: BaoliaoComment = {
      id: 'cmt' + Date.now(),
      baoliaoId: activity?.id || '',
      userId: currentUser.id,
      user: currentUser,
      content: commentText.trim(),
      likes: 0,
      createdAt: new Date(),
    };
    
    setComments([newComment, ...comments]);
    setCommentText('');
  };

  const countdown = useMemo(() => {
    if (!activity) return null;
    const now = new Date();
    const start = new Date(activity.startTime);
    const end = new Date(activity.endTime);
    
    if (now < start) {
      const diff = start.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return { type: 'countdown', days, hours, minutes, seconds };
    } else if (now >= start && now < end) {
      return { type: 'ongoing', duration: formatDuration(now, end) };
    } else {
      return { type: 'ended' };
    }
  }, [activity]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[d.getDay()];
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${weekDay} ${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Empty description="活动不存在" />
      </div>
    );
  }

  const status = statusConfig[activity.status] || statusConfig.upcoming;
  const progress = (activity.currentParticipants / activity.maxParticipants) * 100;
  const isFull = activity.currentParticipants >= activity.maxParticipants;
  const canRegister = activity.status === 'upcoming' && !isFull;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={activity.coverImage}
          alt={activity.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        <div className="absolute top-0 left-0 right-0 p-4 z-10 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsLiked(!isLiked)}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <Heart className={isLiked ? 'w-5 h-5 fill-red-500 text-red-500' : 'w-5 h-5'} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowShare(true)}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <div className="absolute top-3 left-16 z-10">
          <Tag color="chaojing" size="sm">
            {activity.circle.name}
          </Tag>
        </div>
        
        <div className="absolute top-3 right-20 z-10">
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-10">
          <div className="max-w-5xl mx-auto">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl md:text-3xl font-bold text-white mb-2"
            >
              {activity.title}
            </motion.h1>
            
            {countdown?.type === 'countdown' && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 text-white/90"
              >
                <AlertCircle className="w-4 h-4" />
                <span>距离开始还有</span>
                <div className="flex items-center gap-1">
                  {countdown.days > 0 && (
                    <span className="bg-westlake-500 px-2 py-0.5 rounded text-sm font-bold">
                      {countdown.days}天
                    </span>
                  )}
                  <span className="bg-westlake-500 px-2 py-0.5 rounded text-sm font-bold">
                    {countdown.hours}时
                  </span>
                  <span className="bg-westlake-500 px-2 py-0.5 rounded text-sm font-bold">
                    {countdown.minutes}分
                  </span>
                  <span className="bg-westlake-500 px-2 py-0.5 rounded text-sm font-bold">
                    {countdown.seconds}秒
                  </span>
                </div>
              </motion.div>
            )}
            
            {countdown?.type === 'ongoing' && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 text-honghua-400"
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-honghua-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-honghua-500" />
                </span>
                <span>活动进行中，还剩 {countdown.duration}</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-westlake-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-neutral-800">活动时间</div>
                      <div className="text-sm text-neutral-600 mt-1">
                        {formatDate(activity.startTime)} - {formatDate(activity.endTime)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-honghua-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-neutral-800">{activity.location}</div>
                      <div className="text-sm text-neutral-600 mt-1">{activity.address}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Navigation className="w-4 h-4" />}
                    >
                      导航
                    </Button>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-chaojing-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-neutral-800 mb-2">
                        报名进度 {activity.currentParticipants}/{activity.maxParticipants}
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, delay: 0.5 }}
                          className={
                            'h-full rounded-full ' +
                            (progress >= 100
                              ? 'bg-neutral-400'
                              : 'bg-gradient-to-r from-westlake-500 to-westlake-600')
                          }
                        />
                      </div>
                      <div className="flex justify-between text-xs text-neutral-500 mt-1">
                        <span>{Math.round(progress)}% 已报名</span>
                        <span>剩余 {activity.maxParticipants - activity.currentParticipants} 名额</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Avatar
                      size="md"
                      src={activity.organizer.avatar}
                      name={activity.organizer.nickname}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-neutral-800">
                        {activity.organizer.nickname}
                      </div>
                      <div className="text-xs text-neutral-500">活动组织者</div>
                    </div>
                    <Button variant="outline" size="sm">
                      联系
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-westlake-500" />
                  已报名用户
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activity.participants.slice(0, 10).map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      style={{ marginLeft: index > 0 ? '-12px' : '0' }}
                      className="relative"
                    >
                      <Avatar
                        size="md"
                        src={user.avatar}
                        name={user.nickname}
                        className="ring-2 ring-white"
                      />
                    </motion.div>
                  ))}
                  {activity.participants.length > 10 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6 }}
                      className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-sm text-neutral-500 border-2 border-white"
                      style={{ marginLeft: '-12px' }}
                    >
                      +{activity.participants.length - 10}
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <h3 className="text-lg font-bold text-neutral-800 mb-4">活动描述</h3>
                <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed">
                  <p className="mb-4">{activity.description}</p>
                  
                  <h4 className="font-medium text-neutral-800 mt-6 mb-2">活动流程</h4>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-westlake-100 text-westlake-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                      <span>集合签到，领取活动物资</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-westlake-100 text-westlake-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                      <span>开场介绍，活动注意事项说明</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-westlake-100 text-westlake-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                      <span>正式活动开始</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-westlake-100 text-westlake-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
                      <span>互动交流，分享心得</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-westlake-100 text-westlake-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">5</span>
                      <span>活动总结，合影留念</span>
                    </li>
                  </ul>

                  <h4 className="font-medium text-neutral-800 mt-6 mb-2">注意事项</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-honghua-500 flex-shrink-0 mt-0.5" />
                      <span>请提前15分钟到达集合地点签到</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-honghua-500 flex-shrink-0 mt-0.5" />
                      <span>穿着舒适的运动服装和鞋子</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-honghua-500 flex-shrink-0 mt-0.5" />
                      <span>自带饮用水和防晒用品</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-honghua-500 flex-shrink-0 mt-0.5" />
                      <span>如需取消报名，请提前24小时告知</span>
                    </li>
                  </ul>
                </div>
              </Card>
            </motion.div>

            {activity.status === 'ended' && activity.images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-westlake-500" />
                    活动相册
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {activity.images.map((img, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.55 + index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        className="aspect-video rounded-lg overflow-hidden cursor-pointer"
                      >
                        <img
                          src={img}
                          alt={`活动照片 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {activity.status === 'ended' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card>
                  <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-chaojing-500" />
                    活动成果
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-westlake-600">
                          {activity.currentParticipants}
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">参与人数</div>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-honghua-600">
                          {activity.images.length}
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">精彩照片</div>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-chaojing-600">
                          4.8
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">活动评分</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {[1, 2].map(i => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.65 + i * 0.05 }}
                          className="flex gap-3 p-3 bg-neutral-50 rounded-lg"
                        >
                          <Avatar
                            size="sm"
                            src={mockUsers[i].avatar}
                            name={mockUsers[i].nickname}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-neutral-800 text-sm">
                                {mockUsers[i].nickname}
                              </span>
                              <div className="text-chaojing-500 text-xs">
                                {'★'.repeat(5)}
                              </div>
                            </div>
                            <p className="text-sm text-neutral-600">
                              活动非常棒！组织者很用心，认识了很多新朋友，期待下次再参加！
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-westlake-500" />
                  评论区
                  <span className="text-sm font-normal text-neutral-500">({comments.length})</span>
                </h3>
                
                <div className="flex gap-3 mb-6">
                  <Avatar src={currentUser.avatar} name={currentUser.nickname} size="sm" />
                  <div className="flex-1">
                    <TextArea
                      placeholder="发表你的看法..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                      maxLength={500}
                      showCount
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSubmitComment}
                        disabled={!commentText.trim()}
                        leftIcon={<Send className="w-4 h-4" />}
                      >
                        发表评论
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-neutral-100">
                  {comments.map(comment => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                    />
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <h3 className="font-bold text-neutral-800 mb-4">报名操作</h3>
                  
                  {currentUser && activity.organizer.id === currentUser.id && (
                    <div className="mb-4 p-3 bg-westlake-50 border border-westlake-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-westlake-700 text-sm flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          组织者管理
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Users className="w-4 h-4" />}
                          onClick={() => navigate(`/activity/${activity.id}/manage`)}
                        >
                          报名名单
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Award className="w-4 h-4" />}
                          onClick={() => navigate(`/activity/${activity.id}/manage`)}
                        >
                          成果管理
                        </Button>
                      </div>
                    </div>
                  )}

                  {activity.status === 'ended' ? (
                    <div className="text-center py-4">
                      <div className="text-neutral-400 mb-2">活动已结束</div>
                      <Button variant="outline" className="w-full" disabled>
                        已结束
                      </Button>
                    </div>
                  ) : activity.status === 'cancelled' ? (
                    <div className="text-center py-4">
                      <div className="text-neutral-400 mb-2">活动已取消</div>
                      <Button variant="outline" className="w-full" disabled>
                        已取消
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant={activity.isRegistered ? 'outline' : 'primary'}
                        size="lg"
                        className="w-full mb-3"
                        loading={actionLoading}
                        disabled={!canRegister && !activity.isRegistered}
                        onClick={handleRegister}
                      >
                        {activity.isRegistered
                          ? '取消报名'
                          : isFull
                          ? '名额已满'
                          : '立即报名'}
                      </Button>
                      
                      {!activity.isRegistered && !canRegister && (
                        <p className="text-xs text-neutral-500 text-center">
                          {isFull ? '报名人数已达上限' : '活动已开始，无法报名'}
                        </p>
                      )}
                    </>
                  )}

                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <h4 className="text-sm font-medium text-neutral-800 mb-3">活动信息</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">发布时间</span>
                        <span className="text-neutral-700">
                          {formatDate(activity.createdAt).split(' ')[0]}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">活动时长</span>
                        <span className="text-neutral-700">
                          {formatDuration(activity.startTime, activity.endTime)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">所属圈子</span>
                        <button
                          onClick={() => navigate(`/circles/${activity.circle.id}`)}
                          className="text-westlake-600 hover:underline flex items-center gap-1"
                        >
                          {activity.circle.name}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 p-4 z-40 lg:hidden">
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            leftIcon={<Share2 className="w-5 h-5" />}
            onClick={() => setShowShare(true)}
          >
            分享
          </Button>
          {activity.status !== 'ended' && activity.status !== 'cancelled' && (
            <Button
              variant={activity.isRegistered ? 'outline' : 'primary'}
              size="lg"
              className="flex-1"
              loading={actionLoading}
              disabled={!canRegister && !activity.isRegistered}
              onClick={handleRegister}
            >
              {activity.isRegistered
                ? '取消报名'
                : isFull
                ? '名额已满'
                : '立即报名'}
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showShare && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShare(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 p-6"
            >
              <h3 className="text-lg font-bold text-neutral-800 text-center mb-4">分享活动</h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                {['微信', '朋友圈', 'QQ', '微博'].map((item, index) => (
                  <motion.button
                    key={item}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="flex flex-col items-center gap-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-westlake-400 to-westlake-600 flex items-center justify-center text-white text-sm">
                      {item[0]}
                    </div>
                    <span className="text-xs text-neutral-600">{item}</span>
                  </motion.button>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowShare(false)}
              >
                取消
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
