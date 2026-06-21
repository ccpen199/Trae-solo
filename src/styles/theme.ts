import { theme } from 'antd';

const legalTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#0A1628',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#B23A48',
    colorInfo: '#194BA0',
    colorTextBase: '#111827',
    colorBgBase: '#F5F1E8',
    borderRadius: 4,
    fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    fontSize: 14,
    controlHeight: 40,
  },
  components: {
    Button: {
      controlHeight: 40,
      borderRadius: 4,
      primaryShadow: '0 2px 8px rgba(10, 22, 40, 0.15)',
    },
    Input: {
      controlHeight: 40,
      borderRadius: 4,
      activeBorderColor: '#194BA0',
      hoverBorderColor: '#476FB3',
    },
    Select: {
      controlHeight: 40,
      borderRadius: 4,
    },
    Card: {
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(10, 22, 40, 0.08)',
    },
    Table: {
      borderRadius: 8,
      headerBg: '#F8F9FA',
      headerColor: '#495057',
      rowHoverBg: 'rgba(10, 22, 40, 0.03)',
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemBorderRadius: 8,
      itemSelectedBg: '#0A1628',
      itemSelectedColor: '#FFFFFF',
      itemColor: '#6B7280',
      itemHoverColor: '#0A1628',
      itemHoverBg: 'rgba(10, 22, 40, 0.05)',
    },
    Tabs: {
      itemColor: '#6B7280',
      itemSelectedColor: '#0A1628',
      itemHoverColor: '#194BA0',
      inkBarColor: '#C9A962',
      titleFontSize: 14,
    },
    Tag: {
      borderRadius: 4,
    },
    Modal: {
      borderRadius: 8,
    },
    Form: {
      labelFontSize: 14,
      labelColor: '#495057',
    },
    DatePicker: {
      controlHeight: 40,
      borderRadius: 4,
    },
  },
};

export default legalTheme;
