import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, ThumbsUp, MessageCircle, Star, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import Avatar from './Avatar';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export function ArticleCard({ article }) {
  if (!article) return null;
  
  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <Link to={`/user/${article.author?.id}`} className="flex-shrink-0">
          <Avatar src={article.author?.avatar} alt={article.author?.nickname} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Link
              to={`/user/${article.author?.id}`}
              className="text-sm font-medium text-gray-900 hover:text-blue-600"
            >
              {article.author?.nickname || article.author?.username || '匿名用户'}
            </Link>
            <span className="text-xs text-gray-400">
              {article.publishDate ? dayjs(article.publishDate).fromNow() : dayjs(article.createdAt).fromNow()}
            </span>
            {article.category?.name && (
              <Link
                to={`/articles?categoryId=${article.category?.id}`}
                className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full"
              >
                {article.category.name}
              </Link>
            )}
            {article.isFeatured && (
              <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">推荐</span>
            )}
          </div>
          
          <Link to={`/article/${article.id}`}>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-2 line-clamp-2">
              {article.title}
            </h3>
          </Link>
          
          {article.summary && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{article.summary}</p>
          )}
          
          {article.tags && (
            <div className="flex flex-wrap gap-2 mb-3">
              {article.tags.split(',').filter(Boolean).slice(0, 4).map((tag, index) => (
                <span key={index} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-5 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye size={16} />
              {article.viewsCount || 0}
            </span>
            <span className={`flex items-center gap-1 ${article.isLiked ? 'text-red-500' : ''}`}>
              <ThumbsUp size={16} />
              {article.likesCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={16} />
              {article.commentsCount || 0}
            </span>
            <span className={`flex items-center gap-1 ${article.isFavorited ? 'text-amber-500' : ''}`}>
              <Star size={16} />
              {article.favoritesCount || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function QuestionCard({ question }) {
  if (!question) return null;
  
  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <Link to={`/user/${question.author?.id}`} className="flex-shrink-0">
          <Avatar src={question.author?.avatar} alt={question.author?.nickname} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Link
              to={`/user/${question.author?.id}`}
              className="text-sm font-medium text-gray-900 hover:text-blue-600"
            >
              {question.author?.nickname || question.author?.username || '匿名用户'}
            </Link>
            <span className="text-xs text-gray-400">
              {dayjs(question.createdAt).fromNow()}
            </span>
            {question.category?.name && (
              <Link
                to={`/questions?categoryId=${question.category?.id}`}
                className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full"
              >
                {question.category.name}
              </Link>
            )}
            {question.status && question.status !== 'open' && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                question.status === 'resolved' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
              }`}>
                {question.status === 'resolved' ? '已解决' : question.status === 'answered' ? '已回答' : '已关闭'}
              </span>
            )}
            {question.isFeatured && (
              <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">推荐</span>
            )}
          </div>
          
          <Link to={`/question/${question.id}`}>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-2">
              {question.title}
            </h3>
          </Link>
          
          {question.content && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{question.content}</p>
          )}
          
          {question.tags && (
            <div className="flex flex-wrap gap-2 mb-3">
              {question.tags.split(',').filter(Boolean).slice(0, 4).map((tag, index) => (
                <span key={index} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-5 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye size={16} />
              {question.viewsCount || 0}
            </span>
            <span className={`flex items-center gap-1 ${question.isLiked ? 'text-red-500' : ''}`}>
              <ThumbsUp size={16} />
              {question.likesCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={16} />
              {question.answersCount || 0}
            </span>
            <span className={`flex items-center gap-1 ${question.isFavorited ? 'text-amber-500' : ''}`}>
              <Star size={16} />
              {question.favoritesCount || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function MixedContentCard({ item }) {
  if (!item) return null;
  if (item.type === 'article' || item.status === 'published') {
    return <ArticleCard article={item} />;
  }
  return <QuestionCard question={item} />;
}
