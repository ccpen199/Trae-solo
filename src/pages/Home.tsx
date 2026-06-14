import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Flame, Gift, BookOpen, Heart, Sparkles, Users, TrendingUp } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { get } from '../utils/request';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  reward: number;
  progress?: number;
  completions?: number;
  userStatus?: string;
  dailyLimit: number;
}

const Home = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, fetchProfile } = useUserStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayEarnings, setTodayEarnings] = useState(0);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    } else {
      const userId = localStorage.getItem('userId');
      if (userId) {
        fetchProfile().then(() => loadData());
      }
    }
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      const taskRes: any = await get('/tasks?category=content');
      if (taskRes.success) {
        setTasks(taskRes.tasks.slice(0, 4));
      }
      const walletRes: any = await get('/wallet/statistics');
      if (walletRes.success) {
        setTodayEarnings(walletRes.statistics.todayIncome);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const categories = [
    { icon: BookOpen, label: '内容消费', color: 'from-knowledge-400 to-knowledge-600', path: '/tasks?tab=content' },
    { icon: Heart, label: '健康打卡', color: 'from-health-400 to-health-600', path: '/tasks?tab=health' },
    { icon: Sparkles, label: '穿搭测评', color: 'from-accent-400 to-accent-600', path: '/tasks?tab=fashion' },
    { icon: Users, label: '邀请赚钱', color: 'from-primary-400 to-primary-600', path: '/invite' },
  ];

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
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center cursor-pointer"
              onClick={() => navigate(isLoggedIn ? '/profile' : '/login')}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <Coins size={20} className="text-white" />
              )}
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
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
            </div>
            {isLoggedIn && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">等级 Lv.{user?.level || 1}</span>
                  <span className="text-white/60">
                    经验值 {user?.exp || 0}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((user?.exp || 0) % 100), 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-2xl shadow-card p-4 grid grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.label}
                onClick={() => navigate(cat.path)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon size={26} className="text-white" />
                </div>
                <span className="text-sm font-medium text-dark-700">{cat.label}</span>
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
            className="text-sm text-primary-500 font-medium"
          >
            更多 →
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => navigate(getTaskPath(task))}
              className="bg-white rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all cursor-pointer flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTaskIconBg(task.category)}`}>
                {getTaskIcon(task.category)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-dark-800 truncate">{task.title}</h3>
                <p className="text-sm text-dark-500 mt-1 line-clamp-1">{task.description}</p>
                {task.progress !== undefined && task.progress > 0 && (
                  <div className="mt-2 h-1.5 bg-dark-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${(task.progress / (task.dailyLimit || 1)) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-primary-500 font-bold">
                  <Coins size={16} />
                  <span>{task.reward}</span>
                </div>
                <span className="text-xs text-dark-400 mt-1 block">金币</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div 
        className="mt-6 mx-4 bg-gradient-to-r from-accent-500 to-primary-500 rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => navigate('/invite')}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gift size={24} />
              <h3 className="text-lg font-bold">邀请好友赚更多</h3>
            </div>
            <p className="text-sm text-white/80">二级分佣，好友赚钱你也赚</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">50</span>
          </div>
        </div>
      </div>
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
    content: 'bg-knowledge-100 text-knowledge-500',
    health: 'bg-health-100 text-health-500',
    fashion: 'bg-accent-100 text-accent-500',
    invite: 'bg-primary-100 text-primary-500',
  };
  return map[category] || 'bg-dark-100 text-dark-500';
}

function getTaskIcon(category: string) {
  const map: Record<string, any> = {
    content: <BookOpen size={24} />,
    health: <Heart size={24} />,
    fashion: <Sparkles size={24} />,
    invite: <Users size={24} />,
  };
  return map[category] || <Gift size={24} />;
}

export default Home;
