import { ConfigProvider, App as AntdApp, theme as AntTheme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { RouterProvider } from "react-router-dom";
import router from "@/router";

const antdTheme = {
  algorithm: AntTheme.defaultAlgorithm,
  token: {
    colorPrimary: "#FF6B1A",
    colorInfo: "#3B82F6",
    colorSuccess: "#10B981",
    colorWarning: "#F59E0B",
    colorError: "#EF4444",
    borderRadius: 12,
    fontFamily:
      '"HarmonyOS Sans", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
  },
  components: {
    Button: {
      controlHeight: 40,
      borderRadius: 12,
      primaryShadow: "0 8px 20px -8px rgba(255,107,26,0.45)",
    },
    Card: {
      borderRadiusLG: 16,
    },
    Table: {
      headerBg: "#FAFBFC",
      headerColor: "#475569",
      rowHoverBg: "#FFF7F2",
    },
    Tabs: {
      itemSelectedColor: "#FF6B1A",
      inkBarColor: "#FF6B1A",
    },
  },
};

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}
