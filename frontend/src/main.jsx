import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import './index.css';
import App from './App.jsx';

const theme = {
  token: {
    colorPrimary: '#1E6FDB',
    colorInfo: '#1E6FDB',
    colorSuccess: '#52C41A',
    colorWarning: '#FAAD14',
    colorError: '#F5222D',
    borderRadius: 6,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Button: {
      colorPrimary: '#1E6FDB',
      algorithm: true,
    },
    Menu: {
      colorItemBgSelected: '#E6F0FF',
      colorItemTextSelected: '#1E6FDB',
      colorItemTextHover: '#1E6FDB',
    },
    Tabs: {
      colorPrimary: '#1E6FDB',
      colorBorderSecondary: '#f0f0f0',
    },
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider locale={zhCN} theme={theme}>
      <App />
    </ConfigProvider>
  </StrictMode>,
);
