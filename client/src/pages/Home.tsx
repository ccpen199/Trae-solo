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
  const [showGuide, setShowGuide] = useState(false);

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

    const isFirstTime = !localStorage.getItem('has_seen_guide');
    if (isFirstTime) {
      setShowGuide(true);
      localStorage.setItem('has_seen_guide', '1');
    }

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

  const getLevelBadge = (level: number) => {
    if (level >= 10) return { label: '王者', color: 'from-purple-500 to-pink-500', icon: '👑' };
    if (level >= 5) return { label: '黄金', color: 'from-yellow-500 to-orange-500', icon: '🏆' };
    if (level >= 3) return { label: '白银', color: 'from-gray-400 to-gray-500', icon: '🥈' };
    return { label: '青铜', color: 'from-orange-400 to-orange-600', icon: '🥉' };
  };

  const progress = Math.min(steps.steps / steps.goal * 100, 100);
  const levelBadge = getLevelBadge(user?.level || 1);
  const pendingTasks = tasks.filter((t: any) => !t.completed_today).length;

  const quickEntries = [
    {
      icon: '📅',
      label: '每日签到',
      desc: checkin.hasCheckedIn ? '已签' : '+20金币',
      action: handleCheckin,
      disabled: checkin.hasCheckedIn,
      color: 'from-blue-400 to-blue-600',
      target: null,
    },
    {
      icon: '👣',
      label: '步数赚钱',
      desc: `+${steps.rewardCoins || 0}金币`,
      action: () => navigate('/tasks'),
      disabled: false,
      color: 'from-green-400 to-green-600',
      target: '/tasks',
    },
    {
      icon: '🎬',
      label: '看视频',
      desc: '+50金币/次',
      action: () => navigate('/tasks'),
      disabled: false,
      color: 'from-purple-400 to-purple-600',
      target: '/tasks',
    },
    {
      icon: '🤝',
      label: '邀请好友',
      desc: '+500金币',
      action: () => navigate('/invite'),
      disabled: false,
      color: 'from-pink-400 to-pink-600',
      target: '/invite',
    },
  ];

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-primary via-orange-400 to-orange-500 text-white px-5 pt-10 pb-24 rounded-b-[40px] relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full"></div>
        <div className="absolute -left-10 bottom-0 w-32 h-32 bg-white/10 rounded-full"></div>

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl border-2 border-white/50 overflow-hidden">
                {user?.avatar ? <img src={user.avatar} className="w-full h-full rounded-full" alt="avatar" /> : '🧑'}
              </div>
              <div className={`absolute -bottom-1 -right-1 bg-gradient-to-r ${levelBadge.color} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg flex items-center gap-0.5`}>
                <span className="text-[9px]">{levelBadge.icon}</span>
                {levelBadge.label}
              </div>
            </div>
            <div>
              <div className="font-semibold text-lg flex items-center gap-2">
                {user?.nickname || '新用户'}
                {user?.is_new && (
                  <span className="text-[10px] bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-bold">
                    新人
                  </span>
                )}
              </div>
              <div className="text-white/80 text-xs flex items-center gap-1.5">
                <span>Lv.{user?.level || 1}</span>
                <span className="text-white/40">·</span>
                <span>{pendingTasks}个任务待完成</span>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/profile')} className="text-white/80 text-xl active:scale-95 transition">
            ⚙️
          </button>
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

      <div className="px-4 -mt-16 relative z-20 space-y-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold text-lg">今日步数</div>
              <div className="text-xs text-gray-400">已接入系统健康数据 · 实时同步</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {steps.steps?.toLocaleString()} <span className="text-sm text-gray-400 font-normal">步</span>
              </div>
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
              className={`px-5 py-2 rounded-full text-sm font-semibold ${
                steps.is_claimed || steps.rewardCoins <= 0
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-gradient-to-r from-primary to-orange-500 text-white active:scale-95 shadow-lg shadow-orange-200'
              } transition-transform`}
            >
              {steps.is_claimed ? '已领取' : steps.rewardCoins > 0 ? '领取金币' : '加油走路'}
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>⚡</span> 四大赚钱入口
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {quickEntries.map((entry, idx) => (
              <button
                key={idx}
                onClick={entry.action}
                disabled={entry.disabled}
                className={`card p-3 text-center active:scale-95 transition ${entry.disabled ? 'opacity-50' : ''}`}
              >
                <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${entry.color} flex items-center justify-center text-2xl mb-2 shadow-lg`}>
                  {entry.icon}
                </div>
                <div className="text-sm font-semibold text-gray-800">{entry.label}</div>
                <div className={`text-xs mt-0.5 ${entry.disabled ? 'text-gray-400' : 'text-primary'}`}>
                  {entry.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCheckin}
            disabled={checkin.hasCheckedIn}
            className={`card p-4 text-left active:scale-95 transition ${checkin.hasCheckedIn ? 'opacity-60' : ''}`}
          >
            <div className="text-3xl mb-2">📅</div>
            <div className="font-semibold mb-1">每日签到</div>
            <div className="text-xs text-gray-500">
              {checkin.hasCheckedIn
                ? `已连续${checkin.continuousDays}天`
                : `连续签到 +${checkin.todayReward || 20}金币`}
            </div>
            <div className="mt-3 text-primary text-sm font-semibold flex items-center gap-1">
              {checkin.hasCheckedIn ? (
                <>✓ 今日已签</>
              ) : (
                <>
                  立即签到
                  <span className="animate-pulse">→</span>
                </>
              )}
            </div>
          </button>

          <button onClick={() => navigate('/tasks')} className="card p-4 text-left active:scale-95 transition">
            <div className="text-3xl mb-2">🎯</div>
            <div className="font-semibold mb-1">任务中心</div>
            <div className="text-xs text-gray-500">限时活动 · 节日专题</div>
            <div className="mt-3 text-primary text-sm font-semibold flex items-center gap-1">
              {pendingTasks > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {pendingTasks}
                </span>
              )}
              任务中心
              <span className="animate-pulse">→</span>
            </div>
          </button>
        </div>

        <h3 className="font-semibold mt-2 mb-3 flex items-center gap-2">
          <span>🔥</span> 今日热门任务
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
                className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                  task.completed_today
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-gradient-to-r from-primary to-orange-500 text-white active:scale-95 shadow-md shadow-orange-200'
                } transition-transform flex-shrink-0`}
              >
                {task.type === 'invite' ? '去邀请' : task.completed_today ? '已完成' : '去完成'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 card p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <span className="bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  新人专享
                </span>
                <span>T+0 秒到账</span>
              </div>
              <div className="font-bold text-lg">满1元即可提现</div>
              <div className="text-xs text-gray-500 mt-1">金币兑换 · 微信零钱 · 免手续费</div>
            </div>
            <button
              onClick={() => navigate('/withdrawal')}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold active:scale-95 transition-transform shadow-lg shadow-green-200"
            >
              立即提现
            </button>
          </div>
        </div>

        <div className="mt-4 card p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🤝</div>
            <div className="flex-1">
              <div className="font-bold text-gray-800">邀请好友最高赚888元</div>
              <div className="text-xs text-gray-500 mt-0.5">
                三级返佣 · 好友做任务你也赚 · 躺赚模式
              </div>
            </div>
            <button
              onClick={() => navigate('/invite')}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold active:scale-95 transition-transform"
            >
              去邀请
            </button>
          </div>
        </div>
      </div>

      {showGuide && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] px-8" onClick={() => setShowGuide(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 text-white text-center">
              <div className="text-6xl mb-3">🎉</div>
              <div className="text-2xl font-bold">欢迎来到赚赚！</div>
              <div className="text-white/80 text-sm mt-2">4 步开启赚钱之旅</div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { icon: '📅', title: '每日签到', desc: '每天签到领金币，连续签到翻倍' },
                { icon: '👣', title: '走路赚钱', desc: '开启步数兑换，走得多赚得多' },
                { icon: '🎬', title: '看视频赚钱', desc: '每天10次，每次50金币' },
                { icon: '💰', title: '金币提现', desc: '满1元即可提现至微信零钱' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-full active:scale-98 transition-transform"
              >
                开始赚钱！
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
