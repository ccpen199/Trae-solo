import React from 'react';

const Loading = ({ message = '加载中...' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#999'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #f0f0f0',
      borderTopColor: '#1890ff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px'
    }} />
    <span>{message}</span>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default Loading;
