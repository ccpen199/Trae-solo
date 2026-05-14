import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, MessageCircle, UserPlus, ClipboardList } from 'lucide-react';
import { userApi, matchApi, personalityApi, chatApi } from '../api/client';

const Planet = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [matchingUser, setMatchingUser] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [testLoading, setTestLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userApi.getUsers({ limit: 20 });
      setUsers(data.data.users || []);
    } catch (err) {
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async (user) => {
    try {
      setMatchingUser(user.id);
      await matchApi.createMatch(user.id);
    } catch (err) {
      console.error('Match error:', err);
    } finally {
      setMatchingUser(null);
    }
  };

  const handleChat = async (user) => {
    try {
      const data = await chatApi.startChat(user.id);
      navigate(`/chat/${data.data.chat_id}`);
    } catch (err) {
      console.error('Chat error:', err);
    }
  };

  const handleViewProfile = (user) => {
    navigate(`/user/${user.id}`);
  };

  const loadQuestions = async () => {
    try {
      const data = await personalityApi.getQuestions();
      setQuestions(data.data.questions || []);
    } catch (err) {
      console.error('Load questions error:', err);
    }
  };

  const handleSubmitTest = async () => {
    if (Object.keys(answers).length !== questions.length) {
      alert('请完成所有问题');
      return;
    }

    try {
      setTestLoading(true);
      await personalityApi.submitTest({
        answers: questions.map(q => ({
          questionId: q.id,
          optionIndex: answers[q.id]
        }))
      });
      setShowTestModal(false);
      alert('测试完成！');
    } catch (err) {
      console.error('Submit test error:', err);
    } finally {
      setTestLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">星球</h1>
          <p className="text-gray-500 text-sm">发现有趣的人</p>
        </div>
        <button
          onClick={() => {
            loadQuestions();
            setShowTestModal(true);
          }}
          className="flex items-center gap-1 bg-purple-50 text-purple-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-100 transition"
        >
          <ClipboardList size={16} />
          性格测试
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索用户..."
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 px-4 py-3 rounded-xl mb-4 text-center">
          {error}
          <button onClick={loadUsers} className="ml-2 underline">重试</button>
        </div>
      )}

      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
            <p>暂无用户</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div
                  onClick={() => handleViewProfile(user)}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl cursor-pointer"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (user.nickname || user.username)?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1" onClick={() => handleViewProfile(user)}>
                  <h3 className="font-semibold text-gray-800">{user.nickname || user.username}</h3>
                  <p className="text-gray-500 text-sm truncate">{user.bio || '这个人很懒，什么都没写'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMatch(user)}
                    disabled={matchingUser === user.id}
                    className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition disabled:opacity-50"
                  >
                    <UserPlus size={20} />
                  </button>
                  <button
                    onClick={() => handleChat(user)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                  >
                    <MessageCircle size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">性格测试</h2>
            <p className="text-gray-500 text-sm mb-6">完成以下题目，找到更匹配的人</p>

            <div className="space-y-6">
              {questions.map((q, index) => (
                <div key={q.id}>
                  <p className="font-medium text-gray-800 mb-3">
                    {index + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((option, optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => setAnswers({ ...answers, [q.id]: optIndex })}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                          answers[q.id] === optIndex
                            ? 'border-purple-500 bg-purple-50 text-purple-600'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTestModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleSubmitTest}
                disabled={testLoading}
                className="flex-1 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition disabled:opacity-50"
              >
                {testLoading ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planet;
