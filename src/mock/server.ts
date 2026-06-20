// MSW Node Server 入口：Node 测试环境启用 Mock Service Worker

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

export default server;
