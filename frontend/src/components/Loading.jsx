import { Spin } from 'antd';

const Loading = ({ text = '加载中...' }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: '60px 20px' 
  }}>
    <Spin size="large" />
    <p style={{ marginTop: 16, color: '#666' }}>{text}</p>
  </div>
);

export default Loading;
