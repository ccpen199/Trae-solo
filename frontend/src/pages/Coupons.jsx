import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';

const Coupons = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [myCoupons, setMyCoupons] = useState([]);
  const [claimedIds, setClaimedIds] = useState([]);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const res = await axios.get('/api/coupons');
    setCoupons(res.data);
    
    if (user) {
      const myRes = await axios.get('/api/my-coupons');
      setMyCoupons(myRes.data);
      setClaimedIds(myRes.data.map(c => c.couponId));
    }
  };

  const claimCoupon = async (couponId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await axios.post(`/api/coupons/${couponId}/claim`);
      setClaimedIds([...claimedIds, couponId]);
      alert('领取成功！');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || '领取失败');
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
      marginBottom: '10px'
    },
    tabs: {
      display: 'flex',
      background: '#fff',
      marginTop: '10px',
      borderRadius: '20px',
      padding: '4px'
    },
    tab: {
      flex: 1,
      padding: '10px',
      textAlign: 'center',
      borderRadius: '18px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    tabActive: {
      background: '#ff4d4f',
      color: '#fff'
    },
    container: {
      padding: '15px'
    },
    couponCard: {
      background: '#fff',
      borderRadius: '12px',
      marginBottom: '15px',
      display: 'flex',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    },
    couponLeft: {
      background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
      padding: '20px 15px',
      minWidth: '100px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff'
    },
    discount: {
      fontSize: '32px',
      fontWeight: 'bold',
      lineHeight: 1
    },
    unit: {
      fontSize: '14px',
      marginTop: '4px'
    },
    couponRight: {
      padding: '15px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    },
    couponTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '5px'
    },
    condition: {
      fontSize: '12px',
      color: '#999',
      marginBottom: '10px'
    },
    expire: {
      fontSize: '12px',
      color: '#999'
    },
    claimBtn: {
      alignSelf: 'flex-end',
      padding: '8px 20px',
      background: '#ff4d4f',
      color: '#fff',
      border: 'none',
      borderRadius: '15px',
      fontSize: '13px',
      cursor: 'pointer'
    },
    claimedBtn: {
      background: '#ccc'
    },
    usedBtn: {
      background: '#999'
    },
    empty: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#999'
    }
  };

  const availableCoupons = activeTab === 'available' 
    ? coupons.filter(c => !claimedIds.includes(c.id))
    : myCoupons;

  return (
    <div>
      <div style={styles.header}>
        <div style={styles.title}>🎫 优惠券中心</div>
        <div style={styles.tabs}>
          <div 
            style={{ ...styles.tab, ...(activeTab === 'available' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('available')}
          >
            可领取
          </div>
          <div 
            style={{ ...styles.tab, ...(activeTab === 'my' ? styles.tabActive : {}) }}
            onClick={() => user ? setActiveTab('my') : navigate('/login')}
          >
            我的优惠券
          </div>
        </div>
      </div>

      <div style={styles.container}>
        {availableCoupons.length > 0 ? (
          availableCoupons.map(coupon => {
            const c = coupon.coupon || coupon;
            const isClaimed = claimedIds.includes(c.id);
            const status = coupon.status;
            
            return (
              <div key={c.id} style={styles.couponCard}>
                <div style={styles.couponLeft}>
                  <div style={styles.discount}>¥{c.discount}</div>
                  <div style={styles.unit}>满{c.minAmount}可用</div>
                </div>
                <div style={styles.couponRight}>
                  <div>
                    <div style={styles.couponTitle}>{c.title}</div>
                    <div style={styles.condition}>满{c.minAmount}元减{c.discount}元</div>
                    <div style={styles.expire}>有效期至：{c.expireTime}</div>
                  </div>
                  {activeTab === 'available' ? (
                    <button
                      onClick={() => claimCoupon(c.id)}
                      disabled={isClaimed}
                      style={{
                        ...styles.claimBtn,
                        ...(isClaimed ? styles.claimedBtn : {})
                      }}
                    >
                      {isClaimed ? '已领取' : '立即领取'}
                    </button>
                  ) : (
                    <button
                      style={{
                        ...styles.claimBtn,
                        ...(status === 'used' ? styles.usedBtn : styles.claimedBtn)
                      }}
                    >
                      {status === 'used' ? '已使用' : '未使用'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={styles.empty}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>
              {activeTab === 'available' ? '🎉' : '🎫'}
            </div>
            <p style={{ color: '#999' }}>
              {activeTab === 'available' ? '暂无可领取的优惠券' : '暂无优惠券'}
            </p>
            {activeTab === 'my' && !user && (
              <button
                onClick={() => navigate('/login')}
                style={{
                  marginTop: '20px',
                  padding: '12px 40px',
                  background: '#ff4d4f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                登录查看
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Coupons;
