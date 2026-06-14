import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, Plus, Coins, CheckCircle } from 'lucide-react';
import { get, post } from '../utils/request';
import { useUserStore } from '../stores/userStore';

const Water = () => {
  const navigate = useNavigate();
  const { isLoggedIn, fetchProfile } = useUserStore();
  const [totalAmount, setTotalAmount] = useState(0);
  const [goal] = useState(2000);
  const [cupSize] = useState(250);
  const [completed, setCompleted] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login?from=' + encodeURIComponent('/tasks/water'));
      return;
    }
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      const res: any = await get('/health/water/today');
      if (res.success) {
        setTotalAmount(res.totalAmount);
        setCompleted(res.completed);
        setRecords(res.records);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddWater = async (amount: number) => {
    try {
      const res: any = await post('/health/water/checkin', { amount });
      if (res.success) {
        setTotalAmount(res.totalAmount);
        if (res.completed && !completed) {
          setCompleted(true);
          setShowReward(true);
          fetchProfile();
          setTimeout(() => setShowReward(false), 2000);
        }
        loadData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const progress = Math.min((totalAmount / goal) * 100, 100);
  const cups = Math.floor(totalAmount / cupSize);

  return (
    <div className="min-h-screen bg-dark-50">
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center h-14 px-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 flex items-center justify-center">
            <ArrowLeft size={24} className="text-dark-700" />
          </button>
          <h1 className="flex-1 text-center font-bold text-lg text-dark-800">饮水打卡</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-gradient-health rounded-2xl p-6 text-white shadow-card">
          <div className="text-center mb-6">
            <p className="text-white/80 mb-2">今日饮水量</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold">{totalAmount}</span>
              <span className="text-lg">ml</span>
            </div>
            <p className="text-white/70 mt-2">目标 {goal}ml</p>
          </div>

          <div className="relative h-8 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
              {progress.toFixed(0)}%
            </div>
          </div>

          <div className="flex justify-between mt-4 text-sm text-white/80">
            <span>已喝 {cups} 杯</span>
            <span>还需 {Math.max(0, goal - totalAmount)}ml</span>
          </div>
        </div>

        {completed && (
          <div className="mt-4 bg-health-50 border border-health-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-health-500 flex items-center justify-center">
              <CheckCircle size={22} className="text-white" />
            </div>
            <div>
              <p className="font-medium text-health-700">今日目标已达成！</p>
              <p className="text-sm text-health-500">已获得 5 金币奖励</p>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-bold text-dark-800 mb-4">快速打卡</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { amount: 100, label: '小杯', icon: '💧' },
              { amount: 250, label: '中杯', icon: '🥛' },
              { amount: 500, label: '大杯', icon: '🍶' },
            ].map((item) => (
              <button
                key={item.amount}
                onClick={() => handleAddWater(item.amount)}
                className="bg-white rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all flex flex-col items-center gap-2 group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <span className="font-medium text-dark-700">{item.amount}ml</span>
                <span className="text-xs text-dark-400">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => handleAddWater(cupSize)}
            className="w-full py-4 bg-gradient-health text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Plus size={22} />
            <span>喝一杯水 ({cupSize}ml)</span>
          </button>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-card p-4">
          <h3 className="font-bold text-dark-800 mb-4 flex items-center gap-2">
            <Droplets size={18} className="text-health-500" />
            今日饮水记录
          </h3>
          {records.length === 0 ? (
            <p className="text-center text-dark-400 py-6">暂无记录，快来喝第一杯吧</p>
          ) : (
            <div className="space-y-3">
              {records.map((record, index) => (
                <div key={record.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-health-100 flex items-center justify-center">
                    <Droplets size={16} className="text-health-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-dark-700">第 {records.length - index} 杯</p>
                    <p className="text-xs text-dark-400">
                      {new Date(record.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-health-600 font-medium">+{record.amount}ml</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-primary-50 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <Coins size={24} className="text-primary-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-dark-800">完成打卡奖励</p>
            <p className="text-sm text-dark-500">每日饮水达标可获得 5 金币</p>
          </div>
          <span className="text-primary-500 font-bold text-xl">+5</span>
        </div>
      </div>

      {showReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 text-center animate-scale-in">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-gold rounded-full flex items-center justify-center animate-bounce-slow">
              <Coins size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-dark-800 mb-2">+5</h3>
            <p className="text-dark-500">饮水打卡奖励</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Water;
