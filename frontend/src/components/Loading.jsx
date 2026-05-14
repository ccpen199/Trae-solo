import React from 'react';

const Loading = ({ message = '加载中...' }) => {
  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <p style={styles.message}>{message}</p>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #ff4757',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  message: {
    marginTop: '16px',
    color: '#666',
    fontSize: '14px'
  }
};

export default Loading;
