import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';

export default function App() {
  // Ant Design 5.x 主题配置 (严格遵循 PRD 定义的品牌色系)
  const themeConfig = {
    token: {
      colorPrimary: '#0F4C81',
      colorSuccess: '#00A86B',
      colorWarning: '#FF6B35',
      colorError: '#E63946',
      colorInfo: '#0F4C81',
      colorLink: '#0F4C81',
      borderRadius: 4,
      borderRadiusLG: 4,
      borderRadiusXS: 3,
      controlHeight: 36,
      controlHeightSM: 28,
      controlHeightLG: 44,
      fontFamily:
        '"PingFang SC", "HarmonyOS Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: 14,
      lineHeight: 1.5715,
    },
    components: {
      Layout: {
        headerBg: '#0F4C81',
        headerHeight: 64,
        bodyBg: '#F8F9FA',
        siderBg: '#092E4D',
      },
      Button: {
        controlHeight: 36,
        fontWeight: 500,
      },
      Card: {
        borderRadiusLG: 4,
        headerHeight: 48,
      },
      Table: {
        borderRadiusLG: 4,
        headerBg: '#F5F5F7',
        headerSortActiveBg: '#E8F0F8',
        rowHoverBg: '#F0F6FB',
      },
      Tabs: {
        itemColor: '#6B7280',
        itemSelectedColor: '#0F4C81',
        itemHoverColor: '#0C3D67',
        inkBarColor: '#0F4C81',
      },
      Tag: {
        borderRadiusSM: 3,
      },
      Menu: {
        itemBg: 'transparent',
        itemSelectedBg: 'rgba(15, 76, 129, 0.08)',
        itemSelectedColor: '#0F4C81',
        itemHoverBg: 'rgba(15, 76, 129, 0.04)',
      },
    },
  };

  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}
