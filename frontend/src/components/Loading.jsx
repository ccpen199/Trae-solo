const Loading = ({ size = 'medium', text = '加载中...' }) => {
  const sizes = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  return (
    <div style={styles.container}>
      <div style={{ ...styles.spinner, width: sizes[size], height: sizes[size] }}>
        <div />
        <div />
        <div />
        <div />
      </div>
      {text && <p style={styles.text}>{text}</p>}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px'
  },
  spinner: {
    position: 'relative',
    animation: 'spin 1.2s linear infinite'
  },
  text: {
    marginTop: '16px',
    color: '#666',
    fontSize: '14px'
  }
};

export default Loading;
