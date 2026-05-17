import { useState, useEffect } from 'react';
import { Input, Tag, Card, Row, Col, Empty, Spin, Button, message } from 'antd';
import { SearchOutlined, CloseOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { usePlayerStore } from '../store/playerStore';
import { useUserStore } from '../store/userStore';

interface Book {
  id: number;
  title: string;
  author: string;
  speaker: string;
  cover: string;
  is_free: number;
}

interface HotSearch {
  id: number;
  keyword: string;
  search_count: number;
}

interface SearchHistory {
  keyword: string;
  last_search_at: string;
}

export default function Search() {
  const [keyword, setKeyword] = useState('');
  const [hotSearches, setHotSearches] = useState<HotSearch[]>([]);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();
  const { setBook } = usePlayerStore();
  const { isLoggedIn, user } = useUserStore();

  useEffect(() => {
    fetchHotSearches();
    fetchHistory();
  }, []);

  const fetchHotSearches = async () => {
    try {
      const res = await api.get<HotSearch[]>('/search/hot');
      if (res.success) setHotSearches(res.data || []);
    } catch (error) {
      console.error('Failed to fetch hot searches:', error);
    }
  };

  const fetchHistory = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await api.get<SearchHistory[]>('/search/history');
      if (res.success) setHistory(res.data || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleSearch = async (searchKeyword?: string) => {
    const kw = searchKeyword || keyword;
    if (!kw.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get<{ books: Book[]; courses: any[]; ebooks: any[] }>(`/search?keyword=${encodeURIComponent(kw)}`);
      if (res.success) {
        setBooks(res.data?.books || []);
        setKeyword(kw);
        fetchHistory();
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!isLoggedIn) return;
    try {
      await api.delete('/search/history');
      setHistory([]);
      message.success('已清除搜索历史');
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const handlePlayBook = (book: Book) => {
    if (!book.is_free && !isLoggedIn) {
      message.info('请先登录后收听完整内容');
      navigate('/login');
      return;
    }
    if (!book.is_free && user?.is_vip === 0) {
      message.info('该内容需VIP会员或购买后收听');
      return;
    }
    setBook(book);
    message.success('开始播放');
  };

  const highlightKeyword = (text: string, kw: string) => {
    if (!kw) return text;
    const parts = text.split(new RegExp(`(${kw})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === kw.toLowerCase() 
        ? <span key={index} className="text-orange-500 font-semibold">{part}</span>
        : <span key={index}>{part}</span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-4 sticky top-0 z-40 shadow-sm">
        <Input.Search
          placeholder="搜索书名、作者、分类..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={handleSearch}
          enterButton
          size="large"
          autoFocus
        />
      </div>

      <div className="px-4 py-6">
        {!searched ? (
          <>
            {history.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">搜索历史</h3>
                  <Button type="text" icon={<CloseOutlined />} size="small" onClick={clearHistory}>
                    清除
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((item, index) => (
                    <Tag 
                      key={index}
                      className="cursor-pointer px-3 py-1"
                      onClick={() => handleSearch(item.keyword)}
                    >
                      {item.keyword}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">热门搜索</h3>
              <div className="flex flex-wrap gap-2">
                {hotSearches.map((item, index) => (
                  <Tag 
                    key={item.id}
                    color={index < 3 ? 'orange' : 'default'}
                    className="cursor-pointer px-3 py-1"
                    onClick={() => handleSearch(item.keyword)}
                  >
                    {index + 1}. {item.keyword}
                  </Tag>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">
              搜索结果 "{keyword}"
            </h3>

            {loading ? (
              <div className="text-center py-12">
                <Spin size="large" />
              </div>
            ) : books.length === 0 ? (
              <Empty description="未找到相关书籍" />
            ) : (
              <Row gutter={[16, 16]}>
                {books.map((book) => (
                  <Col key={book.id} xs={24} sm={12} md={8}>
                    <Card 
                      hoverable
                      variant="borderless"
                      className="shadow-md"
                      cover={
                        <div className="relative">
                          <img alt={book.title} src={book.cover} className="h-48 object-cover" />
                          <PlayCircleOutlined 
                            className="absolute bottom-2 right-2 text-3xl text-white/90 cursor-pointer hover:text-white hover:scale-110 transition-all"
                            onClick={() => handlePlayBook(book)}
                          />
                          {book.is_free && (
                            <Tag color="success" className="absolute top-2 left-2">免费</Tag>
                          )}
                        </div>
                      }
                      onClick={() => navigate(`/book/${book.id}`)}
                    >
                      <Card.Meta 
                        title={<div className="truncate">{highlightKeyword(book.title, keyword)}</div>}
                        description={<div className="truncate">{highlightKeyword(book.speaker || book.author, keyword)}</div>}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
