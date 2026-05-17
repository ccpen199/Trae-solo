import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Spin, Empty, Tag, Input, Select, message, Button, Avatar } from 'antd';
import { 
  PlayCircleOutlined, 
  SearchOutlined, 
  CrownOutlined, 
  BookOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { api } from '../lib/api';
import { useUserStore } from '../store/userStore';
import { usePlayerStore } from '../store/playerStore';

interface Book {
  id: number;
  title: string;
  author: string;
  speaker: string;
  cover: string;
  category: string;
  tags: string;
  intro: string;
  duration: number;
  play_count: number;
  is_free: number;
  excerpt: string;
  owned?: number;
}

const { Search } = Input;
const { Option } = Select;

export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const { isLoggedIn, user } = useUserStore();
  const { setBook: setCurrentBook } = usePlayerStore();

  const categories = [
    { value: 'all', label: '全部' },
    { value: 'Classic', label: '经典名著' },
    { value: 'Growth', label: '个人成长' },
    { value: 'Business', label: '商业思维' },
    { value: 'Psychology', label: '心理学' },
    { value: 'History', label: '历史人文' },
  ];

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    filterBooks();
  }, [books, category, searchText]);

  const fetchBooks = async () => {
    try {
      const res = await api.get<Book[]>('/home/books');
      if (res.success) {
        setBooks(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch books:', error);
      message.error('加载书籍失败');
    } finally {
      setLoading(false);
    }
  };

  const filterBooks = () => {
    let filtered = [...books];

    if (category !== 'all') {
      filtered = filtered.filter(book => book.category === category);
    }

    if (searchText) {
      const text = searchText.toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(text) ||
        book.author.toLowerCase().includes(text) ||
        book.speaker.toLowerCase().includes(text) ||
        book.tags?.toLowerCase().includes(text)
      );
    }

    setFilteredBooks(filtered);
  };

  const handlePlay = (book: Book) => {
    if (!book.is_free && !book.owned && !user?.is_vip) {
      if (!isLoggedIn) {
        message.info('请先登录后收听完整内容');
        navigate('/login');
        return;
      }
      message.info('该内容需VIP会员或购买后收听');
      navigate('/vip');
      return;
    }
    
    setCurrentBook(book);
    message.success('开始播放');
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-white mb-2">听书</h1>
        <p className="text-white/80">樊登老师深度解读好书</p>
      </div>

      <div className="px-4 -mt-4">
        <Card className="shadow-md border-0 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Search
              placeholder="搜索书名、作者、讲书人..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
              size="large"
              prefix={<SearchOutlined />}
              className="flex-1"
            />
            <Select
              value={category}
              onChange={setCategory}
              size="large"
              style={{ width: '100%', maxWidth: 200 }}
            >
              {categories.map(cat => (
                <Option key={cat.value} value={cat.value}>{cat.label}</Option>
              ))}
            </Select>
          </div>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600">共 {filteredBooks.length} 本书</span>
          {user?.is_vip && (
            <Tag color="orange" icon={<CrownOutlined />}>VIP会员</Tag>
          )}
        </div>

        {filteredBooks.length === 0 ? (
          <Empty description="暂无符合条件的书籍" />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredBooks.map((book) => (
              <Col key={book.id} xs={24} sm={12} md={8} lg={6}>
                <Card 
                  hoverable
                  variant="borderless"
                  className="shadow-md h-full"
                  cover={
                    <div className="relative">
                      <img 
                        alt={book.title} 
                        src={book.cover} 
                        className="h-48 object-cover"
                      />
                      <PlayCircleOutlined 
                        className="absolute bottom-2 right-2 text-4xl text-white/90 cursor-pointer hover:text-white hover:scale-110 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlay(book);
                        }}
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {book.is_free ? (
                          <Tag color="green" className="m-0">免费</Tag>
                        ) : book.owned || user?.is_vip ? (
                          <Tag color="blue" className="m-0">已解锁</Tag>
                        ) : (
                          <Tag color="orange" className="m-0">VIP</Tag>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <ClockCircleOutlined />
                        {formatDuration(book.duration)}
                      </div>
                    </div>
                  }
                  onClick={() => navigate(`/book/${book.id}`)}
                >
                  <Card.Meta 
                    title={<div className="font-semibold truncate">{book.title}</div>}
                    description={
                      <div className="mt-2">
                        <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                          <UserOutlined />
                          <span>{book.speaker} 解读</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <PlayCircleOutlined />
                          <span>{book.play_count} 次播放</span>
                        </div>
                      </div>
                    }
                  />
                  
                  <div className="mt-3 flex flex-wrap gap-1">
                    {book.tags?.split(',').slice(0, 2).map((tag, index) => (
                      <Tag key={index} size="small" className="m-0 text-xs">{tag.trim()}</Tag>
                    ))}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}
