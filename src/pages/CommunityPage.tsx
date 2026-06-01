import { useState } from 'react';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Share2,
  Send,
  Image,
  Hash,
  MoreHorizontal,
  Plus,
  TrendingUp
} from 'lucide-react';
import { mockData } from '../services/api';
import { useAppStore } from '../stores/appStore';

export default function CommunityPage() {
  const { isLoggedIn, user, setCurrentPage, setCurrentMovieId } = useAppStore();
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState(mockData.posts);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const handleLike = (postId: string) => {
    if (likedPosts.has(postId)) {
      setLikedPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, likes: p.likes - 1 } : p
      ));
    } else {
      setLikedPosts(prev => new Set(prev).add(postId));
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      ));
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const hotTopics = [
    { tag: '星际穿越重映', count: 12580, hot: true },
    { tag: '哪吒之魔童闹海', count: 8920, hot: true },
    { tag: '2025年最期待电影', count: 6540 },
    { tag: '王家卫电影美学', count: 4320 },
    { tag: '沙丘3什么时候出', count: 3890 },
    { tag: '国漫崛起', count: 3210 },
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-cinema-red/20 to-transparent py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cinema-red/20 rounded-xl">
              <Users className="w-8 h-8 text-cinema-red" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-cinema-text">社区广场</h1>
              <p className="text-cinema-text-secondary mt-1">
                与百万影迷一起讨论电影
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {isLoggedIn && user && (
              <div className="bg-cinema-bg-light rounded-xl border border-cinema-border p-6 mb-8">
                <div className="flex gap-4">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="分享你的观影感受..."
                      className="w-full bg-cinema-bg border border-cinema-border rounded-xl p-4 text-cinema-text placeholder-cinema-text-muted resize-none focus:outline-none focus:border-cinema-red transition-colors"
                      rows={3}
                    />
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 text-cinema-text-secondary hover:text-cinema-text transition-colors">
                          <Image className="w-5 h-5" />
                          <span className="text-sm">图片</span>
                        </button>
                        <button className="flex items-center gap-2 text-cinema-text-secondary hover:text-cinema-text transition-colors">
                          <Hash className="w-5 h-5" />
                          <span className="text-sm">话题</span>
                        </button>
                      </div>
                      <button
                        disabled={!newPost.trim()}
                        className={`btn-primary flex items-center gap-2 ${!newPost.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Send className="w-4 h-4" />
                        发布
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  className="bg-cinema-bg-light rounded-xl border border-cinema-border p-6 animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.userAvatar}
                        alt={post.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-cinema-text">{post.username}</span>
                        </div>
                        <span className="text-sm text-cinema-text-muted">{post.createdAt}</span>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-cinema-bg rounded-lg transition-colors">
                      <MoreHorizontal className="w-5 h-5 text-cinema-text-muted" />
                    </button>
                  </div>

                  <p className="text-cinema-text leading-relaxed mb-4">
                    {post.content}
                  </p>

                  {post.movieId && (
                    <div
                      className="flex items-center gap-4 p-4 bg-cinema-bg rounded-xl mb-4 cursor-pointer hover:bg-cinema-border/50 transition-colors"
                      onClick={() => {
                        setCurrentMovieId(post.movieId!);
                        setCurrentPage('movie');
                      }}
                    >
                      <div className="w-12 h-16 bg-cinema-border rounded flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-cinema-text line-clamp-1">
                          {post.movieTitle}
                        </p>
                        <p className="text-sm text-cinema-text-muted">点击查看详情</p>
                      </div>
                    </div>
                  )}

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-cinema-red/10 text-cinema-red rounded-full text-sm cursor-pointer hover:bg-cinema-red/20 transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-6 pt-4 border-t border-cinema-border">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 transition-colors ${
                        likedPosts.has(post.id)
                          ? 'text-cinema-red'
                          : 'text-cinema-text-secondary hover:text-cinema-red'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                      <span>{formatNumber(post.likes)}</span>
                    </button>
                    <button className="flex items-center gap-2 text-cinema-text-secondary hover:text-cinema-red transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span>{formatNumber(post.comments)}</span>
                    </button>
                    <button className="flex items-center gap-2 text-cinema-text-secondary hover:text-cinema-red transition-colors">
                      <Share2 className="w-5 h-5" />
                      <span>分享</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!isLoggedIn && (
              <div className="text-center py-12 bg-cinema-bg-light rounded-xl border border-cinema-border">
                <Users className="w-16 h-16 text-cinema-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-bold text-cinema-text mb-2">加入社区</h3>
                <p className="text-cinema-text-secondary mb-6">
                  登录后发布你的观影感受，与同好交流
                </p>
                <button
                  onClick={() => setCurrentPage('login')}
                  className="btn-primary"
                >
                  立即登录
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-cinema-bg-light rounded-xl border border-cinema-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-cinema-gold" />
                <h3 className="font-bold text-cinema-text">热门话题</h3>
              </div>
              <div className="space-y-3">
                {hotTopics.map((topic, index) => (
                  <div
                    key={topic.tag}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-cinema-bg cursor-pointer transition-colors"
                  >
                    <span className={`text-lg font-bold ${
                      index < 3 ? 'text-cinema-gold' : 'text-cinema-text-muted'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-cinema-text font-medium truncate">
                          #{topic.tag}
                        </span>
                        {topic.hot && (
                          <span className="px-1.5 py-0.5 bg-cinema-red/20 text-cinema-red text-xs rounded">
                            热
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-cinema-text-muted">
                        {formatNumber(topic.count)} 讨论
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-cinema-red hover:bg-cinema-red/10 rounded-lg transition-colors">
                查看更多话题
              </button>
            </div>

            <div className="bg-gradient-to-br from-cinema-red/20 to-cinema-gold/20 rounded-xl border border-cinema-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-cinema-gold" />
                <h3 className="font-bold text-cinema-text">创建话题</h3>
              </div>
              <p className="text-sm text-cinema-text-secondary mb-4">
                发起你感兴趣的话题，邀请大家一起讨论
              </p>
              <button className="w-full btn-gold py-2">
                创建话题
              </button>
            </div>

            <div className="bg-cinema-bg-light rounded-xl border border-cinema-border p-6">
              <h3 className="font-bold text-cinema-text mb-4">社区规范</h3>
              <ul className="space-y-2 text-sm text-cinema-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-cinema-red">•</span>
                  <span>尊重他人，文明发言</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cinema-red">•</span>
                  <span>禁止剧透，标记剧透内容</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cinema-red">•</span>
                  <span>禁止发布广告和违规内容</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cinema-red">•</span>
                  <span>鼓励原创，禁止抄袭</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
