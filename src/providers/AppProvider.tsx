import React from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

export interface AppProviderProps {
  children: React.ReactNode;
}

const lightTheme = {
  token: {
    colorPrimary: '#165DFF',
    colorSuccess: '#00B42A',
    colorWarning: '#FF7D00',
    colorError: '#F53F3F',
    colorInfo: '#165DFF',
    colorTextBase: '#1D2129',
    colorBgBase: '#FFFFFF',
    colorBorder: '#E5E6EB',
    borderRadius: 6,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: '#FFFFFF',
      siderBg: '#FFFFFF',
      bodyBg: '#F7F8FA',
    },
    Menu: {
      itemColor: '#4E5969',
      itemSelectedColor: '#165DFF',
      itemSelectedBg: '#E8F3FF',
      itemHoverColor: '#165DFF',
      itemHoverBg: '#F2F3F5',
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
    },
    Button: {
      colorPrimary: '#165DFF',
      algorithm: true,
    },
    Card: {
      colorBorderSecondary: '#E5E6EB',
      borderRadiusLG: 8,
    },
    Table: {
      headerBg: '#F7F8FA',
      borderColor: '#E5E6EB',
      rowHoverBg: '#F2F3F5',
    },
    Input: {
      colorBorder: '#E5E6EB',
      colorPrimaryHover: '#4080FF',
      borderRadius: 6,
    },
    Form: {
      labelColor: '#4E5969',
    },
    Modal: {
      headerBg: '#FFFFFF',
      contentBg: '#FFFFFF',
    },
  },
};

const darkTheme = {
  token: {
    colorPrimary: '#165DFF',
    colorSuccess: '#00B42A',
    colorWarning: '#FF7D00',
    colorError: '#F53F3F',
    colorInfo: '#165DFF',
    colorTextBase: '#F2F3F5',
    colorBgBase: '#1D2129',
    colorBorder: '#4E5969',
    borderRadius: 6,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: '#1D2129',
      siderBg: '#1D2129',
      bodyBg: '#0D0D0D',
    },
    Menu: {
      itemColor: '#C9CDD4',
      itemSelectedColor: '#4080FF',
      itemSelectedBg: 'rgba(22, 93, 255, 0.2)',
      itemHoverColor: '#4080FF',
      itemHoverBg: 'rgba(255, 255, 255, 0.04)',
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
    },
    Button: {
      colorPrimary: '#165DFF',
      algorithm: true,
    },
    Card: {
      colorBorderSecondary: '#4E5969',
      borderRadiusLG: 8,
      colorBgContainer: '#1D2129',
    },
    Table: {
      headerBg: '#272E3B',
      borderColor: '#4E5969',
      rowHoverBg: 'rgba(255, 255, 255, 0.04)',
      colorBgContainer: '#1D2129',
    },
    Input: {
      colorBorder: '#4E5969',
      colorPrimaryHover: '#4080FF',
      borderRadius: 6,
      colorBgContainer: '#1D2129',
    },
    Form: {
      labelColor: '#C9CDD4',
    },
    Modal: {
      headerBg: '#1D2129',
      contentBg: '#1D2129',
      headerBorderBottom: '1px solid #4E5969',
    },
  },
};

const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { isDark } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={zhCN}
        theme={isDark ? darkTheme : lightTheme}
        componentSize="middle"
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default AppProvider;
