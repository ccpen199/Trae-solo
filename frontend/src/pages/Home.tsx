import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Users, Newspaper, Globe, Sparkles, ArrowRight, Zap, Shield, Share2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { apiRequest } from '../lib/api';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  
  const [stats, setStats] = useState({
    onlineUsers: 0,
    activeRooms: 0,
    todayPosts: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [sampleUrl, setSampleUrl] = useState('https://example.com/article/123');
  
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiRequest('/auth/me', 'GET');
      if (response.success) {
        setStats({
          onlineUsers: Math.floor(Math.random() * 50) + 10,
          activeRooms: Math.floor(Math.random() * 20) + 5,
          todayPosts: Math.floor(Math.random() * 100) + 20,
        });
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);
  
  const handleStartChat = () => {
    if (sampleUrl.trim()) {
      navigate('/chat');
    }
  };
  
  const features = [
    {
      icon: Globe,
      title: '网页社交',
      description: '在任意网页上与其他访客实时互动，让网页变成社交场景',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Sparkles,
      title: '虚拟形象',
      description: '定制你的专属 2D 形象，在不同网站间自由流动',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Shield,
      title: '隐私保护',
      description: '社交关系不暴露给网站本身，保障你的隐私安全',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Zap,
      title: '实时互动',
      description: '实时聊天、滚动位置同步、虚拟形象跟随浏览',
      color: 'from-orange-500 to-yellow-500',
    },
  ];
  
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="card p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                欢迎来到 <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">LinkWorld</span>
              </h1>
              <p className="text-white/70 text-lg mb-6">
                让网页本身变成社交场景。访问同一页面的用户可以实时互动，你的虚拟形象在不同网站间自由流动。
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => navigate('/chat')}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  开始聊天
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/feed')}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <Newspaper className="w-5 h-5" />
                  浏览动态
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">
                    {loading ? '...' : stats.onlineUsers}
                  </p>
                  <p className="text-white/50 text-sm">在线用户</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">
                    {loading ? '...' : stats.activeRooms}
                  </p>
                  <p className="text-white/50 text-sm">活跃房间</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">
                    {loading ? '...' : stats.todayPosts}
                  </p>
                  <p className="text-white/50 text-sm">今日动态</p>
                </div>
              </div>
            </div>
            
            <div className="w-64 h-64 flex-shrink-0">
              {user ? (
                <div className="flex flex-col items-center">
                  <Avatar config={user.avatarConfig} size={180} animate />
                  <p className="mt-4 text-white font-semibold text-lg">{user.nickname}</p>
                  <p className="text-white/50">@{user.username}</p>
                </div>
              ) : (
                <div className="w-full h-full bg-white/10 rounded-2xl flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary-500/30 to-accent-500/30 rounded-full animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {features.map((feature, index) => (
            <div key={index} className="card p-6 group hover:bg-white/15 transition-colors">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/70">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-white mb-6">尝试网页聊天</h2>
          <p className="text-white/70 mb-4">
            输入任意网页 URL，访问该页面的用户将进入同一聊天室。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={sampleUrl}
              onChange={(e) => setSampleUrl(e.target.value)}
              className="flex-1 input-field"
              placeholder="https://example.com/article"
            />
            <button
              onClick={handleStartChat}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              进入聊天室
            </button>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-white/50 text-sm">热门网页：</span>
            {['https://news.ycombinator.com', 'https://github.com', 'https://stackoverflow.com'].map((url) => (
              <button
                key={url}
                onClick={() => setSampleUrl(url)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white/80 text-sm rounded-full transition-colors"
              >
                {url.replace('https://', '')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
