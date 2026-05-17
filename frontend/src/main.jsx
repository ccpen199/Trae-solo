import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1890ff' } }}>
        <App />
      </ConfigProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
