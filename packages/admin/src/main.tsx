import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#10B981',
            colorInfo: '#10B981',
            colorSuccess: '#10B981',
            colorWarning: '#F59E0B',
            colorError: '#EF4444',
            borderRadius: 8,
            colorBgLayout: '#F8FAFC',
          },
          components: {
            Layout: {
              headerBg: '#FFFFFF',
              siderBg: '#0F172A',
            },
            Menu: {
              darkItemBg: 'transparent',
              darkSubMenuItemBg: '#0F172A',
              darkItemSelectedBg: '#1E293B',
              darkItemSelectedColor: '#10B981',
              darkItemColor: '#94A3B8',
            },
          },
        }}
      >
        <AntApp>
          <App />
        </AntApp>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
