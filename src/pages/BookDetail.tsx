import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spin, Empty, message, Tag, Avatar, Rate, Divider } from 'antd';
import { 
  PlayCircleOutlined, 
  ArrowLeftOutlined, 
  UserOutlined, 
  ClockCircleOutlined,
  ShoppingCartOutlined,
  CrownOutlined
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

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useUserStore();
  const { setBook: setCurrentBook } = usePlayerStore();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);

  useEffect(() => {
    fetchBookDetail();
  }, [id]);

  const fetchBookDetail = async () => {
    try {
      const res = await api.get<Book>(`/home/books/${id}`);
      if (res.success) {
        setBook(res.data || null);
        setPurchased(res.data?.owned === 1 || false);
      }
    } catch (error) {
      console.error('Failed to fetch book detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (!book) return;

    if (!isLoggedIn) {
      message.info('请先登录后收听完整内容');
      navigate('/login');
      return;
    }

    if (!book.is_free && !purchased && !user?.is_vip) {
      setShowBuyModal(true);
      return;
    }

    setCurrentBook(book);
    message.success('开始播放');
  };

  const handleBuy = async () => {
    if (!isLoggedIn) {
      message.info('请先登录');
      navigate('/login');
      return;
    }

    try {
      const orderRes = await api.post<{ order_no: string }>('/order/create', {
        type: 'book',
        item_id: parseInt(id!)
      });

      if (orderRes.success && orderRes.data) {
        setOrderNo(orderRes.data.order_no);
        setShowBuyModal(true);
      }
    } catch (error) {
      console.error('Create order failed:', error);
      message.error('创建订单失败，请重试');
    }
  };

  const handlePay = async () => {
    try {
      const payRes = await api.post('/order/pay', { order_no: orderNo });
      if (payRes.success) {
        message.success('购买成功！');
        setPurchased(true);
        setShowBuyModal(false);
      } else {
        message.error('支付失败，请重试');
      }
    } catch (error) {
      console.error('Pay failed:', error);
      message.error('支付失败，请重试');
    }
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

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Empty description="书籍不存在" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-b from-orange-600 to-orange-500 px-4 pt-8 pb-12">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined className="text-white text-lg" />} 
          onClick={() => navigate(-1)}
          className="mb-4 text-white hover:text-white/80"
        />
        <div className="flex gap-4">
          <img 
            src={book.cover} 
            alt={book.title} 
            className="w-32 h-44 rounded-lg shadow-lg object-cover"
          />
          <div className="flex-1 text-white">
            <h1 className="text-xl font-bold mb-2">{book.title}</h1>
            <div className="flex items-center gap-2 mb-2 text-white/80">
              <Avatar size={20} icon={<UserOutlined />} />
              <span className="text-sm">{book.speaker} 解读</span>
            </div>
            <p className="text-sm text-white/70 mb-3">作者：{book.author}</p>
            <div className="flex items-center gap-4 text-sm text-white/70">
              <span className="flex items-center gap-1">
                <ClockCircleOutlined /> {formatDuration(book.duration)}
              </span>
              <span className="flex items-center gap-1">
                <PlayCircleOutlined /> {book.play_count} 次播放
              </span>
            </div>
            <div className="mt-3">
              {book.is_free ? (
                <Tag color="success" className="text-sm">免费书籍</Tag>
              ) : purchased || user?.is_vip ? (
                <Tag color="blue" className="text-sm">已解锁</Tag>
              ) : (
                <Tag color="orange" className="text-sm">VIP专属</Tag>
              )}
              <Tag color="default" className="text-sm">{book.category}</Tag>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6">
        <Card className="shadow-lg border-0 rounded-xl mb-4">
          <h3 className="font-bold text-lg mb-3">书籍简介</h3>
          <p className="text-gray-600 leading-relaxed">{book.intro}</p>
          
          <Divider />
          
          <h4 className="font-semibold mb-2">精选书摘</h4>
          <blockquote className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400 text-gray-700 italic">
            "{book.excerpt}"
          </blockquote>
        </Card>

        <Card className="shadow-lg border-0 rounded-xl">
          <h3 className="font-bold text-lg mb-4">主讲人</h3>
          <div className="flex items-center gap-4">
            <Avatar size={64} icon={<UserOutlined />} className="bg-orange-100 text-orange-500 text-2xl" />
            <div>
              <div className="font-semibold text-lg">{book.speaker}</div>
              <div className="text-gray-500 text-sm">资深讲书人 · 已解读 {Math.floor(Math.random() * 50) + 10} 本书</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            {book.is_free ? (
              <span className="text-green-500 font-bold text-xl">免费收听</span>
            ) : purchased || user?.is_vip ? (
              <span className="text-blue-500 font-bold text-xl">已解锁</span>
            ) : (
              <div className="flex items-center gap-2">
                <CrownOutlined className="text-orange-500 text-xl" />
                <span className="text-orange-500 font-bold text-sm">开通VIP免费听</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button 
              type="primary" 
              size="large"
              icon={<PlayCircleOutlined />}
              className="bg-orange-500"
              onClick={handlePlay}
            >
              立即播放
            </Button>
            {!book.is_free && !purchased && !user?.is_vip && (
              <Button 
                type="primary" 
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={handleBuy}
              >
                购买本书
              </Button>
            )}
          </div>
        </div>
      </div>

      {showBuyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="text-center">
              <img 
                src={book.cover} 
                alt={book.title} 
                className="w-24 h-32 object-cover rounded-lg mx-auto mb-4 shadow-md"
              />
              <h3 className="text-xl font-bold mb-2">{book.title}</h3>
              <p className="text-gray-500 mb-4">{book.speaker} 解读</p>
              
              <div className="bg-orange-50 p-4 rounded-lg mb-6 text-left">
                <h4 className="font-semibold mb-2 text-orange-700">购买后可享受：</h4>
                <ul className="text-sm text-orange-600 space-y-1">
                  <li>✓ 无限次收听完整版内容</li>
                  <li>✓ 支持后台播放、离线下载</li>
                  <li>✓ 播放进度自动同步</li>
                  <li>✓ VIP会员可免费收听</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button 
                  size="large" 
                  block
                  onClick={() => setShowBuyModal(false)}
                >
                  取消
                </Button>
                <Button 
                  type="primary" 
                  size="large" 
                  block
                  className="bg-orange-500"
                  onClick={handlePay}
                >
                  立即购买
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
