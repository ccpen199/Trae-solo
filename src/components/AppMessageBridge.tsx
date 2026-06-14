import { useEffect } from 'react';
import { App } from 'antd';
import { bindMessage } from '../utils/message';

const AppMessageBridge = () => {
  const { message } = App.useApp();

  useEffect(() => {
    bindMessage(message);
  }, [message]);

  return null;
};

export default AppMessageBridge;
