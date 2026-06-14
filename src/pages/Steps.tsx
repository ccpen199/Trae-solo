import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Footprints, RefreshCw, Coins, TrendingUp } from 'lucide-react';
import { get, post } from '../utils/request';
import { useUserStore } from '../stores/userStore';

const Steps = () => {
  const navigate = useNavigate();
  const { isLoggedIn, fetchProfile } = useUserStore();
  const [steps, setSteps] = useState(0);
  const [goal] = useState(10000);
  const [completed, setCompleted] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      const res: any = await get('/health/steps/today');
      if (res.success) {
        setSteps(res.steps);
        setCompleted(res.completed);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const randomSteps = steps + Math.floor(Math.random() * 3000) + 1000;
      const res: any = await post('/health/steps/sync', { steps: randomSteps });
      if (res.success) {
        setSteps(res.steps);
        if (res.completed && !completed) {
          setCompleted(true);
          setShowReward(true);
          fetchProfile();
          setTimeout(() => setShowReward(false), 2000);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setSyncing(false), 1000);
    }
  };

  const progress = Math.min((steps / goal) * 100, 100);
  const calories = Math.floor(steps * 0.04);
  const distance = (steps * 0.0007).toFixed(2);

  return (
    <div className="min-h-screen bg-dark-50">
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center h-14 px-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 flex items-center justify-center">
            <ArrowLeft size={24} className="text-dark-700" />
          </button>
          <h1 className="flex-1 text-center font-bold text-lg text-dark-800">步数挑战</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-card">
          <div className="text-center">
            <p className="text-white/80 mb-2">今日步数</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-6xl font-bold">{steps.toLocaleString()}</span>
              <span className="text-lg">步</span>
            </div>
            <p className="text-white/70 mt-2">目标 {goal.toLocaleString()} 步</p>
          </div>

          <div className="mt-6 relative">
            <svg className="w-full h-4" viewBox="0 0 200 20">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffeb3b" />
                  <stop offset="100%" stopColor="#ff9800" />
                </linearGradient>
              </defs>
              <rect x="0" y="5" width="200" height="10" rx="5" fill="rgba(255,255,255,0.2)" />
              <rect 
                x="0" y="5" 
                width={progress * 2} 
                height="10" 
                rx="5" 
                fill="url(#progressGradient)"
                style={{ transition: 'width 0.7s ease-out' }}
              />
            </svg>
            <div className="flex justify-between mt-2 text-sm text-white/80">
              <span>{progress.toFixed(0)}%</span>
              <span>还差 {Math.max(0, goal - steps).toLocaleString()} 步</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-card text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-orange-100 flex items-center justify-center">
              <Footprints size={20} className="text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-dark-800">{steps}</p>
            <p className="text-xs text-dark-500 mt-1">步数</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-card text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-lg">🔥</span>
            </div>
            <p className="text-2xl font-bold text-dark-800">{calories}</p>
            <p className="text-xs text-dark-500 mt-1">卡路里</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-card text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-dark-800">{distance}</p>
            <p className="text-xs text-dark-500 mt-1">公里</p>
          </div>
        </div>

        {completed && (
          <div className="mt-4 bg-health-50 border border-health-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-health-500 flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
            <div>
              <p className="font-bold text-health-700">恭喜！步数目标已达成</p>
              <p className="text-sm text-health-500">已获得 15 金币奖励</p>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full py-4 bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={22} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? '同步中...' : '同步步数'}</span>
          </button>
          <p className="text-center text-xs text-dark-400 mt-2">点击同步模拟步数数据</p>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-card p-5">
          <h3 className="font-bold text-dark-800 mb-4">活动建议</h3>
          <div className="space-y-3">
            {[
              { time: '早间', desc: '晨跑或快走 30 分钟', steps: '约 3000 步' },
              { time: '午间', desc: '饭后散步 15 分钟', steps: '约 1500 步' },
              { time: '晚间', desc: '夜跑或逛街', steps: '约 4000 步' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 py-2 border-b border-dark-100 last:border-0">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-500">
                  {item.time}
                </div>
                <div className="flex-1">
                  <p className="text-dark-700">{item.desc}</p>
                  <p className="text-xs text-dark-400">{item.steps}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-primary-50 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <Coins size={24} className="text-primary-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-dark-800">步数达标奖励</p>
            <p className="text-sm text-dark-500">每日步数达到 10000 步</p>
          </div>
          <span className="text-primary-500 font-bold text-xl">+15</span>
        </div>
      </div>

      {showReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 text-center animate-scale-in">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-gold rounded-full flex items-center justify-center animate-bounce-slow">
              <Coins size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-dark-800 mb-2">+15</h3>
            <p className="text-dark-500">步数达标奖励</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Steps;
