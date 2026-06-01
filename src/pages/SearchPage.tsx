import { useState, useEffect } from 'react';
import { Search, Clock, TrendingUp, X } from 'lucide-react';

const mockNews = [
  { id: 1, title: '曼城夺得英超冠军！', category: '英超' },
  { id: 2, title: '梅西再创纪录', category: '国际足球' },
  { id: 3, title: '中超联赛即将开幕', category: '中超' },
];

const mockTeams = [
  { id: 1, name: '曼城', league: '英超' },
  { id: 2, name: '阿森纳', league: '英超' },
  { id: 3, name: '皇马', league: '西甲' },
  { id: 4, name: '巴塞罗那', league: '西甲' },
];

const hotKeywords = ['曼城', '梅西', '英超冠军', '中超', '皇马', '欧冠'];

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ news: typeof mockNews; teams: typeof mockTeams } | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>(['梅西', '英超']);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const filteredNews = mockNews.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredTeams = mockTeams.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.league.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setResults({ news: filteredNews, teams: filteredTeams });
    setShowResults(true);
    
    if (!searchHistory.includes(searchQuery)) {
      setSearchHistory([searchQuery, ...searchHistory.slice(0, 4)]);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setShowResults(false);
    setResults(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">搜索</h1>
      
      {/* 搜索框 */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder="搜索球队、球员、新闻..."
          className="w-full pl-12 pr-12 py-4 rounded-full border-2 border-gray-200 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 text-lg transition-all"
        />
        {query && (
          <button onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2">
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* 搜索结果 */}
      {showResults && results && (
        <div className="mb-8 space-y-6">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">搜索结果</h3>
            <span className="ml-2 text-sm text-gray-500">
              共找到 {results.news.length + results.teams.length} 条结果
            </span>
          </div>
          
          {results.teams.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                球队 ({results.teams.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {results.teams.map((team) => (
                  <span key={team.id} className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm">
                    {team.name} - {team.league}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {results.news.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                新闻 ({results.news.length})
              </h4>
              <div className="space-y-2">
                {results.news.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                    <p className="text-gray-800">{item.title}</p>
                    <span className="text-xs text-gray-500">{item.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.news.length === 0 && results.teams.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-gray-500">没有找到相关结果</p>
              <p className="text-sm text-gray-400 mt-2">试试其他关键词吧</p>
            </div>
          )}
        </div>
      )}

      {/* 热门搜索 */}
      {!showResults && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-red-500" />
            热门搜索
          </h3>
          <div className="flex flex-wrap gap-2">
            {hotKeywords.map((keyword, index) => (
              <button
                key={keyword}
                onClick={() => {
                  setQuery(keyword);
                  handleSearch(keyword);
                }}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  index < 3
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 搜索历史 */}
      {!showResults && searchHistory.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-400" />
            搜索历史
          </h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((keyword) => (
              <button
                key={keyword}
                onClick={() => {
                  setQuery(keyword);
                  handleSearch(keyword);
                }}
                className="px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-gray-100 transition-colors"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
