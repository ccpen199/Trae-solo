import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { circleAPI } from '../api';

const Circles = () => {
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCircles();
  }, []);

  const loadCircles = async () => {
    setLoading(true);
    try {
      const res = await circleAPI.getCircles();
      setCircles(res.data);
    } catch (error) {
      console.error('加载圈子失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (circleId, isMember) => {
    try {
      if (isMember) {
        await circleAPI.leaveCircle(circleId);
      } else {
        await circleAPI.joinCircle(circleId);
      }
      loadCircles();
    } catch (error) {
      console.error('操作失败', error);
    }
  };

  return (
    <div>
      <div className="header">
        <h1>小世界</h1>
        <span></span>
      </div>

      <div className="container">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          circles.map(circle => (
            <div 
              key={circle.id} 
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/circles/${circle.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '32px' }}>{circle.icon}</div>
                  <div>
                    <div style={{ fontWeight: '600' }}>{circle.name}</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      {circle.member_count} 成员 · {circle.post_count} 动态
                    </div>
                  </div>
                </div>
                <button
                  className={circle.is_member ? 'btn btn-outline' : 'btn btn-primary'}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoin(circle.id, circle.is_member);
                  }}
                >
                  {circle.is_member ? '已加入' : '加入'}
                </button>
              </div>
              <p style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>{circle.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Circles;
