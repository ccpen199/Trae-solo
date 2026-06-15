import React from 'react';
import { ConfigProvider, theme as antdTheme, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import type { ThemeConfig } from 'antd';

const INDUSTRIAL_BLUE = '#165DFF';
const VITAL_ORANGE = '#FF7D00';

const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: INDUSTRIAL_BLUE,
    colorInfo: INDUSTRIAL_BLUE,
    colorSuccess: '#00B42A',
    colorWarning: VITAL_ORANGE,
    colorError: '#F53F3F',

    colorPrimaryBg: '#E8F0FF',
    colorPrimaryBgHover: '#D1E1FF',
    colorPrimaryBorder: '#A3C3FF',
    colorPrimaryBorderHover: '#75A5FF',
    colorPrimaryHover: '#124BCC',
    colorPrimaryActive: '#0D3999',
    colorPrimaryTextHover: '#124BCC',
    colorPrimaryText: '#165DFF',
    colorPrimaryTextActive: '#0D3999',

    colorLink: INDUSTRIAL_BLUE,
    colorLinkHover: '#124BCC',
    colorLinkActive: '#0D3999',

    borderRadius: 8,
    borderRadiusXS: 4,
    borderRadiusSM: 4,
    borderRadiusLG: 12,

    fontSize: 14,
    fontSizeHeading1: 30,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,

    fontFamily: '"Source Han Sans CN", "Noto Sans SC", system-ui, sans-serif',
    fontFamilyCode: '"Roboto Mono", monospace',

    lineHeight: 1.6,
    lineHeightHeading1: 1.3,
    lineHeightHeading2: 1.35,
    lineHeightHeading3: 1.4,
    lineHeightHeading4: 1.5,
    lineHeightHeading5: 1.6,

    controlHeight: 36,
    controlHeightSM: 28,
    controlHeightLG: 44,
    controlHeightXS: 22,

    paddingXS: 4,
    paddingSM: 8,
    padding: 12,
    paddingMD: 16,
    paddingLG: 24,
    paddingXL: 32,

    marginXS: 4,
    marginSM: 8,
    margin: 12,
    marginMD: 16,
    marginLG: 24,
    marginXL: 32,

    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
    boxShadowSecondary: '0 6px 24px rgba(0, 0, 0, 0.12)',
    boxShadowTertiary: '0 12px 48px rgba(0, 0, 0, 0.18)',

    wireframe: false,
    motion: true,
  },
  components: {
    Button: {
      controlHeight: 36,
      controlHeightSM: 28,
      controlHeightLG: 44,
      fontSize: 14,
      fontSizeSM: 12,
      fontSizeLG: 16,
      borderRadius: 4,
      borderRadiusSM: 4,
      borderRadiusLG: 4,
      fontWeight: 500,
      contentFontSizeLG: 16,
      colorPrimary: INDUSTRIAL_BLUE,
      colorPrimaryHover: '#124BCC',
      colorPrimaryActive: '#0D3999',
      primaryShadow: '0 2px 6px rgba(22, 93, 255, 0.25)',
    },
    Card: {
      colorBorderSecondary: '#E5E6EB',
      borderRadiusLG: 8,
      boxShadowTertiary: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
      headerBg: 'transparent',
      headerHeight: 56,
    },
    Input: {
      controlHeight: 36,
      controlHeightSM: 28,
      controlHeightLG: 44,
      activeBorderColor: INDUSTRIAL_BLUE,
      hoverBorderColor: INDUSTRIAL_BLUE,
      colorBorder: '#E5E6EB',
      borderRadius: 4,
      paddingBlock: 6,
      paddingInline: 12,
    },
    InputNumber: {
      controlHeight: 36,
      controlHeightSM: 28,
      controlHeightLG: 44,
      activeBorderColor: INDUSTRIAL_BLUE,
      hoverBorderColor: INDUSTRIAL_BLUE,
      colorBorder: '#E5E6EB',
      borderRadius: 4,
    },
    Select: {
      controlHeight: 36,
      controlHeightSM: 28,
      controlHeightLG: 44,
      colorBorder: '#E5E6EB',
      borderRadius: 4,
      optionSelectedBg: '#E8F0FF',
      optionActiveBg: '#F2F3F5',
      multipleItemBg: '#E8F0FF',
    },
    DatePicker: {
      controlHeight: 36,
      controlHeightSM: 28,
      controlHeightLG: 44,
      colorBorder: '#E5E6EB',
      activeBorderColor: INDUSTRIAL_BLUE,
      hoverBorderColor: INDUSTRIAL_BLUE,
      cellActiveWithRangeBg: '#E8F0FF',
      cellRangeBorderColor: '#A3C3FF',
    },
    Modal: {
      borderRadiusLG: 12,
      headerBg: 'transparent',
      contentBg: '#FFFFFF',
    },
    Drawer: {
      colorBgMask: 'rgba(0, 0, 0, 0.45)',
    },
    Table: {
      headerBg: '#F7F8FA',
      headerColor: '#4E5969',
      headerSortActiveBg: '#E8F0FF',
      headerSortHoverBg: '#F2F3F5',
      rowHoverBg: '#E8F0FF',
      borderColor: '#F2F3F5',
      headerBorderRadius: 8,
    },
    Tag: {
      borderRadiusSM: 4,
      defaultBg: '#F2F3F5',
      defaultColor: '#4E5969',
    },
    Menu: {
      darkItemBg: '#041433',
      darkSubMenuItemBg: '#092666',
      darkItemSelectedBg: '#165DFF',
      itemBg: 'transparent',
      itemSelectedBg: '#E8F0FF',
      itemSelectedColor: INDUSTRIAL_BLUE,
      itemHoverColor: INDUSTRIAL_BLUE,
      itemActiveBg: '#D1E1FF',
    },
    Tabs: {
      itemColor: '#4E5969',
      itemSelectedColor: INDUSTRIAL_BLUE,
      itemHoverColor: '#124BCC',
      itemActiveColor: INDUSTRIAL_BLUE,
      inkBarColor: INDUSTRIAL_BLUE,
      titleFontSize: 14,
    },
    Progress: {
      defaultColor: INDUSTRIAL_BLUE,
      remainingColor: '#F2F3F5',
    },
    Badge: {
      colorBorder: '#FFFFFF',
      textFontSize: 12,
    },
    Alert: {
      borderRadiusLG: 4,
    },
    Dropdown: {
      controlPaddingHorizontal: 8,
      controlItemBgActive: '#E8F0FF',
      controlItemBgHover: '#F2F3F5',
    },
    Tooltip: {
      borderRadiusLG: 4,
    },
    Popover: {
      borderRadiusLG: 8,
    },
    Avatar: {
      containerSize: 32,
      containerSizeLG: 40,
      containerSizeSM: 24,
      fontSize: 14,
      fontSizeLG: 16,
      fontSizeSM: 12,
    },
    Breadcrumb: {
      lastItemColor: '#1D2129',
      itemColor: '#4E5969',
      fontSize: 14,
    },
    Steps: {
      colorPrimary: INDUSTRIAL_BLUE,
      colorBorderSecondary: '#E5E6EB',
    },
    Radio: {
      colorPrimary: INDUSTRIAL_BLUE,
      colorPrimaryHover: '#124BCC',
    },
    Checkbox: {
      colorPrimary: INDUSTRIAL_BLUE,
      colorPrimaryHover: '#124BCC',
    },
    Switch: {
      colorPrimary: INDUSTRIAL_BLUE,
    },
    Slider: {
      colorPrimary: INDUSTRIAL_BLUE,
      colorPrimaryBorder: '#165DFF',
      trackBg: '#E8F0FF',
      railBg: '#F2F3F5',
    },
    Upload: {
      colorBorder: '#E5E6EB',
      actionsColor: '#86909C',
    },
    Pagination: {
      colorPrimary: INDUSTRIAL_BLUE,
      itemSize: 32,
    },
    Form: {
      labelColor: '#1D2129',
      verticalLabelPadding: '0 0 8px 0',
    },
    Empty: {
      colorBgContainer: 'transparent',
    },
    Divider: {
      colorSplit: '#F2F3F5',
      textPaddingInline: '1em',
    },
    Typography: {
      colorText: '#1D2129',
      colorTextSecondary: '#4E5969',
      colorTextTertiary: '#86909C',
      colorLink: INDUSTRIAL_BLUE,
      colorLinkHover: '#124BCC',
      colorLinkActive: '#0D3999',
    },
  },
  algorithm: antdTheme.defaultAlgorithm,
};

const darkThemeConfig: ThemeConfig = {
  ...themeConfig,
  algorithm: antdTheme.darkAlgorithm,
  token: {
    ...themeConfig.token,
    colorBgLayout: '#092666',
    colorBgContainer: '#041433',
    colorBgElevated: '#0D3999',
    colorBorder: '#124BCC',
    colorBorderSecondary: '#0D3999',
  },
};

interface ThemeProviderProps {
  children: React.ReactNode;
  darkMode?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, darkMode = false }) => {
  const config = darkMode ? darkThemeConfig : themeConfig;

  return (
    <ConfigProvider locale={zhCN} theme={config}>
      <AntdApp>
        {children}
      </AntdApp>
    </ConfigProvider>
  );
};

export { themeConfig, darkThemeConfig };
export default themeConfig;
