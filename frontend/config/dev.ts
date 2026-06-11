import type { UserConfigExport } from '@tarojs/cli';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.FRONTEND_PORT || 49098);

export default {
  logger: {
    quiet: false,
    stats: true,
  },
  mini: {},
  h5: {
    devServer: {
      host,
      port,
      open: false, //禁止自动打开浏览器
    },
  },
} satisfies UserConfigExport<'webpack5'>;
