import { useState } from 'react';
import { mockNews } from '../data/mockData';
import {
  Newspaper,
  Eye,
  Calendar,
  Tag,
  Search,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

const categoryTags = [
  { id: 'all', name: '全部', icon: '📰' },
  { id: '政策法规', name: '政策法规', icon: '📋' },
  { id: '乡村振兴', name: '乡村振兴', icon: '🌾' },
  { id: '教育资讯', name: '教育资讯', icon: '🎓' },
  { id: '科技创新', name: '科技创新', icon: '💡' },
  { id: '社会实践', name: '社会实践', icon: '🤝' },
];

const subjectTags = [
  { id: '计算机类', name: '计算机类', color: 'blue' },
  { id: '农林类', name: '农林类', color: 'green' },
  { id: '经管类', name: '经管类', color: 'yellow' },
  { id: '教育类', name: '教育类', color: 'purple' },
  { id: '文史类', name: '文史类', color: 'orange' },
  { id: '医学类', name: '医学类', color: 'red' },
];

const News = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState<string[]>(['计算机类']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNews, setSelectedNews] = useState<string | null>(
    mockNews[0]?.id || null
  );

  const toggleSubject = (subject: string) => {
    setSelectedSubject((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const filteredNews = mockNews.filter((news) => {
    const matchesCategory =
      selectedCategory === 'all' || news.category === selectedCategory;
    const matchesSearch =
      news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      news.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject =
      selectedSubject.length === 0 ||
      news.tags.some((tag) =>
        selectedSubject.some((subj) => tag.includes(subj.replace('类', '')))
      );
    return matchesCategory && matchesSearch && (
      selectedSubject.length === 0 || matchesSubject
    );
  });

  const activeNews = mockNews.find((n) => n.id === selectedNews);

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索新闻标题、内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span>今日推荐 {mockNews.length} 条资讯</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">学科标签（智能推荐）</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {subjectTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleSubject(tag.id)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                selectedSubject.includes(tag.id)
                  ? colorClasses[tag.color] + ' font-medium'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {categoryTags.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span>{cat.icon}</span>
            <span className="text-sm font-medium">{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">资讯列表</h3>
            <p className="text-xs text-gray-500 mt-1">
              共 {filteredNews.length} 条相关资讯
            </p>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {filteredNews.map((news) => (
              <div
                key={news.id}
                onClick={() => setSelectedNews(news.id)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedNews === news.id
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <h4 className="text-sm font-medium text-gray-800 line-clamp-2">
                  {news.title}
                </h4>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  {news.summary}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                      {news.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{news.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{news.publishDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {activeNews ? (
            <div className="h-[600px] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {activeNews.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    来源：{activeNews.source}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 leading-tight">
                  {activeNews.title}
                </h2>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{activeNews.publishDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{activeNews.views} 次阅读</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>约5分钟阅读</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-2">
                {activeNews.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {activeNews.content}
                  </p>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Newspaper className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      小编推荐
                    </span>
                  </div>
                  <p className="text-xs text-blue-600">
                    该资讯与您关注的学科标签高度匹配，建议深入阅读并结合专业知识思考实践应用方向。
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">请选择一篇资讯查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default News;
