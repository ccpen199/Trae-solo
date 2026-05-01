import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppRouter from '@/routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000
    }
  }
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6
          }
        }}
      >
        <AntdApp>
          <AppRouter />
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;
