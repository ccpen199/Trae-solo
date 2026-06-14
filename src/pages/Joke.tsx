import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smile, ThumbsUp, Share2, Coins } from 'lucide-react';
import { get, post } from '../utils/request';
import { useUserStore } from '../stores/userStore';

interface Joke {
  id: string;
  content: string;
}

const Joke = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useUserStore();
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [readCount, setReadCount] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    loadJokes();
  }, [isLoggedIn]);

  const loadJokes = async () => {
    try {
      const res: any = await get('/content/jokes?pageSize=10');
      if (res.success) {
        setJokes(res.jokes);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleNext = async () => {
    if (currentIndex < jokes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      const newCount = readCount + 1;
      setReadCount(newCount);

      if (newCount % 1 === 0) {
        try {
          const res: any = await post(`/content/jokes/${jokes[currentIndex]?.id}/read`);
          if (res.success && res.reward) {
            setRewardAmount(res.reward);
            setShowReward(true);
            setTimeout(() => setShowReward(false), 1500);
          }
        } catch (error) {
          console.error(error);
        }
      }
    } else {
      loadJokes();
      setCurrentIndex(0);
    }
  };

  const handleLike = () => {
    handleNext();
  };

  const currentJoke = jokes[currentIndex];

  return (
    <div className="min-h-screen bg-dark-50">
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center h-14 px-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 flex items-center justify-center">
            <ArrowLeft size={24} className="text-dark-700" />
          </button>
          <h1 className="flex-1 text-center font-bold text-lg text-dark-800">开心一刻</h1>
          <div className="w-10 h-10 flex items-center justify-center text-primary-500 font-bold text-sm">
            {readCount}/5
          </div>
        </div>
      </div>

      <div className="p-4">
        {currentJoke ? (
          <div 
            className="bg-white rounded-2xl shadow-card p-6 min-h-[300px] flex flex-col justify-center animate-fade-in cursor-pointer"
            onClick={handleNext}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Smile size={22} className="text-primary-500" />
              </div>
              <span className="text-sm text-dark-500">第 {currentIndex + 1} 条</span>
            </div>
            <p className="text-lg text-dark-800 leading-relaxed">
              {currentJoke.content}
            </p>
            <div className="mt-6 pt-4 border-t border-dark-100">
              <p className="text-sm text-dark-400 text-center">点击屏幕继续看下一个</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-card p-6 min-h-[300px] flex items-center justify-center">
            <p className="text-dark-400">加载中...</p>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-8">
          <button 
            onClick={handleLike}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-full bg-health-100 flex items-center justify-center hover:scale-110 transition-transform">
              <ThumbsUp size={26} className="text-health-500" />
            </div>
            <span className="text-sm text-dark-500">好笑</span>
          </button>
          <button 
            onClick={handleNext}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-full bg-knowledge-100 flex items-center justify-center hover:scale-110 transition-transform">
              <Share2 size={26} className="text-knowledge-500" />
            </div>
            <span className="text-sm text-dark-500">分享</span>
          </button>
        </div>

        <div className="mt-6 bg-white rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-dark-600">今日进度</span>
            <span className="text-sm text-primary-500 font-medium">{readCount}/5</span>
          </div>
          <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((readCount / 5) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-dark-400 mt-2">每阅读1个笑话可获得 10 金币奖励</p>
        </div>
      </div>

      {showReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 text-center animate-scale-in">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-gold rounded-full flex items-center justify-center animate-bounce-slow">
              <Coins size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-dark-800 mb-2">+{rewardAmount}</h3>
            <p className="text-dark-500">金币已到账</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Joke;
