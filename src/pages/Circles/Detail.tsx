import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  FileText,
  Calendar,
  Crown,
  Plus,
  Check,
  LogOut,
  Edit3,
  Bell,
  Star,
  TrendingUp
} from 'lucide-react';
import { useCircleStore } from '@/stores/useCircleStore';
import { useUserStore } from '@/stores/useUserStore';
import { mockUsers } from '@/data/mockUsers';
import ActivityCard from '@/components/business/ActivityCard';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import Tag from '@/components/common/Tag';
import Badge from '@/components/common/Badge';
import Card from '@/components/common/Card';
import Empty from '@/components/common/Empty';
import Loading from '@/components/common/Loading';
import type { Activity, User } from '@/types';

const tabs = [
  { value: 'home', label: '首页', icon: Star },
  { value: 'feed', label: '动态', icon: FileText },
  { value: 'activities', label: '活动', icon: Calendar },
  { value: 'members', label: '成员', icon: Users },
];

export default function CircleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentCircle,
    activities,
    fetchCircleById,
    fetchActivities,
    joinCircle,
    leaveCircle,
    registerActivity,
    unregisterActivity,
  } = useCircleStore();
  const { user: currentUser, isLoggedIn } = useUserStore();

  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [membersPage, setMembersPage] = useState(1);
  const membersPerPage = 8;

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (circleId: string) => {
    setLoading(true);
    await Promise.all([
      fetchCircleById(circleId),
      fetchActivities(circleId),
    ]);
    setLoading(false);
  };

  const handleJoinLeave = async () => {
    if (!currentCircle) return;
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setActionLoading(true);
    if (currentCircle.isJoined) {
      await leaveCircle(currentCircle.id);
    } else {
      await joinCircle(currentCircle.id);
    }
    setActionLoading(false);
  };

  const handleRegisterActivity = async (activityId: string) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    
    if (activity.isRegistered) {
      await unregisterActivity(activityId);
    } else {
      await registerActivity(activityId);
    }
  };

  const isAdmin = currentUser && currentCircle?.adminId === currentUser.id;

  const paginatedMembers = () => {
    const allMembers: User[] = [];
    if (currentCircle?.admin) {
      allMembers.push(currentCircle.admin);
    }
    const otherMembers = mockUsers.filter(u => u.id !== currentCircle?.adminId);
    allMembers.push(...otherMembers);
    const start = (membersPage - 1) * membersPerPage;
    return allMembers.slice(start, start + membersPerPage);
  };

  const totalMembers = mockUsers.length + 1;
  const totalPages = Math.ceil(totalMembers / membersPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!currentCircle) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Empty description="圈子不存在" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={currentCircle.coverImage}
          alt={currentCircle.name}
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute top-0 left-0 right-0 p-4 z-10">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex-shrink-0"
              >
                <Avatar
                  size="xl"
                  src={currentCircle.coverImage}
                  name={currentCircle.name}
                  className="ring-4 ring-white shadow-lg"
                />
              </motion.div>

              <div className="flex-1">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mb-2"
                >
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {currentCircle.name}
                  </h1>
                  {isAdmin && (
                    <Badge variant="chaojing" size="sm">
                      <Crown className="w-3 h-3 mr-1" />
                      管理员
                    </Badge>
                  )}
                </motion.div>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/80 text-sm md:text-base line-clamp-2 mb-3"
                >
                  {currentCircle.description}
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap gap-2 mb-3"
                >
                  {currentCircle.tags.map(tag => (
                    <Tag key={tag} color="westlake" size="sm">
                      {tag}
                    </Tag>
                  ))}
                </motion.div>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex-shrink-0"
              >
                <Button
                  variant={currentCircle.isJoined ? 'outline' : 'primary'}
                  size="md"
                  loading={actionLoading}
                  leftIcon={currentCircle.isJoined ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  onClick={handleJoinLeave}
                  className={currentCircle.isJoined ? 'bg-white/20 backdrop-blur-sm border-white text-white hover:bg-white/30' : ''}
                >
                  {currentCircle.isJoined ? '已加入' : '加入圈子'}
                </Button>
                {currentCircle.isJoined && (
                  <Button
                    variant="ghost"
                    size="md"
                    className="mt-2 text-white/80 hover:text-white hover:bg-white/20 w-full"
                    leftIcon={<LogOut className="w-4 h-4" />}
                    onClick={handleJoinLeave}
                  >
                    退出圈子
                  </Button>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 py-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-neutral-800">
                <Users className="w-5 h-5 text-westlake-500" />
                <span>{currentCircle.memberCount.toLocaleString()}</span>
              </div>
              <div className="text-xs text-neutral-500 mt-1">成员</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-neutral-800">
                <FileText className="w-5 h-5 text-honghua-500" />
                <span>{currentCircle.postCount.toLocaleString()}</span>
              </div>
              <div className="text-xs text-neutral-500 mt-1">帖子</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-neutral-800">
                <Calendar className="w-5 h-5 text-chaojing-500" />
                <span>{currentCircle.activityCount.toLocaleString()}</span>
              </div>
              <div className="text-xs text-neutral-500 mt-1">活动</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="hidden md:block text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <Avatar
                  size="sm"
                  src={currentCircle.admin.avatar}
                  name={currentCircle.admin.nickname}
                />
                <div className="text-left">
                  <div className="text-sm font-medium text-neutral-800 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-chaojing-500" />
                    {currentCircle.admin.nickname}
                  </div>
                  <div className="text-xs text-neutral-500">圈主</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-30 bg-white border-b border-neutral-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-0">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className={
                        'relative px-4 md:px-6 py-3 text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2'
                      }
                      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                    >
                      <Icon
                        className={
                          'w-4 h-4 ' +
                          (activeTab === tab.value ? 'text-westlake-600' : 'text-neutral-400')
                        }
                      />
                      <span
                        className={
                          activeTab === tab.value ? 'text-westlake-600' : 'text-neutral-600'
                        }
                      >
                        {tab.label}
                      </span>
                      {activeTab === tab.value && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-westlake-500 to-westlake-600"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {currentCircle.isJoined && (
              <div className="flex items-center gap-2 pl-4 border-l border-neutral-100">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit3 className="w-4 h-4" />}
                  className="hidden md:flex"
                >
                  发布动态
                </Button>
                {isAdmin && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => navigate(`/circles/${currentCircle.id}/activity/publish`)}
                  >
                    发起活动
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-honghua-500" />
                    圈子公告
                  </h3>
                  <div className="bg-honghua-50 border border-honghua-100 rounded-lg p-4">
                    <p className="text-neutral-700">
                      欢迎来到{currentCircle.name}！请大家遵守圈子规则，和谐交流。
                      每月我们都会组织精彩的线下活动，敬请期待！
                    </p>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-westlake-500" />
                    精华内容
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <motion.div
                        key={i}
                        whileHover={{ y: -2 }}
                        className="bg-neutral-50 rounded-lg p-4 cursor-pointer"
                      >
                        <div className="flex gap-3">
                          <img
                            src={`https://picsum.photos/seed/feature-${i}/120/80`}
                            alt=""
                            className="w-20 h-14 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-neutral-800 line-clamp-1">
                              精彩内容推荐 #{i}
                            </h4>
                            <p className="text-sm text-neutral-500 line-clamp-2 mt-1">
                              这是一篇非常棒的分享内容，获得了大家的一致好评...
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-chaojing-500" />
                    活跃成员
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {mockUsers.slice(0, 6).map(user => (
                      <motion.div
                        key={user.id}
                        whileHover={{ y: -3 }}
                        className="flex flex-col items-center w-16"
                      >
                        <Avatar
                          size="lg"
                          src={user.avatar}
                          name={user.nickname}
                          className="mb-2"
                        />
                        <span className="text-xs text-neutral-600 text-center line-clamp-1 w-full">
                          {user.nickname}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'feed' && (
              <div className="space-y-4">
                {currentCircle.isJoined ? (
                  <Card className="p-4">
                    <div className="flex gap-3">
                      <Avatar src={currentUser.avatar} name={currentUser.nickname} />
                      <div className="flex-1">
                        <div className="bg-neutral-50 rounded-full px-4 py-2 text-neutral-400 cursor-pointer hover:bg-neutral-100 transition-colors">
                          分享你的想法...
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-6 text-center">
                    <p className="text-neutral-500 mb-4">加入圈子后即可发布动态</p>
                    <Button variant="primary" onClick={handleJoinLeave}>
                      加入圈子
                    </Button>
                  </Card>
                )}

                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4">
                    <div className="flex gap-3">
                      <Avatar
                        src={mockUsers[i % mockUsers.length].avatar}
                        name={mockUsers[i % mockUsers.length].nickname}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-neutral-800">
                            {mockUsers[i % mockUsers.length].nickname}
                          </span>
                          <span className="text-xs text-neutral-400">2小时前</span>
                        </div>
                        <p className="text-neutral-700 mb-3">
                          今天参加了圈子组织的活动，非常开心！分享几张照片给大家看看～
                        </p>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {[1, 2, 3].map(j => (
                            <img
                              key={j}
                              src={`https://picsum.photos/seed/feed-${i}-${j}/200/200`}
                              alt=""
                              className="w-full h-20 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-6 text-sm text-neutral-500">
                          <button className="hover:text-westlake-600 transition-colors">
                            👍 {Math.floor(Math.random() * 50) + 10}
                          </button>
                          <button className="hover:text-westlake-600 transition-colors">
                            💬 {Math.floor(Math.random() * 20) + 1}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'activities' && (
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <Empty description="暂无活动" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activities.map((activity: Activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        onRegister={handleRegisterActivity}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {paginatedMembers().map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -2 }}
                      className="bg-white rounded-card shadow-card p-4 flex flex-col items-center text-center"
                    >
                      <Avatar
                        size="lg"
                        src={member.avatar}
                        name={member.nickname}
                        className="mb-3"
                        online={member.isSignedInToday}
                      />
                      <div className="font-medium text-neutral-800 flex items-center gap-1">
                        {member.id === currentCircle.adminId && (
                          <Crown className="w-3 h-3 text-chaojing-500" />
                        )}
                        {member.nickname}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Lv.{member.level}
                      </div>
                      {member.id !== currentCircle.adminId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full"
                        >
                          关注
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={membersPage === 1}
                      onClick={() => setMembersPage(p => p - 1)}
                    >
                      上一页
                    </Button>
                    <span className="text-sm text-neutral-500">
                      {membersPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={membersPage === totalPages}
                      onClick={() => setMembersPage(p => p + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {currentCircle.isJoined && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <div className="flex flex-col gap-2">
            {isAdmin && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                <Button
                  variant="primary"
                  size="lg"
                  className="w-14 h-14 rounded-full shadow-lg"
                  leftIcon={<Plus className="w-6 h-6" />}
                  onClick={() => navigate(`/circles/${currentCircle.id}/activity/publish`)}
                />
              </motion.div>
            )}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
            >
              <Button
                variant="secondary"
                size="lg"
                className="w-14 h-14 rounded-full shadow-lg"
                leftIcon={<Edit3 className="w-6 h-6" />}
              />
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
