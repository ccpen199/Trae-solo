import {
  HomeOutlined,
  SearchOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  BankOutlined,
  ReadOutlined,
  HistoryOutlined,
  UserOutlined,
  DashboardOutlined,
  SnippetsOutlined,
  MailOutlined,
  CalendarOutlined,
  ProjectOutlined,
  BarChartOutlined,
  GiftOutlined,
  SettingOutlined,
  AppstoreOutlined,
  AuditOutlined,
  ClusterOutlined,
  NodeIndexOutlined,
  SafetyOutlined,
  ToolOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { UserRole } from '@/store/authStore';

export interface MenuItemConfig {
  key: string;
  path: string;
  label: string;
  icon?: React.ReactNode;
  children?: MenuItemConfig[];
}

export const jobseekerMenu: MenuItemConfig[] = [
  { key: 'js-home', path: '/jobseeker/home', label: '首页', icon: <HomeOutlined /> },
  { key: 'js-job', path: '/jobseeker/jobs', label: '职位搜索', icon: <SearchOutlined /> },
  { key: 'js-resume', path: '/jobseeker/resume', label: '我的简历', icon: <FileTextOutlined /> },
  { key: 'js-township', path: '/jobseeker/township', label: '镇街专区', icon: <EnvironmentOutlined /> },
  { key: 'js-campus', path: '/jobseeker/campus', label: '校园招聘', icon: <BankOutlined /> },
  { key: 'js-education', path: '/jobseeker/education', label: '学历提升', icon: <ReadOutlined /> },
  { key: 'js-applications', path: '/jobseeker/applications', label: '投递记录', icon: <HistoryOutlined /> },
  { key: 'js-subsidy', path: '/jobseeker/subsidy', label: '就业补贴', icon: <WalletOutlined /> },
  { key: 'js-profile', path: '/jobseeker/profile', label: '个人中心', icon: <UserOutlined /> },
];

export const enterpriseMenu: MenuItemConfig[] = [
  { key: 'en-dashboard', path: '/enterprise/dashboard', label: '工作台', icon: <DashboardOutlined /> },
  { key: 'en-jobs', path: '/enterprise/jobs', label: '职位管理', icon: <SnippetsOutlined /> },
  { key: 'en-inbox', path: '/enterprise/inbox', label: '简历收件箱', icon: <MailOutlined /> },
  { key: 'en-interview', path: '/enterprise/interview', label: '面试日历', icon: <CalendarOutlined /> },
  { key: 'en-rpo', path: '/enterprise/rpo', label: 'RPO项目', icon: <ProjectOutlined /> },
  { key: 'en-analytics', path: '/enterprise/analytics', label: '招聘分析', icon: <BarChartOutlined /> },
  { key: 'en-subsidy', path: '/enterprise/subsidy', label: '补贴申领', icon: <GiftOutlined /> },
  { key: 'en-settings', path: '/enterprise/settings', label: '企业设置', icon: <SettingOutlined /> },
];

export const adminMenu: MenuItemConfig[] = [
  { key: 'am-summary', path: '/admin/summary', label: '运营总览', icon: <AppstoreOutlined /> },
  { key: 'am-enterprise-audit', path: '/admin/enterprise-audit', label: '企业审核', icon: <AuditOutlined /> },
  { key: 'am-township', path: '/admin/township', label: '镇街运营', icon: <ClusterOutlined /> },
  { key: 'am-skill-map', path: '/admin/skill-map', label: '技能图谱', icon: <NodeIndexOutlined /> },
  { key: 'am-subsidy-audit', path: '/admin/subsidy-audit', label: '补贴审核', icon: <SafetyOutlined /> },
  { key: 'am-system', path: '/admin/system', label: '系统设置', icon: <ToolOutlined /> },
];

export const getMenuByRole = (role: UserRole): MenuItemConfig[] => {
  switch (role) {
    case 'jobseeker':
      return jobseekerMenu;
    case 'enterprise':
      return enterpriseMenu;
    case 'admin':
      return adminMenu;
    default:
      return jobseekerMenu;
  }
};

export const findMenuByPath = (
  menus: MenuItemConfig[],
  pathname: string
): MenuItemConfig[] => {
  const result: MenuItemConfig[] = [];
  for (const menu of menus) {
    if (pathname.startsWith(menu.path)) {
      result.push(menu);
    }
    if (menu.children) {
      const childResult = findMenuByPath(menu.children, pathname);
      if (childResult.length > 0) {
        result.push(menu, ...childResult);
      }
    }
  }
  return result;
};
