import type { MessageInstance } from 'antd/es/message/interface';

type MessageApi = Pick<MessageInstance, 'success' | 'error' | 'warning' | 'info' | 'loading'>;

let globalMessage: MessageApi | null = null;

export const setGlobalMessage = (message: MessageApi) => {
  globalMessage = message;
};

export const getGlobalMessage = (): MessageApi => {
  if (!globalMessage) {
    return {
      success: (content: string) => console.log('[message] success:', content),
      error: (content: string) => console.error('[message] error:', content),
      warning: (content: string) => console.warn('[message] warning:', content),
      info: (content: string) => console.info('[message] info:', content),
      loading: (content: string) => console.log('[message] loading:', content),
    };
  }
  return globalMessage;
};

export const message = {
  success: (content: string) => getGlobalMessage().success(content),
  error: (content: string) => getGlobalMessage().error(content),
  warning: (content: string) => getGlobalMessage().warning(content),
  info: (content: string) => getGlobalMessage().info(content),
  loading: (content: string) => getGlobalMessage().loading(content),
};
