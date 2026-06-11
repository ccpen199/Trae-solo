import type { UserConfigExport } from '@tarojs/cli';
export default {
  logger: {
    quiet: false,
    stats: true,
  },
  mini: {},
  h5: {
    devServer: {
      host: process.env.HOST || '127.0.0.1',
      port: Number(process.env.FRONTEND_PORT || 49161),
      open: false, //禁止自动打开浏览器
    },
  },
} satisfies UserConfigExport<'webpack5'>;
