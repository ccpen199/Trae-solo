import React from 'react';

const EmptyState = ({ icon = '📭', title = '暂无数据', description, onAction, actionText }) => {
  return (
    <div style={styles.container}>
      <div style={styles.icon}>{icon}</div>
      <h3 style={styles.title}>{title}</h3>
      {description && <p style={styles.description}>{description}</p>}
      {onAction && (
        <button style={styles.button} onClick={onAction}>
          {actionText || '去添加'}
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px'
  },
  icon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  title: {
    fontSize: '16px',
    color: '#333',
    marginBottom: '8px'
  },
  description: {
    fontSize: '14px',
    color: '#999',
    marginBottom: '20px',
    textAlign: 'center'
  },
  button: {
    padding: '10px 24px',
    backgroundColor: '#ff4757',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer'
  }
};

export default EmptyState;
