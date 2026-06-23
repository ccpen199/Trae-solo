import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Coins, Flame, Gift, BookOpen, Heart, Sparkles, Users, TrendingUp, ChevronRight, Clock, CheckCircle, Zap } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { get } from '../utils/request';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  reward: number;
  dailyLimit: number;
  maxProgress: number;
  progress?: number;
  completions?: number;
  userStatus?: string;
}

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, fetchProfile } = useUserStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [toast, setToast] = useState<{ show: boolean; message: string; reward?: number }>({ show: false, message: '' });
  const loadingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      if (isLoggedIn) {
        await fetchProfile();
      }
      const taskRes: any = await get('/tasks/daily/recommend');
      if (taskRes.success) {
        setTasks(taskRes.tasks.slice(0, 4));
      }
      if (isLoggedIn) {
        const walletRes: any = await get('/wallet/statistics');
        if (walletRes.success) {
          setTodayEarnings(walletRes.statistics.todayIncome || 0);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => { loadingRef.current = false; }, 300);
    }
  }, [isLoggedIn, fetchProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let mounted = true;
    const handleVisible = () => {
      if (document.visibilityState === 'visible' && mounted) {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [loadData]);

  const categories = [
    { icon: BookOpen, label: '内容消费', color: 'from-blue-400 to-blue-600', path: '/tasks?tab=content', desc: '笑话成语赚金币' },
    { icon: Heart, label: '健康打卡', color: 'from-green-400 to-green-600', path: '/tasks?tab=health', desc: '饮水步数领奖励' },
    { icon: Sparkles, label: '穿搭测评', color: 'from-pink-400 to-pink-600', path: '/tasks?tab=fashion', desc: '发型服饰测风格' },
    { icon: Users, label: '邀请赚钱', color: 'from-amber-400 to-amber-600', path: '/invite', desc: '二级分佣赚更多' },
  ];

  const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = { content: '内容', health: '健康', fashion: '穿搭', invite: '邀请' };
    return map[category] || '';
  };

  const getConditionText = (task: Task) => {
    if (task.type === 'steps') return `完成${task.maxProgress}步`;
    if (task.maxProgress > 1) return `完成${task.maxProgress}次`;
    return '完成1次';
  };

  const getStatusText = (task: Task) => {
    if (!isLoggedIn) return '登录领取';
    if (task.userStatus === 'completed') return '已完成';
    if (task.completions && task.completions > 0) return `${task.completions}/${task.dailyLimit}`;
    return '去完成';
  };

  const getStatusStyle = (task: Task) => {
    if (!isLoggedIn) return 'bg-primary-500 text-white';
    if (task.userStatus === 'completed') return 'bg-green-100 text-green-600';
    return 'bg-primary-500 text-white';
  };

  const handleTaskClick = (task: Task) => {
    if (!isLoggedIn) {
      navigate('/login?from=' + encodeURIComponent(getTaskPath(task)));
      return;
    }
    navigate(getTaskPath(task));
  };

  return (
    <div className="pb-20">
      <div className="bg-gradient-primary px-4 pt-12 pb-20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold">
                {isLoggedIn ? `你好，${user?.nickname || '同学'}` : '欢迎来到赚金币'}
              </h1>
              <p className="text-sm text-white/80 mt-1">利用碎片时间，轻松赚金币</p>
            </div>
            <div
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              onClick={() => navigate(isLoggedIn ? '/profile' : '/login?from=' + encodeURIComponent('/profile'))}
            >
              <Coins size={20} className="text-white" />
            </div>
          </div>

          <div
            className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 border border-white/20 cursor-pointer active:scale-[0.99] transition-transform"
            onClick={() => navigate(isLoggedIn ? '/wallet' : '/login?from=' + encodeURIComponent('/wallet'))}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/80">我的金币</span>
              <div className="flex items-center gap-1 text-sm">
                <Flame size={16} />
                <span>今日 +{todayEarnings.toFixed(0)}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <Coins size={28} className="text-yellow-300 animate-float" />
              <span className="text-4xl font-bold">{isLoggedIn ? (user?.coins || 0).toFixed(0) : '--'}</span>
              {isLoggedIn && todayEarnings > 0 && (
                <span className="text-sm text-yellow-200 flex items-center gap-0.5 ml-2">
                  <Zap size={14} />+{todayEarnings.toFixed(0)}
                </span>
              )}
            </div>
            {isLoggedIn && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">等级 Lv.{user?.level || 1}</span>
                  <span className="text-white/60">经验值 {user?.exp || 0}</span>
                </div>
                <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(((user?.exp || 0) % 100), 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-white/60 mt-1.5">
                  <span>距离 Lv.{(user?.level || 1) + 1} 还需 {100 - ((user?.exp || 0) % 100)} 经验</span>
                </div>
              </div>
            )}
            {!isLoggedIn && (
              <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                <p className="text-sm text-white/70">登录后查看金币余额与流水详情</p>
                <ChevronRight size={20} className="text-white/50" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-2xl shadow-card p-4 grid grid-cols-4 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.label}
                onClick={() => navigate(cat.path)}
                className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon size={22} className="text-white" />
                </div>
                <span className="text-xs font-medium text-dark-700">{cat.label}</span>
                <span className="text-[10px] text-dark-400">{cat.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-500" />
            今日推荐
          </h2>
          <button
            onClick={() => navigate('/tasks')}
            className="text-sm text-primary-500 font-medium flex items-center gap-1 active:opacity-70"
          >
            更多 <ChevronRight size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className="bg-white rounded-xl p-4 shadow-card hover:shadow-card-hover active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getTaskIconBg(task.category)}`}>
                  {getTaskIcon(task.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dark-800 truncate">{task.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${getCategoryBg(task.category)}`}>
                      {getCategoryLabel(task.category)}
                    </span>
                  </div>
                  <p className="text-sm text-dark-500 mt-0.5 line-clamp-1">{task.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-primary-500 font-bold">
                      <Coins size={12} /> +{task.reward}金币
                    </span>
                    <span className="flex items-center gap-1 text-xs text-dark-400">
                      <Clock size={12} /> {getConditionText(task)}
                    </span>
                    {task.dailyLimit > 1 && (
                      <span className="text-xs text-dark-400">每日{task.dailyLimit}次</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getStatusStyle(task)}`}>
                    {getStatusText(task)}
                  </span>
                  {isLoggedIn && task.userStatus === 'completed' && (
                    <CheckCircle size={16} className="text-green-500" />
                  )}
                </div>
              </div>
              {isLoggedIn && task.progress !== undefined && task.maxProgress > 1 && task.userStatus !== 'completed' && (
                <div className="mt-3 ml-15">
                  <div className="flex justify-between text-xs text-dark-500 mb-1">
                    <span>进度</span>
                    <span>{task.progress}/{task.maxProgress}</span>
                  </div>
                  <div className="h-1.5 bg-dark-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700"
                      style={{ width: `${((task.progress || 0) / task.maxProgress) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-10 bg-white rounded-xl shadow-card">
            <div className="w-16 h-16 mx-auto mb-3 bg-dark-100 rounded-full flex items-center justify-center">
              <Gift size={28} className="text-dark-300" />
            </div>
            <p className="text-dark-400 font-medium">暂无推荐任务</p>
            <p className="text-dark-300 text-sm mt-1">请稍后再来查看</p>
          </div>
        )}
      </div>

      <div
        className="mt-6 mx-4 bg-gradient-to-r from-accent-500 to-primary-500 rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg active:scale-[0.99] transition-all"
        onClick={() => navigate(isLoggedIn ? '/invite' : '/login?from=' + encodeURIComponent('/invite'))}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gift size={24} />
              <h3 className="text-lg font-bold">邀请好友赚更多</h3>
            </div>
            <p className="text-sm text-white/80">二级分佣，好友赚钱你也赚</p>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                <Users size={12} />注册+50
              </span>
              <span className="bg-white/20 px-2 py-1 rounded-full">一级10%分佣</span>
              <span className="bg-white/20 px-2 py-1 rounded-full">二级5%分佣</span>
            </div>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">50</span>
          </div>
        </div>
      </div>

      <div className="mt-6 mx-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-card">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
            <BookOpen size={20} className="text-blue-500" />
          </div>
          <p className="font-bold text-dark-800 text-sm">新手任务</p>
          <p className="text-xs text-dark-400 mt-1">快速赚取首金币</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-card">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-2">
            <TrendingUp size={20} className="text-orange-500" />
          </div>
          <p className="font-bold text-dark-800 text-sm">每日榜单</p>
          <p className="text-xs text-dark-400 mt-1">看谁赚得最多</p>
        </div>
      </div>

      {toast.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-dark-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2">
            <Coins size={20} className="text-yellow-300" />
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

function getTaskPath(task: Task): string {
  const pathMap: Record<string, string> = {
    joke: '/tasks/joke',
    idiom: '/tasks/idiom',
    water: '/tasks/water',
    steps: '/tasks/steps',
    hairstyle: '/tasks/fashion/hairstyle',
    clothing: '/tasks/fashion/clothing',
  };
  return pathMap[task.type] || '/tasks';
}

function getTaskIconBg(category: string): string {
  const map: Record<string, string> = {
    content: 'bg-blue-100',
    health: 'bg-green-100',
    fashion: 'bg-pink-100',
    invite: 'bg-amber-100',
  };
  return map[category] || 'bg-gray-100';
}

function getTaskIcon(category: string) {
  const map: Record<string, any> = {
    content: <BookOpen size={22} className="text-blue-500" />,
    health: <Heart size={22} className="text-green-500" />,
    fashion: <Sparkles size={22} className="text-pink-500" />,
    invite: <Users size={22} className="text-amber-500" />,
  };
  return map[category] || <Gift size={22} className="text-gray-500" />;
}

function getCategoryBg(category: string): string {
  const map: Record<string, string> = {
    content: 'bg-blue-50 text-blue-500',
    health: 'bg-green-50 text-green-500',
    fashion: 'bg-pink-50 text-pink-500',
    invite: 'bg-amber-50 text-amber-500',
  };
  return map[category] || 'bg-gray-50 text-gray-500';
}

export default Home;
