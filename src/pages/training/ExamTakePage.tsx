import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Award, FileText, Shield } from 'lucide-react';

const mockQuestions = [
  {
    id: 1,
    type: 'single',
    question: '国珍松花粉的主要原料产地是哪里？',
    options: ['A. 云南昆明', 'B. 浙江千岛湖', 'C. 山东烟台', 'D. 广东广州'],
    answer: 1,
    score: 10,
  },
  {
    id: 2,
    type: 'single',
    question: '以下哪项不是国珍松花粉的主要功效？',
    options: ['A. 增强免疫力', 'B. 抗疲劳', 'C. 调节血脂', 'D. 治疗癌症'],
    answer: 3,
    score: 10,
  },
  {
    id: 3,
    type: 'multiple',
    question: '国珍产品的核心优势包括哪些？（多选）',
    options: ['A. 纯天然原料', 'B. 先进工艺', 'C. 科学配方', 'D. 价格低廉'],
    answer: [0, 1, 2],
    score: 15,
  },
  {
    id: 4,
    type: 'single',
    question: '国珍松花粉每日推荐服用量是多少？',
    options: ['A. 1-2粒', 'B. 3-6粒', 'C. 10-15粒', 'D. 20粒以上'],
    answer: 1,
    score: 10,
  },
  {
    id: 5,
    type: 'judge',
    question: '国珍松花粉可以替代药物治疗疾病。',
    options: ['A. 正确', 'B. 错误'],
    answer: 1,
    score: 10,
  },
  {
    id: 6,
    type: 'single',
    question: '以下哪种人群不适合服用松花粉？',
    options: ['A. 亚健康人群', 'B. 免疫力低下者', 'C. 花粉过敏者', 'D. 疲劳人群'],
    answer: 2,
    score: 10,
  },
  {
    id: 7,
    type: 'multiple',
    question: '以下哪些属于国珍产品线？（多选）',
    options: ['A. 健康食品', 'B. 护肤美容', 'C. 家居日用', 'D. 医疗器械'],
    answer: [0, 1, 2],
    score: 15,
  },
  {
    id: 8,
    type: 'single',
    question: '国珍品牌隶属于哪家企业？',
    options: ['A. 新时代健康产业集团', 'B. 同仁堂', 'C. 汤臣倍健', 'D. 无限极'],
    answer: 0,
    score: 10,
  },
  {
    id: 9,
    type: 'single',
    question: '松花粉富含多少种营养成分？',
    options: ['A. 50多种', 'B. 100多种', 'C. 200多种', 'D. 500多种'],
    answer: 2,
    score: 10,
  },
  {
    id: 10,
    type: 'judge',
    question: '保健食品可以宣传治疗功效。',
    options: ['A. 正确', 'B. 错误'],
    answer: 1,
    score: 10,
  },
];

export default function ExamTakePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | number[]>>({});
  const [showSubmit, setShowSubmit] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);

  const question = mockQuestions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / mockQuestions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (optionIndex: number) => {
    if (showResult) return;

    if (question.type === 'multiple') {
      const currentAnswer = (answers[question.id] as number[]) || [];
      if (currentAnswer.includes(optionIndex)) {
        setAnswers({
          ...answers,
          [question.id]: currentAnswer.filter(i => i !== optionIndex)
        });
      } else {
        setAnswers({
          ...answers,
          [question.id]: [...currentAnswer, optionIndex].sort()
        });
      }
    } else {
      setAnswers({
        ...answers,
        [question.id]: optionIndex
      });
    }
  };

  const calculateScore = () => {
    let totalScore = 0;
    mockQuestions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer === undefined) return;

      if (q.type === 'multiple') {
        const correct = JSON.stringify(userAnswer) === JSON.stringify(q.answer);
        if (correct) totalScore += q.score;
      } else {
        if (userAnswer === q.answer) totalScore += q.score;
      }
    });
    return totalScore;
  };

  const handleSubmit = () => {
    setShowResult(true);
  };

  const score = showResult ? calculateScore() : 0;
  const passingScore = 60;
  const isPassed = score >= passingScore;

  if (showResult) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/training/exam')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回考试列表
        </button>

        <div className="card p-8 text-center">
          <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${isPassed ? 'bg-green-100' : 'bg-red-100'}`}>
            {isPassed ? (
              <CheckCircle className="w-12 h-12 text-green-600" />
            ) : (
              <AlertCircle className="w-12 h-12 text-red-600" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isPassed ? '恭喜您，考试通过！' : '很遗憾，未能通过考试'}
          </h1>
          <p className="text-gray-500 mb-8">产品知识考核 · 满分100分 · 及格分60分</p>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">您的得分</p>
              <p className={`text-3xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>{score}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">正确题数</p>
              <p className="text-3xl font-bold text-primary-600">
                {mockQuestions.filter(q => {
                  const userAnswer = answers[q.id];
                  if (userAnswer === undefined) return false;
                  if (q.type === 'multiple') {
                    return JSON.stringify(userAnswer) === JSON.stringify(q.answer);
                  }
                  return userAnswer === q.answer;
                }).length}/{mockQuestions.length}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">正确率</p>
              <p className="text-3xl font-bold text-brand-600">
                {Math.round((mockQuestions.filter(q => {
                  const userAnswer = answers[q.id];
                  if (userAnswer === undefined) return false;
                  if (q.type === 'multiple') {
                    return JSON.stringify(userAnswer) === JSON.stringify(q.answer);
                  }
                  return userAnswer === q.answer;
                }).length / mockQuestions.length) * 100)}%
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left mb-8">
            <p className="text-sm text-amber-800 flex items-start gap-2">
              <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>考试须知：</strong>本次考试成绩已计入您的培训档案。如需补考，请联系管理员重新安排。请务必掌握合规知识，规范展业行为。
              </span>
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate('/training/exam')} className="btn btn-secondary">
              返回考试列表
            </button>
            <button className="btn btn-primary">
              查看答案解析
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">答题详情</h3>
          <div className="space-y-4">
            {mockQuestions.map((q, idx) => {
              const userAnswer = answers[q.id];
              const isCorrect = userAnswer !== undefined && (
                q.type === 'multiple'
                  ? JSON.stringify(userAnswer) === JSON.stringify(q.answer)
                  : userAnswer === q.answer
              );

              return (
                <div key={q.id} className={`p-4 rounded-xl ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                      {isCorrect ? <CheckCircle className="w-4 h-4 text-white" /> : <AlertCircle className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-2">
                        {idx + 1}. {q.question}
                        <span className="text-sm text-gray-500 ml-2">({q.score}分)</span>
                      </p>
                      <div className="space-y-1">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = q.type === 'multiple'
                            ? (userAnswer as number[])?.includes(optIdx)
                            : userAnswer === optIdx;
                          const isCorrectAnswer = q.type === 'multiple'
                            ? (q.answer as number[]).includes(optIdx)
                            : q.answer === optIdx;

                          return (
                            <p
                              key={optIdx}
                              className={`text-sm p-2 rounded-lg ${
                                isCorrectAnswer
                                  ? 'bg-green-100 text-green-800'
                                  : isSelected && !isCorrectAnswer
                                  ? 'bg-red-100 text-red-800'
                                  : 'text-gray-600'
                              }`}
                            >
                              {opt}
                              {isCorrectAnswer && <span className="ml-2 text-green-600">✓ 正确答案</span>}
                              {isSelected && !isCorrectAnswer && <span className="ml-2 text-red-600">✗ 您的选择</span>}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/training/exam')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回考试列表
        </button>
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg">
          <Clock className="w-5 h-5" />
          <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">产品知识考核</h2>
            <span className="text-sm text-gray-500">
              {answeredCount}/{mockQuestions.length} 已作答
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {mockQuestions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = currentQuestion === idx;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  isCurrent
                    ? 'bg-primary-600 text-white'
                    : isAnswered
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              {currentQuestion + 1}/{mockQuestions.length}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {question.type === 'single' ? '单选题' : question.type === 'multiple' ? '多选题' : '判断题'}
            </span>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
              {question.score}分
            </span>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-6">{question.question}</h3>

          <div className="space-y-3">
            {question.options.map((option, idx) => {
              const isSelected = question.type === 'multiple'
                ? (answers[question.id] as number[])?.includes(idx)
                : answers[question.id] === idx;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                    }`}>
                      {isSelected && <div className="w-3 h-3 rounded-full bg-white"></div>}
                    </div>
                    <span className={isSelected ? 'text-primary-700 font-medium' : 'text-gray-700'}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <button
            onClick={() => setCurrentQuestion(q => Math.max(0, q - 1))}
            disabled={currentQuestion === 0}
            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            上一题
          </button>

          {currentQuestion < mockQuestions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(q => q + 1)}
              className="btn btn-primary"
            >
              下一题
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              onClick={() => setShowSubmit(true)}
              className="btn btn-primary"
            >
              提交试卷
            </button>
          )}
        </div>
      </div>

      {showSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSubmit(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">确认提交试卷？</h3>
              <p className="text-gray-500">
                您已完成 {answeredCount}/{mockQuestions.length} 道题目
                {answeredCount < mockQuestions.length && (
                  <span className="text-amber-600">，还有 {mockQuestions.length - answeredCount} 道未作答</span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSubmit(false)} className="btn btn-secondary flex-1">
                继续答题
              </button>
              <button onClick={handleSubmit} className="btn btn-primary flex-1">
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
