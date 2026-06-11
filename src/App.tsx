import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import router from './router';

const themeConfig = {
  token: {
    colorPrimary: '#165DFF',
    borderRadius: 6,
    fontFamily: '"Source Han Sans CN", "PingFang SC", "Microsoft YaHei", sans-serif',
    colorLink: '#165DFF',
    colorSuccess: '#00B42A',
    colorWarning: '#FF8800',
    colorError: '#F53F3F',
  },
  components: {
    Button: {
      controlHeight: 40,
      borderRadius: 6,
      contentFontSize: 14,
    },
    Card: {
      borderRadiusLG: 12,
    },
    Table: {
      borderRadiusLG: 12,
    },
    Modal: {
      borderRadiusLG: 12,
    },
    Input: {
      controlHeight: 40,
      borderRadius: 6,
    },
    Select: {
      controlHeight: 40,
      borderRadius: 6,
    },
  },
};

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
