import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import './app.scss';
import { useAppStore } from './store/appStore';
import { useUserStore } from './store/userStore';
import classnames from 'classnames';

function App(props) {
  const initApp = useAppStore(state => state.init);
  const loadProfile = useUserStore(state => state.loadProfile);
  const stopSpeak = useAppStore(state => state.stopSpeak);
  const { accessibility } = useAppStore();

  useEffect(() => {
    console.log('[App] componentDidMount, initializing stores');
    initApp().then(() => {
      loadProfile();
    });
  }, [initApp, loadProfile]);

  useDidShow(() => {
    console.log('[App] useDidShow');
  });

  useDidHide(() => {
    console.log('[App] useDidHide, stopping speech');
    stopSpeak();
  });

  const rootClass = classnames({
    'a11y-mode-high-contrast': accessibility.highContrast,
    'a11y-mode-large-font': accessibility.largeFont
  });

  return (
    <div className={rootClass}>
      {props.children}
    </div>
  );
}

export default App;
