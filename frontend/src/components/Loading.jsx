import './Loading.css';

const Loading = ({ message = '加载中...' }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
};

export const EmptyState = ({ message = '暂无数据', icon = '📭' }) => {
  return (
    <div className="empty-container">
      <div className="empty-icon">{icon}</div>
      <p className="empty-text">{message}</p>
    </div>
  );
};

export default Loading;
