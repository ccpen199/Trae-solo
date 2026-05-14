import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Lock, Eye, EyeOff, Smile } from 'lucide-react';
import { useStore } from '../store/useStore';
import { authApi } from '../lib/api';
import type { LoginResponse, User as UserType } from '../types';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setToken, showToast } = useStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim() || !nickname.trim()) {
      setError('请填写所有字段');
      return;
    }
    
    if (username.length < 3) {
      setError('用户名至少3个字符');
      return;
    }
    
    if (password.length < 6) {
      setError('密码至少6个字符');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Attempting registration with:', { username: username.trim(), nickname: nickname.trim() });
      const response = await authApi.register(username.trim(), password, nickname.trim());
      console.log('Registration response:', response);
      
      if (response.success && response.data) {
        const data = response.data as LoginResponse;
        setToken(data.token);
        setUser(data.user as UserType);
        showToast('注册成功，欢迎加入 LinkWorld！', 'success');
        navigate('/avatar-setup');
      } else {
        const errorMsg = response.message || '注册失败';
        setError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      const errorMsg = '注册失败，请稍后重试';
      setError(errorMsg);
      console.error('Register error:', err);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [username, password, nickname, navigate, setUser, setToken, showToast]);
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-accent-500 to-primary-500 rounded-full flex items-center justify-center">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">创建账号</h1>
          <p className="text-white/70">加入 LinkWorld 社交网络</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">用户名</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field pl-10"
                placeholder="3-20个字符，字母数字下划线"
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">昵称</label>
            <div className="relative">
              <Smile className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="input-field pl-10"
                placeholder="显示给其他用户的名字"
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10 pr-10"
                placeholder="至少6个字符"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                注册
              </>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-white/70">
            已有账号？{' '}
            <Link to="/login" className="text-primary-300 hover:text-primary-200 font-medium">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
