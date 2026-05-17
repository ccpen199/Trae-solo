const Loading = ({ message = '加载中...' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px'
  }}>
    <div style={{
      width: 40,
      height: 40,
      border: '4px solid #e0e0e0',
      borderTopColor: '#007AFF',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p style={{ marginTop: 16, color: '#666' }}>{message}</p>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default Loading;
