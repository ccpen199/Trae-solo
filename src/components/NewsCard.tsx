import { Link } from 'react-router-dom';
import { Calendar, Eye, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  cover?: string;
  category: string;
  publishTime: string;
  views: number;
  featured?: boolean;
}

interface NewsCardProps {
  news: NewsItem;
  variant?: 'horizontal' | 'vertical' | 'compact';
  className?: string;
}

export default function NewsCard({ news, variant = 'vertical', className }: NewsCardProps) {
  if (variant === 'compact') {
    return (
      <Link
        to={`/news/${news.id}`}
        className={cn(
          'group flex items-center justify-between gap-3 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gov-50/50 px-1 transition-colors',
          className,
        )}
      >
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-800 truncate group-hover:text-gov-600 transition-colors line-clamp-1">
            {news.title}
          </h4>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            {news.publishTime}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gov-500 flex-shrink-0 transition-colors" />
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link
        to={`/news/${news.id}`}
        className={cn(
          'card group flex flex-col md:flex-row gap-0 hover:-translate-y-0.5',
          className,
        )}
      >
        {news.cover && (
          <div className="md:w-56 h-44 md:h-auto flex-shrink-0 overflow-hidden">
            <img
              src={news.cover}
              alt={news.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="chip bg-gov-100 text-gov-700">{news.category}</span>
              {news.featured && (
                <span className="chip bg-warm-100 text-warm-600">置顶</span>
              )}
            </div>
            <h3 className="font-serif text-lg md:text-xl font-bold text-gray-900 group-hover:text-gov-600 transition-colors line-clamp-2">
              {news.title}
            </h3>
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{news.summary}</p>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 mt-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {news.publishTime}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {news.views} 阅读
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/news/${news.id}`}
      className={cn('card group hover:-translate-y-1', className)}
    >
      {news.cover ? (
        <div className="h-44 overflow-hidden">
          <img
            src={news.cover}
            alt={news.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="h-44 bg-gradient-to-br from-gov-100 to-gov-200 flex items-center justify-center">
          <span className="font-serif text-5xl font-bold text-gov-400">
            {news.title.charAt(0)}
          </span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="chip bg-gov-100 text-gov-700">{news.category}</span>
          {news.featured && <span className="chip bg-warm-100 text-warm-600">置顶</span>}
        </div>
        <h3 className="font-semibold text-gray-900 group-hover:text-gov-600 transition-colors line-clamp-2 leading-snug">
          {news.title}
        </h3>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{news.summary}</p>
        <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {news.publishTime}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {news.views}
          </span>
        </div>
      </div>
    </Link>
  );
}
