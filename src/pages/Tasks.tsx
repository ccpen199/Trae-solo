import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BookOpen, Heart, Sparkles, Users, Coins, CheckCircle, Clock, ChevronRight } from 'lucide-react';
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

const Tasks = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useUserStore();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'all', label: '全部' },
    { id: 'content', label: '内容消费', icon: BookOpen },
    { id: 'health', label: '健康打卡', icon: Heart },
    { id: 'fashion', label: '穿搭测评', icon: Sparkles },
    { id: 'invite', label: '邀请任务', icon: Users },
  ];

  useEffect(() => {
    const tab = searchParams.get('tab') || 'all';
    setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    loadTasks(activeTab);
  }, [activeTab, isLoggedIn]);

  const loadTasks = async (tab: string) => {
    setLoading(true);
    try {
      const url = tab === 'all' ? '/tasks' : `/tasks?category=${tab}`;
      const res: any = await get(url);
      if (res.success) {
        setTasks(res.tasks || []);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error(error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/tasks${tabId === 'all' ? '' : `?tab=${tabId}`}`, { replace: true });
  };

  const getTaskPath = (task: Task): string => {
    const pathMap: Record<string, string> = {
      joke: '/tasks/joke',
      idiom: '/tasks/idiom',
      water: '/tasks/water',
      steps: '/tasks/steps',
      hairstyle: '/tasks/fashion/hairstyle',
      clothing: '/tasks/fashion/clothing',
      invite: '/invite',
    };
    return pathMap[task.type] || '/tasks';
  };

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

  const getStatusColor = (task: Task) => {
    if (!isLoggedIn) return 'text-primary-500';
    if (task.userStatus === 'completed') return 'text-green-500';
    if (task.completions && task.completions > 0) return 'text-primary-500';
    return 'text-dark-400';
  };

  const handleTaskClick = (task: Task) => {
    if (!isLoggedIn) {
      navigate('/login?from=' + encodeURIComponent(getTaskPath(task)));
      return;
    }
    navigate(getTaskPath(task));
  };

  return (
    <div className="pb-20 bg-dark-50 min-h-screen">
      <div className="sticky top-0 bg-white z-30 shadow-sm">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-dark-800">任务中心</h1>
        </div>
        <div className="flex overflow-x-auto px-2 pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all mx-1 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-button'
                    : 'bg-dark-100 text-dark-600'
                }`}
              >
                {Icon && <Icon size={16} />}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-dark-400">加载中...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-10 text-dark-400">暂无任务</div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className="bg-white rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getTaskIconBg(task.category)}`}>
                  {getTaskIcon(task.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-dark-800">{task.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryBg(task.category)}`}>
                      {getCategoryLabel(task.category)}
                    </span>
                  </div>
                  <p className="text-sm text-dark-500 line-clamp-1">{task.description}</p>

                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-primary-500 font-bold text-sm">
                      <Coins size={14} />
                      +{task.reward}金币
                    </span>
                    <span className="flex items-center gap-1 text-dark-400 text-xs">
                      <Clock size={12} />
                      {getConditionText(task)}
                    </span>
                    <span className="text-xs text-dark-400">
                      每日{task.dailyLimit}次
                    </span>
                  </div>

                  {isLoggedIn && task.progress !== undefined && task.maxProgress > 1 && task.userStatus !== 'completed' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-dark-500 mb-1">
                        <span>进度</span>
                        <span>{task.progress}/{task.maxProgress}</span>
                      </div>
                      <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                          style={{ width: `${((task.progress || 0) / task.maxProgress) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {isLoggedIn && task.userStatus === 'completed' && (
                        <CheckCircle size={14} className="text-green-500" />
                      )}
                      <span className={`text-xs font-medium ${getStatusColor(task)}`}>
                        {getStatusText(task)}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-dark-300" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

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
  return map[category] || <BookOpen size={22} className="text-gray-500" />;
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

export default Tasks;
