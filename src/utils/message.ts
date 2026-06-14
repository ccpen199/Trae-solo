import { message as staticMessage } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';

let appMessage: MessageInstance | null = null;

export const bindMessage = (messageApi: MessageInstance) => {
  appMessage = messageApi;
};

const getMessage = () => appMessage ?? staticMessage;

export const message = {
  success: (...args: Parameters<MessageInstance['success']>) => getMessage().success(...args),
  error: (...args: Parameters<MessageInstance['error']>) => getMessage().error(...args),
  info: (...args: Parameters<MessageInstance['info']>) => getMessage().info(...args),
  warning: (...args: Parameters<MessageInstance['warning']>) => getMessage().warning(...args),
};
