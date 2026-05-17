import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, FileCheck, Award, CheckCircle, XCircle, ChevronLeft } from 'lucide-react';
import Loading from '../components/Loading';
import { useToast } from '../components/Toast';

const Assessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await fetch('/api/assessments');
      const data = await response.json();
      if (data.success) {
        setAssessments(data.data.list || []);
      }
    } catch (error) {
      console.error('Fetch assessments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = async (assessment) => {
    const token = localStorage.getItem('hiu_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`/api/assessments/${assessment.id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedAssessment(assessment);
        setQuestions(data.data.questions || []);
        setCurrentQuestion(0);
        setAnswers({});
        setShowResult(false);
        setResult(null);
      }
    } catch (error) {
      console.error('Fetch assessment detail error:', error);
      showToast('加载测评失败', 'error');
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('hiu_token');
    if (!token) return;

    try {
      const answerArray = questions.map(q => answers[q.id] || '');
      const response = await fetch('/api/assessments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assessmentId: selectedAssessment.id,
          answers: answerArray
        })
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setShowResult(true);
        showToast('提交成功！', 'success');
      } else {
        showToast(data.message || '提交失败', 'error');
      }
    } catch (error) {
      showToast('提交失败，请稍后重试', 'error');
    }
  };

  const handleBack = () => {
    setSelectedAssessment(null);
    setShowResult(false);
  };

  if (loading) {
    return <Loading />;
  }

  if (showResult && result) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          返回测评列表
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center bg-blue-100">
            <Award className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">测评完成！</h1>
          <p className="text-gray-600 mb-6">你的得分是：</p>
          
          <div className="text-6xl font-bold text-blue-600 mb-6">
            {result.score}
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-green-50 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-800">{result.correctCount}</p>
              <p className="text-sm text-gray-500">正确</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-800">{result.totalCount - result.correctCount}</p>
              <p className="text-sm text-gray-500">错误</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <FileCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-800">{result.totalCount}</p>
              <p className="text-sm text-gray-500">总题数</p>
            </div>
          </div>

          {result.isPassed ? (
            <div className="p-4 bg-green-100 text-green-700 rounded-xl mb-6">
              🎉 恭喜你通过了本次测评！
            </div>
          ) : (
            <div className="p-4 bg-yellow-100 text-yellow-700 rounded-xl mb-6">
              💪 很遗憾，继续加油，下次一定能通过！
            </div>
          )}

          <button
            onClick={handleBack}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            继续测评
          </button>
        </div>
      </div>
    );
  }

  if (selectedAssessment) {
    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          返回测评列表
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800">{selectedAssessment.title}</h1>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="w-5 h-5" />
              <span>第 {currentQuestion + 1} / {questions.length} 题</span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {currentQuestion + 1}. {question?.question}
            </h2>

            <div className="space-y-3">
              {(question?.options || []).map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(question.id, option)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    answers[question.id] === option
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              上一题
            </button>
            
            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length !== questions.length}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                提交答案
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                下一题
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">能力测评</h1>

      {assessments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">暂无测评</h3>
          <p className="text-gray-500">敬请期待更多测评内容</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <FileCheck className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{assessment.title}</h3>
              <p className="text-gray-500 text-sm mb-4">{assessment.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {assessment.duration} 分钟
                </span>
                <span className="flex items-center gap-1">
                  <FileCheck className="w-4 h-4" />
                  {assessment.question_count} 题
                </span>
              </div>

              <button
                onClick={() => startAssessment(assessment)}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                开始测评
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Assessments;
