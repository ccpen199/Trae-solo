import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, CheckCircle, XCircle, Coins, Trophy } from 'lucide-react';
import { get, post } from '../utils/request';
import { useUserStore } from '../stores/userStore';

interface Question {
  id: string;
  idiom: string;
  question: string;
  options: string[];
  answer: string;
}

const Idiom = () => {
  const navigate = useNavigate();
  const { isLoggedIn, fetchProfile } = useUserStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login?from=' + encodeURIComponent('/tasks/idiom'));
      return;
    }
    loadQuestions();
  }, [isLoggedIn]);

  const loadQuestions = async () => {
    try {
      const res: any = await get('/content/idioms/questions?count=5');
      if (res.success) {
        setQuestions(res.questions);
        setCurrentIndex(0);
        setScore(0);
        setCorrectCount(0);
        setGameOver(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectAnswer = async (answer: string) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);

    const currentQ = questions[currentIndex];
    const correct = answer === currentQ.answer;
    setIsCorrect(correct);

    if (correct) {
      setScore(score + 10);
      setCorrectCount(correctCount + 1);
    }

    setTimeout(async () => {
      if (correct) {
        try {
          const res: any = await post('/content/idioms/submit', {
            questionId: currentQ.id,
            answer,
          });
          if (res.success && res.reward) {
            setRewardAmount(res.reward);
            setShowReward(true);
            fetchProfile();
            setCompletedCount(completedCount + 1);
            setTimeout(() => setShowReward(false), 1500);
          }
        } catch (error) {
          console.error(error);
        }
      }

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setGameOver(true);
      }
    }, 1200);
  };

  const restart = () => {
    loadQuestions();
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-dark-50">
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center h-14 px-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 flex items-center justify-center">
            <ArrowLeft size={24} className="text-dark-700" />
          </button>
          <h1 className="flex-1 text-center font-bold text-lg text-dark-800">成语答题</h1>
          <div className="w-10 h-10 flex items-center justify-center">
            <Trophy size={22} className="text-primary-500" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dark-500">
              第 {currentIndex + 1}/{questions.length} 题
            </span>
            <div className="flex items-center gap-1 text-primary-500 font-bold">
              <Coins size={16} />
              <span>{score}</span>
            </div>
          </div>
          <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-knowledge-400 to-knowledge-600 rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {!gameOver && currentQ ? (
          <>
            <div className="bg-white rounded-2xl shadow-card p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-knowledge-100 flex items-center justify-center">
                  <Brain size={26} className="text-knowledge-500" />
                </div>
                <span className="text-sm text-knowledge-500 font-medium">成语知识</span>
              </div>
              <p className="text-lg font-medium text-dark-800 leading-relaxed">
                {currentQ.question}
              </p>
            </div>

            <div className="space-y-3">
              {currentQ.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrectAnswer = option === currentQ.answer;
                
                let bgClass = 'bg-white';
                let borderClass = 'border-dark-200';
                let textClass = 'text-dark-700';
                
                if (showResult) {
                  if (isCorrectAnswer) {
                    bgClass = 'bg-health-50';
                    borderClass = 'border-health-500';
                    textClass = 'text-health-600';
                  } else if (isSelected && !isCorrect) {
                    bgClass = 'bg-red-50';
                    borderClass = 'border-red-500';
                    textClass = 'text-red-600';
                  }
                } else if (isSelected) {
                  bgClass = 'bg-knowledge-50';
                  borderClass = 'border-knowledge-500';
                  textClass = 'text-knowledge-600';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-xl border-2 ${bgClass} ${borderClass} ${textClass} text-left font-medium transition-all hover:shadow-md flex items-center gap-3`}
                  >
                    <span className="w-8 h-8 rounded-full bg-dark-100 flex items-center justify-center text-sm font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {showResult && isCorrectAnswer && (
                      <CheckCircle size={22} className="text-health-500" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle size={22} className="text-red-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : gameOver ? (
          <div className="bg-white rounded-2xl shadow-card p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary-400 to-accent-500 rounded-full flex items-center justify-center">
              <Trophy size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-dark-800 mb-2">答题结束</h2>
            <p className="text-dark-500 mb-6">
              答对 {correctCount}/{questions.length} 题
            </p>
            <div className="bg-dark-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-dark-500 mb-1">本次获得金币</p>
              <div className="flex items-center justify-center gap-2">
                <Coins size={28} className="text-primary-500" />
                <span className="text-3xl font-bold text-primary-500">{score}</span>
              </div>
            </div>
            <button
              onClick={restart}
              className="w-full py-4 bg-gradient-primary text-white font-bold rounded-xl shadow-button"
            >
              再来一轮
            </button>
          </div>
        ) : (
          <div className="text-center py-20 text-dark-400">加载中...</div>
        )}

        <div className="mt-6 bg-white rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-dark-600">今日已完成</span>
            <span className="text-sm text-primary-500 font-medium">{completedCount}/3</span>
          </div>
          <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((completedCount / 3) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-dark-400 mt-2">每答对1题可获得 20 金币奖励</p>
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

export default Idiom;
