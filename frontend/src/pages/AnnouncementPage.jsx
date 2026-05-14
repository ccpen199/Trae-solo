import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageApi } from '../api';

const AnnouncementPage = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const res = await messageApi.getAnnouncements();
      if (res.data.success) {
        setAnnouncements(res.data.data);
      }
    } catch (err) {
      console.error('加载公告失败', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeInfo = (type) => {
    switch (type) {
      case 'coupon':
        return { icon: '🎫', label: '优惠券', color: '#ff6a00' };
      case 'safety':
        return { icon: '🛡️', label: '安全提示', color: '#07c160' };
      case 'activity':
        return { icon: '🎉', label: '活动', color: '#1890ff' };
      default:
        return { icon: '📢', label: '公告', color: '#666' };
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading" style={{ borderColor: '#ff6a00', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ 
        background: 'linear-gradient(180deg, #ff6a00 0%, #ff8a33 100%)', 
        padding: '16px', 
        paddingTop: '50px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div 
            onClick={() => navigate(-1)}
            style={{ fontSize: '20px', cursor: 'pointer' }}
          >
            ←
          </div>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}>福利公告</div>
          <div style={{ width: '20px' }}></div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎁</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>专属福利来袭</div>
          <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>
            新用户首单立减，老用户专享优惠
          </div>
        </div>
      </div>

      <div style={{ margin: '16px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #fff5ee 0%, #ffd4b8 100%)', 
          borderRadius: '16px', 
          padding: '20px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#ff6a00' }}>限时优惠</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#ff6a00', marginTop: '4px' }}>
                ¥10 <span style={{ fontSize: '14px' }}>新用户专享</span>
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                首单立减，无门槛使用
              </div>
            </div>
            <div style={{ 
              background: '#ff6a00', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '20px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              立即领取
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          {[
            { icon: '🎫', title: '优惠券', count: '3张' },
            { icon: '💳', title: '充值优惠', desc: '充100送20' },
            { icon: '⭐', title: '积分商城', desc: '积分换好礼' },
          ].map((item, index) => (
            <div 
              key={index}
              style={{ 
                flex: 1, 
                background: 'white', 
                borderRadius: '12px', 
                padding: '16px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.title}</div>
              {item.count && (
                <div style={{ fontSize: '12px', color: '#ff6a00', marginTop: '4px' }}>
                  {item.count}
                </div>
              )}
              {item.desc && (
                <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                  {item.desc}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>公告通知</div>
          
          {announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
              暂无公告
            </div>
          ) : (
            announcements.map((ann, index) => {
              const typeInfo = getTypeInfo(ann.type);
              return (
                <div 
                  key={ann.id}
                  style={{ 
                    padding: '16px 0',
                    borderBottom: index < announcements.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '10px',
                      background: `${typeInfo.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      {typeInfo.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '10px', 
                          background: `${typeInfo.color}15`, 
                          color: typeInfo.color, 
                          padding: '2px 6px', 
                          borderRadius: '4px' 
                        }}>
                          {typeInfo.label}
                        </span>
                        <span style={{ fontWeight: '500' }}>{ann.title}</span>
                      </div>
                      {ann.content && (
                        <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
                          {ann.content}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPage;