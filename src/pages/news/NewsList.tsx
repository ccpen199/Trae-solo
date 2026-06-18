import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, User, Calendar, Tag, Search, BookOpen } from 'lucide-react';
import { mockNews } from '@/mock/news';
import { SUBJECT_TAGS } from '@/constants/config';
import { NewsCategory } from '@/constants/enums';
import dayjs from 'dayjs';

type CategoryKey = 'all' | 'policy' | 'case' | 'notice' | 'activity';

const categories: { key: CategoryKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'policy', label: '政策解读' },
  { key: 'case', label: '实践案例' },
  { key: 'notice', label: '活动通知' },
  { key: 'activity', label: '活动报道' },
];

const categoryIcons: Record<string, string> = {
  policy: '📜',
  case: '💡',
  notice: '📢',
  activity: '🎯',
};

export default function NewsList() {
  const [activeTag, setActiveTag] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNews = mockNews.filter((news) => {
    if (activeTag && !news.subjectTags.includes(activeTag)) return false;
    if (activeCategory !== 'all' && news.category !== activeCategory) return false;
    if (searchQuery && !news.title.includes(searchQuery) && !news.summary.includes(searchQuery)) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">资讯引擎</h1>
        <p className="text-surface-500 mt-1">基于学科标签的智能新闻聚合</p>
      </div>

      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2">
            <Search className="w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索资讯..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-surface-400"
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-surface-500 mb-2 flex items-center gap-1">
            <Tag className="w-3 h-3" /> 学科标签
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTag('')}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !activeTag ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              全部
            </button>
            {SUBJECT_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeTag === tag ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1 border-b border-surface-200 -mx-4 px-4">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeCategory === cat.key
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredNews.map((news, index) => {
          const catInfo = NewsCategory[news.category as keyof typeof NewsCategory];
          return (
            <motion.div
              key={news.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/news/${news.id}`}
                className="card card-hover p-5 flex gap-4 group"
              >
                <div className={`shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center text-2xl ${
                  news.category === 'policy' ? 'bg-primary-50' :
                  news.category === 'case' ? 'bg-success-50' :
                  news.category === 'notice' ? 'bg-accent-50' :
                  'bg-purple-50'
                }`}>
                  <span>{categoryIcons[news.category] || '📰'}</span>
                  <span className={`status-badge text-[10px] mt-1 ${catInfo?.color}`}>
                    {catInfo?.label}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <h3 className="font-semibold text-surface-900 line-clamp-1 group-hover:text-primary-700 transition-colors">
                    {news.title}
                  </h3>
                  <p className="text-sm text-surface-500 line-clamp-2 leading-relaxed">{news.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {news.subjectTags.slice(0, 3).map((tag) => (
                        <span key={tag} className="status-badge bg-surface-100 text-surface-600 text-[10px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-surface-400 shrink-0 ml-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {news.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {dayjs(news.publishedAt).format('MM-DD')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {news.views}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}

        {filteredNews.length === 0 && (
          <div className="text-center py-16 text-surface-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>没有找到匹配的资讯</p>
            <p className="text-xs mt-1">尝试更换标签或关键词</p>
          </div>
        )}
      </div>
    </div>
  );
}
