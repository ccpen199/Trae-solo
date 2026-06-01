import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Clock, TrendingUp, Trash2 } from 'lucide-react';
import { searchAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState({ posts: [], users: [] });
  const [history, setHistory] = useState([]);
  const [hotKeywords] = useState(['NBA', '湖人', '詹姆斯', 'C罗', '梅西', '欧冠', 'CBA', 'S14']);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setKeyword(q);
      doSearch(q);
    }
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (user) {
      try {
        const response = await searchAPI.search({ keyword: '' });
        setHistory(response.data.history || []);
      } catch (error) {
        console.error('加载搜索历史失败:', error);
      }
    }
  };

  const doSearch = async (q) => {
    if (!q.trim()) return;
    
    setLoading(true);
    setSearched(true);
    try {
      const response = await searchAPI.search({ keyword: q });
      setResults(response.data.results || { posts: [], users: [] });
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      setSearchParams({ q: keyword });
      doSearch(keyword);
    }
  };

  const handleHotClick = (kw) => {
    setKeyword(kw);
    setSearchParams({ q: kw });
    doSearch(kw);
  };

  const clearHistory = async () => {
    try {
      await searchAPI.clearHistory();
      setHistory([]);
    } catch (error) {
      console.error('清除历史失败:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索帖子、用户..."
            className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            搜索
          </button>
        </div>
      </form>

      {!searched && (
        <>
          {user && history.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  搜索历史
                </h3>
                <button
                  onClick={clearHistory}
                  className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  清空
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleHotClick(item.keyword)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {item.keyword}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              热门搜索
            </h3>
            <div className="flex flex-wrap gap-2">
              {hotKeywords.map((kw, index) => (
                <button
                  key={kw}
                  onClick={() => handleHotClick(kw)}
                  className="px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-sm hover:bg-orange-100 transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {searched && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-gray-500">
              搜索关键词: <span className="text-primary font-medium">"{keyword}"</span>
            </span>
          </div>

          {results.users && results.users.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4">用户</h3>
              <div className="space-y-3">
                {results.users.map((user) => (
                <Link
                  key={user.id}
                  to={`/user/${user.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 font-medium">
                      {(user.nickname || user.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.nickname || user.username}
                    </div>
                    <div className="text-xs text-gray-400">
                      Lv.{user.level} · {user.reputation}声望</div>
                  </div>
                </Link>
              ))}
              </div>
            </div>
          )}

          {results.posts && results.posts.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-4">帖子</h3>
              <div className="space-y-4">
                {results.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {(!results.posts || results.posts.length === 0) &&
            (!results.users || results.users.length === 0) && (
            <div className="text-center py-16 text-gray-400">
              未找到相关内容
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
