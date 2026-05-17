import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';
import { useUserStore, useUIStore } from '../store';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useUserStore((state) => state.login);
  const showToast = useUIStore((state) => state.showToast);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('请输入用户名和密码', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register({ username, password, nickname });
      if (response.data.success) {
        login(response.data.data.user, response.data.data.token);
        showToast('注册成功', 'success');
        navigate('/');
      } else {
        showToast(response.data.message || '注册失败', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || '注册失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">创建账号</h1>
        <p className="text-gray-500 text-center mb-8">加入我们，分享你的音乐品味</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="至少3个字符"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="你的昵称（可选）"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              placeholder="至少6个字符"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        
        <p className="text-center mt-6 text-gray-600">
          已有账号？{' '}
          <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">
            立即登录
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
