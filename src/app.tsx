import React, { useEffect } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { useUserStore } from './store/useUserStore';
import './app.scss';

function App(props) {
  const { login, isLoggedIn } = useUserStore();

  useDidShow(() => {
    if (!isLoggedIn) {
      login('resident');
      console.log('[App] Auto login with resident role');
    }
  });

  return props.children;
}

export default App;
