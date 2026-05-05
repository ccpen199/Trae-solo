import { useEffect, useState } from 'react';
import { Spin, App as AntApp } from 'antd';
import { useUserStore } from '@/store/userStore';
import { AppRouter } from '@/router';
import { setGlobalMessage, message } from '@/utils/message';

function App() {
  const { message: antMessage } = AntApp.useApp();
  const { user, token, initUserInfo, clearUserInfo } = useUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setGlobalMessage(antMessage);
  }, [antMessage]);

  useEffect(() => {
    const initApp = async () => {
      if (token) {
        try {
          await initUserInfo();
        } catch (error) {
          clearUserInfo();
          message.error('登录已过期，请重新登录');
        }
      }
      setLoading(false);
    };

    initApp();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return <AppRouter />;
}

export default App;
