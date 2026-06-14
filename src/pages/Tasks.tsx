import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BookOpen, Heart, Sparkles, Users, Coins, CheckCircle, Clock } from 'lucide-react';
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
    loadTasks(tab);
  }, [searchParams]);

  const loadTasks = async (tab: string) => {
    setLoading(true);
    try {
      const url = tab === 'all' ? '/tasks' : `/tasks?category=${tab}`;
      const res: any = await get(url);
      if (res.success) {
        setTasks(res.tasks);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
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

  const getStatusText = (task: Task): string => {
    if (task.userStatus === 'completed') return '已完成';
    if (task.completions && task.completions > 0) return `已完成${task.completions}/${task.dailyLimit}`;
    return '未开始';
  };

  const getStatusIcon = (task: Task) => {
    if (task.userStatus === 'completed') return <CheckCircle size={18} className="text-health-500" />;
    if (task.completions && task.completions > 0) return <Clock size={18} className="text-primary-500" />;
    return null;
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
                onClick={() => {
                  setActiveTab(tab.id);
                  navigate(`/tasks${tab.id === 'all' ? '' : `?tab=${tab.id}`}`);
                }}
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
              onClick={() => {
                if (!isLoggedIn && task.type !== 'invite') {
                  navigate('/login');
                  return;
                }
                navigate(getTaskPath(task));
              }}
              className="bg-white rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${getTaskIconBg(task.category)}`}>
                  {getTaskIcon(task.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-dark-800">{task.title}</h3>
                    <div className="flex items-center gap-1 text-primary-500 font-bold flex-shrink-0">
                      <Coins size={16} />
                      <span>{task.reward}</span>
                    </div>
                  </div>
                  <p className="text-sm text-dark-500 mt-1 line-clamp-2">{task.description}</p>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task)}
                      <span className={`text-xs font-medium ${
                        task.userStatus === 'completed' ? 'text-health-500' : 'text-dark-400'
                      }`}>
                        {getStatusText(task)}
                      </span>
                    </div>
                    <span className="text-xs text-dark-400">
                      每日上限 {task.dailyLimit} 次
                    </span>
                  </div>

                  {isLoggedIn && task.progress !== undefined && task.dailyLimit > 1 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-dark-500 mb-1">
                        <span>今日进度</span>
                        <span>{task.completions || 0}/{task.dailyLimit}</span>
                      </div>
                      <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                          style={{ width: `${((task.completions || 0) / task.dailyLimit) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
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
    content: 'bg-knowledge-100',
    health: 'bg-health-100',
    fashion: 'bg-accent-100',
    invite: 'bg-primary-100',
  };
  return map[category] || 'bg-dark-100';
}

function getTaskIcon(category: string) {
  const map: Record<string, any> = {
    content: <BookOpen size={26} className="text-knowledge-500" />,
    health: <Heart size={26} className="text-health-500" />,
    fashion: <Sparkles size={26} className="text-accent-500" />,
    invite: <Users size={26} className="text-primary-500" />,
  };
  return map[category] || <BookOpen size={26} className="text-dark-500" />;
}

export default Tasks;
