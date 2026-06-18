import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Eye, User } from 'lucide-react';
import { mockNews } from '@/mock/news';
import { NewsCategory } from '@/constants/enums';
import dayjs from 'dayjs';

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const news = mockNews.find((n) => n.id === id);

  if (!news) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-400">资讯未找到</p>
        <Link to="/news" className="text-primary-600 hover:underline mt-2 inline-block">返回资讯列表</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <Link to="/news" className="inline-flex items-center gap-1 text-primary-600 hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" />
        返回资讯列表
      </Link>
      <article className="card p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-surface-900">{news.title}</h1>
          <span className={`status-badge shrink-0 ${NewsCategory[news.category as keyof typeof NewsCategory]?.color}`}>
            {NewsCategory[news.category as keyof typeof NewsCategory]?.label}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-surface-400">
          <span className="flex items-center gap-1"><User className="w-4 h-4" />{news.author}</span>
          <span>{dayjs(news.publishedAt).format('YYYY-MM-DD')}</span>
          <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{news.views}</span>
        </div>
        {news.coverImage && (
          <img src={news.coverImage} alt="" className="w-full rounded-xl" />
        )}
        <p className="text-surface-600 leading-relaxed whitespace-pre-line">{news.content}</p>
        <div className="flex flex-wrap gap-1.5">
          {news.subjectTags.map((tag) => (
            <span key={tag} className="status-badge bg-surface-100 text-surface-600">{tag}</span>
          ))}
        </div>
      </article>
    </div>
  );
}
