import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookApi } from '@/services/api';
import { Book, Review } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchBookDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [bookResponse, reviewsResponse] = await Promise.all([
          bookApi.getBook(Number(id)),
          bookApi.getBookReviews(Number(id))
        ]);
        
        if (bookResponse.data.success && bookResponse.data.data) {
          setBook(bookResponse.data.data);
        }
        if (reviewsResponse.data.success && reviewsResponse.data.data) {
          setReviews(reviewsResponse.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch book detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookDetail();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!book) return;
    const success = await addToCart(book.id, quantity);
    if (success) {
      alert('已添加到购物车');
    } else {
      alert('添加失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p className="empty-state-text">图书不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="card card-body" style={{ marginBottom: '2rem' }}>
        <div className="flex" style={{ gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ 
            width: '300px', 
            height: '400px', 
            background: 'linear-gradient(135deg, var(--bg-secondary), #e2e8f0)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '5rem'
          }}>
            📖
          </div>
          
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              {book.title}
              {book.is_new && (
                <span style={{ 
                  background: 'var(--danger-color)', 
                  color: 'white', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  marginLeft: '0.5rem'
                }}>
                  新书
                </span>
              )}
            </h1>
            
            <div style={{ 
              background: '#f8fafc', 
              padding: '1.5rem', 
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger-color)' }}>
                ¥{book.actual_price.toFixed(2)}
                {book.discount_price && (
                  <span style={{ 
                    fontSize: '1rem', 
                    color: '#94a3b8', 
                    textDecoration: 'line-through',
                    marginLeft: '0.5rem'
                  }}>
                    ¥{book.price.toFixed(2)}
                  </span>
                )}
              </div>
              {book.discount_price && (
                <div style={{ marginTop: '0.5rem', color: 'var(--primary-color)' }}>
                  限时优惠
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ marginBottom: '0.5rem' }}><strong>作者：</strong>{book.author}</p>
              <p style={{ marginBottom: '0.5rem' }}><strong>出版社：</strong>{book.publisher}</p>
              <p style={{ marginBottom: '0.5rem' }}><strong>出版日期：</strong>{new Date(book.publish_date).toLocaleDateString('zh-CN')}</p>
              <p style={{ marginBottom: '0.5rem' }}><strong>ISBN：</strong>{book.isbn}</p>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>库存：</strong>
                {book.in_stock ? (
                  <span style={{ color: 'var(--success-color)' }}>有货</span>
                ) : (
                  <span style={{ color: 'var(--danger-color)' }}>缺货</span>
                )}
              </p>
              <p><strong>销量：</strong>{book.sales_count} 本</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>购买数量：</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  className="form-input"
                  style={{ width: '80px', textAlign: 'center' }}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                />
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-primary"
                onClick={handleAddToCart}
                disabled={!book.in_stock}
              >
                加入购物车
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => navigate('/books')}
              >
                返回列表
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card card-body">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          图书简介
        </h2>
        <p style={{ lineHeight: '1.8', color: '#475569' }}>
          {book.description || '暂无简介'}
        </p>
      </div>

      {reviews.length > 0 && (
        <div className="card card-body" style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            用户评价 ({reviews.length})
          </h2>
          
          {reviews.map((review) => (
            <div key={review.id} style={{ 
              padding: '1rem 0', 
              borderBottom: '1px solid var(--border-color)',
              '&:last-child': { borderBottom: 'none' }
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold' }}>
                  用户 {review.user_id}
                </span>
                <span style={{ color: '#f59e0b' }}>
                  {'⭐'.repeat(review.rating)}
                </span>
              </div>
              <p style={{ color: '#475569', lineHeight: '1.6' }}>
                {review.content}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                {new Date(review.created_at).toLocaleDateString('zh-CN')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookDetail;
