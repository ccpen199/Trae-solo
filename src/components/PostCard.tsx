import React, { useState } from 'react';
import { Heart, MessageCircle, Flag, MoreHorizontal, Eye, Handshake } from 'lucide-react';
import type { Post } from '@/types';

interface PostCardProps {
  post: Post;
  onLike?: (id: number) => void;
  onReport?: (id: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onReport }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes);
  const [showMenu, setShowMenu] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
    onLike?.(post.id);
  };

  return (
    <div className="card group hover:-translate-y-1 duration-300">
      <div className="flex items-start gap-3 mb-3">
        <img
          src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author}`}
          alt={post.author}
          className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{post.author}</h4>
              {post.is_verified && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">已认证</span>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 animate-fade-in">
                  <button
                    onClick={() => {
                      onReport?.(post.id);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left"
                  >
                    <Flag className="w-4 h-4" />
                    举报
                  </button>
                </div>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-500">{post.createdAt}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block badge bg-primary-100 text-primary-700">{post.category}</span>
        {post.tags?.map((tag, idx) => (
          <span key={idx} className="inline-block badge bg-gray-100 text-gray-600 text-xs">{tag}</span>
        ))}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
        {post.title}
      </h3>
      <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>
      {post.images && post.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {post.images.slice(0, 3).map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt=""
              className="w-full h-24 object-cover rounded-lg"
            />
          ))}
        </div>
      )}
      {post.category === '互助求助' && (
        <div className="mb-4 p-3 bg-pink-50 rounded-lg border border-pink-100">
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-pink-500" />
            <span className="text-pink-700 font-medium">
              互助响应: {post.help_responses ?? post.comments} 人已响应
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm transition-colors ${
            isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span>{likes}</span>
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Eye className="w-5 h-5" />
          <span>{post.views || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
