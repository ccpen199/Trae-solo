import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [groupDeals, setGroupDeals] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [claimedCoupons, setClaimedCoupons] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [bannersRes, productsRes, couponsRes, flashRes, groupRes] = await Promise.all([
      axios.get('/api/banners'),
      axios.get('/api/products'),
      axios.get('/api/coupons'),
      axios.get('/api/flash-sales'),
      axios.get('/api/group-deals')
    ]);
    setBanners(bannersRes.data);
    setProducts(productsRes.data);
    setAllProducts(productsRes.data);
    setCoupons(couponsRes.data);
    
    const flashWithProducts = flashRes.data.map(f => ({
      ...f,
      product: productsRes.data.find(p => p.id === f.productId)
    }));
    setFlashSales(flashWithProducts);
    
    const groupWithProducts = groupRes.data.map(g => ({
      ...g,
      product: productsRes.data.find(p => p.id === g.productId)
    }));
    setGroupDeals(groupWithProducts);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      fetchData();
      setIsRefreshing(false);
    }, 1000);
  };

  const handleSearch = () => {
    if (!searchText.trim()) {
      setProducts(allProducts);
      return;
    }
    const keyword = searchText.toLowerCase();
    const filtered = allProducts.filter(p => 
      p.title.toLowerCase().includes(keyword) || 
      p.description.toLowerCase().includes(keyword)
    );
    setProducts(filtered);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const claimCoupon = async (couponId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await axios.post(`/api/coupons/${couponId}/claim`);
      setClaimedCoupons([...claimedCoupons, couponId]);
      alert('领取成功！');
    } catch (err) {
      alert(err.response?.data?.error || '领取失败');
    }
  };

  const styles = {
    header: {
      background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
      padding: '15px',
      color: '#fff'
    },
    searchBox: {
      background: '#fff',
      borderRadius: '20px',
      padding: '10px 15px',
      display: 'flex',
      alignItems: 'center',
      marginBottom: '15px'
    },
    searchInput: {
      border: 'none',
      outline: 'none',
      flex: 1,
      fontSize: '14px',
      marginLeft: '8px',
      background: 'transparent'
    },
    searchBtn: {
      background: '#ff4d4f',
      color: '#fff',
      border: 'none',
      padding: '6px 16px',
      borderRadius: '15px',
      fontSize: '13px',
      cursor: 'pointer'
    },
    banner: {
      width: '100%',
      height: '180px',
      background: '#ddd',
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '15px'
    },
    bannerImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    quickEntries: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '10px',
      padding: '15px',
      background: '#fff',
      marginBottom: '10px',
      borderRadius: '8px'
    },
    quickItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      cursor: 'pointer'
    },
    quickIcon: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      background: '#fff5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      marginBottom: '5px'
    },
    section: {
      background: '#fff',
      padding: '15px',
      marginBottom: '10px',
      borderRadius: '8px'
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    seeMore: {
      color: '#999',
      fontSize: '13px'
    },
    couponList: {
      display: 'flex',
      gap: '10px',
      overflowX: 'auto',
      paddingBottom: '5px'
    },
    couponCard: {
      background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)',
      border: '1px solid #ffccc7',
      borderRadius: '8px',
      padding: '12px',
      minWidth: '150px',
      position: 'relative'
    },
    couponDiscount: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#ff4d4f'
    },
    couponCondition: {
      fontSize: '12px',
      color: '#666',
      marginBottom: '8px'
    },
    couponTitle: {
      fontSize: '13px',
      fontWeight: 'bold',
      marginBottom: '8px'
    },
    couponBtn: {
      width: '100%',
      padding: '6px',
      background: '#ff4d4f',
      color: '#fff',
      border: 'none',
      borderRadius: '15px',
      fontSize: '12px',
      cursor: 'pointer'
    },
    couponBtnDisabled: {
      background: '#ccc',
      cursor: 'not-allowed'
    },
    flashList: {
      display: 'flex',
      gap: '10px',
      overflowX: 'auto',
      paddingBottom: '5px'
    },
    flashCard: {
      background: '#fff',
      borderRadius: '8px',
      overflow: 'hidden',
      minWidth: '130px',
      border: '1px solid #f0f0f0',
      cursor: 'pointer'
    },
    flashImg: {
      width: '130px',
      height: '130px',
      objectFit: 'cover',
      background: '#f0f0f0'
    },
    flashInfo: {
      padding: '8px'
    },
    flashPrice: {
      color: '#ff4d4f',
      fontSize: '16px',
      fontWeight: 'bold'
    },
    flashOriginalPrice: {
      color: '#999',
      fontSize: '12px',
      textDecoration: 'line-through',
      marginLeft: '5px'
    },
    flashProgress: {
      background: '#ff7875',
      borderRadius: '10px',
      padding: '2px 8px',
      color: '#fff',
      fontSize: '11px',
      marginTop: '5px',
      display: 'inline-block'
    },
    groupList: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px'
    },
    groupCard: {
      background: '#fff',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #f0f0f0',
      textDecoration: 'none',
      color: '#333'
    },
    groupImg: {
      width: '100%',
      aspectRatio: '1',
      objectFit: 'cover',
      background: '#f0f0f0'
    },
    groupInfo: {
      padding: '10px'
    },
    groupTitle: {
      fontSize: '14px',
      marginBottom: '8px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2
    },
    groupPrice: {
      color: '#ff4d4f',
      fontSize: '18px',
      fontWeight: 'bold'
    },
    groupOriginalPrice: {
      color: '#999',
      fontSize: '12px',
      textDecoration: 'line-through',
      marginLeft: '5px'
    },
    groupTag: {
      display: 'inline-block',
      background: '#ff4d4f',
      color: '#fff',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '11px',
      marginTop: '5px'
    },
    productsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px'
    },
    productCard: {
      background: '#fff',
      borderRadius: '8px',
      overflow: 'hidden',
      textDecoration: 'none',
      color: '#333',
      border: '1px solid #f0f0f0'
    },
    productImg: {
      width: '100%',
      aspectRatio: '1',
      objectFit: 'cover',
      background: '#f0f0f0'
    },
    productInfo: {
      padding: '10px'
    },
    productTitle: {
      fontSize: '14px',
      marginBottom: '8px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2
    },
    price: {
      color: '#ff4d4f',
      fontSize: '18px',
      fontWeight: 'bold'
    },
    originalPrice: {
      color: '#999',
      fontSize: '12px',
      textDecoration: 'line-through',
      marginLeft: '5px'
    },
    refreshIndicator: {
      textAlign: 'center',
      padding: '20px',
      color: '#999'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#999'
    },
    resetBtn: {
      marginTop: '15px',
      padding: '8px 24px',
      background: '#ff4d4f',
      color: '#fff',
      border: 'none',
      borderRadius: '20px',
      fontSize: '14px',
      cursor: 'pointer'
    }
  };

  const quickEntries = [
    { icon: '🎫', name: '领券', path: '/coupons' },
    { icon: '👥', name: '拼团', path: '/group-deals' },
    { icon: '⚡', name: '限时抢购', path: '/flash-sales' },
    { icon: '🏷', name: '生活服务' },
    { icon: '🎮', name: '互动游戏' }
  ];

  return (
    <div>
      <div style={styles.header}>
        <h2 style={{ marginBottom: '15px' }}>🐔 云集</h2>
        <div style={styles.searchBox}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="搜索商品"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            style={styles.searchInput}
          />
          <button 
            onClick={handleSearch} 
            style={styles.searchBtn}
          >
            搜索
          </button>
        </div>
      </div>

      {isRefreshing && (
        <div style={styles.refreshIndicator}>
          <div style={{ fontSize: '30px' }}>🐔</div>
          <div>云鸡正在刷新...</div>
        </div>
      )}

      {!searchText && (
        <>
          <div style={{ padding: '15px' }}>
            {banners.length > 0 && (
              <div style={styles.banner}>
                <img src={banners[0].image} style={styles.bannerImg} alt="banner" />
              </div>
            )}
          </div>

          <div style={styles.quickEntries}>
            {quickEntries.map((entry, i) => (
              <div 
                key={i} 
                style={styles.quickItem}
                onClick={() => entry.path && navigate(entry.path)}
              >
                <div style={styles.quickIcon}>{entry.icon}</div>
                <span style={{ fontSize: '12px' }}>{entry.name}</span>
              </div>
            ))}
          </div>

          {coupons.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitle}>
                  <span>🎫</span>
                  <span>优惠券</span>
                </div>
                <span style={styles.seeMore} onClick={() => navigate('/coupons')}>查看更多 ›</span>
              </div>
              <div style={styles.couponList}>
                {coupons.slice(0, 4).map(coupon => (
                  <div key={coupon.id} style={styles.couponCard}>
                    <div style={styles.couponDiscount}>¥{coupon.discount}</div>
                    <div style={styles.couponCondition}>满{coupon.minAmount}可用</div>
                    <div style={styles.couponTitle}>{coupon.title}</div>
                    <button
                      onClick={() => claimCoupon(coupon.id)}
                      disabled={claimedCoupons.includes(coupon.id)}
                      style={{
                        ...styles.couponBtn,
                        ...(claimedCoupons.includes(coupon.id) ? styles.couponBtnDisabled : {})
                      }}
                    >
                      {claimedCoupons.includes(coupon.id) ? '已领取' : '立即领取'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {flashSales.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitle}>
                  <span>⚡</span>
                  <span>限时抢购</span>
                  <span style={{ fontSize: '12px', color: '#ff4d4f' }}>进行中</span>
                </div>
                <span style={styles.seeMore} onClick={() => navigate('/flash-sales')}>查看更多 ›</span>
              </div>
              <div style={styles.flashList}>
                {flashSales.map(item => (
                  <Link 
                    key={item.id} 
                    to={`/product/${item.productId}`} 
                    style={styles.flashCard}
                  >
                    {item.product && (
                      <>
                        <img src={item.product.image} style={styles.flashImg} alt={item.product.title} />
                        <div style={styles.flashInfo}>
                          <div style={{ 
                            fontSize: '12px', 
                            marginBottom: '5px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.product.title}
                          </div>
                          <div>
                            <span style={styles.flashPrice}>¥{item.price}</span>
                            <span style={styles.flashOriginalPrice}>¥{item.originalPrice}</span>
                          </div>
                          <div style={styles.flashProgress}>
                            已抢{item.sold}件
                          </div>
                        </div>
                      </>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {groupDeals.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionTitle}>
                  <span>👥</span>
                  <span>拼团专区</span>
                </div>
                <span style={styles.seeMore} onClick={() => navigate('/group-deals')}>查看更多 ›</span>
              </div>
              <div style={styles.groupList}>
                {groupDeals.map(item => (
                  <Link 
                    key={item.id} 
                    to={`/product/${item.productId}?group=${item.id}`} 
                    style={styles.groupCard}
                  >
                    {item.product && (
                      <>
                        <img src={item.product.image} style={styles.groupImg} alt={item.product.title} />
                        <div style={styles.groupInfo}>
                          <div style={styles.groupTitle}>{item.product.title}</div>
                          <div>
                            <span style={styles.groupPrice}>¥{item.price}</span>
                            <span style={styles.groupOriginalPrice}>¥{item.originalPrice}</span>
                          </div>
                          <div style={styles.groupTag}>
                            {item.currentPeople}人团，还差{item.minPeople - (item.currentPeople % item.minPeople)}人
                          </div>
                        </div>
                      </>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>
            {searchText ? (
              <>
                <span>🔍</span>
                <span>搜索结果 ({products.length})</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>热门推荐</span>
              </>
            )}
          </div>
        </div>
        {products.length > 0 ? (
          <div style={styles.productsGrid}>
            {products.map(product => (
              <Link key={product.id} to={`/product/${product.id}`} style={styles.productCard}>
                <img src={product.image} style={styles.productImg} alt={product.title} />
                <div style={styles.productInfo}>
                  <div style={styles.productTitle}>{product.title}</div>
                  <div>
                    <span style={styles.price}>¥{product.price}</span>
                    <span style={styles.originalPrice}>¥{product.originalPrice}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>🔍</div>
            <p style={{ color: '#999' }}>没有找到相关商品</p>
            {searchText && (
              <button 
                onClick={() => { setSearchText(''); setProducts(allProducts); }} 
                style={styles.resetBtn}
              >
                重置搜索
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
