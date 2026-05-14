import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const FlashSales = () => {
  const navigate = useNavigate();
  const [flashSales, setFlashSales] = useState([]);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchData();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    const [flashRes, productsRes] = await Promise.all([
      axios.get('/api/flash-sales'),
      axios.get('/api/products')
    ]);
    
    const withProducts = flashRes.data.map(f => ({
      ...f,
      product: productsRes.data.find(p => p.id === f.productId)
    }));
    setFlashSales(withProducts);
  };

  const updateCountdown = () => {
    const now = new Date();
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const diff = endTime - now;
    
    if (diff > 0) {
      setCountdown({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    }
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
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    countdownBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    countdownText: {
      fontSize: '14px'
    },
    countdownNumber: {
      background: '#000',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '16px',
      fontWeight: 'bold'
    },
    container: {
      padding: '15px'
    },
    saleCard: {
      background: '#fff',
      borderRadius: '12px',
      marginBottom: '15px',
      display: 'flex',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    },
    saleLink: {
      textDecoration: 'none',
      color: '#333',
      display: 'flex',
      width: '100%'
    },
    saleImg: {
      width: '120px',
      height: '120px',
      objectFit: 'cover',
      background: '#f0f0f0'
    },
    saleInfo: {
      flex: 1,
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    },
    saleTitle: {
      fontSize: '14px',
      marginBottom: '8px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2
    },
    priceRow: {
      display: 'flex',
      alignItems: 'baseline'
    },
    flashPrice: {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#ff4d4f'
    },
    flashPriceUnit: {
      fontSize: '12px',
      color: '#ff4d4f',
      marginRight: '8px'
    },
    originalPrice: {
      fontSize: '12px',
      color: '#999',
      textDecoration: 'line-through'
    },
    progressBar: {
      height: '20px',
      background: '#fff5f5',
      borderRadius: '10px',
      overflow: 'hidden',
      position: 'relative',
      marginTop: '8px'
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #ff4d4f, #ff7875)',
      transition: 'width 0.3s'
    },
    progressText: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      color: '#fff',
      fontWeight: 'bold'
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
        <div style={styles.title}>
          <span>⚡</span>
          <span>限时抢购</span>
        </div>
        <div style={styles.countdownBox}>
          <span style={styles.countdownText}>距离结束：</span>
          <span style={styles.countdownNumber}>
            {String(countdown.hours).padStart(2, '0')}
          </span>
          <span>:</span>
          <span style={styles.countdownNumber}>
            {String(countdown.minutes).padStart(2, '0')}
          </span>
          <span>:</span>
          <span style={styles.countdownNumber}>
            {String(countdown.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div style={styles.container}>
        {flashSales.length > 0 ? (
          flashSales.map(sale => (
            <div key={sale.id} style={styles.saleCard}>
              <Link 
                to={`/product/${sale.productId}`} 
                style={styles.saleLink}
              >
                {sale.product && (
                  <>
                    <img 
                      src={sale.product.image} 
                      style={styles.saleImg} 
                      alt={sale.product.title} 
                    />
                    <div style={styles.saleInfo}>
                      <div>
                        <div style={styles.saleTitle}>{sale.product.title}</div>
                        <div style={styles.priceRow}>
                          <span style={styles.flashPriceUnit}>¥</span>
                          <span style={styles.flashPrice}>{sale.price}</span>
                          <span style={styles.originalPrice}> ¥{sale.originalPrice}</span>
                        </div>
                      </div>
                      <div style={styles.progressBar}>
                        <div 
                          style={{ 
                            ...styles.progressFill, 
                            width: `${Math.min((sale.sold / sale.stock) * 100, 100)}%` 
                          }} 
                        />
                        <div style={styles.progressText}>
                          已抢{Math.round((sale.sold / sale.stock) * 100)}%
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </Link>
            </div>
          ))
        ) : (
          <div style={styles.empty}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚡</div>
            <p style={{ color: '#999' }}>暂无限时抢购</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashSales;
