import React from 'react';

const Empty = ({ message = '暂无数据', icon = '📭' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#999'
  }}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
    <span>{message}</span>
  </div>
);

export default Empty;
