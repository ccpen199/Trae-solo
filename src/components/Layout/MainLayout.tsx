import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppStore, selectTheme } from '../../store/app';
import { useUserStore, selectIsLoggedIn } from '../../store/user';
import { useNavigate } from 'react-router-dom';

const MainLayout: React.FC = () => {
  const theme = useAppStore(selectTheme);
  const setTheme = useAppStore((state) => state.setTheme);
  const isLoggedIn = useUserStore(selectIsLoggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  const isDark =
    theme === 'dark' ||
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#165DFF',
          colorSuccess: '#00B42A',
          colorWarning: '#FF7D00',
          colorError: '#F53F3F',
          colorInfo: '#14C9C9',
          borderRadius: 8,
        },
        algorithm: isDark ? undefined : undefined,
      }}
    >
      <AntdApp>
        <div className={`h-full flex ${isDark ? 'dark' : ''}`}>
          <Sidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 p-6 scrollbar-thin">
              <Outlet />
            </main>
          </div>
        </div>
      </AntdApp>
    </ConfigProvider>
  );
};

export default MainLayout;
