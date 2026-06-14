import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

const recentCheckIns = [
  { name: '赵雪', time: '08:55', avatar: '赵' },
  { name: '陈浩', time: '08:58', avatar: '陈' },
  { name: '王强', time: '08:50', avatar: '王' },
  { name: '孙丽', time: '08:45', avatar: '孙' },
  { name: '吴芳', time: '08:59', avatar: '吴' },
];

export default function AttendanceCheckin() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(600);
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  const handleCheckIn = () => {
    setCheckedIn(true);
    setTimeout(() => setCheckedIn(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/attendance')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-heading font-bold text-gray-800">扫码签到</h2>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card-base p-8 text-center">
          <h3 className="font-heading font-semibold text-gray-800 mb-2">图书馆管理员 · 今日签到</h3>
          <p className="text-sm text-gray-500 mb-6">请使用手机扫描下方二维码完成签到</p>

          <div className="relative inline-block">
            <div className={`w-56 h-56 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center border-4 transition-all duration-500 ${
              checkedIn ? 'border-emerald-400 shadow-lg shadow-emerald-200' : 'border-primary/20'
            }`}>
              {checkedIn ? (
                <div className="animate-fade-in flex flex-col items-center">
                  <CheckCircle2 size={64} className="text-emerald-500" />
                  <p className="text-emerald-600 font-medium mt-2">签到成功！</p>
                </div>
              ) : (
                <div className="w-44 h-44 bg-white rounded-xl shadow-inner flex items-center justify-center">
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: 49 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-sm ${
                          Math.random() > 0.3 ? 'bg-primary' : 'bg-white'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <span className="font-mono text-lg text-gray-600">
              倒计时 {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={handleCheckIn}
            className="mt-6 btn-accent px-8 py-3 text-base"
          >
            模拟签到
          </button>
        </div>

        <div className="card-base p-5">
          <h4 className="font-heading font-semibold text-gray-800 mb-3">最近签到</h4>
          <div className="space-y-2">
            {recentCheckIns.map((c) => (
              <div key={c.name} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                  {c.avatar}
                </div>
                <span className="text-sm text-gray-700">{c.name}</span>
                <span className="ml-auto font-mono text-sm text-gray-500">{c.time}</span>
                <CheckCircle2 size={14} className="text-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
