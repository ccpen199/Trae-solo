import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntdApp, Result, Button } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 50 }}>
          <Result
            status="error"
            title="页面加载异常"
            subTitle={this.state.error?.message || '发生未知错误'}
            extra={[
              <Button type="primary" key="refresh" onClick={() => window.location.reload()}>
                刷新页面
              </Button>
            ]}
          />
          <pre style={{ background: '#fff1f0', padding: 20, borderRadius: 8, marginTop: 20, overflow: 'auto', maxHeight: 300, whiteSpace: 'pre-wrap' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConfigProvider locale={zhCN}>
        <AntdApp>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AntdApp>
      </ConfigProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
