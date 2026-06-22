import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flower2,
  CalendarCheck,
  Crown,
  TrendingUp,
  TrendingDown,
  Gift,
  HeartHandshake,
  HelpCircle,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Loader2,
  LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePointStore } from '@/stores/usePointStore';
import { useUserStore } from '@/stores/useUserStore';
import PointCard from '@/components/business/PointCard';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Empty from '@/components/common/Empty';

type RecordTabType = 'all' | 'earn' | 'spend';
type TaskTabType = 'daily' | 'weekly' | 'one_time';

const taskTabLabels: Record<TaskTabType, string> = {
  daily: '每日任务',
  weekly: '每周任务',
  one_time: '新手任务'
};

const recordTabLabels: Record<RecordTabType, string> = {
  all: '全部',
  earn: '收入',
  spend: '支出'
};

const quickEntries = [
  { icon: Gift, name: '积分商城', path: '/points/mall', color: 'from-pink-400 to-rose-500', bgColor: 'bg-pink-50' },
  { icon: HeartHandshake, name: '公益捐赠', path: '/points/donate', color: 'from-honghua-400 to-honghua-600', bgColor: 'bg-honghua-50' },
  { icon: HelpCircle, name: '积分说明', path: '/points/help', color: 'from-chaojing-400 to-chaojing-600', bgColor: 'bg-chaojing-50' },
];

const levelConfig = [
  { level: 1, name: '新手上路', minPoints: 0 },
  { level: 2, name: '初级会员', minPoints: 100 },
  { level: 3, name: '白银会员', minPoints: 500 },
  { level: 4, name: '白银会员', minPoints: 1000 },
  { level: 5, name: '黄金会员', minPoints: 2000 },
  { level: 6, name: '黄金会员', minPoints: 3500 },
  { level: 7, name: '黄金会员', minPoints: 5000 },
  { level: 8, name: '铂金会员', minPoints: 8000 },
  { level: 9, name: '铂金会员', minPoints: 12000 },
  { level: 10, name: '钻石会员', minPoints: 20000 },
];

export default function Center() {
  const navigate = useNavigate();
  const { user, isLoggedIn, signIn, updatePoints } = useUserStore();
  const { pointRecords, tasks, loading, fetchPointRecords, fetchTasks, completeTask } = usePointStore();
  const [taskTab, setTaskTab] = useState<TaskTabType>('daily');
  const [recordTab, setRecordTab] = useState<RecordTabType>('all');
  const [signInLoading, setSignInLoading] = useState(false);
  const [showPointAnimation, setShowPointAnimation] = useState(false);
  const [animationPoints, setAnimationPoints] = useState(0);
  const [displayPoints, setDisplayPoints] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (isLoggedIn) {
      fetchPointRecords();
      fetchTasks();
    }
  }, [isLoggedIn, fetchPointRecords, fetchTasks]);

  useEffect(() => {
    if (user) {
      setDisplayPoints(user.points);
    }
  }, [user?.points]);

  const currentLevelInfo = useMemo(() => {
    if (!user) return { current: levelConfig[0], next: levelConfig[1], progress: 0 };
    const currentIndex = Math.min(user.level - 1, levelConfig.length - 1);
    const current = levelConfig[currentIndex];
    const next = levelConfig[Math.min(currentIndex + 1, levelConfig.length - 1)];
    const pointsInCurrentLevel = user.points - current.minPoints;
    const pointsNeeded = next.minPoints - current.minPoints;
    const progress = pointsNeeded > 0 ? Math.min((pointsInCurrentLevel / pointsNeeded) * 100, 100) : 100;
    return { current, next, progress, pointsInCurrentLevel, pointsNeeded };
  }, [user]);

  const todayEarned = useMemo(() => {
    const today = new Date().toDateString();
    return pointRecords
      .filter(r => r.type === 'earn' && new Date(r.createdAt).toDateString() === today)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [pointRecords]);

  const totalEarned = useMemo(() => {
    return pointRecords
      .filter(r => r.type === 'earn')
      .reduce((sum, r) => sum + r.amount, 0);
  }, [pointRecords]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.type === taskTab);
  }, [tasks, taskTab]);

  const filteredRecords = useMemo(() => {
    let records = [...pointRecords];
    if (recordTab !== 'all') {
      records = records.filter(r => r.type === recordTab);
    }
    return records.slice(0, page * pageSize);
  }, [pointRecords, recordTab, page]);

  const hasMore = filteredRecords.length < pointRecords.filter(r => recordTab === 'all' || r.type === recordTab).length;

  const handleSignIn = async () => {
    if (!user || user.isSignedInToday) return;
    setSignInLoading(true);
    const result = await signIn();
    setSignInLoading(false);
    if (result.signedIn) {
      setAnimationPoints(result.points);
      setShowPointAnimation(true);
      updatePoints(result.points);
      setTimeout(() => setShowPointAnimation(false), 2000);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    const result = await completeTask(taskId);
    if (result.success) {
      setAnimationPoints(result.points);
      setShowPointAnimation(true);
      updatePoints(result.points);
      setTimeout(() => setShowPointAnimation(false), 2000);
    }
  };

  const handleQuickEntry = (path: string) => {
    navigate(path);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hours}:${minutes}`;
  };

  if (!isLoggedIn || !user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-neutral-50 flex items-center justify-center"
      >
        <Card className="p-8 text-center max-w-sm mx-4">
          <div className="w-20 h-20 rounded-full bg-chaojing-100 flex items-center justify-center mx-auto mb-4">
            <Flower2 className="w-10 h-10 text-chaojing-500" />
          </div>
          <h2 className="text-xl font-bold text-neutral-800 mb-2">登录后查看积分</h2>
          <p className="text-neutral-500 mb-6">登录即可享受积分兑换、公益捐赠等专属权益</p>
          <Button
            variant="warning"
            size="lg"
            onClick={() => navigate('/login', { state: { from: '/points' } })}
            className="w-full"
            leftIcon={<LogIn className="w-5 h-5" />}
          >
            立即登录
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-neutral-50 pb-20"
    >
      <div className="relative bg-gradient-to-br from-chaojing-400 via-chaojing-500 to-chaojing-600 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 20 + 10}px`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.6, 0.3],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              🌸
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {showPointAnimation && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.5 }}
              animate={{ opacity: 1, y: -40, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className="flex items-center gap-2 text-white text-3xl font-bold">
                <Sparkles className="w-8 h-8" />
                +{animationPoints}
                <Flower2 className="w-8 h-8" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container-page pt-8 pb-12 relative z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-white/80 text-sm mb-2">我的小红花积分</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Flower2 className="w-12 h-12 text-white" />
              </motion.div>
              <motion.span
                key={displayPoints}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3 }}
                className="text-5xl md:text-6xl font-bold text-white"
              >
                {displayPoints.toLocaleString()}
              </motion.span>
            </div>

            <div className="flex items-center justify-center gap-4 mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignIn}
                disabled={user.isSignedInToday || signInLoading}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all',
                  user.isSignedInToday
                    ? 'bg-white/20 text-white/70 cursor-default'
                    : 'bg-white text-chaojing-600 hover:bg-white/90 shadow-lg'
                )}
              >
                {signInLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CalendarCheck className="w-5 h-5" />
                )}
                {user.isSignedInToday ? '今日已签到' : '立即签到'}
                {!user.isSignedInToday && <span className="text-chaojing-500">+10</span>}
              </motion.button>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-white" />
                  <span className="text-white font-medium">{currentLevelInfo.current.name}</span>
                  <span className="text-white/70 text-sm">LV.{user.level}</span>
                </div>
                <div className="text-white/80 text-sm">
                  距离 {currentLevelInfo.next.name} 还需 {Math.max(0, currentLevelInfo.next.minPoints - user.points)} 积分
                </div>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentLevelInfo.progress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-white to-chaojing-200 rounded-full"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center gap-1 text-white/70 text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  累计获得
                </div>
                <div className="text-white text-xl font-bold">{totalEarned.toLocaleString()}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center gap-1 text-white/70 text-sm mb-1">
                  <Sparkles className="w-4 h-4" />
                  今日获得
                </div>
                <div className="text-white text-xl font-bold">+{todayEarned}</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="container-page -mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6"
        >
          <Card className="p-4">
            <h2 className="font-bold text-neutral-800 text-lg mb-4">快捷入口</h2>
            <div className="grid grid-cols-3 gap-3">
              {quickEntries.map((entry, index) => (
                <motion.button
                  key={entry.name}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  onClick={() => handleQuickEntry(entry.path)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-neutral-50 transition-colors group"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-md',
                    entry.color
                  )}>
                    <entry.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm text-neutral-700 font-medium group-hover:text-chaojing-600 transition-colors">
                    {entry.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-6"
        >
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h2 className="font-bold text-neutral-800 text-lg">任务中心</h2>
              <div className="text-sm text-neutral-500">
                已完成 {tasks.filter(t => t.completed).length}/{tasks.length}
              </div>
            </div>

            <div className="flex border-b border-neutral-100">
              {(Object.keys(taskTabLabels) as TaskTabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTaskTab(tab)}
                  className={cn(
                    'flex-1 py-3 px-4 text-sm font-medium transition-colors relative',
                    taskTab === tab ? 'text-chaojing-600' : 'text-neutral-500 hover:text-neutral-700'
                  )}
                >
                  {taskTabLabels[tab]}
                  <span className="ml-1 text-xs text-neutral-400">
                    ({tasks.filter(t => t.type === tab).length})
                  </span>
                  {taskTab === tab && (
                    <motion.div
                      layoutId="activeTaskTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-chaojing-400 to-chaojing-600"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="p-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-chaojing-500 animate-spin" />
                </div>
              ) : filteredTasks.length > 0 ? (
                <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={taskTab}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {filteredTasks.map((task) => (
                        <PointCard
                          key={task.id}
                          task={task}
                          onAction={handleCompleteTask}
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : (
                <Empty title="暂无任务" />
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h2 className="font-bold text-neutral-800 text-lg">积分记录</h2>
              <div className="flex bg-neutral-100 rounded-lg p-0.5">
                {(Object.keys(recordTabLabels) as RecordTabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setRecordTab(tab); setPage(1); }}
                    className={cn(
                      'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                      recordTab === tab
                        ? 'bg-white text-chaojing-600 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    )}
                  >
                    {recordTabLabels[tab]}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-neutral-100">
              {loading && filteredRecords.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-chaojing-500 animate-spin" />
                </div>
              ) : filteredRecords.length > 0 ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={recordTab}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {filteredRecords.map((record, index) => (
                        <motion.div
                          key={record.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center',
                              record.type === 'earn' ? 'bg-honghua-100' : 'bg-chaojing-100'
                            )}>
                              {record.type === 'earn' ? (
                                <TrendingUp className="w-5 h-5 text-honghua-600" />
                              ) : (
                                <TrendingDown className="w-5 h-5 text-chaojing-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-neutral-800">{record.reason}</p>
                              <p className="text-sm text-neutral-500">{formatDate(record.createdAt)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              'font-bold text-lg',
                              record.type === 'earn' ? 'text-honghua-600' : 'text-neutral-700'
                            )}>
                              {record.type === 'earn' ? '+' : '-'}{record.amount}
                            </p>
                            <p className="text-xs text-neutral-400">余额 {record.balance}</p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  {hasMore && (
                    <div className="p-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setPage(p => p + 1)}
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                      >
                        加载更多
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12">
                  <Empty title="暂无积分记录" />
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
