import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App.tsx';
import './index.css';

const theme = {
  token: {
    colorPrimary: '#165DFF',
    colorInfo: '#165DFF',
    colorSuccess: '#00B42A',
    colorWarning: '#FF7D00',
    colorError: '#F53F3F',
    borderRadius: 8,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#001529',
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#0f2744',
      darkItemSelectedBg: '#165DFF',
      darkItemSelectedColor: '#ffffff',
    },
    Card: {
      borderRadiusLG: 8,
    },
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN} theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>
);
