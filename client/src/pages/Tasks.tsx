import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { getTaskList, completeTask, claimTaskReward } from '../services/api';

const typeIcons: Record<string, string> = {
  checkin: '📅',
  steps: '👟',
  video: '🎬',
  invite: '🤝',
  custom: '🎁',
  activity: '🎉',
  festival: '🎊',
};

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useUserStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const t = await getTaskList();
      setTasks(t || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTask = async (task: any) => {
    if (task.type === 'invite') {
      navigate('/invite');
      return;
    }

    if (task.completed_today && !task.claimed) {
      try {
        const r: any = await claimTaskReward(task.id);
        (window as any).toast(`领取成功 +${r.rewardCoins}金币`);
        refreshUser();
        loadData();
        return;
      } catch (e: any) {
        (window as any).toast(e.message);
        return;
      }
    }

    if (task.completed_today && task.claimed) {
      (window as any).toast('今日已完成');
      return;
    }

    if (task.type === 'video') {
      (window as any).toast('🎬 模拟观看视频...', 3000);
      setTimeout(async () => {
        try {
          await completeTask(task.id);
          const r: any = await claimTaskReward(task.id);
          (window as any).toast(`完成! +${r.rewardCoins}金币`);
          refreshUser();
          loadData();
        } catch (e: any) {
          (window as any).toast(e.message);
        }
      }, 3000);
      return;
    }

    try {
      await completeTask(task.id);
      const r: any = await claimTaskReward(task.id);
      (window as any).toast(`完成! +${r.rewardCoins}金币`);
      refreshUser();
      loadData();
    } catch (e: any) {
      (window as any).toast(e.message);
    }
  };

  const filteredTasks = tasks.filter((t: any) => {
    if (filter === 'all') return true;
    if (filter === 'todo') return !t.completed_today;
    if (filter === 'done') return t.completed_today;
    return true;
  });

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'todo', label: '待完成' },
    { key: 'done', label: '已完成' },
  ];

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 pt-12 pb-8 rounded-b-[32px]">
        <h1 className="text-2xl font-bold mb-2">🎯 任务中心</h1>
        <p className="text-white/80 text-sm">完成任务获取金币，金币换现金</p>

        <div className="flex gap-2 mt-6">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${filter === f.key ? 'bg-white text-indigo-600' : 'bg-white/20 text-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 -mt-4">
        {tasks.some(t => !t.completed_today && t.is_hot) && (
          <>
            <h3 className="font-semibold mb-3 flex items-center gap-2 mt-4">
              <span className="px-2 py-0.5 bg-red-100 text-red-500 rounded text-xs font-bold">HOT</span>
              限时活动
            </h3>
            <div className="space-y-3 mb-6">
              {tasks.filter(t => !t.completed_today && t.is_hot).map((task: any) => (
                <TaskCard key={task.id} task={task} onClick={() => handleTask(task)} />
              ))}
            </div>
          </>
        )}

        <h3 className="font-semibold mb-3">所有任务 ({filteredTasks.length})</h3>
        <div className="space-y-3">
          {filteredTasks.map((task: any) => (
            <TaskCard key={task.id} task={task} onClick={() => handleTask(task)} />
          ))}
        </div>
      </div>
    </div>
  );
};

const TaskCard: React.FC<{ task: any; onClick: () => void }> = ({ task, onClick }) => {
  return (
    <div className="card p-4 flex items-center gap-4 active:scale-[0.98] transition-transform" onClick={onClick}>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${task.completed_today ? 'bg-gray-100' : 'bg-gradient-to-br from-orange-100 to-yellow-100'}`}>
        {typeIcons[task.type] || '🎁'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-semibold truncate">{task.name}</div>
          {task.daily_limit > 1 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">每日{task.daily_limit}次</span>
          )}
        </div>
        <div className="text-xs text-gray-500 truncate mt-0.5">{task.description}</div>
        <div className="flex items-center gap-3 mt-1.5">
          {task.reward_coins > 0 && <div className="text-sm text-primary font-bold">+{task.reward_coins} 🪙</div>}
          {task.reward_cash > 0 && <div className="text-sm text-accent font-bold">+¥{task.reward_cash}</div>}
        </div>
      </div>
      <button
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-transform flex-shrink-0 ${task.completed_today && task.claimed ? 'bg-gray-100 text-gray-400' : task.completed_today ? 'bg-primary text-white animate-pulse' : 'bg-gradient-to-r from-primary to-orange-500 text-white active:scale-95'}`}
      >
        {task.completed_today && task.claimed ? '已完成' : task.completed_today ? '领取' : task.type === 'invite' ? '去邀请' : '去完成'}
      </button>
    </div>
  );
};

export default Tasks;
