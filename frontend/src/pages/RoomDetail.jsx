import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <div className="header">
        <span style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>←</span>
        <h1>语音房间</h1>
        <span></span>
      </div>

      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            fontSize: '48px',
            color: 'white'
          }}>
            🎤
          </div>
          <h3 style={{ marginTop: '20px' }}>房间 #{id}</h3>
          <p style={{ color: '#999', marginTop: '8px' }}>0人在线</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '32px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#f5f5f5',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}>
                {i === 1 ? '👑' : '🎧'}
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                {i === 1 ? '房主' : '空位'}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn-primary">上麦</button>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>离开</button>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
