import { useEffect, useState } from 'react';
import { Carousel, Card, Row, Col, Button, Avatar, Badge, Spin, Empty, message } from 'antd';
import { 
  PlayCircleOutlined, 
  SearchOutlined, 
  BookOutlined, 
  ReadOutlined, 
  ShoppingOutlined, 
  UserOutlined,
  CrownOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
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
  intro: string;
  duration: number;
  is_free: number;
  owned?: number;
}

interface Banner {
  id: number;
  title: string;
  image: string;
  link: string;
}

export default function Home() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserStore();
  const { setBook } = usePlayerStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bannerRes, bookRes] = await Promise.all([
        api.get<Banner[]>('/home/banners'),
        api.get<Book[]>('/home/books'),
      ]);

      if (bannerRes.success) setBanners(bannerRes.data || []);
      if (bookRes.success) setBooks(bookRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayBook = (book: Book) => {
    if (!book.is_free && !book.owned && !isLoggedIn) {
      message.info('请先登录后收听完整内容');
      navigate('/login');
      return;
    }
    if (!book.is_free && !book.owned && user?.is_vip === 0) {
      message.info('该内容需VIP会员或购买后收听');
      return;
    }
    setBook(book);
    message.success('开始播放');
  };

  const quickMenu = [
    { icon: <BookOutlined />, title: '听书', color: 'bg-orange-500', path: '/books' },
    { icon: <ReadOutlined />, title: '课程', color: 'bg-blue-500', path: '/courses' },
    { icon: <CrownOutlined />, title: 'VIP', color: 'bg-yellow-500', path: '/vip' },
    { icon: <ShoppingOutlined />, title: '商城', color: 'bg-red-500', path: '/mall' },
  ];

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {isLoggedIn ? (
              <Avatar size={40} icon={<UserOutlined />} className="bg-white text-orange-500" />
            ) : (
              <Avatar size={40} icon={<UserOutlined />} className="bg-white/30" />
            )}
            <div className="text-white">
              <div className="font-semibold">
                {isLoggedIn ? (
                  <span className="flex items-center">
                    {user?.nickname}
                    {user?.is_vip ? <CrownOutlined className="ml-2 text-yellow-300" /> : null}
                  </span>
                ) : (
                  <span onClick={() => navigate('/login')} className="cursor-pointer hover:underline">
                    点击登录
                  </span>
                )}
              </div>
              <div className="text-sm text-white/80">
                {isLoggedIn ? `智慧币: ${user?.wisdom_coins || 0}` : '登录解锁更多精彩内容'}
              </div>
            </div>
          </div>
          <Button 
            type="text" 
            icon={<SearchOutlined />} 
            className="text-white"
            onClick={() => navigate('/search')}
          />
        </div>
      </div>

      {banners.length > 0 && (
        <div className="px-4 -mt-2">
          <Carousel autoplay className="rounded-xl overflow-hidden shadow-lg">
            {banners.map((banner) => (
              <div key={banner.id} className="relative h-40 cursor-pointer" onClick={() => navigate(banner.link)}>
                <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                  <span className="text-white font-medium">{banner.title}</span>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      )}

      <div className="px-4 py-6">
        <Row gutter={16}>
          {quickMenu.map((item, index) => (
            <Col key={index} span={6}>
              <div 
                className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(item.path)}
              >
                <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white text-2xl mb-2 shadow-lg`}>
                  {item.icon}
                </div>
                <span className="text-sm text-gray-700">{item.title}</span>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      <div className="mx-4 mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <CrownOutlined className="text-2xl text-white" />
            </div>
            <div className="text-white">
              <div className="font-bold text-lg">开通VIP会员</div>
              <div className="text-sm text-white/90">畅听全场2000+精品书籍</div>
            </div>
          </div>
          <Button type="primary" className="bg-white text-orange-500 border-none hover:bg-white/90" onClick={() => navigate('/vip')}>
            立即开通
          </Button>
        </div>
      </div>

      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">精选书籍</h2>
          <Button type="text" icon={<RightOutlined />} onClick={() => navigate('/books')}>
            查看更多
          </Button>
        </div>

        {books.length === 0 ? (
          <Empty description="暂无书籍" />
        ) : (
          <Row gutter={[16, 16]}>
            {books.slice(0, 6).map((book) => (
              <Col key={book.id} xs={12} sm={8} md={6}>
                <Card 
                  hoverable
                  variant="borderless"
                  className="h-full shadow-md"
                  cover={
                    <div className="relative">
                      <img alt={book.title} src={book.cover} className="h-40 object-cover" />
                      <PlayCircleOutlined 
                        className="absolute bottom-2 right-2 text-3xl text-white/90 cursor-pointer hover:text-white hover:scale-110 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayBook(book);
                        }}
                      />
                      {book.is_free ? (
                        <Badge count="免费" className="absolute top-2 left-2" style={{ backgroundColor: '#52c41a' }} />
                      ) : book.owned || user?.is_vip ? (
                        <Badge count="已解锁" className="absolute top-2 left-2" style={{ backgroundColor: '#1890ff' }} />
                      ) : null}
                    </div>
                  }
                  onClick={() => navigate(`/book/${book.id}`)}
                >
                  <Card.Meta 
                    title={<div className="text-sm font-medium truncate">{book.title}</div>}
                    description={<div className="text-xs text-gray-500 truncate">{book.speaker} 解读</div>}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}
