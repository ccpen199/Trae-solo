import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Users, Heart, Filter, RefreshCw } from 'lucide-react';
import api, { handleApiError } from '../services/api';
import useStore from '../store/useStore';
import Loading from '../components/Loading';
import { showToast } from '../components/Toast';
import { Question, User } from '../types';

const Planet: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSoulTest, setShowSoulTest] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [personalityType, setPersonalityType] = useState<string | null>(null);
  const [recommendedUsers, setRecommendedUsers] = useState<any[]>([]);
  const [genderFilter, setGenderFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const user = useStore((state) => state.user);

  useEffect(() => {
    fetchSoulTestQuestions();
    fetchRecommendedUsers();
  }, [genderFilter]);

  const fetchSoulTestQuestions = async () => {
    try {
      const res = await api.get('/match/soul-test/questions');
      if (res.data.success) {
        setQuestions(res.data.data.questions);
      }
    } catch (error) {
      console.error('获取测试题失败', error);
    }
  };

  const fetchRecommendedUsers = async () => {
    setRefreshing(true);
    try {
      const params = genderFilter ? { gender: genderFilter } : {};
      const res = await api.get('/match/recommendations', { params });
      if (res.data.success) {
        setRecommendedUsers(res.data.data.users || []);
      }
    } catch (error) {
      showToast(handleApiError(error), 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitSoulTest(newAnswers);
    }
  };

  const submitSoulTest = async (ans: number[]) => {
    setLoading(true);
    try {
      const res = await api.post('/match/soul-test/submit', { answers: ans });
      if (res.data.success) {
        setPersonalityType(res.data.data.personality_type);
        setTimeout(() => {
          setShowSoulTest(false);
          setPersonalityType(null);
          setCurrentQuestion(0);
          setAnswers([]);
          fetchRecommendedUsers();
        }, 2000);
      }
    } catch (error) {
      showToast(handleApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async (targetUserId: number) => {
    try {
      const res = await api.post('/match/create', { targetUserId });
      if (res.data.success) {
        showToast('匹配成功！快去聊天吧', 'success');
        navigate(`/chat/${targetUserId}`);
      }
    } catch (error) {
      showToast(handleApiError(error), 'error');
    }
  };

  if (showSoulTest) {
    const question = questions[currentQuestion];
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 p-6">
        {loading && <Loading fullScreen />}
        
        {personalityType ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-2xl font-bold text-purple-700 mb-2">测试完成！</h2>
            <p className="text-lg text-purple-600">你的灵魂类型：{personalityType}</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => setShowSoulTest(false)} className="text-gray-500">
                取消
              </button>
              <span className="text-sm text-gray-500">
                {currentQuestion + 1}/{questions.length}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-6">{question?.question}</h2>

            <div className="space-y-3">
              {question?.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className="w-full p-4 bg-white rounded-xl shadow-sm border border-gray-100 text-left hover:border-pink-300 hover:shadow-md transition-all"
                >
                  <span className="text-gray-700">{option.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 pt-8">
        <h1 className="text-xl font-bold mb-1">星球</h1>
        <p className="text-sm opacity-90">发现有趣的灵魂</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setShowSoulTest(true)}
            className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center"
          >
            <Sparkles className="text-purple-500 mb-2" size={24} />
            <span className="text-sm text-gray-700">灵魂测试</span>
          </button>
          <button className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center">
            <Heart className="text-pink-500 mb-2" size={24} />
            <span className="text-sm text-gray-700">恋爱铃</span>
          </button>
          <button className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center">
            <Users className="text-blue-500 mb-2" size={24} />
            <span className="text-sm text-gray-700">同城</span>
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">推荐匹配</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGenderFilter(genderFilter === '男' ? '女' : genderFilter === '女' ? null : '男')}
                className={`text-xs px-2 py-1 rounded-full ${genderFilter === '男' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
              >
                男
              </button>
              <button
                onClick={() => setGenderFilter(genderFilter === '女' ? null : '女')}
                className={`text-xs px-2 py-1 rounded-full ${genderFilter === '女' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-500'}`}
              >
                女
              </button>
              <button onClick={fetchRecommendedUsers} disabled={refreshing}>
                <RefreshCw size={16} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {refreshing ? (
            <Loading />
          ) : recommendedUsers?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users size={48} className="mx-auto mb-3 opacity-50" />
              <p>暂无推荐用户</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedUsers?.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt="" className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{u.nickname}</span>
                      <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-600 rounded-full">
                        {u.match_score || 85}%匹配
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{u.bio || '这个人很懒~'}</p>
                  </div>
                  <button
                    onClick={() => handleMatch(u.id)}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-full"
                  >
                    匹配
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Planet;
