import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { getTodaySteps, doCheckin, getCheckinStatus, uploadSteps, claimStepReward, getTaskList, claimTaskReward, completeTask } from '../services/api';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useUserStore();
  const [steps, setSteps] = useState({ steps: 0, rewardCoins: 0, goal: 10000, is_claimed: 0 });
  const [checkin, setCheckin] = useState<any>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, c, t] = await Promise.all([
        getTodaySteps().catch(() => ({ steps: 0, rewardCoins: 0, goal: 10000, is_claimed: 0 })),
        getCheckinStatus().catch(() => ({})),
        getTaskList().catch(() => []),
      ]);
      setSteps(s);
      setCheckin(c);
      setTasks(t.filter((t: any) => t.type === 'checkin' || t.type === 'steps' || t.type === 'video' || t.type === 'invite'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    refreshUser();

    let step = steps.steps;
    const simSteps = () => {
      if (step < 3000) {
        step += Math.floor(Math.random() * 20 + 5);
        uploadSteps(step).then((s: any) => setSteps(s)).catch(() => {});
      }
    };
    const timer = setInterval(simSteps, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckin = async () => {
    try {
      const r = await doCheckin();
      (window as any).toast(`签到成功 +${r.rewardCoins}金币`);
      refreshUser();
      loadData();
    } catch (e: any) {
      (window as any).toast(e.message);
    }
  };

  const handleClaimSteps = async () => {
    try {
      const r: any = await claimStepReward();
      (window as any).toast(`领取成功 +${r.rewardCoins}金币`);
      refreshUser();
      loadData();
    } catch (e: any) {
      (window as any).toast(e.message);
    }
  };

  const handleTask = async (task: any) => {
    if (task.type === 'invite') {
      navigate('/invite');
      return;
    }
    if (task.type === 'video') {
      (window as any).toast('🎬 模拟观看视频中...', 3000);
      setTimeout(async () => {
        try {
          await completeTask(task.id);
          const r = await claimTaskReward(task.id);
          (window as any).toast(`奖励已发放 +${r.rewardCoins}金币`);
          refreshUser();
          loadData();
        } catch (e: any) {
          (window as any).toast(e.message);
        }
      }, 3000);
      return;
    }
  };

  const progress = Math.min(steps.steps / steps.goal * 100, 100);

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-primary via-orange-400 to-orange-500 text-white px-5 pt-10 pb-20 rounded-b-[40px] relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full"></div>
        <div className="absolute -left-10 bottom-0 w-32 h-32 bg-white/10 rounded-full"></div>

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl border-2 border-white/50">
              {user?.avatar ? <img src={user.avatar} className="w-full h-full rounded-full" /> : '🧑'}
            </div>
            <div>
              <div className="font-semibold text-lg">{user?.nickname || '新用户'}</div>
              <div className="text-white/80 text-xs">Lv.{user?.level || 1} · 走路赚钱中...</div>
            </div>
          </div>
          <button onClick={() => navigate('/profile')} className="text-white/80 text-xl">⚙️</button>
        </div>

        <div className="grid grid-cols-3 gap-4 relative z-10">
          <div onClick={() => navigate('/wallet')} className="text-center cursor-pointer active:scale-95 transition">
            <div className="text-3xl font-bold">{(user?.coins || 0).toLocaleString()}</div>
            <div className="text-xs text-white/80 mt-1">🪙 金币</div>
          </div>
          <div onClick={() => navigate('/withdrawal')} className="text-center cursor-pointer active:scale-95 transition border-x border-white/20">
            <div className="text-3xl font-bold">¥{(user?.cash_balance || 0).toFixed(2)}</div>
            <div className="text-xs text-white/80 mt-1">💵 余额</div>
          </div>
          <div onClick={() => navigate('/invite')} className="text-center cursor-pointer active:scale-95 transition">
            <div className="text-3xl font-bold">{user?.total_earned_coins ? Math.floor(user.total_earned_coins / 1000) : 0}</div>
            <div className="text-xs text-white/80 mt-1">📊 累计赚(元)</div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-14 relative z-20">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold text-lg">今日步数</div>
              <div className="text-xs text-gray-400">接入系统健康数据</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{steps.steps?.toLocaleString()} <span className="text-sm text-gray-400 font-normal">步</span></div>
              <div className="text-xs text-gray-400">目标 {steps.goal?.toLocaleString()} 步</div>
            </div>
          </div>

          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full bg-white/30 animate-pulse"></div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              预计可兑换 <span className="text-primary font-bold">{steps.rewardCoins}</span> 金币
            </div>
            <button
              onClick={handleClaimSteps}
              disabled={Boolean(steps.is_claimed || steps.rewardCoins <= 0)}
              className={`px-5 py-2 rounded-full text-sm font-semibold ${steps.is_claimed || steps.rewardCoins <= 0 ? 'bg-gray-100 text-gray-400' : 'bg-primary text-white active:scale-95'} transition-transform`}
            >
              {steps.is_claimed ? '已领取' : steps.rewardCoins > 0 ? '领取金币' : '加油走路'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={handleCheckin} disabled={checkin.hasCheckedIn} className={`card p-4 text-left active:scale-95 transition ${checkin.hasCheckedIn ? 'opacity-60' : ''}`}>
            <div className="text-3xl mb-2">📅</div>
            <div className="font-semibold mb-1">每日签到</div>
            <div className="text-xs text-gray-500">
              {checkin.hasCheckedIn ? `已连续${checkin.continuousDays}天` : `连续签到 +${checkin.todayReward || 20}金币`}
            </div>
            <div className="mt-3 text-primary text-sm font-semibold">
              {checkin.hasCheckedIn ? '✓ 今日已签' : '立即签到 →'}
            </div>
          </button>

          <button onClick={() => navigate('/tasks')} className="card p-4 text-left active:scale-95 transition">
            <div className="text-3xl mb-2">🎯</div>
            <div className="font-semibold mb-1">做任务赚钱</div>
            <div className="text-xs text-gray-500">限时活动 · 节日专题</div>
            <div className="mt-3 text-primary text-sm font-semibold">
              {tasks.filter(t => !t.completed_today).length} 个任务待完成 →
            </div>
          </button>
        </div>

        <h3 className="font-semibold mt-6 mb-3 flex items-center gap-2">
          <span>🔥</span> 今日热门
        </h3>

        <div className="space-y-3">
          {tasks.slice(0, 4).map((task: any) => (
            <div key={task.id} className="card p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center text-2xl flex-shrink-0">
                {task.type === 'video' ? '🎬' : task.type === 'invite' ? '🤝' : task.type === 'checkin' ? '📅' : '🎁'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{task.name}</div>
                <div className="text-xs text-gray-500 truncate">{task.description}</div>
                <div className="text-sm text-primary font-bold mt-1">
                  +{task.type === 'steps' ? steps.rewardCoins : task.reward_coins} 🪙
                </div>
              </div>
              <button
                onClick={() => handleTask(task)}
                disabled={task.completed_today}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold ${task.completed_today ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-r from-primary to-orange-500 text-white active:scale-95'} transition-transform flex-shrink-0`}
              >
                {task.type === 'invite' ? '去邀请' : task.completed_today ? '已完成' : '去完成'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 card p-5 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">🎁 新人专享</div>
              <div className="font-bold text-lg">首提秒到账</div>
              <div className="text-xs text-gray-500 mt-1">满1元即可提现至微信零钱</div>
            </div>
            <button onClick={() => navigate('/withdrawal')} className="px-5 py-2.5 rounded-full bg-accent text-white font-semibold active:scale-95 transition-transform">
              立即提现
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
