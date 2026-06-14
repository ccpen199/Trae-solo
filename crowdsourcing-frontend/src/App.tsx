import React from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { RouterProvider } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import router from './router';
import 'dayjs/locale/zh-cn';

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1E40AF',
          borderRadius: 6,
          colorInfo: '#1E40AF',
        },
        components: {
          Button: {
            borderRadius: 6,
            controlHeight: 36,
            primaryColor: '#1E40AF',
          },
          Input: {
            borderRadius: 6,
          },
          Card: {
            borderRadius: 8,
          },
          Modal: {
            borderRadius: 8,
          },
          Menu: {
            itemBorderRadius: 6,
          }
        }
      }}
    >
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
