import {
  Home,
  Building2,
  Map,
  UserCog,
  Gift,
  BarChart3,
} from 'lucide-react';

export const navItems = [
  {
    path: '/',
    label: '首页',
    icon: Home,
  },
  {
    path: '/properties',
    label: '楼盘字典',
    icon: Building2,
  },
  {
    path: '/map',
    label: '地图找房',
    icon: Map,
  },
  {
    path: '/butler',
    label: '购房管家',
    icon: UserCog,
  },
  {
    path: '/subsidy',
    label: '购房补贴',
    icon: Gift,
  },
  {
    path: '/analytics',
    label: '运营分析',
    icon: BarChart3,
  },
];
