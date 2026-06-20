import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import {
  Users,
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Fish,
  Droplets,
  Send,
  Image,
  Smile,
  MoreHorizontal,
  Bookmark,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Social() {
  const { posts, theme, user, toggleLike, toggleBookmark } = useAppStore();
  const [activeTab, setActiveTab] = useState<'latest' | 'following' | 'nearby'>('latest');
  const [newPost, setNewPost] = useState('');
  
  const tabs = [
    { key: 'latest', label: '最新' },
    { key: 'following', label: '关注' },
    { key: 'nearby', label: '附近' },
  ];
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 顶部标签 */}
      <div className={cn(
        'rounded-2xl p-2 flex gap-2',
        theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
      )}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-lake-green-500/20 text-lake-green-400'
                : 'text-moonlight-400 hover:text-moonlight-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* 发布框 */}
      <div className={cn(
        'rounded-2xl p-5',
        theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
      )}>
        <div className="flex gap-4">
          <img
            src={user.avatar}
            alt={user.nickname}
            className="w-12 h-12 rounded-full flex-shrink-0"
          />
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="分享你的垂钓故事..."
              rows={3}
              className={cn(
                'w-full resize-none bg-transparent outline-none text-moonlight-100 placeholder-moonlight-500',
                theme === 'dark' ? '' : 'text-deep-sea-900 placeholder-moonlight-400'
              )}
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-deep-sea-700/30">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 text-moonlight-400 hover:text-lake-green-400 transition-colors">
                  <Image size={18} />
                  <span className="text-sm">图片</span>
                </button>
                <button className="flex items-center gap-2 text-moonlight-400 hover:text-lake-green-400 transition-colors">
                  <MapPin size={18} />
                  <span className="text-sm">钓点</span>
                </button>
                <button className="flex items-center gap-2 text-moonlight-400 hover:text-lake-green-400 transition-colors">
                  <Fish size={18} />
                  <span className="text-sm">鱼种</span>
                </button>
              </div>
              <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-lake-green-500 to-deep-sea-500 text-white text-sm font-medium hover:from-lake-green-600 hover:to-deep-sea-600 transition-all flex items-center gap-2">
                <Send size={14} />
                发布
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 动态列表 */}
      <div className="space-y-6">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className={cn(
              'rounded-2xl overflow-hidden animate-slide-up',
              theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* 用户信息 */}
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={post.userAvatar}
                  alt={post.userName}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h4 className="font-semibold">{post.userName}</h4>
                  <div className="flex items-center gap-2 text-xs text-moonlight-400">
                    <span>{format(new Date(post.createdAt), 'MM-dd HH:mm')}</span>
                  </div>
                </div>
              </div>
              <button className="p-2 rounded-lg text-moonlight-400 hover:bg-deep-sea-800/50 transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
            
            {/* 内容 */}
            <div className="px-5 pb-4">
              <p className="text-moonlight-100 leading-relaxed">{post.content}</p>
            </div>
            
            {/* 图片 */}
            {post.images.length > 0 && (
              <div className={cn(
                'grid gap-1',
                post.images.length === 1 ? 'grid-cols-1' :
                post.images.length === 2 ? 'grid-cols-2' :
                post.images.length === 3 ? 'grid-cols-3' :
                'grid-cols-2'
              )}>
                {post.images.slice(0, 4).map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img}
                      alt=""
                      className="w-full h-48 object-cover"
                    />
                    {idx === 3 && post.images.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">+{post.images.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* 标签 */}
            <div className="px-5 py-3 flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs bg-lake-green-500/10 text-lake-green-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
            
            {/* 钓点信息 */}
            {post.spotName && (
              <div className="mx-5 mb-4 p-3 rounded-xl bg-deep-sea-800/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-lake-green-500/20 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-lake-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{post.spotName}</p>
                  <p className="text-xs text-moonlight-400">钓点打卡</p>
                </div>
              </div>
            )}
            
            {/* 标签 */}
            {post.tags && post.tags.length > 0 && (
              <div className="mx-5 mb-4 flex flex-wrap gap-2">
                {post.tags.slice(0, 4).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-md text-xs bg-deep-sea-500/20 text-deep-sea-300 flex items-center gap-1"
                  >
                    <Droplets size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* 操作栏 */}
            <div className="px-5 py-4 border-t border-deep-sea-700/30 flex items-center justify-around">
              <button
                onClick={() => toggleLike(post.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                  post.isLiked
                    ? 'text-red-400 bg-red-500/10'
                    : 'text-moonlight-400 hover:text-red-400 hover:bg-red-500/10'
                )}
              >
                <Heart size={18} className={post.isLiked ? 'fill-current' : ''} />
                <span className="text-sm">{post.likes}</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-moonlight-400 hover:text-lake-green-400 hover:bg-lake-green-500/10 transition-all">
                <MessageCircle size={18} />
                <span className="text-sm">{post.comments}</span>
              </button>
              <button
                onClick={() => toggleBookmark(post.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                  post.isBookmarked
                    ? 'text-yellow-400 bg-yellow-500/10'
                    : 'text-moonlight-400 hover:text-yellow-400 hover:bg-yellow-500/10'
                )}
              >
                <Bookmark size={18} className={post.isBookmarked ? 'fill-current' : ''} />
                <span className="text-sm">收藏</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-moonlight-400 hover:text-deep-sea-400 hover:bg-deep-sea-500/10 transition-all">
                <Share2 size={18} />
                <span className="text-sm">分享</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
