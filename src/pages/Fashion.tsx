import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Coins, ChevronRight } from 'lucide-react';
import { get } from '../utils/request';
import { useUserStore } from '../stores/userStore';

interface Quiz {
  id: string;
  title: string;
  type: string;
  description: string;
  reward: number;
}

const Fashion = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useUserStore();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login?from=' + encodeURIComponent('/tasks/fashion'));
      return;
    }
    loadQuizzes();
  }, [isLoggedIn]);

  const loadQuizzes = async () => {
    try {
      const res: any = await get('/fashion/quizzes');
      if (res.success) {
        setQuizzes(res.quizzes);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const quizList = [
    {
      id: 'quiz-hairstyle',
      title: '发型风格测评',
      type: 'hairstyle',
      description: '发现最适合你的发型',
      reward: 30,
      gradient: 'from-pink-400 to-purple-500',
      emoji: '💇‍♀️',
    },
    {
      id: 'quiz-clothing',
      title: '服饰搭配测评',
      type: 'clothing',
      description: '找到你的穿搭风格',
      reward: 30,
      gradient: 'from-orange-400 to-pink-500',
      emoji: '👗',
    },
  ];

  const getQuizPath = (type: string) => {
    return `/tasks/fashion/${type}`;
  };

  return (
    <div className="min-h-screen bg-dark-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center h-14 px-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 flex items-center justify-center">
            <ArrowLeft size={24} className="text-dark-700" />
          </button>
          <h1 className="flex-1 text-center font-bold text-lg text-dark-800">穿搭测评</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-gradient-to-r from-accent-400 to-pink-500 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles size={28} />
            <h2 className="text-xl font-bold">穿搭变美计划</h2>
          </div>
          <p className="text-white/80 text-sm">
            完成测评，发现专属于你的风格指南</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">专业测评</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">风格分析</span>
          </div>
        </div>

        <h3 className="font-bold text-dark-800 mb-4">精选测评</h3>

        <div className="space-y-4">
          {quizList.map((quiz) => (
            <div
              key={quiz.id}
              onClick={() => navigate(getQuizPath(quiz.type))}
              className="bg-white rounded-2xl shadow-card overflow-hidden cursor-pointer hover:shadow-card-hover transition-all"
            >
              <div className={`bg-gradient-to-r ${quiz.gradient} p-6 text-white relative overflow-hidden`}>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-30">
                  {quiz.emoji}
                </div>
                <div className="relative z-10">
                  <h4 className="text-lg font-bold mb-1">{quiz.title}</h4>
                  <p className="text-white/80 text-sm">{quiz.description}</p>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Coins size={16} className="text-primary-500" />
                  </div>
                  <span className="text-primary-500 font-bold">+{quiz.reward} 金币</span>
                </div>
                <div className="flex items-center text-accent-500">
                  <span className="text-sm font-medium">开始测评</span>
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-white rounded-2xl p-5 shadow-card">
          <h4 className="font-bold text-dark-800 mb-4 flex items-center gap-2">
            <span className="text-xl">💡</span>
            穿搭小知识
          </h4>
          <div className="space-y-3">
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-sm text-dark-600">
                <span className="font-medium text-dark-800">脸型与发型：</span>
                鹅蛋脸适合各种发型，圆脸适合侧分拉长脸型，方脸适合柔化线条的发型。
              </p>
            </div>
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-sm text-dark-600">
                <span className="font-medium text-dark-800">肤色与服装：</span>
                冷白皮适合亮色和冷色调，暖黄皮适合大地色和暖色调。
              </p>
            </div>
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-sm text-dark-600">
                <span className="font-medium text-dark-800">身材与穿搭：</span>
                苹果型适合高腰下装，梨型适合A字裙，沙漏型适合修身款式。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fashion;
