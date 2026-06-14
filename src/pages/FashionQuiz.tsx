import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, CheckCircle } from 'lucide-react';
import { get, post } from '../utils/request';
import { useUserStore } from '../stores/userStore';

interface Question {
  id: string;
  question: string;
  options: string[];
}

interface FashionQuizProps {
  type: 'hairstyle' | 'clothing';
}

const FashionQuiz = ({ type }: FashionQuizProps) => {
  const navigate = useNavigate();
  const { isLoggedIn, fetchProfile } = useUserStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; answer: string }[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [resultText, setResultText] = useState('');
  const [reward, setReward] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');

  const titles = {
    hairstyle: '发型风格测评',
    clothing: '服饰搭配测评',
  };

  const gradients = {
    hairstyle: 'from-pink-400 to-purple-500',
    clothing: 'from-orange-400 to-pink-500',
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login?from=' + encodeURIComponent(type === 'hairstyle' ? '/tasks/fashion/hairstyle' : '/tasks/fashion/clothing'));
      return;
    }
    setQuizTitle(titles[type]);
    loadQuiz();
  }, [type, isLoggedIn]);

  const loadQuiz = async () => {
    try {
      const quizId = type === 'hairstyle' ? 'quiz-hairstyle' : 'quiz-clothing';
      const res: any = await get(`/fashion/quizzes/${quizId}`);
      if (res.success && res.quiz) {
        setQuestions(res.quiz.questions || []);
      }
    } catch (error) {
      console.error(error);
      // Fallback data
      const fallbackQuestions = [
        { id: 'q1', question: '你最喜欢的颜色是？', options: ['温柔粉', '经典黑', '明亮黄', '自然绿'] },
        { id: 'q2', question: '你的穿衣风格偏向？', options: ['甜美可爱', '干练知性', '休闲舒适', '个性潮流'] },
        { id: 'q3', question: '你更注重？', options: ['舒适度', '设计感', '品牌', '性价比'] },
        { id: 'q4', question: '你最喜欢的季节？', options: ['春天', '夏天', '秋天', '冬天'] },
        { id: 'q5', question: '你希望给人的感觉是？', options: ['亲切随和', '专业可靠', '时尚前卫', '温柔优雅'] },
      ];
      setQuestions(fallbackQuestions);
    }
  };

  const handleSelectAnswer = (answer: string) => {
    const currentQ = questions[currentIndex];
    const newAnswers = [...answers, { questionId: currentQ.id, answer }];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 300);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (ans: { questionId: string; answer: string }[]) => {
    try {
      const quizId = type === 'hairstyle' ? 'quiz-hairstyle' : 'quiz-clothing';
      const res: any = await post(`/fashion/quizzes/${quizId}/submit`, { answers: ans });
      
      if (res.success) {
        setResultText(res.result);
        setReward(res.reward);
        setShowResult(true);
        setShowReward(true);
        fetchProfile();
      } else {
        setResultText(type === 'hairstyle' 
          ? '你最适合齐肩微卷发型，温柔又修饰脸型！' 
          : '你的穿搭风格是极简主义，高级感满满！');
        setReward(30);
        setShowResult(true);
        setShowReward(true);
      }
    } catch (error) {
      console.error(error);
      setResultText(type === 'hairstyle' 
        ? '你最适合齐肩微卷发型，温柔又修饰脸型！' 
        : '你的穿搭风格是极简主义，高级感满满！');
      setReward(30);
      setShowResult(true);
      setShowReward(true);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setAnswers([]);
    setShowResult(false);
    setShowReward(false);
  };

  const currentQ = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-dark-50">
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center h-14 px-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 flex items-center justify-center">
            <ArrowLeft size={24} className="text-dark-700" />
          </button>
          <h1 className="flex-1 text-center font-bold text-lg text-dark-800">{quizTitle}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4">
        {!showResult ? (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-dark-500">第 {currentIndex + 1}/{questions.length} 题</span>
                <div className="flex items-center gap-1 text-primary-500 font-bold text-sm">
                  <Coins size={14} />
                  <span>30</span>
                </div>
              </div>
              <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${gradients[type]} rounded-full transition-all duration-500`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {currentQ && (
              <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
                <h2 className="text-lg font-bold text-dark-800 mb-6">{currentQ.question}</h2>

                <div className="space-y-3">
                  {currentQ.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(option)}
                      className="w-full p-4 rounded-xl border-2 border-dark-100 bg-white text-left font-medium text-dark-700 hover:border-accent-400 hover:bg-accent-50 transition-all flex items-center gap-3 group"
                    >
                      <span className="w-8 h-8 rounded-full bg-dark-100 group-hover:bg-accent-200 flex items-center justify-center text-sm font-bold text-dark-500 group-hover:text-accent-600 transition-colors">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1">{option}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center text-sm text-dark-400">
              选择答案后自动进入下一题
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-card p-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-accent-400 to-pink-500 rounded-full flex items-center justify-center animate-bounce-slow">
              <span className="text-4xl">✨</span>
            </div>
            <h2 className="text-2xl font-bold text-dark-800 mb-2">测评完成！</h2>
            <p className="text-dark-500 mb-6">你的专属风格分析</p>
            
            <div className={`bg-gradient-to-r ${gradients[type]} rounded-xl p-5 text-white mb-6 text-left`}>
              <h3 className="font-bold mb-2">风格分析结果</h3>
              <p className="text-white/90 text-sm leading-relaxed">
                {resultText}
              </p>
            </div>

            <div className="bg-dark-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-dark-500 mb-2">获得奖励</p>
              <div className="flex items-center justify-center gap-2">
                <Coins size={32} className="text-primary-500" />
                <span className="text-3xl font-bold text-primary-500">+{reward}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={restart}
                className="flex-1 py-3 bg-dark-100 text-dark-600 font-bold rounded-xl hover:bg-dark-200 transition-colors"
              >
                再测一次
              </button>
              <button
                onClick={() => navigate('/tasks/fashion')}
                className="flex-1 py-3 bg-gradient-to-r from-accent-400 to-pink-500 text-white font-bold rounded-xl"
              >
                返回列表
              </button>
            </div>
          </div>
        )}
      </div>

      {showReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 text-center animate-scale-in">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-gold rounded-full flex items-center justify-center animate-bounce-slow">
              <Coins size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-dark-800 mb-2">+{reward}</h3>
            <p className="text-dark-500">测评奖励已到账</p>
            <button
              onClick={() => setShowReward(false)}
              className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-full"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FashionQuiz;
