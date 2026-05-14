import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { messageApi } from '../api';

const AnnouncementDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncement();
  }, [id]);

  const loadAnnouncement = async () => {
    try {
      const res = await messageApi.getAnnouncements();
      if (res.data.success) {
        const found = res.data.data.find(a => a.id === id);
        setAnnouncement(found);
      }
    } catch (err) {
      console.error('加载公告失败', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading" style={{ borderColor: '#ff6a00', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📢</div>
        <div>公告不存在</div>
        <button
          onClick={() => navigate(-1)}
          style={{ 
            marginTop: '24px',
            padding: '12px 32px',
            background: '#ff6a00',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            cursor: 'pointer'
          }}
        >
          返回
        </button>
      </div>
    );
  }

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

  const typeInfo = getTypeInfo(announcement.type);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ 
        background: 'white', 
        padding: '16px', 
        paddingTop: '50px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div 
          onClick={() => navigate(-1)}
          style={{ fontSize: '20px', cursor: 'pointer' }}
        >
          ←
        </div>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}>公告详情</div>
        <div style={{ width: '20px' }}></div>
      </div>

      <div style={{ background: 'white', margin: '16px', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px',
            background: `${typeInfo.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            {typeInfo.icon}
          </div>
          <div>
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
            </div>
            <div style={{ fontWeight: '600', marginTop: '4px' }}>{announcement.title}</div>
          </div>
        </div>

        <div style={{ 
          borderLeft: `3px solid ${typeInfo.color}`,
          paddingLeft: '12px',
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.6'
        }}>
          {announcement.content}
        </div>

        <div style={{ 
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #f0f0f0',
          fontSize: '12px',
          color: '#999'
        }}>
          发布时间: {announcement.created_at}
        </div>
      </div>

      <div style={{ padding: '0 16px', paddingBottom: '32px' }}>
        <button
          onClick={() => navigate('/announcement')}
          style={{ 
            width: '100%',
            padding: '14px',
            background: '#ff6a00',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          查看更多公告
        </button>
      </div>
    </div>
  );
};

export default AnnouncementDetail;