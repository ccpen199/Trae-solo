import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookApi, newsApi } from '@/services/api';
import { Book, News } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';

const Home = () => {
  const [newBooks, setNewBooks] = useState<Book[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [booksRes, newsRes] = await Promise.all([
          bookApi.getNewBooks(8),
          newsApi.getNews({ type: 'home', limit: 5 })
        ]);
        
        if (booksRes.data.success && booksRes.data.data) {
          setNewBooks(booksRes.data.data);
        }
        if (newsRes.data.success && newsRes.data.data) {
          setNews(newsRes.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = async (book: Book) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const success = await addToCart(book.id, 1);
    if (success) {
      alert('已添加到购物车');
    } else {
      alert('添加失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="container section">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">欢迎来到网上书店</h1>
          <p className="hero-subtitle">海量正版图书，品质保障，快速配送</p>
          <div style={{ marginTop: '2rem' }}>
            <button 
              className="btn btn-lg"
              style={{ background: 'white', color: '#667eea' }}
              onClick={() => navigate('/books')}
            >
              立即选购 →
            </button>
          </div>
        </div>
      </section>

      {news.length > 0 && (
        <section className="news-scroll">
          <div className="container">
            <div className="news-scroll-content">
              {news.map((n, index) => (
                <span key={n.id} style={{ margin: '0 2rem', whiteSpace: 'nowrap' }}>
                  📢 {n.title}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section container">
        <div className="flex justify-between items-center mb-6">
          <h2 className="section-title" style={{ marginBottom: 0 }}>新书上架</h2>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/books?isNew=true')}
          >
            查看全部 →
          </button>
        </div>

        {newBooks.length > 0 ? (
          <div className="grid grid-4">
            {newBooks.map((book) => (
              <div key={book.id} className="card book-card">
                <div 
                  className="book-cover"
                  onClick={() => navigate(`/books/${book.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '3rem' }}>📖</span>
                </div>
                <div className="book-card-content">
                  <h3 
                    className="book-title"
                    onClick={() => navigate(`/books/${book.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {book.title}
                    {book.is_new && <span className="new-badge">新书</span>}
                  </h3>
                  <p className="book-author">{book.author}</p>
                  <p className="book-publisher">{book.publisher}</p>
                  <div className="book-price">
                    <span className="price-current">¥{book.actual_price.toFixed(2)}</span>
                    {book.discount_price && (
                      <span className="price-original">¥{book.price.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleAddToCart(book)}
                    >
                      加入购物车
                    </button>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/books/${book.id}`)}
                    >
                      详情
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <p className="empty-state-text">暂无新书上架</p>
          </div>
        )}
      </section>

      <section className="section container">
        <div className="grid grid-3 gap-6">
          <div className="card card-body">
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚚</div>
            <h3 style={{ marginBottom: '0.5rem' }}>快速配送</h3>
            <p className="text-secondary">全国主要城市次日达，偏远地区3-5天送达</p>
          </div>
          <div className="card card-body">
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ marginBottom: '0.5rem' }}>品质保证</h3>
            <p className="text-secondary">100%正版图书，假一赔十，品质有保障</p>
          </div>
          <div className="card card-body">
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💬</div>
            <h3 style={{ marginBottom: '0.5rem' }}>贴心服务</h3>
            <p className="text-secondary">7天无理由退换货，专业客服在线解答</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
