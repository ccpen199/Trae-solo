import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Calendar, Map, Users, UsersRound, Shield, FileKey, FileSearch, FileBarChart,
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  group?: string;
  badge?: string;
}

export const navItems: NavItem[] = [
  { path: '/', label: '数据大屏', icon: LayoutDashboard, group: '数据分析' },
  { path: '/screening', label: '排片预测', icon: Calendar, group: '数据分析' },
  { path: '/heatmap', label: '上座率热力图', icon: Map, group: '数据分析' },
  { path: '/audience', label: '受众分析', icon: Users, group: '数据分析' },
  { path: '/crew', label: '剧组协作', icon: UsersRound, group: '产业服务' },
  { path: '/admin', label: '管理首页', icon: Shield, group: '后台管理' },
  { path: '/admin/permissions', label: '权限分级', icon: FileKey, group: '后台管理' },
  { path: '/admin/audit', label: '导出审计', icon: FileSearch, group: '后台管理' },
  { path: '/admin/reports', label: '报告中心', icon: FileBarChart, group: '后台管理' },
];
