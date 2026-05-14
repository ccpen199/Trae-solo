import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const GroupDeals = () => {
  const navigate = useNavigate();
  const [groupDeals, setGroupDeals] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [groupRes, productsRes] = await Promise.all([
      axios.get('/api/group-deals'),
      axios.get('/api/products')
    ]);
    setProducts(productsRes.data);
    
    const withProducts = groupRes.data.map(g => ({
      ...g,
      product: productsRes.data.find(p => p.id === g.productId)
    }));
    setGroupDeals(withProducts);
  };

  const styles = {
    header: {
      background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
      padding: '20px 15px',
      color: '#fff'
    },
    title: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '13px',
      opacity: 0.9
    },
    container: {
      padding: '15px'
    },
    dealCard: {
      background: '#fff',
      borderRadius: '12px',
      marginBottom: '15px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    },
    dealLink: {
      textDecoration: 'none',
      color: '#333',
      display: 'block'
    },
    dealImg: {
      width: '100%',
      aspectRatio: '16/10',
      objectFit: 'cover',
      background: '#f0f0f0'
    },
    dealInfo: {
      padding: '15px'
    },
    dealTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '10px'
    },
    priceRow: {
      display: 'flex',
      alignItems: 'baseline',
      marginBottom: '10px'
    },
    groupPrice: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#ff4d4f'
    },
    groupPriceUnit: {
      fontSize: '14px',
      color: '#ff4d4f',
      marginRight: '10px'
    },
    originalPrice: {
      fontSize: '14px',
      color: '#999',
      textDecoration: 'line-through'
    },
    progressBox: {
      background: '#fff5f5',
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    progressInfo: {
      fontSize: '14px',
      color: '#ff4d4f'
    },
    joinBtn: {
      padding: '10px 24px',
      background: '#ff4d4f',
      color: '#fff',
      border: 'none',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer'
    },
    empty: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#999'
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div style={styles.title}>👥 拼团专区</div>
        <div style={styles.subtitle}>邀请好友一起拼，享更多优惠！</div>
      </div>

      <div style={styles.container}>
        {groupDeals.length > 0 ? (
          groupDeals.map(deal => (
            <div key={deal.id} style={styles.dealCard}>
              <Link 
                to={`/product/${deal.productId}?group=${deal.id}`} 
                style={styles.dealLink}
              >
                {deal.product && (
                  <>
                    <img 
                      src={deal.product.image} 
                      style={styles.dealImg} 
                      alt={deal.product.title} 
                    />
                    <div style={styles.dealInfo}>
                      <div style={styles.dealTitle}>{deal.product.title}</div>
                      <div style={styles.priceRow}>
                        <span style={styles.groupPriceUnit}>¥</span>
                        <span style={styles.groupPrice}>{deal.price}</span>
                        <span style={styles.originalPrice}> ¥{deal.originalPrice}</span>
                      </div>
                      <div style={styles.progressBox}>
                        <span style={styles.progressInfo}>
                          🔥 {deal.currentPeople}人已拼
                        </span>
                        <button 
                          style={styles.joinBtn}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/product/${deal.productId}?group=${deal.id}`);
                          }}
                        >
                          去拼团
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </Link>
            </div>
          ))
        ) : (
          <div style={styles.empty}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>👥</div>
            <p style={{ color: '#999' }}>暂无拼团活动</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDeals;
