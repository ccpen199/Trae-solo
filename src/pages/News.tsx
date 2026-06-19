import { useState, useMemo, useEffect, useRef } from 'react';
import { mockNews } from '../data/mockData';
import {
  Newspaper,
  Eye,
  Calendar,
  Tag,
  Search,
  BookOpen,
  TrendingUp,
  Settings,
  X,
  Clock,
  CheckCircle2,
  ChevronRight,
  Cloud,
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

const subjectPreferenceOptions = [
  { id: '计算机类', name: '计算机类', description: '人工智能、大数据、软件开发等' },
  { id: '农林类', name: '农林类', description: '农业技术、林业、畜牧兽医等' },
  { id: '经管类', name: '经管类', description: '经济管理、金融、市场营销等' },
  { id: '教育类', name: '教育类', description: '教育学、教育技术、师范教育等' },
  { id: '文史类', name: '文史类', description: '文学、历史、哲学、新闻传播等' },
  { id: '医学类', name: '医学类', description: '临床医学、公共卫生、药学等' },
];

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'info';
}

const News = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState<string[]>(['计算机类']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNews, setSelectedNews] = useState<string | null>(
    mockNews[0]?.id || null
  );
  const [activeTab, setActiveTab] = useState<'recommend' | 'read'>('recommend');
  const [readHistory, setReadHistory] = useState<string[]>([]);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [tempPreferences, setTempPreferences] = useState<string[]>(['计算机类']);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });
  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const tagCloud = useMemo(() => {
    const tagCount: Record<string, number> = {};
    mockNews.forEach((news) => {
      news.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const getTagStyle = (count: number, maxCount: number) => {
    const ratio = count / maxCount;
    const fontSize = 12 + ratio * 16;
    const opacity = 0.5 + ratio * 0.5;
    const colors = ['text-blue-400', 'text-blue-500', 'text-blue-600', 'text-blue-700', 'text-blue-800'];
    const colorIndex = Math.min(Math.floor(ratio * colors.length), colors.length - 1);
    return { fontSize: `${fontSize}px`, opacity, colorClass: colors[colorIndex] };
  };

  const maxTagCount = Math.max(...tagCloud.map((t) => t.count), 1);

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const progress = scrollHeight > clientHeight
          ? (scrollTop / (scrollHeight - clientHeight)) * 100
          : 0;
        setReadingProgress(Math.min(progress, 100));
      }
    };

    const element = contentRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (element) {
        element.removeEventListener('scroll', handleScroll);
      }
    };
  }, [selectedNews]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubject((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleNewsClick = (newsId: string) => {
    setSelectedNews(newsId);
    setReadingProgress(0);
    setReadHistory((prev) => {
      const filtered = prev.filter((id) => id !== newsId);
      const newHistory = [newsId, ...filtered];
      return newHistory.slice(0, 10);
    });
  };

  const handleTagClick = (tag: string) => {
    const matchedSubject = subjectTags.find((s) => tag.includes(s.id.replace('类', '')));
    if (matchedSubject && !selectedSubject.includes(matchedSubject.id)) {
      toggleSubject(matchedSubject.id);
    } else if (!matchedSubject) {
      const newsWithTag = mockNews.find((n) => n.tags.includes(tag));
      if (newsWithTag) {
        setSelectedNews(newsWithTag.id);
      }
    }
  };

  const handleSavePreferences = () => {
    setSelectedSubject([...tempPreferences]);
    setShowPreferenceModal(false);
    showToast('偏好已更新', 'success');
  };

  const handleOpenPreferenceModal = () => {
    setTempPreferences([...selectedSubject]);
    setShowPreferenceModal(true);
  };

  const toggleTempPreference = (subject: string) => {
    setTempPreferences((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const filteredNews = useMemo(() => {
    return mockNews.filter((news) => {
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
  }, [selectedCategory, selectedSubject, searchTerm]);

  const displayNews = useMemo(() => {
    if (activeTab === 'read') {
      return mockNews.filter((news) => readHistory.includes(news.id));
    }
    return filteredNews;
  }, [activeTab, filteredNews, readHistory]);

  const activeNews = mockNews.find((n) => n.id === selectedNews);

  const relatedNews = useMemo(() => {
    if (!activeNews) return [];
    return mockNews
      .filter((n) =>
        n.id !== activeNews.id &&
        n.tags.some((tag) => activeNews.tags.includes(tag))
      )
      .slice(0, 3);
  }, [activeNews]);

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6 relative">
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
        }`}>
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {showPreferenceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">设置学科偏好</h3>
                <p className="text-xs text-gray-500 mt-1">系统将根据您的偏好智能推送资讯</p>
              </div>
              <button
                onClick={() => setShowPreferenceModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                {subjectPreferenceOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      tempPreferences.includes(option.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={tempPreferences.includes(option.id)}
                      onChange={() => toggleTempPreference(option.id)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{option.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowPreferenceModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存偏好
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">学科标签（智能推荐）</span>
          </div>
          <button
            onClick={handleOpenPreferenceModal}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            设置偏好
          </button>
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

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">热门标签</span>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {tagCloud.map(({ tag, count }) => {
              const style = getTagStyle(count, maxTagCount);
              return (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-2 py-1 rounded hover:bg-gray-100 transition-colors ${style.colorClass}`}
                  style={{ fontSize: style.fontSize, opacity: style.opacity }}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">资讯列表</h3>
                <p className="text-xs text-gray-500 mt-1">
                  共 {displayNews.length} 条相关资讯
                </p>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setActiveTab('recommend')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'recommend'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  推荐
                </button>
                <button
                  onClick={() => setActiveTab('read')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                    activeTab === 'read'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  已读
                </button>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {displayNews.length > 0 ? (
              displayNews.map((news) => (
                <div
                  key={news.id}
                  onClick={() => handleNewsClick(news.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedNews === news.id
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <h4 className={`text-sm font-medium line-clamp-2 ${
                    readHistory.includes(news.id) ? 'text-gray-400' : 'text-gray-800'
                  }`}>
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
              ))
            ) : (
              <div className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  {activeTab === 'read' ? '暂无阅读记录' : '暂无相关资讯'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {activeNews ? (
            <div className="h-[600px] flex flex-col">
              <div className="relative h-1 bg-gray-100">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-150"
                  style={{ width: `${readingProgress}%` }}
                />
              </div>
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

              <div ref={contentRef} className="flex-1 p-6 overflow-y-auto">
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

                {relatedNews.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-800">相关推荐</span>
                    </div>
                    <div className="space-y-3">
                      {relatedNews.map((news) => (
                        <div
                          key={news.id}
                          onClick={() => handleNewsClick(news.id)}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                              {news.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {news.summary}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {news.category}
                              </span>
                              <span className="text-xs text-gray-400">{news.publishDate}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
